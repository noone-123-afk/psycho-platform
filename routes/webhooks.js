const express = require('express');
const paypal = require('@paypal/checkout-server-sdk');
const { client } = require('../paypal');
const Assessment = require('../models/Assessment');
const WebhookEvent = require('../models/WebhookEvent');
const { verifyPayPalWebhook } = require('../services/paypalWebhookService');

const PRODUCTS = {
    pdf: { price: '10.00', currency: 'USD' }
};
const STALE_PROCESSING_MS = 5 * 60 * 1000;

function getRelatedOrderId(event) {
    return event.resource?.supplementary_data?.related_ids?.order_id ||
        (event.event_type === 'CHECKOUT.ORDER.APPROVED' ? event.resource?.id : null);
}

function createWebhookRouter({
    verifySignature = verifyPayPalWebhook,
    executePayPalRequest = (request) => client.execute(request)
} = {}) {
    const router = express.Router();

    router.post('/paypal', async (req, res) => {
        const event = req.body;
        if (
            !event ||
            typeof event !== 'object' ||
            Array.isArray(event) ||
            typeof event.id !== 'string' ||
            !event.id ||
            event.id.length > 120 ||
            typeof event.event_type !== 'string' ||
            !event.event_type ||
            event.event_type.length > 120 ||
            !event.resource ||
            typeof event.resource !== 'object' ||
            Array.isArray(event.resource)
        ) {
            return res.status(400).json({ message: 'Invalid PayPal webhook event' });
        }

        try {
            const validSignature = await verifySignature({
                headers: req.headers,
                event
            });
            if (!validSignature) {
                return res.status(400).json({ message: 'Invalid PayPal webhook signature' });
            }
        } catch (error) {
            console.error('PayPal webhook verification failed:', error.message);
            return res.status(503).json({ message: 'Unable to verify PayPal webhook right now' });
        }

        const now = new Date();
        let webhookRecord;
        try {
            webhookRecord = await WebhookEvent.findOneAndUpdate(
                { eventId: event.id },
                {
                    $setOnInsert: {
                        eventId: event.id,
                        eventType: event.event_type,
                        resourceId: event.resource.id || null,
                        orderId: getRelatedOrderId(event),
                        status: 'received'
                    }
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        } catch (error) {
            if (error.code !== 11000) {
                console.error('PayPal webhook event could not be recorded:', error.message);
                return res.status(503).json({ message: 'Unable to record PayPal webhook' });
            }
            try {
                webhookRecord = await WebhookEvent.findOne({ eventId: event.id });
            } catch (lookupError) {
                console.error('PayPal webhook duplicate lookup failed:', lookupError.message);
                return res.status(503).json({ message: 'Unable to record PayPal webhook' });
            }
        }

        if (!webhookRecord) {
            return res.status(503).json({ message: 'Unable to record PayPal webhook' });
        }
        if (webhookRecord.status === 'processed' || webhookRecord.status === 'ignored') {
            return res.json({ status: 'success', duplicate: true });
        }

        const staleProcessingAt = new Date(now.getTime() - STALE_PROCESSING_MS);
        let claimed;
        try {
            claimed = await WebhookEvent.findOneAndUpdate(
                {
                    _id: webhookRecord._id,
                    $or: [
                        { status: { $in: ['received', 'failed'] } },
                        { status: 'processing', processingAt: { $lt: staleProcessingAt } }
                    ]
                },
                {
                    $set: { status: 'processing', processingAt: now },
                    $inc: { attempts: 1 }
                },
                { new: true }
            );
        } catch (error) {
            console.error(`PayPal webhook claim failed for event ${event.id}:`, error.message);
            return res.status(503).json({ message: 'Unable to process PayPal webhook right now' });
        }
        if (!claimed) {
            return res.json({ status: 'success', duplicate: true });
        }

        try {
            if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
                const capture = event.resource;
                const orderId = getRelatedOrderId(event);
                if (
                    capture.status !== 'COMPLETED' ||
                    typeof capture.id !== 'string' ||
                    typeof orderId !== 'string'
                ) {
                    await WebhookEvent.updateOne(
                        { _id: claimed._id, status: 'processing' },
                        { $set: { status: 'ignored', processedAt: new Date() }, $unset: { processingAt: 1 } }
                    );
                    return res.json({ status: 'success' });
                }

                const assessment = await Assessment.findOne({ paypalOrderId: orderId });
                if (!assessment) {
                    await WebhookEvent.updateOne(
                        { _id: claimed._id, status: 'processing' },
                        { $set: { status: 'ignored', processedAt: new Date() }, $unset: { processingAt: 1 } }
                    );
                    return res.json({ status: 'success' });
                }

                const product = PRODUCTS[assessment.paymentType];
                if (!product) {
                    await WebhookEvent.updateOne(
                        { _id: claimed._id, status: 'processing' },
                        { $set: { status: 'ignored', processedAt: new Date() }, $unset: { processingAt: 1 } }
                    );
                    return res.json({ status: 'success' });
                }

                const orderResponse = await executePayPalRequest(new paypal.orders.OrdersGetRequest(orderId));
                const order = orderResponse.result;
                const purchaseUnit = order.purchase_units?.find(
                    (unit) => unit.custom_id === assessment.id
                );
                const orderCapture = purchaseUnit?.payments?.captures?.find(
                    (item) => item.id === capture.id
                );
                const amountMatches = (amount) =>
                    amount?.currency_code === product.currency && amount?.value === product.price;
                if (
                    order.status !== 'COMPLETED' ||
                    !purchaseUnit ||
                    orderCapture?.status !== 'COMPLETED' ||
                    !amountMatches(orderCapture.amount) ||
                    !amountMatches(capture.amount)
                ) {
                    await WebhookEvent.updateOne(
                        { _id: claimed._id, status: 'processing' },
                        { $set: { status: 'ignored', processedAt: new Date() }, $unset: { processingAt: 1 } }
                    );
                    console.error(`PayPal capture event ${event.id} did not match a completed platform order`);
                    return res.json({ status: 'success' });
                }

                if (!assessment.isPaid) {
                    await Assessment.updateOne(
                        {
                            _id: assessment._id,
                            paypalOrderId: orderId,
                            isPaid: { $ne: true }
                        },
                        {
                            $set: {
                                isPaid: true,
                                paidAt: new Date(),
                                paypalCaptureId: capture.id
                            }
                        }
                    );
                }
            }

            await WebhookEvent.updateOne(
                { _id: claimed._id, status: 'processing' },
                { $set: { status: 'processed', processedAt: new Date() }, $unset: { processingAt: 1 } }
            );
            return res.json({ status: 'success' });
        } catch (error) {
            try {
                await WebhookEvent.updateOne(
                    { _id: claimed._id, status: 'processing' },
                    { $set: { status: 'failed' }, $unset: { processingAt: 1 } }
                );
            } catch (recordError) {
                console.error('PayPal webhook failure could not be recorded:', recordError.message);
            }
            console.error(`PayPal webhook processing failed for event ${event.id}:`, error.message);
            return res.status(503).json({ message: 'PayPal webhook processing failed' });
        }
    });

    return router;
}

module.exports = createWebhookRouter();
module.exports.createWebhookRouter = createWebhookRouter;

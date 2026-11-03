const express = require('express');
const paypal = require('@paypal/checkout-server-sdk');
const { client } = require('../paypal');
const { requireAuth } = require('../middleware/auth');
const { sendFinalBookToUser } = require('../services/emailService');
const { createPDFBooklet } = require('../utils/pdfGenerator');
const Assessment = require('../models/Assessment');
const fs = require('node:fs/promises');
const path = require('node:path');

const router = express.Router();
const products = {
    pdf: { price: '10.00', description: 'نسخة رقمية PDF من التقرير الشخصي' }
};

router.get('/config', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ clientId: process.env.PAYPAL_CLIENT_ID || '' });
});

router.use(requireAuth);

async function createOrder(req, res, paymentType) {
    const assessmentId = req.body.assessmentId;
    if (typeof assessmentId !== 'string' || !/^[a-f\d]{24}$/i.test(assessmentId)) {
        return res.status(400).json({ message: 'A valid assessmentId is required' });
    }

    try {
        const assessment = await Assessment.findOne({
            _id: assessmentId,
            user: req.authUser.id
        });
        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }
        if (assessment.isPaid) {
            return res.status(409).json({ message: 'This assessment has already been paid for' });
        }

        const product = products[paymentType];
        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer('return=representation');
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                custom_id: assessment.id,
                amount: { currency_code: 'USD', value: product.price },
                description: product.description
            }]
        });
        const response = await client.execute(request);
        assessment.paypalOrderId = response.result.id;
        assessment.paymentType = paymentType;
        await assessment.save();
        return res.json({ id: response.result.id });
    } catch (error) {
        console.error('PayPal order creation failed:', error.message);
        return res.status(502).json({ message: 'Unable to create the PayPal order' });
    }
}

router.post('/create-order/pdf', (req, res) => createOrder(req, res, 'pdf'));
router.post('/create-order/pdf-audio', (_req, res) => {
    res.status(501).json({ message: 'The audio report package is not available yet' });
});
router.post('/create-order/print', (_req, res) => {
    res.status(501).json({ message: 'Printed report delivery is not available yet' });
});

async function deliverPaidAssessment(assessment, user, res) {
    let claimedAssessment;
    try {
        const staleClaim = new Date(Date.now() - 30 * 60 * 1000);
        claimedAssessment = await Assessment.findOneAndUpdate(
            {
                _id: assessment.id,
                isPaid: true,
                deliveryComplete: { $ne: true },
                $or: [
                    { deliveryInProgressAt: { $exists: false } },
                    { deliveryInProgressAt: { $lt: staleClaim } }
                ]
            },
            { $set: { deliveryInProgressAt: new Date() } },
            { new: true }
        );
        if (!claimedAssessment) {
            const latestAssessment = await Assessment.findById(assessment.id);
            if (latestAssessment?.deliveryComplete) {
                return res.json({
                    status: 'success',
                    assessmentId: latestAssessment.id,
                    downloadUrl: `/api/assessment/${latestAssessment.id}/download`
                });
            }
            return res.status(409).json({
                status: 'delivery_in_progress',
                message: 'Report delivery is already being processed. Please retry shortly.'
            });
        }
        const fileName = `final_${claimedAssessment.id}.pdf`;
        const outputPath = path.join(__dirname, '..', 'temp', fileName);
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await createPDFBooklet(claimedAssessment.bookContentRaw, user.name, outputPath);
        if (user.notificationPreferences?.bookReadyEmail !== false) {
            await sendFinalBookToUser(
                user.email,
                user.name,
                outputPath,
                user.id,
                user.language,
                claimedAssessment.id
            );
            claimedAssessment.deliveryEmailSent = true;
        }
        claimedAssessment.status = 'delivered';
        claimedAssessment.deliveryComplete = true;
        claimedAssessment.deliveryInProgressAt = undefined;
        await claimedAssessment.save();
        return res.json({
            status: 'success',
            assessmentId: claimedAssessment.id,
            downloadUrl: `/api/assessment/${claimedAssessment.id}/download`
        });
    } catch (error) {
        if (claimedAssessment) {
            try {
                await Assessment.updateOne(
                    {
                        _id: claimedAssessment.id,
                        deliveryInProgressAt: claimedAssessment.deliveryInProgressAt
                    },
                    { $unset: { deliveryInProgressAt: 1 } }
                );
            } catch (releaseError) {
                console.error('Unable to release paid report delivery lock:', releaseError.message);
            }
        }
        console.error(`Paid report delivery failed for ${assessment.id}:`, error.message);
        return res.status(503).json({
            status: 'paid_delivery_pending',
            message: 'Payment was captured, but report delivery is pending. You can retry delivery from your account.',
            assessmentId: assessment.id
        });
    }
}

router.post('/capture-order', async (req, res) => {
    const { orderID, assessmentId } = req.body;
    if (
        typeof orderID !== 'string' ||
        typeof assessmentId !== 'string' ||
        !/^[a-f\d]{24}$/i.test(assessmentId)
    ) {
        return res.status(400).json({ message: 'A valid orderID and assessmentId are required' });
    }

    try {
        const assessment = await Assessment.findOne({
            _id: assessmentId,
            user: req.authUser.id,
            paypalOrderId: orderID
        });
        if (!assessment) {
            return res.status(404).json({ message: 'Payment order not found' });
        }
        if (assessment.deliveryComplete) {
            return res.json({
                status: 'success',
                assessmentId: assessment.id,
                downloadUrl: `/api/assessment/${assessment.id}/download`
            });
        }

        const product = products[assessment.paymentType];
        if (!product) {
            return res.status(409).json({ message: 'Payment package is invalid' });
        }

        if (!assessment.isPaid) {
            const request = new paypal.orders.OrdersCaptureRequest(orderID);
            request.requestBody({});
            let result;
            try {
                const response = await client.execute(request);
                result = response.result;
            } catch (captureError) {
                try {
                    const lookup = await client.execute(new paypal.orders.OrdersGetRequest(orderID));
                    result = lookup.result;
                } catch (lookupError) {
                    console.error('PayPal order recovery lookup failed:', lookupError.message);
                    throw captureError;
                }
            }
            const unit = result.purchase_units?.[0];
            const capture = unit?.payments?.captures?.[0];
            if (
                result.status !== 'COMPLETED' ||
                unit?.custom_id !== assessment.id ||
                capture?.status !== 'COMPLETED' ||
                capture?.amount?.currency_code !== 'USD' ||
                capture?.amount?.value !== product.price
            ) {
                console.error('PayPal capture did not match the expected order, amount, or status');
                return res.status(402).json({ message: 'Payment could not be verified' });
            }
            assessment.isPaid = true;
            assessment.paidAt = new Date();
            await assessment.save();
        }

        return deliverPaidAssessment(assessment, req.authUser, res);
    } catch (error) {
        console.error('PayPal capture failed:', error.message);
        return res.status(502).json({ message: 'Unable to verify or complete the payment' });
    }
});

router.post('/retry-delivery', async (req, res) => {
    const { assessmentId } = req.body;
    if (typeof assessmentId !== 'string' || !/^[a-f\d]{24}$/i.test(assessmentId)) {
        return res.status(400).json({ message: 'A valid assessmentId is required' });
    }
    try {
        const assessment = await Assessment.findOne({
            _id: assessmentId,
            user: req.authUser.id,
            isPaid: true
        });
        if (!assessment) {
            return res.status(404).json({ message: 'Paid assessment not found' });
        }
        if (assessment.deliveryComplete) {
            return res.json({
                status: 'success',
                assessmentId: assessment.id,
                downloadUrl: `/api/assessment/${assessment.id}/download`
            });
        }
        return deliverPaidAssessment(assessment, req.authUser, res);
    } catch (error) {
        console.error('Paid report delivery retry failed:', error.message);
        return res.status(503).json({ message: 'Unable to retry report delivery' });
    }
});

module.exports = router;

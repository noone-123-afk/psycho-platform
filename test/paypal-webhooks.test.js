const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const Assessment = require('../models/Assessment');
const WebhookEvent = require('../models/WebhookEvent');
const { createWebhookRouter } = require('../routes/webhooks');
const { verifyPayPalWebhook } = require('../services/paypalWebhookService');

const webhookHeaders = {
    'paypal-auth-algo': 'SHA256withRSA',
    'paypal-cert-url': 'https://api.paypal.com/cert',
    'paypal-transmission-id': 'transmission-id',
    'paypal-transmission-sig': 'signature',
    'paypal-transmission-time': '2026-01-01T00:00:00Z'
};

function createQuery(value) {
    return {
        select() { return this; },
        lean: async () => value
    };
}

async function postWebhook(router, event) {
    const app = express();
    app.use(express.json());
    app.use('/api/webhooks', router);
    const server = app.listen(0);
    try {
        await new Promise((resolve) => server.once('listening', resolve));
        return await fetch(`http://127.0.0.1:${server.address().port}/api/webhooks/paypal`, {
            method: 'POST',
            headers: {
                ...webhookHeaders,
                'content-type': 'application/json'
            },
            body: JSON.stringify(event)
        });
    } finally {
        server.close();
    }
}

function completedCaptureEvent(overrides = {}) {
    return {
        id: 'WH-event-1',
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
            id: 'capture-1',
            status: 'COMPLETED',
            amount: { currency_code: 'USD', value: '10.00' },
            supplementary_data: { related_ids: { order_id: 'order-1' } }
        },
        ...overrides
    };
}

async function withWebhookModels(testBody) {
    const originals = {
        webhookFindOneAndUpdate: WebhookEvent.findOneAndUpdate,
        webhookFindOne: WebhookEvent.findOne,
        webhookUpdateOne: WebhookEvent.updateOne,
        assessmentFindOne: Assessment.findOne,
        assessmentUpdateOne: Assessment.updateOne
    };
    const updates = [];

    try {
        await testBody(updates);
    } finally {
        WebhookEvent.findOneAndUpdate = originals.webhookFindOneAndUpdate;
        WebhookEvent.findOne = originals.webhookFindOne;
        WebhookEvent.updateOne = originals.webhookUpdateOne;
        Assessment.findOne = originals.assessmentFindOne;
        Assessment.updateOne = originals.assessmentUpdateOne;
    }
}

test('PayPal webhook verification uses environment-specific API and configured webhook ID', async () => {
    const calls = [];
    const fetchImpl = async (url, options) => {
        calls.push({ url, options });
        if (url.endsWith('/v1/oauth2/token')) {
            return { ok: true, json: async () => ({ access_token: 'access-token' }) };
        }
        return { ok: true, json: async () => ({ verification_status: 'SUCCESS' }) };
    };

    const verified = await verifyPayPalWebhook({
        headers: webhookHeaders,
        event: { id: 'event-1', event_type: 'CHECKOUT.ORDER.APPROVED', resource: { id: 'order-1' } },
        env: {
            PAYPAL_ENV: 'live',
            PAYPAL_CLIENT_ID: 'live-client-id',
            PAYPAL_CLIENT_SECRET: 'live-client-secret',
            PAYPAL_WEBHOOK_ID: 'live-webhook-id'
        },
        fetchImpl
    });

    assert.equal(verified, true);
    assert.equal(calls[0].url, 'https://api-m.paypal.com/v1/oauth2/token');
    assert.equal(calls[1].url, 'https://api-m.paypal.com/v1/notifications/verify-webhook-signature');
    assert.equal(JSON.parse(calls[1].options.body).webhook_id, 'live-webhook-id');
    assert.equal(calls[1].options.headers.authorization, 'Bearer access-token');
});

test('PayPal webhook verification requires matching environment configuration', async () => {
    await assert.rejects(verifyPayPalWebhook({
        headers: webhookHeaders,
        event: {},
        env: { PAYPAL_ENV: 'production' },
        fetchImpl: async () => assert.fail('PayPal should not be called with invalid config')
    }), /PAYPAL_ENV must be either sandbox or live/);
});

test('invalid PayPal webhook signatures are rejected without recording an event', async () => {
    const router = createWebhookRouter({ verifySignature: async () => false });
    await withWebhookModels(async () => {
        WebhookEvent.findOneAndUpdate = async () => assert.fail('Invalid event must not be stored');
        const response = await postWebhook(router, completedCaptureEvent());
        assert.equal(response.status, 400);
    });
});

test('verified completed captures are matched against PayPal order details before marking paid', async () => {
    const event = completedCaptureEvent();
    const assessment = {
        _id: 'assessment-object-id',
        id: 'assessment-1',
        paymentType: 'pdf',
        isPaid: false
    };
    let upsertCalls = 0;
    await withWebhookModels(async (updates) => {
        WebhookEvent.findOneAndUpdate = async () => {
            upsertCalls += 1;
            return {
                _id: 'webhook-record-1',
                eventId: event.id,
                status: upsertCalls === 1 ? 'received' : 'processing'
            };
        };
        WebhookEvent.updateOne = async (filter, update) => updates.push({ filter, update });
        Assessment.findOne = async (filter) => {
            assert.deepEqual(filter, { paypalOrderId: 'order-1' });
            return assessment;
        };
        Assessment.updateOne = async (filter, update) => updates.push({ filter, update });

        const router = createWebhookRouter({
            verifySignature: async () => true,
            executePayPalRequest: async () => ({
                result: {
                    status: 'COMPLETED',
                    purchase_units: [{
                        custom_id: 'assessment-1',
                        payments: {
                            captures: [{
                                id: 'capture-1',
                                status: 'COMPLETED',
                                amount: { currency_code: 'USD', value: '10.00' }
                            }]
                        }
                    }]
                }
            })
        });

        const response = await postWebhook(router, event);
        assert.equal(response.status, 200);
        assert.deepEqual(updates.find(({ filter }) => filter.paypalOrderId), {
            filter: {
                _id: 'assessment-object-id',
                paypalOrderId: 'order-1',
                isPaid: { $ne: true }
            },
            update: {
                $set: {
                    isPaid: true,
                    paidAt: updates.find(({ filter }) => filter.paypalOrderId).update.$set.paidAt,
                    paypalCaptureId: 'capture-1'
                }
            }
        });
        assert.ok(updates.find(({ filter }) => filter.paypalOrderId).update.$set.paidAt instanceof Date);
        assert.ok(updates.some(({ update }) => update.$set?.status === 'processed'));
    });
});

test('capture events with a mismatched amount are acknowledged but never mark the assessment paid', async () => {
    const event = completedCaptureEvent();
    let assessmentUpdates = 0;
    await withWebhookModels(async (updates) => {
        let upsertCalls = 0;
        WebhookEvent.findOneAndUpdate = async () => ({
            _id: 'webhook-record-1',
            eventId: event.id,
            status: ++upsertCalls === 1 ? 'received' : 'processing'
        });
        WebhookEvent.updateOne = async (filter, update) => updates.push({ filter, update });
        Assessment.findOne = async () => ({
            _id: 'assessment-object-id',
            id: 'assessment-1',
            paymentType: 'pdf',
            isPaid: false
        });
        Assessment.updateOne = async () => { assessmentUpdates += 1; };
        const router = createWebhookRouter({
            verifySignature: async () => true,
            executePayPalRequest: async () => ({
                result: {
                    status: 'COMPLETED',
                    purchase_units: [{
                        custom_id: 'assessment-1',
                        payments: {
                            captures: [{
                                id: 'capture-1',
                                status: 'COMPLETED',
                                amount: { currency_code: 'USD', value: '1.00' }
                            }]
                        }
                    }]
                }
            })
        });

        const response = await postWebhook(router, event);
        assert.equal(response.status, 200);
        assert.equal(assessmentUpdates, 0);
        assert.ok(updates.some(({ update }) => update.$set?.status === 'ignored'));
    });
});

test('processed PayPal webhook duplicates are acknowledged without repeating payment work', async () => {
    const event = completedCaptureEvent();
    await withWebhookModels(async () => {
        WebhookEvent.findOneAndUpdate = async () => ({
            _id: 'webhook-record-1',
            eventId: event.id,
            status: 'processed'
        });
        Assessment.findOne = async () => assert.fail('Processed duplicate must not look up payment');

        const response = await postWebhook(
            createWebhookRouter({ verifySignature: async () => true }),
            event
        );
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { status: 'success', duplicate: true });
    });
});

test('webhook event records have unique IDs and one-year TTL retention', () => {
    const WebhookEvent = require('../models/WebhookEvent');
    const indexes = WebhookEvent.schema.indexes();
    assert.ok(indexes.some(([fields, options]) => fields.eventId === 1 && options.unique === true));
    assert.ok(indexes.some(([fields, options]) =>
        fields.expiresAt === 1 && options.expireAfterSeconds === 0
    ));
});

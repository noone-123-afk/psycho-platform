const express = require('express');
const router = express.Router();
const paypal = require('@paypal/checkout-server-sdk');
const { client } = require('../paypal');
// const Assessment = require('../models/Assessment');

// إنشاء طلب دفع لنسخة الـ PDF
router.post('/create-order/pdf', async (req, res) => {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
            amount: { currency_code: 'USD', value: '10.00' },
            description: "نسخة رقمية PDF من الكتاب المخصص"
        }]
    });
    try { const order = await client.execute(request); res.json({ id: order.result.id }); } 
    catch (err) { res.status(500).json({ error: err.message }); }
});

// إنشاء طلب دفع لنسخة PDF + الكتاب الصوتي (Audiobook)
router.post('/create-order/pdf-audio', async (req, res) => {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
            amount: { currency_code: 'USD', value: '25.00' },
            description: "نسخة PDF + نسخة صوتية مسموعة من الكتاب المخصص"
        }]
    });
    try { const order = await client.execute(request); res.json({ id: order.result.id }); } 
    catch (err) { res.status(500).json({ error: err.message }); }
});

// إنشاء طلب دفع للنسخة المطبوعة
router.post('/create-order/print', async (req, res) => {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
            amount: { currency_code: 'USD', value: '30.00' },
            description: "نسخة ورقية مطبوعة من الكتاب المخصص"
        }]
    });
    try { const order = await client.execute(request); res.json({ id: order.result.id }); } 
    catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

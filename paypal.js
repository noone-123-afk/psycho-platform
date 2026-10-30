// ملف تكوين بوابة الدفع PayPal
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
require('dotenv').config();

// إعداد بيئة PayPal (تأكد من وضع المفاتيح في ملف .env)
const clientId = process.env.PAYPAL_CLIENT_ID || "PAYPAL-SANDBOX-CLIENT-ID";
const clientSecret = process.env.PAYPAL_CLIENT_SECRET || "PAYPAL-SANDBOX-CLIENT-SECRET";

// استخدام بيئة Sandbox للتجربة (يتم تغييرها لاحقاً لـ LiveEnvironment)
const environment = new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
const client = new checkoutNodeJssdk.core.PayPalHttpClient(environment);

module.exports = { client };

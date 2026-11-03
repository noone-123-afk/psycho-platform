// ملف تكوين بوابة الدفع PayPal
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
require('dotenv').config();

// إعداد بيئة PayPal (تأكد من وضع المفاتيح في ملف .env)
const clientId = process.env.PAYPAL_CLIENT_ID || '';
const clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
const environment = process.env.PAYPAL_ENV === 'live'
  ? new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret)
  : new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
const client = new checkoutNodeJssdk.core.PayPalHttpClient(environment);

module.exports = { client };

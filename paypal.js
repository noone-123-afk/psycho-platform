// ملف تكوين بوابة الدفع PayPal
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
require('dotenv').config();

const PAYPAL_ENV = process.env.PAYPAL_ENV || 'sandbox';
if (!['sandbox', 'live'].includes(PAYPAL_ENV)) {
  throw new Error('PAYPAL_ENV must be either sandbox or live');
}

const clientId = process.env.PAYPAL_CLIENT_ID || '';
const clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
if (Boolean(clientId) !== Boolean(clientSecret)) {
  throw new Error('PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be configured together');
}
if (PAYPAL_ENV === 'live' && (!clientId || !clientSecret)) {
  throw new Error('Live PayPal mode requires PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET');
}

const environment = PAYPAL_ENV === 'live'
  ? new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret)
  : new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
const client = new checkoutNodeJssdk.core.PayPalHttpClient(environment);

module.exports = { client, PAYPAL_ENV };

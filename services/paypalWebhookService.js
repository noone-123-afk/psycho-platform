const PAYPAL_BASE_URLS = {
    sandbox: 'https://api-m.sandbox.paypal.com',
    live: 'https://api-m.paypal.com'
};

function getPaypalConfiguration(env = process.env) {
    const mode = env.PAYPAL_ENV || 'sandbox';
    const baseUrl = PAYPAL_BASE_URLS[mode];
    if (!baseUrl) {
        throw new Error('PAYPAL_ENV must be either sandbox or live');
    }
    if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET || !env.PAYPAL_WEBHOOK_ID) {
        throw new Error('PayPal credentials and PAYPAL_WEBHOOK_ID are required for webhook verification');
    }
    return {
        baseUrl,
        clientId: env.PAYPAL_CLIENT_ID,
        clientSecret: env.PAYPAL_CLIENT_SECRET,
        webhookId: env.PAYPAL_WEBHOOK_ID
    };
}

async function verifyPayPalWebhook({ headers, event, env = process.env, fetchImpl = fetch }) {
    const config = getPaypalConfiguration(env);
    const requiredHeaders = [
        'paypal-auth-algo',
        'paypal-cert-url',
        'paypal-transmission-id',
        'paypal-transmission-sig',
        'paypal-transmission-time'
    ];
    if (requiredHeaders.some((header) => typeof headers[header] !== 'string' || !headers[header])) {
        return false;
    }

    const tokenResponse = await fetchImpl(`${config.baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
            'content-type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials',
        signal: AbortSignal.timeout(10000)
    });
    if (!tokenResponse.ok) {
        throw new Error(`PayPal OAuth request failed with status ${tokenResponse.status}`);
    }
    const tokenBody = await tokenResponse.json();
    if (typeof tokenBody.access_token !== 'string' || !tokenBody.access_token) {
        throw new Error('PayPal OAuth response did not contain an access token');
    }

    const verificationResponse = await fetchImpl(
        `${config.baseUrl}/v1/notifications/verify-webhook-signature`,
        {
            method: 'POST',
            headers: {
                authorization: `Bearer ${tokenBody.access_token}`,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                auth_algo: headers['paypal-auth-algo'],
                cert_url: headers['paypal-cert-url'],
                transmission_id: headers['paypal-transmission-id'],
                transmission_sig: headers['paypal-transmission-sig'],
                transmission_time: headers['paypal-transmission-time'],
                webhook_id: config.webhookId,
                webhook_event: event
            }),
            signal: AbortSignal.timeout(10000)
        }
    );
    if (!verificationResponse.ok) {
        throw new Error(`PayPal signature verification failed with status ${verificationResponse.status}`);
    }
    const verificationBody = await verificationResponse.json();
    return verificationBody.verification_status === 'SUCCESS';
}

module.exports = { getPaypalConfiguration, verifyPayPalWebhook };

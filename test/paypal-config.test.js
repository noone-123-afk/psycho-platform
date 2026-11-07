const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');

function loadPaypalConfig(environment) {
    const result = spawnSync(process.execPath, [
        '-e',
        "const config = require('./paypal'); console.log(config.PAYPAL_ENV);"
    ], {
        cwd: projectRoot,
        encoding: 'utf8',
        env: {
            ...process.env,
            ...environment,
            NODE_ENV: 'test'
        }
    });
    return result;
}

test('PayPal uses sandbox by default when valid sandbox credentials are configured', () => {
    const result = loadPaypalConfig({
        PAYPAL_ENV: 'sandbox',
        PAYPAL_CLIENT_ID: 'sandbox-client-id',
        PAYPAL_CLIENT_SECRET: 'sandbox-client-secret'
    });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), 'sandbox');
});

test('PayPal selects live mode only with a complete live credential pair', () => {
    const result = loadPaypalConfig({
        PAYPAL_ENV: 'live',
        PAYPAL_CLIENT_ID: 'live-client-id',
        PAYPAL_CLIENT_SECRET: 'live-client-secret'
    });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), 'live');
});

test('PayPal rejects an unknown environment instead of silently selecting sandbox', () => {
    const result = loadPaypalConfig({
        PAYPAL_ENV: 'production',
        PAYPAL_CLIENT_ID: 'client-id',
        PAYPAL_CLIENT_SECRET: 'client-secret'
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /PAYPAL_ENV must be either sandbox or live/);
});

test('PayPal live mode requires both credentials', () => {
    const result = loadPaypalConfig({
        PAYPAL_ENV: 'live',
        PAYPAL_CLIENT_ID: '',
        PAYPAL_CLIENT_SECRET: ''
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Live PayPal mode requires/);
});

test('PayPal rejects a partially configured credential pair', () => {
    const result = loadPaypalConfig({
        PAYPAL_ENV: 'sandbox',
        PAYPAL_CLIENT_ID: 'client-id',
        PAYPAL_CLIENT_SECRET: ''
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /must be configured together/);
});

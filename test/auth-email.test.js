const test = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, verifyPassword } = require('../utils/passwords');
const { signToken, verifyToken } = require('../middleware/auth');
const nodemailer = require('nodemailer');
const EmailLog = require('../models/EmailLog');
const Assessment = require('../models/Assessment');
const {
    buildVerificationUrl,
    escapeHtml,
    sendTrackedEmail,
    sendVerificationEmail
} = require('../services/emailService');

test('password hashes verify only the original password', async () => {
    const hash = await hashPassword('correct horse battery staple');
    assert.notEqual(hash, 'correct horse battery staple');
    assert.equal(await verifyPassword('correct horse battery staple', hash), true);
    assert.equal(await verifyPassword('incorrect password', hash), false);
    assert.equal(await verifyPassword('password', 'not-a-hash'), false);
});

test('signed auth tokens reject tampering', () => {
    process.env.AUTH_TOKEN_SECRET = 'test-secret-with-more-than-thirty-two-bytes';
    const token = signToken('507f1f77bcf86cd799439011');
    assert.equal(verifyToken(token), '507f1f77bcf86cd799439011');
    assert.throws(() => verifyToken(`${token.slice(0, -1)}x`), /Invalid authentication token/);
});

test('verification URLs use the configured origin and escape HTML values', () => {
    process.env.FRONTEND_URL = 'https://example.test';
    assert.equal(
        buildVerificationUrl('safe-token'),
        'https://example.test/verify-email?token=safe-token'
    );
    assert.equal(escapeHtml('<script>"&</script>'), '&lt;script&gt;&quot;&amp;&lt;/script&gt;');
    process.env.FRONTEND_URL = 'http://example.test';
    assert.throws(() => buildVerificationUrl('safe-token'), /must use HTTPS/);
});

test('email delivery attempts record sent and failed outcomes without storing content', async () => {
    const originalCreateTransport = nodemailer.createTransport;
    const originalCreateLog = EmailLog.create;
    const records = [];
    process.env.SMTP_HOST = 'smtp.example.test';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'sender@example.test';
    process.env.SMTP_PASSWORD = 'test-password';
    process.env.FROM_EMAIL = 'sender@example.test';
    EmailLog.create = async (record) => records.push(record);
    try {
        nodemailer.createTransport = () => ({ sendMail: async () => ({ messageId: 'test' }) });
        await sendTrackedEmail({
            to: 'recipient@example.test',
            subject: 'Test',
            kind: 'unit_test',
            html: '<p>not retained</p>'
        });
        assert.equal(records[0].status, 'sent');
        assert.equal(records[0].kind, 'unit_test');
        assert.equal(Object.hasOwn(records[0], 'html'), false);

        nodemailer.createTransport = () => ({
            sendMail: async () => { throw Object.assign(new Error('SMTP failed'), { code: 'ESOCKET' }); }
        });
        await assert.rejects(sendTrackedEmail({
            to: 'recipient@example.test',
            subject: 'Test failure',
            kind: 'unit_test',
            text: 'not retained'
        }), /SMTP failed/);
        assert.equal(records[1].status, 'failed');
        assert.equal(records[1].errorCode, 'ESOCKET');
        assert.equal(Object.hasOwn(records[1], 'text'), false);
    } finally {
        nodemailer.createTransport = originalCreateTransport;
        EmailLog.create = originalCreateLog;
    }
});

test('verification messages escape names and include the verification link', async () => {
    const originalCreateTransport = nodemailer.createTransport;
    const originalCreateLog = EmailLog.create;
    const originalFindLog = EmailLog.findOne;
    let outgoingMessage;
    let deliveryLog;
    process.env.SMTP_HOST = 'smtp.example.test';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'sender@example.test';
    process.env.SMTP_PASSWORD = 'test-password';
    process.env.FROM_EMAIL = 'sender@example.test';
    process.env.FRONTEND_URL = 'https://example.test';
    nodemailer.createTransport = () => ({
        sendMail: async (message) => { outgoingMessage = message; }
    });
    EmailLog.create = async (record) => { deliveryLog = record; };
    EmailLog.findOne = () => ({ lean: async () => null });
    try {
        await sendVerificationEmail(
            'person@example.test',
            '<img src=x onerror=alert(1)>',
            '507f1f77bcf86cd799439011',
            buildVerificationUrl('test-token'),
            'en'
        );
        assert.match(outgoingMessage.html, /&lt;img src=x onerror=alert\(1\)&gt;/);
        assert.doesNotMatch(outgoingMessage.html, /<img src=x onerror=/);
        assert.match(outgoingMessage.html, /https:\/\/example\.test\/verify-email\?token=test-token/);
        assert.equal(outgoingMessage.html.includes('Manage email preferences'), false);
        assert.equal(deliveryLog.kind, 'email_verification');
        assert.equal(deliveryLog.idempotencyKey.includes('test-token'), false);
    } finally {
        nodemailer.createTransport = originalCreateTransport;
        EmailLog.create = originalCreateLog;
        EmailLog.findOne = originalFindLog;
    }
});

test('successfully sent idempotent messages are not delivered twice', async () => {
    const originalCreateTransport = nodemailer.createTransport;
    const originalCreateLog = EmailLog.create;
    const originalFindLog = EmailLog.findOne;
    const sentMessages = [];
    const storedLogs = [];
    process.env.SMTP_HOST = 'smtp.example.test';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'sender@example.test';
    process.env.SMTP_PASSWORD = 'test-password';
    process.env.FROM_EMAIL = 'sender@example.test';
    nodemailer.createTransport = () => ({
        sendMail: async (message) => { sentMessages.push(message); }
    });
    EmailLog.create = async (record) => { storedLogs.push(record); };
    EmailLog.findOne = (query) => ({
        lean: async () => storedLogs.find((record) =>
            record.idempotencyKey === query.idempotencyKey && record.status === 'sent'
        ) || null
    });
    try {
        const message = {
            to: 'recipient@example.test',
            subject: 'Report ready',
            kind: 'book_ready',
            idempotencyKey: 'book-ready-assessment-id',
            text: 'report attached'
        };
        await sendTrackedEmail(message);
        await sendTrackedEmail(message);
        assert.equal(sentMessages.length, 1);
        assert.equal(storedLogs.length, 1);
        assert.equal(storedLogs[0].idempotencyKey, message.idempotencyKey);
    } finally {
        nodemailer.createTransport = originalCreateTransport;
        EmailLog.create = originalCreateLog;
        EmailLog.findOne = originalFindLog;
    }
});

test('assessment model accepts the submitted keyed answer format', async () => {
    const assessment = new Assessment({
        user: '507f1f77bcf86cd799439011',
        answers: { q1: 'answer one', q5: 'reflection' },
        bookContentRaw: { title: 'Test report' }
    });
    await assert.doesNotReject(assessment.validate());
    assert.deepEqual(assessment.answers, { q1: 'answer one', q5: 'reflection' });
});

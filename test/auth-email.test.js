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
    sendScheduledFollowupReminderEmail,
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
    const originalSendGridApiKey = process.env.SENDGRID_API_KEY;
    const records = [];
    delete process.env.SENDGRID_API_KEY;
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
        if (originalSendGridApiKey === undefined) delete process.env.SENDGRID_API_KEY;
        else process.env.SENDGRID_API_KEY = originalSendGridApiKey;
    }
});

test('SendGrid sends tracked messages and PDF attachments without logging message content', async () => {
    const originalFetch = global.fetch;
    const originalCreateLog = EmailLog.create;
    const originalFindLog = EmailLog.findOne;
    const originalCreateTransport = nodemailer.createTransport;
    const originalSendGridApiKey = process.env.SENDGRID_API_KEY;
    const originalFromEmail = process.env.FROM_EMAIL;
    const records = [];
    let request;
    process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
    process.env.FROM_EMAIL = 'sender@example.test';
    global.fetch = async (url, options) => {
        request = { url, options };
        return { ok: true, status: 202 };
    };
    EmailLog.create = async (record) => { records.push(record); };
    EmailLog.findOne = () => ({ lean: async () => null });

    try {
        await sendTrackedEmail({
            to: 'recipient@example.test',
            subject: 'Report ready',
            kind: 'book_ready',
            idempotencyKey: 'sendgrid-test-report',
            text: 'private message',
            html: '<p>private message</p>',
            replyTo: 'reply@example.test',
            attachments: [{
                filename: 'report.pdf',
                content: Buffer.from('fake-pdf-content'),
                contentType: 'application/pdf'
            }]
        });

        assert.equal(request.url, 'https://api.sendgrid.com/v3/mail/send');
        assert.equal(request.options.headers.authorization, 'Bearer test-sendgrid-key');
        const payload = JSON.parse(request.options.body);
        assert.deepEqual(payload.personalizations[0].to, [{ email: 'recipient@example.test' }]);
        assert.equal(payload.reply_to.email, 'reply@example.test');
        assert.equal(payload.attachments[0].content, Buffer.from('fake-pdf-content').toString('base64'));
        assert.equal(records[0].status, 'sent');
        assert.equal(Object.hasOwn(records[0], 'text'), false);
        assert.equal(JSON.stringify(records).includes('test-sendgrid-key'), false);

        global.fetch = async () => ({ ok: false, status: 401 });
        nodemailer.createTransport = () => {
            throw new Error('SendGrid failures must not fall back to SMTP');
        };
        await assert.rejects(sendTrackedEmail({
            to: 'recipient@example.test',
            subject: 'Failure',
            kind: 'unit_test',
            text: 'private message'
        }), /status 401/);
        assert.equal(records[1].status, 'failed');
        assert.equal(records[1].errorCode, 'SENDGRID_HTTP_401');
        assert.equal(Object.hasOwn(records[1], 'text'), false);
    } finally {
        global.fetch = originalFetch;
        EmailLog.create = originalCreateLog;
        EmailLog.findOne = originalFindLog;
        nodemailer.createTransport = originalCreateTransport;
        if (originalSendGridApiKey === undefined) delete process.env.SENDGRID_API_KEY;
        else process.env.SENDGRID_API_KEY = originalSendGridApiKey;
        if (originalFromEmail === undefined) delete process.env.FROM_EMAIL;
        else process.env.FROM_EMAIL = originalFromEmail;
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

test('scheduled follow-up reminder emails link to the follow-up page without health details', async () => {
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
        await sendScheduledFollowupReminderEmail({
            email: 'person@example.test',
            name: 'Person',
            userId: '507f1f77bcf86cd799439011',
            language: 'en',
            followupNumber: 2,
            followupId: '507f1f77bcf86cd799439012'
        });
        assert.match(outgoingMessage.html, /Follow-up assessment 2 of 3 is now available/);
        assert.match(outgoingMessage.html, /https:\/\/example\.test\/followup/);
        assert.match(outgoingMessage.text, /https:\/\/example\.test\/followup/);
        assert.doesNotMatch(outgoingMessage.html, /PHQ|GAD|score|health/i);
        assert.equal(deliveryLog.kind, 'followup_assessment_reminder');
        assert.equal(deliveryLog.idempotencyKey, 'followup-reminder-507f1f77bcf86cd799439012');
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

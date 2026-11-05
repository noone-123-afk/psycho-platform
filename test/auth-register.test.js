const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const User = require('../models/User');
const emailService = require('../services/emailService');

let verificationEmailCalls = 0;
emailService.sendVerificationEmail = async () => {
    verificationEmailCalls += 1;
};
const authRoutes = require('../routes/auth');
const { verifyToken } = require('../middleware/auth');

test('registration verifies the account and returns an auth token without sending email', async () => {
    const originalCreate = User.create;
    const originalSecret = process.env.AUTH_TOKEN_SECRET;
    const originalAdminEmail = process.env.ADMIN_EMAIL;
    const userId = '507f1f77bcf86cd799439011';
    let savedUser;
    process.env.AUTH_TOKEN_SECRET = 'test-secret-with-more-than-thirty-two-bytes';
    process.env.ADMIN_EMAIL = '';
    User.create = async (user) => {
        savedUser = user;
        return { ...user, id: userId };
    };

    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.post('/api/register', authRoutes.registerUser);
    const server = app.listen(0);

    try {
        await new Promise((resolve) => server.once('listening', resolve));
        const address = server.address();
        const response = await fetch(`http://127.0.0.1:${address.port}/api/register`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email: 'test@example.com',
                password: 'a-secure-test-password',
                language: 'en'
            })
        });
        const body = await response.json();

        assert.equal(response.status, 201);
        assert.equal(savedUser.emailVerified, true);
        assert.equal(Object.hasOwn(savedUser, 'emailVerificationTokenHash'), false);
        assert.equal(Object.hasOwn(savedUser, 'emailVerificationExpiresAt'), false);
        assert.equal(verifyToken(body.token), userId);
        assert.equal(body.user.email, 'test@example.com');
        assert.equal(verificationEmailCalls, 0);
    } finally {
        server.close();
        User.create = originalCreate;
        if (originalSecret === undefined) {
            delete process.env.AUTH_TOKEN_SECRET;
        } else {
            process.env.AUTH_TOKEN_SECRET = originalSecret;
        }
        if (originalAdminEmail === undefined) {
            delete process.env.ADMIN_EMAIL;
        } else {
            process.env.ADMIN_EMAIL = originalAdminEmail;
        }
    }
});

const express = require('express');
const crypto = require('node:crypto');
const User = require('../models/User');
const { requireAuth, signToken } = require('../middleware/auth');
const { hashPassword, verifyPassword } = require('../utils/passwords');
const {
    sendVerificationEmail,
    sendWelcomeEmail,
    buildVerificationUrl
} = require('../services/emailService');

const router = express.Router();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        language: user.language
    };
}

router.post('/register', async (req, res) => {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = req.body.password;
    const language = req.body.language === 'en' ? 'en' : 'ar';

    if (!name || name.length > 100 || !EMAIL_PATTERN.test(email) || email.length > 254) {
        return res.status(400).json({ message: 'Enter a valid name and email address' });
    }
    if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
        return res.status(400).json({ message: 'Password must be between 12 and 128 characters' });
    }
    if (!process.env.AUTH_TOKEN_SECRET || Buffer.byteLength(process.env.AUTH_TOKEN_SECRET, 'utf8') < 32) {
        return res.status(503).json({ message: 'Authentication is not configured' });
    }
    if (email === process.env.ADMIN_EMAIL?.trim().toLowerCase()) {
        return res.status(409).json({ message: 'This email is reserved for the administrator' });
    }
    let verificationToken;
    let verificationUrl;
    try {
        verificationToken = crypto.randomBytes(32).toString('base64url');
        verificationUrl = buildVerificationUrl(verificationToken);
    } catch (error) {
        return res.status(503).json({ message: error.message });
    }

    try {
        const user = await User.create({
            name,
            email,
            passwordHash: await hashPassword(password),
            language,
            emailVerificationTokenHash: crypto.createHash('sha256').update(verificationToken).digest('hex'),
            emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            verificationLastSentAt: new Date()
        });
        void sendVerificationEmail(user.email, user.name, user.id, verificationUrl, user.language)
            .catch((error) => console.error('Verification email delivery failed:', error.message));
        return res.status(201).json({
            verificationRequired: true,
            message: 'Check your email to verify your account before signing in'
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'An account with this email already exists' });
        }
        console.error('Account registration failed:', error.message);
        return res.status(500).json({ message: 'Unable to create account' });
    }
});

router.post('/login', async (req, res) => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = req.body.password;
    if (!EMAIL_PATTERN.test(email) || typeof password !== 'string' || password.length > 128) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    try {
        const user = await User.findOne({ email }).select('+passwordHash');
        if (!user || !(await verifyPassword(password, user.passwordHash))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        if (!user.emailVerified) {
            return res.status(403).json({ message: 'Verify your email address before signing in' });
        }
        return res.json({ token: signToken(user.id), user: publicUser(user) });
    } catch (error) {
        console.error('Account sign-in failed:', error.message);
        return res.status(500).json({ message: 'Unable to sign in' });
    }
});

router.post('/resend-verification', async (req, res) => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
        return res.status(400).json({ message: 'Enter a valid email address' });
    }

    try {
        const verificationToken = crypto.randomBytes(32).toString('base64url');
        const verificationUrl = buildVerificationUrl(verificationToken);
        const now = new Date();
        const user = await User.findOneAndUpdate(
            {
                email,
                emailVerified: false,
                $or: [
                    { verificationLastSentAt: { $exists: false } },
                    { verificationLastSentAt: { $lte: new Date(now.getTime() - 60 * 1000) } }
                ]
            },
            {
                $set: {
                    emailVerificationTokenHash: crypto.createHash('sha256').update(verificationToken).digest('hex'),
                    emailVerificationExpiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
                    verificationLastSentAt: now
                }
            },
            { new: true }
        );
        if (!user) {
            return res.json({ message: 'If an unverified account exists, a new link will be sent' });
        }
        await sendVerificationEmail(user.email, user.name, user.id, verificationUrl, user.language);
        return res.json({ message: 'A new verification link has been sent' });
    } catch (error) {
        console.error('Verification email resend failed:', error.message);
        return res.status(503).json({ message: 'Unable to send a verification link right now' });
    }
});

router.get('/verify-email', async (req, res) => {
    const token = req.query.token;
    if (typeof token !== 'string' || token.length < 32 || token.length > 200) {
        return res.status(400).json({ message: 'Invalid or expired verification link' });
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    try {
        const user = await User.findOne({
            emailVerificationTokenHash: tokenHash,
            emailVerificationExpiresAt: { $gt: new Date() }
        }).select('+emailVerificationTokenHash +emailVerificationExpiresAt');
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification link' });
        }
        user.emailVerified = true;
        user.emailVerificationTokenHash = undefined;
        user.emailVerificationExpiresAt = undefined;
        await user.save();
        void sendWelcomeEmail(user.email, user.name, user.id, user.language)
            .catch((error) => console.error('Welcome email delivery failed:', error.message));
        return res.json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('Email verification failed:', error.message);
        return res.status(500).json({ message: 'Unable to verify email address' });
    }
});

router.get('/me', requireAuth, (req, res) => {
    res.json({ user: publicUser(req.authUser) });
});

module.exports = router;

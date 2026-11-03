const crypto = require('node:crypto');
const User = require('../models/User');

const TOKEN_LIFETIME_SECONDS = 7 * 24 * 60 * 60;

function getTokenSecret() {
    const secret = process.env.AUTH_TOKEN_SECRET;
    if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
        throw new Error('AUTH_TOKEN_SECRET must contain at least 32 bytes');
    }
    return secret;
}

function signToken(userId) {
    const now = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(JSON.stringify({
        sub: userId.toString(),
        iat: now,
        exp: now + TOKEN_LIFETIME_SECONDS
    })).toString('base64url');
    const unsignedToken = `v1.${payload}`;
    const signature = crypto.createHmac('sha256', getTokenSecret())
        .update(unsignedToken)
        .digest('base64url');
    return `${unsignedToken}.${signature}`;
}

function verifyToken(token) {
    const [version, payload, signature, extra] = token.split('.');
    if (version !== 'v1' || !payload || !signature || extra !== undefined) {
        throw new Error('Invalid authentication token');
    }

    const expectedSignature = crypto.createHmac('sha256', getTokenSecret())
        .update(`${version}.${payload}`)
        .digest();
    const suppliedSignature = Buffer.from(signature, 'base64url');
    if (
        suppliedSignature.length !== expectedSignature.length ||
        !crypto.timingSafeEqual(suppliedSignature, expectedSignature)
    ) {
        throw new Error('Invalid authentication token');
    }

    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (
        typeof claims.sub !== 'string' ||
        !mongooseIdIsValid(claims.sub) ||
        !Number.isInteger(claims.exp) ||
        claims.exp <= Math.floor(Date.now() / 1000)
    ) {
        throw new Error('Expired or invalid authentication token');
    }
    return claims.sub;
}

function mongooseIdIsValid(value) {
    return /^[a-f\d]{24}$/i.test(value);
}

async function requireAuth(req, res, next) {
    const authorization = req.get('authorization') || '';
    const match = /^Bearer ([^\s]+)$/.exec(authorization);
    if (!match) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    let userId;
    try {
        userId = verifyToken(match[1]);
    } catch (error) {
        if (error.message === 'AUTH_TOKEN_SECRET must contain at least 32 bytes') {
            console.error(error.message);
            return res.status(503).json({ message: 'Authentication is not configured' });
        }
        return res.status(401).json({ message: 'Invalid or expired authentication token' });
    }

    try {
        const user = await User.findById(userId);
        if (!user || !user.emailVerified) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        req.authUser = user;
        return next();
    } catch (error) {
        console.error('Authentication lookup failed:', error.message);
        return res.status(503).json({ message: 'Unable to verify authentication' });
    }
}

function requireAdmin(req, res, next) {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (!adminEmail || req.authUser?.email !== adminEmail || !req.authUser?.isAdmin) {
        return res.status(403).json({ message: 'Administrator access required' });
    }
    return next();
}

module.exports = { requireAuth, requireAdmin, signToken, verifyToken };

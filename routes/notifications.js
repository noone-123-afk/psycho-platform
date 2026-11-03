const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const preferenceFields = [
    'welcomeEmail',
    'bookReadyEmail',
    'followUpEmails',
    'marketingEmails'
];

router.use(requireAuth);

router.get('/preferences', (req, res) => {
    const preferences = req.authUser.notificationPreferences || {};
    return res.json({
        welcomeEmail: preferences.welcomeEmail ?? true,
        bookReadyEmail: preferences.bookReadyEmail ?? true,
        followUpEmails: preferences.followUpEmails ?? true,
        marketingEmails: preferences.marketingEmails ?? false
    });
});

router.put('/preferences', async (req, res) => {
    const suppliedFields = Object.keys(req.body || {});
    if (
        suppliedFields.length !== preferenceFields.length ||
        preferenceFields.some((field) => typeof req.body[field] !== 'boolean') ||
        suppliedFields.some((field) => !preferenceFields.includes(field))
    ) {
        return res.status(400).json({ message: 'All notification preferences must be boolean values' });
    }

    try {
        req.authUser.notificationPreferences = Object.fromEntries(
            preferenceFields.map((field) => [field, req.body[field]])
        );
        await req.authUser.save();
        return res.json({ status: 'preferences updated' });
    } catch (error) {
        console.error('Notification preferences update failed:', error.message);
        return res.status(500).json({ message: 'Unable to update notification preferences' });
    }
});

module.exports = router;

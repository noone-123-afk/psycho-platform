const express = require('express');
const CrisisReport = require('../models/CrisisReport');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
        ? req.body
        : {};
    if (Object.keys(body).some((key) => key !== 'consent') || body.consent !== true) {
        return res.status(400).json({
            message: 'Explicit consent is required; report text and health information are not accepted'
        });
    }

    try {
        const existingReport = await CrisisReport.exists({
            user: req.authUser.id,
            status: 'new',
            expiresAt: { $gt: new Date() }
        });
        if (existingReport) {
            return res.status(409).json({
                message: 'You already have an open request. Please wait for it to be reviewed.'
            });
        }

        const report = await CrisisReport.create({
            user: req.authUser.id,
            requestType: 'contact_request',
            consentAt: new Date()
        });
        res.set('Cache-Control', 'no-store');
        return res.status(201).json({
            report: {
                id: report.id,
                status: report.status,
                createdAt: report.createdAt,
                expiresAt: report.expiresAt
            }
        });
    } catch (error) {
        console.error('Voluntary crisis contact request failed:', error.message);
        return res.status(500).json({ message: 'Unable to submit your request right now' });
    }
});

module.exports = router;

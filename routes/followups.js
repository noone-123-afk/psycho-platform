const express = require('express');
const mongoose = require('mongoose');
const Assessment = require('../models/Assessment');
const FollowupAssessment = require('../models/FollowupAssessment');
const { scheduleFollowups } = require('../services/followupService');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const RETENTION_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

const scoreFields = {
    phq9_score: { path: 'phq9Score', min: 0, max: 27 },
    gad7_score: { path: 'gad7Score', min: 0, max: 21 },
    self_rating_awareness: { path: 'selfRatingAwareness', min: 1, max: 10 },
    self_rating_regulation: { path: 'selfRatingRegulation', min: 1, max: 10 },
    self_rating_relationships: { path: 'selfRatingRelationships', min: 1, max: 10 },
    self_rating_productivity: { path: 'selfRatingProductivity', min: 1, max: 10 },
    self_rating_satisfaction: { path: 'selfRatingSatisfaction', min: 1, max: 10 }
};

const textFields = {
    progress_notes: 'progressNotes',
    challenges_faced: 'challengesFaced',
    achievements: 'achievements',
    goals_for_next_period: 'goalsForNextPeriod'
};

function validateSubmission(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return 'A valid follow-up submission is required';
    }
    const allowedKeys = new Set([
        'followup_number',
        'consent',
        ...Object.keys(scoreFields),
        ...Object.keys(textFields)
    ]);
    if (Object.keys(body).some((key) => !allowedKeys.has(key))) {
        return 'Unexpected follow-up data was provided';
    }
    if (!Number.isInteger(body.followup_number) || body.followup_number < 1 || body.followup_number > 3) {
        return 'Follow-up number must be 1, 2, or 3';
    }
    if (body.consent !== true) {
        return 'Explicit consent is required to save follow-up health information';
    }
    for (const [field, { min, max }] of Object.entries(scoreFields)) {
        if (!Number.isInteger(body[field]) || body[field] < min || body[field] > max) {
            return `${field} must be an integer between ${min} and ${max}`;
        }
    }
    for (const field of Object.keys(textFields)) {
        if (body[field] !== undefined && body[field] !== null &&
            (typeof body[field] !== 'string' || body[field].length > 2000)) {
            return `${field} must be text no longer than 2000 characters`;
        }
    }
    return null;
}

router.use(requireAuth);
router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    return next();
});

router.post('/schedule', async (req, res) => {
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
        ? req.body
        : {};
    if (
        Object.keys(body).length !== 1 ||
        typeof body.assessment_id !== 'string' ||
        !mongoose.isValidObjectId(body.assessment_id)
    ) {
        return res.status(400).json({ message: 'A valid assessment_id is required' });
    }

    try {
        const assessment = await Assessment.findOne({
            _id: body.assessment_id,
            user: req.authUser.id,
            assessmentType: 'individual'
        }).select('_id createdAt');
        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }
        await scheduleFollowups({
            userId: req.authUser.id,
            assessmentId: assessment.id,
            assessedAt: assessment.createdAt
        });
        return res.status(201).json({
            status: 'success',
            message: 'Follow-ups scheduled for 30, 60, and 90 days'
        });
    } catch (error) {
        console.error('Follow-up scheduling failed:', error.message);
        return res.status(500).json({ message: 'Unable to schedule follow-ups right now' });
    }
});

router.get('/my-followups', async (req, res) => {
    try {
        const followups = await FollowupAssessment.find({
            user: req.authUser.id,
            expiresAt: { $gt: new Date() }
        })
            .select('originalAssessment followupNumber scheduledAt completedAt status')
            .sort({ scheduledAt: 1 })
            .lean();

        return res.json({
            followups: followups.map((followup) => ({
                id: followup._id.toString(),
                original_assessment_id: followup.originalAssessment.toString(),
                followup_number: followup.followupNumber,
                scheduled_date: followup.scheduledAt,
                completed_date: followup.completedAt,
                status: followup.status,
                available: followup.status === 'scheduled' && followup.scheduledAt <= new Date()
            }))
        });
    } catch (error) {
        console.error('Follow-up schedule retrieval failed:', error.message);
        return res.status(500).json({ message: 'Unable to load your follow-up schedule' });
    }
});

router.post('/submit', async (req, res) => {
    const validationError = validateSubmission(req.body);
    if (validationError) {
        return res.status(400).json({ message: validationError });
    }

    const now = new Date();
    const update = {
        status: 'completed',
        completedAt: now,
        consentAt: now,
        expiresAt: new Date(now.getTime() + RETENTION_DAYS * DAY_MS)
    };
    for (const [field, { path }] of Object.entries(scoreFields)) {
        update[path] = req.body[field];
    }
    for (const [field, path] of Object.entries(textFields)) {
        update[path] = typeof req.body[field] === 'string' ? req.body[field].trim() : null;
    }

    try {
        const followup = await FollowupAssessment.findOneAndUpdate(
            {
                user: req.authUser.id,
                followupNumber: req.body.followup_number,
                status: 'scheduled',
                scheduledAt: { $lte: now },
                expiresAt: { $gt: now }
            },
            { $set: update },
            { new: true, runValidators: true }
        );
        if (!followup) {
            return res.status(404).json({
                message: 'No available follow-up was found for this period'
            });
        }
        return res.json({
            status: 'success',
            message: 'Follow-up submitted successfully',
            followup_number: followup.followupNumber,
            next_followup: followup.followupNumber < 3 ? followup.followupNumber + 1 : null,
            expires_at: followup.expiresAt
        });
    } catch (error) {
        console.error('Follow-up submission failed:', error.message);
        if (error instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({ message: 'Follow-up values are invalid' });
        }
        return res.status(500).json({ message: 'Unable to save your follow-up right now' });
    }
});

router.get('/progress-summary', async (req, res) => {
    try {
        const followups = await FollowupAssessment.find({
            user: req.authUser.id,
            status: 'completed',
            expiresAt: { $gt: new Date() }
        })
            .select('followupNumber completedAt phq9Score gad7Score selfRatingAwareness selfRatingRegulation selfRatingRelationships selfRatingProductivity selfRatingSatisfaction')
            .sort({ completedAt: 1 })
            .lean();

        if (followups.length === 0) {
            return res.json({ summary: null, message: 'No completed follow-ups yet' });
        }
        const scoreMap = {
            phq9: 'phq9Score',
            gad7: 'gad7Score',
            awareness: 'selfRatingAwareness',
            regulation: 'selfRatingRegulation',
            relationships: 'selfRatingRelationships',
            productivity: 'selfRatingProductivity',
            satisfaction: 'selfRatingSatisfaction'
        };
        const serialize = (followup) => ({
            followup_number: followup.followupNumber,
            completed_date: followup.completedAt,
            phq9_score: followup.phq9Score,
            gad7_score: followup.gad7Score,
            self_rating_awareness: followup.selfRatingAwareness,
            self_rating_regulation: followup.selfRatingRegulation,
            self_rating_relationships: followup.selfRatingRelationships,
            self_rating_productivity: followup.selfRatingProductivity,
            self_rating_satisfaction: followup.selfRatingSatisfaction
        });
        const trends = Object.fromEntries(
            Object.entries(scoreMap).map(([trend, field]) => [
                trend,
                followups
                    .filter((followup) => followup[field] !== null && followup[field] !== undefined)
                    .map((followup) => followup[field])
            ])
        );

        return res.json({
            summary: {
                total_completed: followups.length,
                latest: serialize(followups[followups.length - 1]),
                periods: followups.map((followup) => ({
                    followup_number: followup.followupNumber,
                    completed_date: followup.completedAt
                })),
                trends
            }
        });
    } catch (error) {
        console.error('Follow-up progress summary failed:', error.message);
        return res.status(500).json({ message: 'Unable to load your progress summary' });
    }
});

module.exports = router;
module.exports.validateSubmission = validateSubmission;

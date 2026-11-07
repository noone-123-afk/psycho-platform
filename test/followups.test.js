const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const User = require('../models/User');
const Assessment = require('../models/Assessment');
const FollowupAssessment = require('../models/FollowupAssessment');
const FollowupReminder = require('../models/FollowupReminder');
const followupRoutes = require('../routes/followups');
const { signToken } = require('../middleware/auth');
const { scheduleFollowups } = require('../services/followupService');

test('follow-up scheduling creates idempotent 30, 60, and 90 day records', async () => {
    const originalBulkWrite = FollowupAssessment.bulkWrite;
    const originalFind = FollowupAssessment.find;
    const originalReminderBulkWrite = FollowupReminder.bulkWrite;
    const operationsWritten = [];
    let reminderOperations = [];
    FollowupAssessment.bulkWrite = async (operations, options) => {
        operationsWritten.push({ operations, options });
        return { upsertedCount: operations.length };
    };
    FollowupAssessment.find = () => ({
        select() { return this; },
        lean: async () => operationsWritten[0].operations.map(({ updateOne }, index) => ({
            _id: `followup-${index + 1}`,
            user: updateOne.update.$setOnInsert.user,
            scheduledAt: updateOne.update.$setOnInsert.scheduledAt,
            expiresAt: updateOne.update.$setOnInsert.expiresAt
        }))
    });
    FollowupReminder.bulkWrite = async (operations, options) => {
        reminderOperations = { operations, options };
    };
    try {
        const baseDate = new Date('2026-01-01T10:00:00.000Z');
        await scheduleFollowups({
            userId: '507f1f77bcf86cd799439011',
            assessmentId: '507f191e810c19729de860ea',
            assessedAt: baseDate
        });
        const { operations, options } = operationsWritten[0];
        assert.equal(operations.length, 3);
        assert.deepEqual(options, { ordered: true });
        assert.equal(reminderOperations.operations.length, 3);
        assert.deepEqual(reminderOperations.options, { ordered: true });
        for (const [index, days] of [30, 60, 90].entries()) {
            const operation = operations[index].updateOne;
            assert.equal(operation.upsert, true);
            assert.equal(operation.filter.followupNumber, index + 1);
            assert.equal(
                operation.update.$setOnInsert.scheduledAt.getTime(),
                baseDate.getTime() + days * 24 * 60 * 60 * 1000
            );
            assert.equal(operation.update.$setOnInsert.status, 'scheduled');
            const reminder = reminderOperations.operations[index].updateOne;
            assert.equal(reminder.filter.followup, `followup-${index + 1}`);
            assert.equal(reminder.upsert, true);
            assert.equal(reminder.update.$setOnInsert.status, 'pending');
        }
        await assert.rejects(scheduleFollowups({
            userId: '507f1f77bcf86cd799439011',
            assessmentId: '507f191e810c19729de860ea',
            assessedAt: 'invalid'
        }), /valid assessment completion date/);
    } finally {
        FollowupAssessment.bulkWrite = originalBulkWrite;
        FollowupAssessment.find = originalFind;
        FollowupReminder.bulkWrite = originalReminderBulkWrite;
    }
});

test('follow-up routes require ownership, explicit consent, and valid privacy-bounded fields', async () => {
    const originals = {
        secret: process.env.AUTH_TOKEN_SECRET,
        userFindById: User.findById,
        assessmentFindOne: Assessment.findOne,
        bulkWrite: FollowupAssessment.bulkWrite,
        reminderBulkWrite: FollowupReminder.bulkWrite,
        find: FollowupAssessment.find,
        findOneAndUpdate: FollowupAssessment.findOneAndUpdate
    };
    const userId = '507f1f77bcf86cd799439011';
    const assessmentId = '507f191e810c19729de860ea';
    const now = new Date();
    const savedFollowup = {
        _id: '507f191e810c19729de860eb',
        originalAssessment: assessmentId,
        followupNumber: 1,
        scheduledAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        completedAt: now,
        status: 'completed',
        expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
        phq9Score: 4,
        gad7Score: 3,
        selfRatingAwareness: 8,
        selfRatingRegulation: 7,
        selfRatingRelationships: 6,
        selfRatingProductivity: 8,
        selfRatingSatisfaction: 9,
        progressNotes: 'private note'
    };
    let activeUser = { id: userId, emailVerified: true, isAdmin: false, adminRole: null };
    let scheduleFilter;
    let submissionFilter;
    let submissionUpdate;
    let foundRecords = [];
    let followupFindFilter;
    process.env.AUTH_TOKEN_SECRET = 'test-secret-with-more-than-thirty-two-bytes';
    User.findById = async () => activeUser;
    Assessment.findOne = (filter) => {
        scheduleFilter = filter;
        return { select: async () => ({ id: assessmentId, createdAt: now }) };
    };
    FollowupAssessment.bulkWrite = async (operations) => {
        foundRecords = operations.map(({ updateOne }) => ({
            _id: `followup-${updateOne.filter.followupNumber}`,
            originalAssessment: assessmentId,
            followupNumber: updateOne.filter.followupNumber,
            scheduledAt: updateOne.update.$setOnInsert.scheduledAt,
            completedAt: null,
            status: 'scheduled'
        }));
    };
    FollowupReminder.bulkWrite = async () => {};
    FollowupAssessment.find = (filter) => ({
        filter,
        select() { return this; },
        sort() { return this; },
        lean: async function lean() {
            followupFindFilter = this.filter;
            return this.filter.user === userId ? foundRecords : [];
        }
    });
    FollowupAssessment.findOneAndUpdate = async (filter, update) => {
        submissionFilter = filter;
        submissionUpdate = update.$set;
        return savedFollowup;
    };

    const app = express();
    app.use(express.json());
    app.use('/api/followup', followupRoutes);
    const server = app.listen(0);
    try {
        await new Promise((resolve) => server.once('listening', resolve));
        const baseUrl = `http://127.0.0.1:${server.address().port}`;
        const headers = {
            authorization: `Bearer ${signToken(userId)}`,
            'content-type': 'application/json'
        };

        const invalidSchedule = await fetch(`${baseUrl}/api/followup/schedule`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ user_id: '507f1f77bcf86cd799439012' })
        });
        assert.equal(invalidSchedule.status, 400);

        const scheduled = await fetch(`${baseUrl}/api/followup/schedule`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ assessment_id: assessmentId })
        });
        assert.equal(scheduled.status, 201);
        assert.equal(scheduleFilter.user, userId);
        assert.equal(scheduleFilter.assessmentType, 'individual');

        const listResponse = await fetch(`${baseUrl}/api/followup/my-followups`, { headers });
        const listBody = await listResponse.json();
        assert.equal(listResponse.status, 200);
        assert.equal(listBody.followups.length, 3);
        assert.equal(Object.hasOwn(listBody.followups[0], 'phq9_score'), false);
        assert.equal(listBody.followups[0].available, false);

        foundRecords[0].scheduledAt = new Date(now.getTime() - 1000);
        const dueListResponse = await fetch(`${baseUrl}/api/followup/my-followups`, { headers });
        const dueListBody = await dueListResponse.json();
        assert.equal(dueListBody.followups[0].available, true);

        const baseSubmission = {
            followup_number: 1,
            consent: true,
            phq9_score: 4,
            gad7_score: 3,
            self_rating_awareness: 8,
            self_rating_regulation: 7,
            self_rating_relationships: 6,
            self_rating_productivity: 8,
            self_rating_satisfaction: 9,
            progress_notes: 'private note'
        };
        const noConsent = await fetch(`${baseUrl}/api/followup/submit`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ ...baseSubmission, consent: false })
        });
        assert.equal(noConsent.status, 400);

        const outOfRange = await fetch(`${baseUrl}/api/followup/submit`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ ...baseSubmission, phq9_score: 28 })
        });
        assert.equal(outOfRange.status, 400);

        const submission = await fetch(`${baseUrl}/api/followup/submit`, {
            method: 'POST',
            headers,
            body: JSON.stringify(baseSubmission)
        });
        const submissionBody = await submission.json();
        assert.equal(submission.status, 200);
        assert.equal(submissionBody.next_followup, 2);
        assert.equal(submission.headers.get('cache-control'), 'no-store');
        assert.equal(submissionFilter.user, userId);
        assert.equal(submissionFilter.status, 'scheduled');
        assert.ok(submissionFilter.scheduledAt.$lte instanceof Date);
        assert.equal(submissionUpdate.phq9Score, 4);
        assert.equal(submissionUpdate.progressNotes, 'private note');
        assert.ok(submissionUpdate.consentAt instanceof Date);
        assert.ok(submissionUpdate.expiresAt.getTime() >= now.getTime() + 365 * 24 * 60 * 60 * 1000 - 1000);

        foundRecords = [savedFollowup];
        const summaryResponse = await fetch(`${baseUrl}/api/followup/progress-summary`, { headers });
        const summary = await summaryResponse.json();
        assert.equal(summaryResponse.status, 200);
        assert.deepEqual(summary.summary.trends.phq9, [4]);
        assert.equal(summary.summary.latest.phq9_score, 4);
        assert.equal(Object.hasOwn(summary.summary.latest, 'progress_notes'), false);

        activeUser = { id: '507f1f77bcf86cd799439012', emailVerified: true };
        const otherUserResponse = await fetch(`${baseUrl}/api/followup/my-followups`, {
            headers: { authorization: `Bearer ${signToken(activeUser.id)}` }
        });
        const otherUserBody = await otherUserResponse.json();
        assert.equal(otherUserResponse.status, 200);
        assert.deepEqual(otherUserBody.followups, []);
        assert.equal(followupFindFilter.user, activeUser.id);
    } finally {
        server.close();
        if (originals.secret === undefined) delete process.env.AUTH_TOKEN_SECRET;
        else process.env.AUTH_TOKEN_SECRET = originals.secret;
        User.findById = originals.userFindById;
        Assessment.findOne = originals.assessmentFindOne;
        FollowupAssessment.bulkWrite = originals.bulkWrite;
        FollowupReminder.bulkWrite = originals.reminderBulkWrite;
        FollowupAssessment.find = originals.find;
        FollowupAssessment.findOneAndUpdate = originals.findOneAndUpdate;
    }
});

test('follow-up health details have explicit consent and one-year TTL retention', () => {
    const indexes = FollowupAssessment.schema.indexes();
    assert.ok(indexes.some(([fields, options]) =>
        fields.expiresAt === 1 && options.expireAfterSeconds === 0
    ));
    assert.ok(indexes.some(([fields, options]) =>
        fields.user === 1 && fields.originalAssessment === 1 && fields.followupNumber === 1 &&
        options.unique === true
    ));
    assert.equal(FollowupAssessment.schema.path('progressNotes').options.maxlength, 2000);
});

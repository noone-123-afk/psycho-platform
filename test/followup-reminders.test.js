const test = require('node:test');
const assert = require('node:assert/strict');
const FollowupAssessment = require('../models/FollowupAssessment');
const FollowupReminder = require('../models/FollowupReminder');
const { processDueFollowupReminders } = require('../services/followupReminderService');

test('follow-up reminder records are unique per assessment and expire with their follow-up', () => {
    const indexes = FollowupReminder.schema.indexes();
    assert.ok(indexes.some(([fields, options]) =>
        fields.followup === 1 && options.unique === true
    ));
    assert.ok(indexes.some(([fields, options]) =>
        fields.expiresAt === 1 && options.expireAfterSeconds === 0
    ));
});

function createQuery(value) {
    return {
        select() { return this; },
        sort() { return this; },
        limit() { return this; },
        populate() { return this; },
        lean: async () => value
    };
}

async function withReminderModels({ dueFollowups = [], reminders = [], testBody }) {
    const originals = {
        followupFind: FollowupAssessment.find,
        reminderFind: FollowupReminder.find,
        reminderBulkWrite: FollowupReminder.bulkWrite,
        reminderFindOneAndUpdate: FollowupReminder.findOneAndUpdate,
        reminderUpdateOne: FollowupReminder.updateOne
    };
    const updates = [];
    FollowupAssessment.find = () => createQuery(dueFollowups);
    FollowupReminder.find = () => createQuery(reminders.map(({ _id }) => ({ _id })));
    FollowupReminder.bulkWrite = async () => {};
    FollowupReminder.findOneAndUpdate = (filter, update) => {
        const reminder = reminders.find(({ _id }) => _id === filter._id);
        if (reminder) {
            updates.push({ filter, update });
        }
        return createQuery(reminder || null);
    };
    FollowupReminder.updateOne = async (filter, update) => {
        updates.push({ filter, update });
    };

    try {
        await testBody(updates);
    } finally {
        FollowupAssessment.find = originals.followupFind;
        FollowupReminder.find = originals.reminderFind;
        FollowupReminder.bulkWrite = originals.reminderBulkWrite;
        FollowupReminder.findOneAndUpdate = originals.reminderFindOneAndUpdate;
        FollowupReminder.updateOne = originals.reminderUpdateOne;
    }
}

test('due follow-up reminders are sent once and marked sent', async () => {
    const sentMessages = [];
    const now = new Date('2026-05-01T12:00:00.000Z');
    await withReminderModels({
        dueFollowups: [{
            _id: 'followup-1',
            user: 'user-1',
            scheduledAt: new Date('2026-05-01T11:00:00.000Z'),
            expiresAt: new Date('2027-05-01T11:00:00.000Z')
        }],
        reminders: [{
            _id: 'reminder-1',
            user: {
                _id: 'user-1',
                email: 'person@example.test',
                name: 'Person',
                language: 'en',
                notificationPreferences: { followUpEmails: true }
            },
            followup: { _id: 'followup-1', followupNumber: 2, status: 'scheduled' }
        }],
        testBody: async (updates) => {
            const result = await processDueFollowupReminders({
                now,
                sendReminder: async (message) => sentMessages.push(message)
            });
            assert.deepEqual(result, { sent: 1, skipped: 0 });
            assert.deepEqual(sentMessages, [{
                email: 'person@example.test',
                name: 'Person',
                userId: 'user-1',
                language: 'en',
                followupNumber: 2,
                followupId: 'followup-1'
            }]);
            assert.equal(updates[0].update.$set.status, 'sending');
            assert.equal(updates[1].update.$set.status, 'sent');
            assert.ok(updates[1].update.$set.sentAt instanceof Date);
        }
    });
});

test('completed and opted-out follow-ups are skipped without sending mail', async () => {
    const reminders = [
        {
            _id: 'reminder-completed',
            user: {
                _id: 'user-1',
                email: 'person@example.test',
                notificationPreferences: { followUpEmails: true }
            },
            followup: { _id: 'followup-1', followupNumber: 1, status: 'completed' }
        },
        {
            _id: 'reminder-opted-out',
            user: {
                _id: 'user-2',
                email: 'other@example.test',
                notificationPreferences: { followUpEmails: false }
            },
            followup: { _id: 'followup-2', followupNumber: 1, status: 'scheduled' }
        }
    ];
    await withReminderModels({
        reminders,
        testBody: async (updates) => {
            const result = await processDueFollowupReminders({
                now: new Date('2026-05-01T12:00:00.000Z'),
                sendReminder: async () => assert.fail('No email should be sent')
            });
            assert.deepEqual(result, { sent: 0, skipped: 2 });
            assert.equal(updates.filter(({ update }) => update.$set.status === 'skipped').length, 2);
        }
    });
});

test('failed reminder emails return to pending for a later retry', async () => {
    await withReminderModels({
        reminders: [{
            _id: 'reminder-1',
            user: {
                _id: 'user-1',
                email: 'person@example.test',
                notificationPreferences: { followUpEmails: true }
            },
            followup: { _id: 'followup-1', followupNumber: 1, status: 'scheduled' }
        }],
        testBody: async (updates) => {
            const result = await processDueFollowupReminders({
                now: new Date('2026-05-01T12:00:00.000Z'),
                sendReminder: async () => { throw new Error('SMTP unavailable'); }
            });
            assert.deepEqual(result, { sent: 0, skipped: 0 });
            assert.equal(updates.at(-1).update.$set.status, 'pending');
            assert.deepEqual(updates.at(-1).update.$unset, { sendingAt: 1 });
        }
    });
});

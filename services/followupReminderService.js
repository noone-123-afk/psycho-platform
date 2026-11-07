const FollowupReminder = require('../models/FollowupReminder');
const FollowupAssessment = require('../models/FollowupAssessment');
const { sendScheduledFollowupReminderEmail } = require('./emailService');

const CLAIM_TIMEOUT_MS = 30 * 60 * 1000;
const BATCH_SIZE = 100;

async function ensureDueFollowupReminders(now) {
    const dueFollowups = await FollowupAssessment.find({
        status: 'scheduled',
        scheduledAt: { $lte: now },
        expiresAt: { $gt: now }
    })
        .select('_id user scheduledAt expiresAt')
        .sort({ scheduledAt: 1 })
        .limit(BATCH_SIZE)
        .lean();

    if (dueFollowups.length === 0) {
        return;
    }

    await FollowupReminder.bulkWrite(dueFollowups.map((followup) => ({
        updateOne: {
            filter: { followup: followup._id },
            update: {
                $setOnInsert: {
                    user: followup.user,
                    followup: followup._id,
                    scheduledAt: followup.scheduledAt,
                    expiresAt: followup.expiresAt,
                    status: 'pending'
                }
            },
            upsert: true
        }
    })), { ordered: true });
}

async function processDueFollowupReminders({
    now = new Date(),
    sendReminder = sendScheduledFollowupReminderEmail
} = {}) {
    await ensureDueFollowupReminders(now);
    const staleClaim = new Date(now.getTime() - CLAIM_TIMEOUT_MS);
    const dueReminders = await FollowupReminder.find({
        scheduledAt: { $lte: now },
        expiresAt: { $gt: now },
        $or: [
            { status: 'pending' },
            { status: 'sending', sendingAt: { $lt: staleClaim } }
        ]
    })
        .select('_id')
        .sort({ scheduledAt: 1 })
        .limit(BATCH_SIZE)
        .lean();

    let sent = 0;
    let skipped = 0;
    for (const reminder of dueReminders) {
        const claimed = await FollowupReminder.findOneAndUpdate(
            {
                _id: reminder._id,
                scheduledAt: { $lte: now },
                expiresAt: { $gt: now },
                $or: [
                    { status: 'pending' },
                    { status: 'sending', sendingAt: { $lt: staleClaim } }
                ]
            },
            { $set: { status: 'sending', sendingAt: now } },
            { new: true }
        )
            .populate('user', 'name email language notificationPreferences')
            .populate('followup', 'status followupNumber')
            .lean();

        if (!claimed) {
            continue;
        }
        if (
            !claimed.user ||
            !claimed.followup ||
            claimed.followup.status !== 'scheduled' ||
            claimed.user.notificationPreferences?.followUpEmails === false
        ) {
            await FollowupReminder.updateOne(
                { _id: claimed._id, status: 'sending' },
                { $set: { status: 'skipped' }, $unset: { sendingAt: 1 } }
            );
            skipped += 1;
            continue;
        }

        try {
            await sendReminder({
                email: claimed.user.email,
                name: claimed.user.name,
                userId: claimed.user._id,
                language: claimed.user.language,
                followupNumber: claimed.followup.followupNumber,
                followupId: claimed.followup._id
            });
            await FollowupReminder.updateOne(
                { _id: claimed._id, status: 'sending' },
                { $set: { status: 'sent', sentAt: new Date() }, $unset: { sendingAt: 1 } }
            );
            sent += 1;
        } catch (error) {
            await FollowupReminder.updateOne(
                { _id: claimed._id, status: 'sending' },
                { $set: { status: 'pending' }, $unset: { sendingAt: 1 } }
            );
            console.error(`Follow-up reminder failed for reminder ${claimed._id}:`, error.message);
        }
    }

    return { sent, skipped };
}

module.exports = { processDueFollowupReminders };

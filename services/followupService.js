const FollowupAssessment = require('../models/FollowupAssessment');
const FollowupReminder = require('../models/FollowupReminder');

const FOLLOWUP_DAYS = [30, 60, 90];
const RETENTION_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

async function scheduleFollowups({ userId, assessmentId, assessedAt }) {
    const baseDate = new Date(assessedAt);
    if (!Number.isFinite(baseDate.getTime())) {
        throw new Error('A valid assessment completion date is required to schedule follow-ups');
    }

    const operations = FOLLOWUP_DAYS.map((days, index) => {
        const scheduledAt = new Date(baseDate.getTime() + days * DAY_MS);
        return {
            updateOne: {
                filter: {
                    user: userId,
                    originalAssessment: assessmentId,
                    followupNumber: index + 1
                },
                update: {
                    $setOnInsert: {
                        user: userId,
                        originalAssessment: assessmentId,
                        followupNumber: index + 1,
                        scheduledAt,
                        expiresAt: new Date(scheduledAt.getTime() + RETENTION_DAYS * DAY_MS),
                        status: 'scheduled'
                    }
                },
                upsert: true
            }
        };
    });

    await FollowupAssessment.bulkWrite(operations, { ordered: true });

    const followups = await FollowupAssessment.find({
        user: userId,
        originalAssessment: assessmentId
    })
        .select('_id user scheduledAt expiresAt')
        .lean();
    if (followups.length === 0) {
        return;
    }

    await FollowupReminder.bulkWrite(followups.map((followup) => ({
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

module.exports = { scheduleFollowups };

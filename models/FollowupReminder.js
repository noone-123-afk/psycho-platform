const mongoose = require('mongoose');

const FollowupReminderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    followup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FollowupAssessment',
        required: true,
        unique: true
    },
    scheduledAt: { type: Date, required: true },
    status: {
        type: String,
        enum: ['pending', 'sending', 'sent', 'skipped'],
        default: 'pending',
        required: true
    },
    sendingAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true }
}, { timestamps: true });

FollowupReminderSchema.index({ status: 1, scheduledAt: 1, expiresAt: 1 });
FollowupReminderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('FollowupReminder', FollowupReminderSchema);

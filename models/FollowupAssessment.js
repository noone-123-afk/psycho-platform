const mongoose = require('mongoose');

const RETENTION_DAYS = 365;

const FollowupAssessmentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    originalAssessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
    followupNumber: { type: Number, enum: [1, 2, 3], required: true },
    scheduledAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },
    status: { type: String, enum: ['scheduled', 'completed', 'missed'], default: 'scheduled' },
    consentAt: { type: Date, default: null },
    phq9Score: { type: Number, min: 0, max: 27, default: null },
    gad7Score: { type: Number, min: 0, max: 21, default: null },
    selfRatingAwareness: { type: Number, min: 1, max: 10, default: null },
    selfRatingRegulation: { type: Number, min: 1, max: 10, default: null },
    selfRatingRelationships: { type: Number, min: 1, max: 10, default: null },
    selfRatingProductivity: { type: Number, min: 1, max: 10, default: null },
    selfRatingSatisfaction: { type: Number, min: 1, max: 10, default: null },
    progressNotes: { type: String, maxlength: 2000, default: null },
    challengesFaced: { type: String, maxlength: 2000, default: null },
    achievements: { type: String, maxlength: 2000, default: null },
    goalsForNextPeriod: { type: String, maxlength: 2000, default: null },
    expiresAt: { type: Date, required: true }
}, { timestamps: true });

FollowupAssessmentSchema.index(
    { user: 1, originalAssessment: 1, followupNumber: 1 },
    { unique: true }
);
FollowupAssessmentSchema.index({ user: 1, scheduledAt: 1, status: 1 });
FollowupAssessmentSchema.index({ status: 1, scheduledAt: 1, expiresAt: 1 });
FollowupAssessmentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('FollowupAssessment', FollowupAssessmentSchema);

const mongoose = require('mongoose');

const RETENTION_DAYS = 90;

function getExpirationDate() {
    return new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

const CrisisReportSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requestType: { type: String, enum: ['contact_request'], default: 'contact_request', required: true },
    status: { type: String, enum: ['new', 'reviewed', 'closed'], default: 'new', index: true },
    consentAt: { type: Date, required: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: getExpirationDate, required: true }
}, { timestamps: true });

CrisisReportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
CrisisReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CrisisReport', CrisisReportSchema);

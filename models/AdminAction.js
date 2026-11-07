const mongoose = require('mongoose');

const AdminActionSchema = new mongoose.Schema({
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actionType: {
        type: String,
        enum: ['crisis_report_status_updated', 'admin_role_updated'],
        required: true
    },
    targetReport: { type: mongoose.Schema.Types.ObjectId, ref: 'CrisisReport', default: null },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    previousValue: { type: String, default: null },
    newValue: { type: String, default: null },
    expiresAt: { type: Date, required: true }
}, { timestamps: { createdAt: true, updatedAt: false } });

AdminActionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
AdminActionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AdminAction', AdminActionSchema);

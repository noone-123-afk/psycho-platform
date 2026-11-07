const mongoose = require('mongoose');

const RETENTION_DAYS = 365;

const WebhookEventSchema = new mongoose.Schema({
    eventId: { type: String, required: true, maxlength: 120 },
    eventType: { type: String, required: true, maxlength: 120 },
    resourceId: { type: String, maxlength: 120, default: null },
    orderId: { type: String, maxlength: 120, default: null },
    status: {
        type: String,
        enum: ['received', 'processing', 'processed', 'ignored', 'failed'],
        default: 'received',
        required: true
    },
    attempts: { type: Number, min: 0, default: 0 },
    processingAt: { type: Date, default: null },
    processedAt: { type: Date, default: null },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000)
    }
}, { timestamps: true });

WebhookEventSchema.index({ eventId: 1 }, { unique: true });
WebhookEventSchema.index({ eventType: 1, createdAt: -1 });
WebhookEventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('WebhookEvent', WebhookEventSchema);

const mongoose = require('mongoose');

const EmailLogSchema = new mongoose.Schema({
  toEmail: { type: String, required: true, maxlength: 254 },
  subject: { type: String, required: true, maxlength: 500 },
  kind: { type: String, required: true, maxlength: 80 },
  idempotencyKey: { type: String },
  status: { type: String, enum: ['sent', 'failed'], required: true },
  errorCode: { type: String, maxlength: 100 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, {
  timestamps: { createdAt: 'sentAt', updatedAt: false }
});

EmailLogSchema.index({ user: 1, sentAt: -1 });
EmailLogSchema.index({ status: 1, sentAt: -1 });
EmailLogSchema.index({ idempotencyKey: 1, status: 1 });

module.exports = mongoose.model('EmailLog', EmailLogSchema);

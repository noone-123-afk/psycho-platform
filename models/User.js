const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
  age: { type: Number, required: false },
  gender: { type: String, required: false },
  passwordHash: { type: String, required: true, select: false },
  emailVerified: { type: Boolean, default: false },
  emailVerificationTokenHash: { type: String, select: false },
  emailVerificationExpiresAt: { type: Date, select: false },
  verificationLastSentAt: { type: Date, select: false },
  isAdmin: { type: Boolean, default: false },
  adminRole: {
    type: String,
    enum: ['owner', 'admin', 'psychologist', 'support'],
    default: null
  },
  language: { type: String, enum: ['ar', 'en'], default: 'ar' },
  notificationPreferences: {
    welcomeEmail: { type: Boolean, default: true },
    bookReadyEmail: { type: Boolean, default: true },
    followUpEmails: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now },
  // حفظ التقييمات والملاحظات الخاصة بالمستخدم لتحسين الموقع
  siteRating: { type: Number, min: 1, max: 5 },
  lastLogin: { type: Date },
  // سنحفظ إجابات المستخدم والتحليل الخاص به لاحقاً
  assessments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment'
  }]
});

module.exports = mongoose.model('User', UserSchema);

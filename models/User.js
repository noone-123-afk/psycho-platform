const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: false },
  email: { type: String, required: false }, // اختياري في البداية للحفاظ على الخصوصية
  age: { type: Number, required: false },
  gender: { type: String, required: false },
  password: { type: String, required: false }, // لتسجيل الدخول وحفظ البيانات
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

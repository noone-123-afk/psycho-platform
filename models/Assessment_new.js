const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['in_progress', 'completed', 'flagged_crisis'], default: 'in_progress' },
  
  // بيانات الديموغرافيا والسرد الذاتي
  demographicData: { type: mongoose.Schema.Types.Mixed, default: {} },
  narrativeData: { type: mongoose.Schema.Types.Mixed, default: {} }, // إجابات الأسئلة المفتوحة

  // نتائج المقاييس العلمية
  bigFiveScores: {
    openness: { type: Number, min: 0, max: 100 },
    conscientiousness: { type: Number, min: 0, max: 100 },
    extraversion: { type: Number, min: 0, max: 100 },
    agreeableness: { type: Number, min: 0, max: 100 },
    neuroticism: { type: Number, min: 0, max: 100 }
  },
  viaStrengths: { type: mongoose.Schema.Types.Mixed, default: {} },
  top5Strengths: [{ type: String }],
  
  // الفحص الصحي
  healthScreening: {
    phq9Score: { type: Number, min: 0, max: 27 },
    gad7Score: { type: Number, min: 0, max: 21 },
    crisisTriggered: { type: Boolean, default: false }
  },

  // بيانات الكتاب والدفع
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  paymentId: { type: String },
  bookContentRaw: { type: mongoose.Schema.Types.Mixed, default: {} }, // هنا يُحفظ محتوى الكتاب (JSON)
  pdfUrl: { type: String },

  // سجل الأزمات (إذا تم رفعها)
  crisisReportId: { type: mongoose.Schema.Types.ObjectId, ref: 'CrisisReport' },

  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema);

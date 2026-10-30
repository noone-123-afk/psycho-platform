const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    selectedOption: { type: String }, // الخيار الذي تم اختياره
    textAnswer: { type: String }, // الإجابة النصية إن وجدت
    score: { type: Number } // النقاط المحتسبة لهذه الإجابة
  }],
  generatedBooklet: { type: String }, // هنا سنحفظ النص الذي سيمثل "الكتاب المخصص" للمستخدم
  isCritical: { type: Boolean, default: false }, // لتحديد الحالات التي تستدعي تدخل طبي
  bookRating: { type: Number, min: 1, max: 5 }, // تقييم المستخدم للكتاب
  userFeedback: { type: String }, // ملاحظات المستخدم حول دقة التحليل
  paymentType: { type: String, enum: ['none', 'pdf', 'pdf_audio', 'print'], default: 'none' }, // نوع الباقة المشتراة
  freePreview: { type: String }, // الملخص التشويقي المجاني
  assessmentType: { type: String, enum: ['individual', 'relationship'], default: 'individual' }, // نوع الاختبار: فردي أم علاقة ثنائية
  relationshipType: { type: String, enum: ['same_sex_friends', 'mixed_friends', 'business_partners', 'coworkers', 'married', 'engaged', 'dating', 'none'], default: 'none' }, // نوع العلاقة
  partnerName: { type: String }, // اسم الشريك في الاختبار (إن وجد)
  partnerAnswers: { type: Array }, // إجابات الشريك
  coverImageUrl: { type: String }, // رابط صورة الغلاف المولدة بالذكاء الاصطناعي
  audiobookUrl: { type: String }, // رابط النسخة المسموعة (إن وجدت)
  toneOfVoice: { type: String, enum: ['scientific', 'friendly'], default: 'friendly' }, // نبرة الكتابة التي اختارها المستخدم
  isGift: { type: Boolean, default: false }, // هل هذا التقييم مدفوع كهدية من شخص آخر؟
  giftedBy: { type: String }, // اسم الشخص المهدي (إن وجد)
  followUp7DaysSent: { type: Boolean, default: false }, // هل تم إرسال إيميل المتابعة بعد أسبوع؟
  status: { type: String, enum: ['pending_review', 'approved', 'delivered'], default: 'pending_review' }, // حالة الكتاب للتدقيق
  bookContentRaw: { type: Object }, // حفظ نص الكتاب ككائن لتسهيل التعديل من الإدارة قبل الاعتماد
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assessment', AssessmentSchema);

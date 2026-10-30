const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true }, // نص السؤال
  category: { type: String, required: true }, // فئة السؤال: نفسي، اجتماعي، إلخ
  options: [{ // الخيارات المتاحة للإجابة (إذا كان اختيار من متعدد)
    text: String,
    score: Number // النقاط المخصصة لهذا الخيار للتحليل
  }],
  isTextBased: { type: Boolean, default: false } // هل السؤال يتطلب إجابة نصية مفتوحة؟
});

module.exports = mongoose.model('Question', QuestionSchema);

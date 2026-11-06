const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    category: { type: String, required: true },
    options: [{
        text: String,
        score: Number
    }],
    isTextBased: { type: Boolean, default: false },
    instrument: {
        type: String,
        enum: ['IPIP_NEO_SAMPLE', 'VIA_IS_R_SAMPLE', 'PHQ9', 'GAD7', 'NARRATIVE'],
        required: true
    },
    itemId: { type: Number, required: true },
    questionAr: { type: String, required: true },
    questionEn: { type: String, required: true },
    trait: { type: String },
    facet: { type: String },
    virtue: { type: String },
    strength: { type: String },
    scoreDirection: { type: String },
    questionNumber: { type: Number },
    scoreMin: { type: Number },
    scoreMax: { type: Number },
    minWords: { type: Number },
    maxWords: { type: Number },
    purpose: { type: String },
    source: { type: String, required: true }
}, { timestamps: true });

QuestionSchema.index(
    { instrument: 1, itemId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            instrument: { $type: 'string' },
            itemId: { $type: 'number' }
        }
    }
);

module.exports = mongoose.model('Question', QuestionSchema);

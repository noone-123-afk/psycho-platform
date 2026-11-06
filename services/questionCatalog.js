const fs = require('node:fs/promises');
const path = require('node:path');
const Question = require('../models/Question');

const SOURCES = [
    { instrument: 'IPIP_NEO_SAMPLE', file: 'big_five_questions.csv' },
    { instrument: 'VIA_IS_R_SAMPLE', file: 'via_questions.csv' },
    { instrument: 'PHQ9', file: 'health_screening_questions.csv', filter: (row) => row.scale === 'PHQ-9' },
    { instrument: 'GAD7', file: 'health_screening_questions.csv', filter: (row) => row.scale === 'GAD-7' },
    { instrument: 'NARRATIVE', file: 'narrative_questions.csv' }
];

const SCALE_OPTIONS = {
    selfReflection: [
        { value: 1, ar: 'لا تنطبق عليّ أبداً', en: 'Not at all like me' },
        { value: 2, ar: 'نادراً ما تنطبق عليّ', en: 'Rarely like me' },
        { value: 3, ar: 'تنطبق عليّ أحياناً', en: 'Sometimes like me' },
        { value: 4, ar: 'غالباً ما تنطبق عليّ', en: 'Often like me' },
        { value: 5, ar: 'تنطبق عليّ كثيراً', en: 'Very much like me' }
    ],
    health: [
        { value: 0, ar: 'أبداً', en: 'Not at all' },
        { value: 1, ar: 'عدة أيام', en: 'Several days' },
        { value: 2, ar: 'أكثر من نصف الأيام', en: 'More than half the days' },
        { value: 3, ar: 'تقريباً كل يوم', en: 'Nearly every day' }
    ]
};

const SECTION_DETAILS = {
    IPIP_NEO_SAMPLE: {
        id: 'ipip',
        title: { ar: 'سمات الشخصية — عينة استكشافية (50 عبارة)', en: 'Personality — exploratory sample (50 items)' },
        description: {
            ar: 'هذه عينة غير متوازنة وغير معيارية مقدمة للمشروع؛ تصف إجاباتك فقط ولا تقيس الشخصية تشخيصياً.',
            en: 'This is an unbalanced, non-standardized sample supplied for this project; it describes your responses and is not a diagnostic personality measure.'
        }
    },
    VIA_IS_R_SAMPLE: {
        id: 'via',
        title: { ar: 'نقاط القوة — عينة استكشافية (30 عبارة)', en: 'Character strengths — exploratory sample (30 items)' },
        description: {
            ar: 'هذه العينة تغطي بعض القوى فقط، وليست نسخة كاملة أو معيارية من VIA-IS-R.',
            en: 'This sample covers only some strengths; it is not the complete or standardized VIA-IS-R.'
        }
    },
    HEALTH: {
        id: 'health',
        title: { ar: 'فحص صحي اختياري: PHQ-9 وGAD-7', en: 'Optional health screeners: PHQ-9 and GAD-7' },
        description: {
            ar: 'اختياري وحساس. أجب عن الأسبوعين الماضيين فقط إذا رغبت. إجاباتك ودرجاتك الصحية تبقى في ذاكرة المتصفح ولا تُرسل إلى الخادم أو تحفظ في الحساب. هذه أدوات فحص وليست تشخيصاً. صياغة العربية المرفقة لم يُتحقق من مطابقتها لترجمة رسمية.',
            en: 'Optional and sensitive. Answer about the past two weeks only if you choose. Your health responses and scores remain in browser memory and are not sent to the server or saved to your account. These are screeners, not diagnoses. The supplied Arabic wording has not been verified against an official translation.'
        }
    },
    NARRATIVE: {
        id: 'narrative',
        title: { ar: 'أسئلة السيرة والتأمل (اختيارية)', en: 'Life-story reflections (optional)' },
        description: {
            ar: 'يمكنك ترك أي سؤال. إذا أدخلت إجابات، فستُحفظ في التقييم وتدخل في التقرير، وقد تُضمّن في نسخة المراجعة المرسلة إلى بريد إدارة المنصة. تجنب ذكر معلومات تعريفية عن أشخاص آخرين.',
            en: 'You may skip any prompt. If you enter responses, they will be saved with your assessment and included in your report, and may appear in the review copy sent to the platform administration email. Avoid identifying other people.'
        }
    }
};

function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    const input = text.replace(/^\uFEFF/, '');

    for (let index = 0; index < input.length; index += 1) {
        const character = input[index];
        if (quoted) {
            if (character === '"' && input[index + 1] === '"') {
                field += '"';
                index += 1;
            } else if (character === '"') {
                quoted = false;
            } else {
                field += character;
            }
        } else if (character === '"' && field.length === 0) {
            quoted = true;
        } else if (character === ',') {
            row.push(field);
            field = '';
        } else if (character === '\n' || character === '\r') {
            row.push(field);
            field = '';
            if (row.some((cell) => cell.length > 0)) {
                rows.push(row);
            }
            row = [];
            if (character === '\r' && input[index + 1] === '\n') {
                index += 1;
            }
        } else {
            field += character;
        }
    }

    if (quoted) {
        throw new Error('CSV contains an unterminated quoted field');
    }
    row.push(field);
    if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
    }
    if (rows.length < 2) {
        throw new Error('CSV must contain a header and at least one question');
    }

    const headers = rows.shift();
    return rows.map((cells) => {
        if (cells.length !== headers.length) {
            throw new Error(`CSV row has ${cells.length} fields; expected ${headers.length}`);
        }
        return Object.fromEntries(headers.map((header, index) => [header, cells[index]]));
    });
}

function toQuestionRecord(instrument, row) {
    const itemId = Number(row.id);
    if (!Number.isInteger(itemId) || itemId < 1 || !row.question_ar || !row.question_en) {
        throw new Error(`Invalid question row for ${instrument}`);
    }

    const record = {
        instrument,
        itemId,
        text: row.question_ar,
        category: row.trait || row.virtue || row.category || instrument,
        isTextBased: instrument === 'NARRATIVE',
        questionAr: row.question_ar,
        questionEn: row.question_en,
        source: row.source || 'project'
    };

    if (instrument === 'IPIP_NEO_SAMPLE') {
        Object.assign(record, {
            trait: row.trait,
            facet: row.facet,
            scoreDirection: row.score_direction,
            scoreMin: 1,
            scoreMax: 5
        });
    } else if (instrument === 'VIA_IS_R_SAMPLE') {
        Object.assign(record, {
            virtue: row.virtue,
            strength: row.strength,
            scoreDirection: row.score_direction,
            scoreMin: 1,
            scoreMax: 5
        });
    } else if (instrument === 'PHQ9' || instrument === 'GAD7') {
        Object.assign(record, {
            questionNumber: Number(row.question_number),
            scoreMin: Number(row.score_min),
            scoreMax: Number(row.score_max)
        });
    } else if (instrument === 'NARRATIVE') {
        Object.assign(record, {
            category: row.category,
            minWords: Number(row.min_words),
            maxWords: Number(row.max_words),
            purpose: row.purpose
        });
    }
    return record;
}

async function readQuestionRecords(baseDirectory = path.join(__dirname, '..', 'database', 'questions')) {
    const contents = new Map();
    for (const source of SOURCES) {
        if (!contents.has(source.file)) {
            contents.set(source.file, parseCsv(await fs.readFile(path.join(baseDirectory, source.file), 'utf8')));
        }
    }

    return SOURCES.flatMap((source) => contents.get(source.file)
        .filter((row) => !source.filter || source.filter(row))
        .map((row) => toQuestionRecord(source.instrument, row)));
}

async function seedQuestionCatalog(model = Question, baseDirectory) {
    const records = await readQuestionRecords(baseDirectory);
    const uniqueRecords = new Map(records.map((record) => [
        `${record.instrument}:${record.itemId}`,
        record
    ]));
    if (uniqueRecords.size !== records.length) {
        throw new Error('Question catalog contains duplicate instrument item IDs');
    }
    const operations = records.map((record) => ({
        updateOne: {
            filter: { instrument: record.instrument, itemId: record.itemId },
            update: { $set: record },
            upsert: true
        }
    }));
    const result = await model.bulkWrite(operations, { ordered: true });
    return { questionCount: records.length, upsertedCount: result.upsertedCount };
}

function toClientQuestion(record) {
    return {
        id: `${record.instrument}:${record.itemId}`,
        instrument: record.instrument,
        itemId: record.itemId,
        type: record.instrument === 'NARRATIVE' ? 'text' : 'rating',
        ar: record.questionAr,
        en: record.questionEn,
        min: record.scoreMin,
        max: record.scoreMax,
        trait: record.trait,
        facet: record.facet,
        virtue: record.virtue,
        strength: record.strength,
        category: record.category,
        minWords: record.minWords,
        maxWords: record.maxWords
    };
}

async function loadQuestionnaire(model = Question) {
    const records = await model.find({ instrument: { $in: SOURCES.map(({ instrument }) => instrument) } })
        .sort({ instrument: 1, itemId: 1 })
        .lean();
    const byInstrument = new Map();
    for (const record of records) {
        if (!byInstrument.has(record.instrument)) {
            byInstrument.set(record.instrument, []);
        }
        byInstrument.get(record.instrument).push(toClientQuestion(record));
    }

    const sections = [
        {
            ...SECTION_DETAILS.IPIP_NEO_SAMPLE,
            sample: true,
            required: true,
            responseOptions: SCALE_OPTIONS.selfReflection,
            items: byInstrument.get('IPIP_NEO_SAMPLE') || []
        },
        {
            ...SECTION_DETAILS.VIA_IS_R_SAMPLE,
            sample: true,
            required: true,
            responseOptions: SCALE_OPTIONS.selfReflection,
            items: byInstrument.get('VIA_IS_R_SAMPLE') || []
        },
        {
            ...SECTION_DETAILS.HEALTH,
            sample: false,
            required: false,
            responseOptions: SCALE_OPTIONS.health,
            items: [
                ...(byInstrument.get('PHQ9') || []),
                ...(byInstrument.get('GAD7') || [])
            ]
        },
        {
            ...SECTION_DETAILS.NARRATIVE,
            sample: false,
            required: false,
            responseOptions: [],
            items: byInstrument.get('NARRATIVE') || []
        }
    ];

    const expectedCounts = { ipip: 50, via: 30, health: 16, narrative: 5 };
    for (const section of sections) {
        if (section.items.length !== expectedCounts[section.id]) {
            throw new Error(`Question catalog is incomplete for section ${section.id}`);
        }
    }
    return { sections };
}

module.exports = {
    parseCsv,
    readQuestionRecords,
    seedQuestionCatalog,
    loadQuestionnaire
};

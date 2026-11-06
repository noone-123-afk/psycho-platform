function answerKey(question) {
    return `${question.instrument}:${question.itemId}`;
}

function isRatingQuestion(question) {
    return ['IPIP_NEO_SAMPLE', 'VIA_IS_R_SAMPLE'].includes(question.instrument);
}

function validateAssessmentAnswers(answers, questions) {
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
        return { valid: false, message: 'Assessment answers must be an object' };
    }

    const allowed = new Map(questions
        .filter((question) => question.instrument !== 'PHQ9' && question.instrument !== 'GAD7')
        .map((question) => [answerKey(question), question]));

    for (const question of questions.filter(isRatingQuestion)) {
        const answer = answers[answerKey(question)];
        if (!Number.isInteger(answer) || answer < question.scoreMin || answer > question.scoreMax) {
            return { valid: false, message: 'Please answer all personality and strengths sample items' };
        }
    }

    for (const [key, answer] of Object.entries(answers)) {
        const question = allowed.get(key);
        if (!question) {
            return { valid: false, message: 'Unknown or sensitive health-screening answers were submitted' };
        }
        if (isRatingQuestion(question)) {
            if (!Number.isInteger(answer) || answer < question.scoreMin || answer > question.scoreMax) {
                return { valid: false, message: 'A rating response is outside the allowed range' };
            }
        } else if (
            question.instrument === 'NARRATIVE' &&
            (typeof answer !== 'string' || answer.length > question.maxWords * 30)
        ) {
            return { valid: false, message: 'A reflection response exceeds the allowed length' };
        }
    }

    return { valid: true };
}

function average(items, answers, valueField, language) {
    const labels = {
        ar: {
            extraversion: 'الانبساطية',
            openness: 'الانفتاح على الخبرة',
            conscientiousness: 'يقظة الضمير',
            agreeableness: 'المقبولية',
            neuroticism: 'العُصابية',
            wisdom: 'الحكمة',
            courage: 'الشجاعة',
            humanity: 'الإنسانية',
            justice: 'العدالة',
            creativity: 'الإبداع',
            curiosity: 'حب الاستطلاع',
            open_mindedness: 'الانفتاح الذهني',
            love_of_learning: 'حب التعلم',
            perspective: 'الحكمة والمنظور',
            bravery: 'الشجاعة',
            perseverance: 'المثابرة',
            honesty: 'الصدق',
            zest: 'الحيوية',
            love: 'الحب',
            kindness: 'اللطف',
            social_intelligence: 'الذكاء الاجتماعي',
            fairness: 'الإنصاف',
            leadership: 'القيادة',
            teamwork: 'العمل الجماعي'
        },
        en: {}
    };
    const answered = items
        .map((question) => {
            const value = answers[answerKey(question)];
            if (!Number.isInteger(value)) {
                return null;
            }
            const scored = question.scoreDirection === 'negative'
                ? question.scoreMin + question.scoreMax - value
                : value;
            return { question, value: scored };
        })
        .filter(Boolean);

    if (answered.length === 0) {
        return null;
    }
    return {
        label: labels[language][answered[0].question[valueField]]
            || answered[0].question[valueField].replaceAll('_', ' '),
        mean: Number((answered.reduce((sum, item) => sum + item.value, 0) / answered.length).toFixed(2)),
        answered: answered.length,
        total: items.length,
        note: language === 'en'
            ? 'Descriptive responses to a project sample; not norm-referenced or diagnostic.'
            : 'وصف لإجابات عينة المشروع؛ ليست درجة معيارية أو تشخيصية.'
    };
}

function buildAssessmentProfile(questions, answers, language = 'ar') {
    const personalityQuestions = questions.filter((question) => question.instrument === 'IPIP_NEO_SAMPLE');
    const strengthsQuestions = questions.filter((question) => question.instrument === 'VIA_IS_R_SAMPLE');
    const narrativeQuestions = questions.filter((question) => question.instrument === 'NARRATIVE');
    const groupBy = (items, property) => [...new Set(items.map((item) => item[property]).filter(Boolean))]
        .map((value) => average(items.filter((item) => item[property] === value), answers, property, language));

    return {
        personality: groupBy(personalityQuestions, 'trait'),
        virtues: groupBy(strengthsQuestions, 'virtue'),
        strengths: groupBy(strengthsQuestions, 'strength'),
        reflections: narrativeQuestions
            .map((question) => ({
                prompt: language === 'en' ? question.questionEn : question.questionAr,
                answer: answers[answerKey(question)]?.trim()
            }))
            .filter(({ answer }) => answer)
    };
}

module.exports = { answerKey, validateAssessmentAnswers, buildAssessmentProfile };

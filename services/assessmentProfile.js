const questionnaire = require('../client/src/data/assessmentQuestions.json');

const ratingQuestions = questionnaire.domains.flatMap((domain) =>
    domain.questions.map((question) => ({ ...question, domainId: domain.id }))
);
const reflectionIds = new Set(questionnaire.reflections.map(({ id }) => id));
const ratingIds = new Set(ratingQuestions.map(({ id }) => id));

function validateAssessmentAnswers(answers) {
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
        return { valid: false, message: 'Assessment answers must be an object' };
    }

    for (const id of ratingIds) {
        if (!Number.isInteger(answers[id]) || answers[id] < 1 || answers[id] > 5) {
            return { valid: false, message: 'Please answer all rating questions before submitting' };
        }
    }

    for (const [id, answer] of Object.entries(answers)) {
        if (!ratingIds.has(id) && !reflectionIds.has(id)) {
            return { valid: false, message: 'An unknown assessment question was submitted' };
        }
        if (reflectionIds.has(id) && (typeof answer !== 'string' || answer.length > 1500)) {
            return { valid: false, message: 'Reflection answers must be text no longer than 1500 characters' };
        }
    }

    return { valid: true };
}

function scoreAssessment(answers, language = 'ar') {
    return questionnaire.domains.map((domain) => {
        const values = domain.questions.map(({ id }) => answers[id]);
        const score = values.reduce((total, value) => total + value, 0) / values.length;
        const interpretation = score >= 3.8
            ? (language === 'en'
                ? 'Your responses often point to this as a resource you draw on.'
                : 'تشير إجاباتك غالباً إلى أن هذا جانب تستند إليه.')
            : score <= 2.5
                ? (language === 'en'
                    ? 'Your responses suggest an area you may wish to explore in your own context.'
                    : 'تشير إجاباتك إلى جانب قد ترغب في استكشافه ضمن ظروفك الخاصة.')
                : (language === 'en'
                    ? 'Your responses show a varied pattern that may depend on the situation.'
                    : 'تعكس إجاباتك نمطاً متنوعاً قد يتغير بحسب الموقف.');
        return {
            id: domain.id,
            title: domain[language],
            score: Number(score.toFixed(1)),
            interpretation
        };
    });
}

module.exports = { questionnaire, validateAssessmentAnswers, scoreAssessment };

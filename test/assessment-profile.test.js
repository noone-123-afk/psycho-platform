const test = require('node:test');
const assert = require('node:assert/strict');
const { generateBookletContent } = require('../services/aiEngine');
const {
    questionnaire,
    validateAssessmentAnswers,
    scoreAssessment
} = require('../services/assessmentProfile');

function completeAnswers() {
    const answers = {};
    for (const domain of questionnaire.domains) {
        for (const question of domain.questions) {
            answers[question.id] = domain.id === 'connection' ? 5 : 3;
        }
    }
    return answers;
}

test('self-reflection questionnaire contains 30 rating items and four optional prompts', () => {
    assert.equal(questionnaire.domains.reduce((count, domain) => count + domain.questions.length, 0), 30);
    assert.equal(questionnaire.reflections.length, 4);
    assert.equal(validateAssessmentAnswers(completeAnswers()).valid, true);
});

test('assessment submission rejects missing, out-of-range, and unknown answers', () => {
    const answers = completeAnswers();
    delete answers.p01;
    assert.equal(validateAssessmentAnswers(answers).valid, false);

    const invalidRating = completeAnswers();
    invalidRating.p01 = 6;
    assert.equal(validateAssessmentAnswers(invalidRating).valid, false);

    const unknownQuestion = completeAnswers();
    unknownQuestion.unrecognized = 3;
    assert.equal(validateAssessmentAnswers(unknownQuestion).valid, false);
});

test('profile and generated report reflect submitted scores and optional written responses', async () => {
    const answers = {
        ...completeAnswers(),
        r1: 'I am proud that I completed my studies.',
        r2: 'Walking outdoors helps me recharge.'
    };
    const profile = scoreAssessment(answers, 'en');
    assert.equal(profile.find(({ id }) => id === 'connection').score, 5);
    assert.equal(profile.find(({ id }) => id === 'curiosity').score, 3);

    const report = await generateBookletContent({ language: 'en' }, answers);
    assert.match(report.free_preview, /Connection and relationships/);
    assert.match(report.chapter3_history, /completed my studies/);
    assert.match(report.chapter4_literature, /Walking outdoors/);
    assert.match(report.chapter2_diagnosis, /not a standardized psychological test/);
});

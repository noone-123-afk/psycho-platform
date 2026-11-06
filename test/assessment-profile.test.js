const test = require('node:test');
const assert = require('node:assert/strict');
const { generateBookletContent } = require('../services/aiEngine');
const {
    answerKey,
    buildAssessmentProfile,
    validateAssessmentAnswers
} = require('../services/assessmentProfile');
const { readQuestionRecords } = require('../services/questionCatalog');

async function getCatalog() {
    return readQuestionRecords();
}

function completeAnswers(questions) {
    return Object.fromEntries(
        questions
            .filter(({ instrument }) => ['IPIP_NEO_SAMPLE', 'VIA_IS_R_SAMPLE'].includes(instrument))
            .map((question) => [answerKey(question), 4])
    );
}

test('assessment requires all personality and strengths sample items while reflections remain optional', async () => {
    const questions = await getCatalog();
    const answers = completeAnswers(questions);

    assert.equal(Object.keys(answers).length, 80);
    assert.equal(validateAssessmentAnswers(answers, questions).valid, true);

    delete answers['IPIP_NEO_SAMPLE:1'];
    assert.equal(validateAssessmentAnswers(answers, questions).valid, false);
});

test('assessment rejects invalid ratings, unknown items, and health-screening responses', async () => {
    const questions = await getCatalog();
    const baseline = completeAnswers(questions);

    assert.equal(validateAssessmentAnswers(null, questions).valid, false);
    assert.equal(validateAssessmentAnswers({ ...baseline, 'VIA_IS_R_SAMPLE:1': 6 }, questions).valid, false);
    assert.equal(validateAssessmentAnswers({ ...baseline, unrecognized: 2 }, questions).valid, false);
    assert.equal(validateAssessmentAnswers({ ...baseline, 'PHQ9:1': 2 }, questions).valid, false);
});

test('assessment accepts optional reflections and rejects overlong reflection responses', async () => {
    const questions = await getCatalog();
    const baseline = completeAnswers(questions);
    const narrative = questions.find(({ instrument }) => instrument === 'NARRATIVE');

    assert.equal(
        validateAssessmentAnswers({ ...baseline, [answerKey(narrative)]: 'A short reflection.' }, questions).valid,
        true
    );
    assert.equal(
        validateAssessmentAnswers({
            ...baseline,
            [answerKey(narrative)]: 'x'.repeat(narrative.maxWords * 30 + 1)
        }, questions).valid,
        false
    );
});

test('descriptive profiles and report content use the supplied item bank and submitted answers', async () => {
    const questions = await getCatalog();
    const answers = {
        ...completeAnswers(questions),
        'NARRATIVE:1': 'I remember a supportive childhood home.',
        'NARRATIVE:5': 'I hope to build a calmer and more connected life.'
    };
    const profile = buildAssessmentProfile(questions, answers, 'en');
    const report = await generateBookletContent({ language: 'en' }, answers, questions);

    assert.equal(profile.personality.length, 5);
    assert.equal(profile.personality[0].mean, 4);
    assert.equal(profile.reflections.length, 2);
    assert.match(report.chapter3_history, /supportive childhood home/);
    assert.match(report.chapter5_roadmap, /calmer and more connected life/);
    assert.match(report.chapter2_diagnosis, /not diagnostic/i);
});

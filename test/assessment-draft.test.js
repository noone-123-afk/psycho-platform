const test = require('node:test');
const assert = require('node:assert/strict');

test('assessment drafts and submissions exclude health responses and unconsented narrative answers', async () => {
    const { filterAssessmentAnswers } = await import('../client/src/utils/assessmentDraft.js');
    const answers = {
        'IPIP_NEO_SAMPLE:1': 4,
        'VIA_IS_R_SAMPLE:1': 5,
        'PHQ9:1': 2,
        'GAD7:1': 1,
        'NARRATIVE:1': 'A personal reflection'
    };

    assert.deepEqual(filterAssessmentAnswers(answers, false), {
        'IPIP_NEO_SAMPLE:1': 4,
        'VIA_IS_R_SAMPLE:1': 5
    });
    assert.deepEqual(filterAssessmentAnswers(answers, true), {
        'IPIP_NEO_SAMPLE:1': 4,
        'VIA_IS_R_SAMPLE:1': 5,
        'NARRATIVE:1': 'A personal reflection'
    });
});

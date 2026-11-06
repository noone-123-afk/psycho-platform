const test = require('node:test');
const assert = require('node:assert/strict');
const {
    buildBookletHtml,
    getCommonStyles,
    getCoverPage,
    getTocPage
} = require('../utils/pdfTemplates');

test('cover and contents helpers render safely in Arabic and English', () => {
    const arabicCover = getCoverPage('<Reader>', '٦ نوفمبر ٢٠٢٦', 'ar', 'عنوان الكتاب');
    const englishCover = getCoverPage('Test Reader', 'November 6, 2026', 'en', 'My Book');
    const arabicToc = getTocPage('ar');
    const englishToc = getTocPage('en');

    assert.match(arabicCover, /رحلة فهم الذات/);
    assert.match(arabicCover, /&lt;Reader&gt;/);
    assert.match(englishCover, /A Journey of Self-Discovery/);
    assert.match(arabicToc, /محتويات الكتاب/);
    assert.match(englishToc, /Table of Contents/);
    assert.equal((arabicToc.match(/class="toc-item"/g) || []).length, 5);
    assert.match(arabicToc, /الفصل الخامس: خطوة تالية/);
});

test('booklet template renders bilingual cover, contents, and chapters', () => {
    const arabicHtml = buildBookletHtml({
        title: 'خريطة تأملية',
        chapter1_mirror: 'ملامح إجاباتك'
    }, 'قارئ الاختبار', 'ar');
    const englishHtml = buildBookletHtml({
        title: 'A Reflective Map',
        chapter1_mirror: 'Your response patterns'
    }, 'Test Reader', 'en');

    assert.match(arabicHtml, /<html lang="ar" dir="rtl">/);
    assert.match(arabicHtml, /محتويات الكتاب/);
    assert.match(arabicHtml, /قارئ الاختبار/);
    assert.match(englishHtml, /<html lang="en" dir="ltr">/);
    assert.match(englishHtml, /Contents/);
    assert.match(englishHtml, /Test Reader/);
    assert.equal((arabicHtml.match(/class="page chapter-page"/g) || []).length, 5);
});

test('booklet template escapes user content while retaining the shared design components', () => {
    const html = buildBookletHtml({
        title: '<script>alert("title")</script>',
        chapter1_mirror: '<img src=x onerror=alert(1)>'
    }, 'Reader & Co', 'en');
    const styles = getCommonStyles('en');

    assert.doesNotMatch(html, /<script>alert/);
    assert.doesNotMatch(html, /<img src=x/);
    assert.match(html, /&lt;script&gt;/);
    assert.match(html, /Reader &amp; Co/);
    assert.match(styles, /\.info-box/);
    assert.match(styles, /\.score-card/);
    assert.match(styles, /\.timeline-item/);
});

test('personal assessment reports render personality cards and safely escaped reflections', () => {
    const html = buildBookletHtml({
        title: 'Reflective map',
        free_preview: 'A personal response summary.',
        assessmentProfile: {
            personality: [
                { id: 'openness', label: 'Openness', mean: 3.5, answered: 4, total: 4 },
                { id: 'neuroticism', label: 'Neuroticism', mean: 2, answered: 2, total: 2 }
            ],
            strengths: [
                { id: 'curiosity', label: 'curiosity', mean: 4, answered: 2, total: 2 },
                { id: 'teamwork', label: 'teamwork', mean: 3.5, answered: 2, total: 2 }
            ],
            virtues: [
                { label: 'Wisdom', mean: 4.5, answered: 4, total: 4 }
            ],
            reflections: [
                { category: 'childhood', prompt: 'What matters to you?', answer: 'My reflection: <img src=x onerror=alert(1)>' },
                { category: 'turning_points', prompt: 'What changed your path?', answer: 'A new beginning.' },
                { category: 'current_challenges', prompt: 'What is difficult now?', answer: 'I am dealing with <script>alert("challenge")</script>.' },
                { category: 'future_vision', prompt: 'What do you hope for?', answer: 'A calmer future.' }
            ]
        },
        chapter3_history: 'My reflection: <img src=x onerror=alert(1)>',
        chapter4_literature: 'Use these results as prompts.',
        chapter5_roadmap: 'Choose one small next step.'
    }, '<Reader>', 'en');

    assert.match(html, /Chapter 1: Personal introduction/);
    assert.match(html, /Chapter 2: Personality response summary/);
    assert.match(html, /Chapter 3: Strengths map/);
    assert.match(html, /Chapter 4: Your life narrative/);
    assert.match(html, /Chapter 5: Understanding challenges/);
    assert.match(html, /Chapter 6: Development plan/);
    assert.match(html, /Chapter 7: Scientific appendix/);
    assert.match(html, /Openness/);
    assert.match(html, /3\.5\/5/);
    assert.match(html, /Curiosity/);
    assert.match(html, /Explore a topic that interests you/);
    assert.match(html, /Teamwork/);
    assert.match(html, /clear communication/);
    assert.match(html, /Wisdom/);
    assert.match(html, /What matters to you\?/);
    assert.match(html, /Childhood environment/);
    assert.match(html, /Pivotal moments/);
    assert.match(html, /Future vision/);
    assert.match(html, /What is difficult now\?/);
    assert.match(html, /Catastrophizing/);
    assert.match(html, /not CBT treatment/i);
    assert.match(html, /Optional practical tools/);
    assert.match(html, /A brief thought record/);
    assert.match(html, /Small, manageable steps/);
    assert.match(html, /Beck, A\. T\. \(1979\)/);
    assert.match(html, /does not include or interpret health-screening responses/i);
    assert.match(html, /Days 1–30: Foundation and awareness/);
    assert.match(html, /Days 31–60: Practice and adjustment/);
    assert.match(html, /Days 61–90: Consolidation and reflection/);
    assert.match(html, /A quiet pause/);
    assert.match(html, /Observe thoughts without judgment/);
    assert.match(html, /Use a valued strength/);
    assert.match(html, /Build a flexible habit/);
    assert.match(html, /Connection, if it feels right/);
    assert.match(html, /Review your progress/);
    assert.match(html, /Clarify a longer-term direction/);
    assert.match(html, /Your stated future vision/);
    assert.match(html, /A calmer future/);
    assert.match(html, /not therapy or a promise of specific results/i);
    assert.match(html, /Optional daily rhythm/);
    assert.match(html, /Optional progress check-in/);
    assert.match(html, /not validated measures, diagnoses/i);
    assert.match(html, /Hayes, S\. C\., Strosahl, K\. D\., &amp; Wilson, K\. G\. \(2012\)/);
    assert.match(html, /A reflection prompt/);
    assert.match(html, /Answers to health-screening questions are not included/i);
    assert.doesNotMatch(html, /PHQ-9 score|GAD-7 score/i);
    assert.match(html, /&lt;script&gt;alert\(&quot;challenge&quot;\)&lt;\/script&gt;/);
    assert.doesNotMatch(html, /<script>alert\("challenge"\)<\/script>/);
    assert.match(html, /A reflection to keep in mind/);
    assert.match(html, /We are the stories we tell ourselves/);
    assert.match(html, /McAdams, D\. P\. \(2006\)/);
    assert.match(html, /not a “top five” ranking/);
    assert.match(html, /Peterson, C\., &amp; Seligman, M\. E\. \(2004\)/);
    assert.match(html, /does not establish the validity or standardization/i);
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.doesNotMatch(html, /<img src=x/);
    assert.equal((html.match(/class="page chapter-page"/g) || []).length, 7);

    const arabicHtml = buildBookletHtml({
        assessmentProfile: {
            personality: [],
            reflections: [{ category: 'current_challenges', prompt: 'تحدٍ حالي', answer: 'إجابة تجريبية' }]
        }
    }, 'قارئ الاختبار', 'ar');
    assert.match(arabicHtml, /التفكير الكارثي/);
    assert.match(arabicHtml, /تحليل التحديات/);
    assert.match(arabicHtml, /الأيام 1–30/);
    assert.match(arabicHtml, /الأيام 31–60/);
    assert.match(arabicHtml, /الأيام 61–90/);
    assert.match(arabicHtml, /الملحق العلمي/);
    assert.match(arabicHtml, /بندين فقط لهذا البعد/);
});

test('scientific appendix qualifies the project sample and its limitations', () => {
    const englishHtml = buildBookletHtml({
        assessmentProfile: { personality: [], reflections: [] }
    }, 'Reader', 'en');
    const arabicHtml = buildBookletHtml({
        assessmentProfile: { personality: [], reflections: [] }
    }, 'قارئ', 'ar');

    assert.match(englishHtml, /do not constitute the full IPIP-NEO instrument/i);
    assert.match(englishHtml, /not norm-referenced/i);
    assert.match(englishHtml, /does not establish the validity of this project’s sample items/i);
    assert.match(englishHtml, /not the complete VIA Inventory of Strengths/i);
    assert.match(englishHtml, /Answers to health-screening questions are not included/i);
    assert.match(englishHtml, /does not deliver CBT, ACT, or narrative therapy/i);
    assert.match(englishHtml, /Selected references/);
    assert.match(englishHtml, /A final reflection/);
    assert.match(englishHtml, /Peterson, C\., &amp; Seligman, M\. E\. \(2004\)/);
    assert.match(englishHtml, /Kroenke, K\., Spitzer, R\. L\., &amp; Williams, J\. B\. \(2001\)/);
    assert.match(arabicHtml, /ليست مقاييس نفسية كاملة/);
    assert.match(arabicHtml, /العصابية/);
    assert.match(arabicHtml, /مجموعة جزئية من البنود المستلهمة من VIA/);
    assert.match(arabicHtml, /لا تُدرج إجابات أسئلة الفحص الصحي/);
    assert.match(arabicHtml, /لا يقدم هذا الكتاب علاج CBT أو ACT/);
    assert.match(arabicHtml, /مراجع مختارة/);
    assert.match(arabicHtml, /كلمة ختامية/);
});

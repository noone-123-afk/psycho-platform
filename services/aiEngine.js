const { buildAssessmentProfile } = require('./assessmentProfile');

async function generateBookletContent(userProfile, assessmentAnswers, questions) {
    const language = userProfile.language === 'en' ? 'en' : 'ar';
    const english = language === 'en';
    const profile = buildAssessmentProfile(questions, assessmentAnswers, language);
    const formatMetrics = (metrics) => metrics.map((metric) =>
        `${metric.label}: ${metric.mean}/5 (${metric.answered}/${metric.total})`
    ).join('\n');
    const reflectionText = profile.reflections.length
        ? profile.reflections.map(({ prompt, answer }) => `${prompt}\n${answer}`).join('\n\n')
        : (english ? 'No written reflections were submitted.' : 'لم تُرسل إجابات سردية مكتوبة.');
    const personalityText = formatMetrics(profile.personality);
    const strengthsText = formatMetrics(profile.strengths);
    const virtuesText = formatMetrics(profile.virtues);
    const futureAnswer = profile.reflections.find(({ prompt }) =>
        prompt === questions.find((question) => question.instrument === 'NARRATIVE' && question.itemId === 5)?.[
            english ? 'questionEn' : 'questionAr'
        ]
    )?.answer;
    const narrativeCount = profile.reflections.length;
    const title = english ? 'A Reflective Map of You' : 'خريطة تأملية لذاتك';

    return {
        cover_prompt: 'An original, calm abstract illustration about self-reflection and personal growth',
        free_preview: english
            ? 'Your report summarizes your responses to the project’s sample personality and strengths items. These samples are incomplete and non-standardized; the summaries are descriptive only, not a diagnosis or fixed judgment.'
            : 'يلخص التقرير إجاباتك عن عينات أسئلة الشخصية ونقاط القوة المقدمة للمشروع. هذه العينات جزئية وغير معيارية؛ والملخصات وصفية فقط وليست تشخيصاً أو حكماً ثابتاً.',
        title,
        assessmentProfile: {
            personality: profile.personality,
            strengths: profile.strengths,
            virtues: profile.virtues,
            reflections: profile.reflections
        },
        chapter1_mirror: english
            ? `Big Five sample — descriptive averages (1–5)\n${personalityText}\n\nCoverage is uneven and too limited for standardized trait interpretation.\n\nVIA sample — descriptive averages (1–5)\n${strengthsText}\n\nAvailable virtue group averages\n${virtuesText}`
            : `عينة السمات الخمس — متوسطات وصفية (1–5)\n${personalityText}\n\nالتغطية غير متوازنة ومحدودة، ولا تكفي لتفسير معياري للسمات.\n\nعينة VIA — متوسطات وصفية (1–5)\n${strengthsText}\n\nمتوسطات مجموعات الفضائل المتاحة\n${virtuesText}`,
        chapter2_diagnosis: english
            ? `This report is based on your self-reported answers to incomplete, project-provided samples. These items have not been established here as validated translations or standardized scales. Their averages are not diagnostic and should not be compared with population norms.\n\n${narrativeCount} optional narrative response(s) were included.\n\n${reflectionText}`
            : `بُني التقرير على إجاباتك الذاتية عن عينات جزئية مقدمة للمشروع. لم يثبت هنا اعتماد ترجمتها أو تقنينها؛ لذلك لا تُعد متوسطاتها تشخيصاً ولا تُقارن بمعايير سكانية.\n\nأُدرجت ${narrativeCount} إجابة سردية اختيارية.\n\n${reflectionText}`,
        chapter3_history: english
            ? `Your reflections\n${reflectionText}`
            : `تأملاتك الشخصية\n${reflectionText}`,
        chapter4_literature: english
            ? 'Use the response summaries as prompts for reflection. They describe only the items answered and do not define you.'
            : 'استخدم ملخصات الإجابات بوصفها أسئلة للتأمل. فهي تصف البنود التي أجبت عنها فقط ولا تختزلك في نتيجة.',
        chapter5_roadmap: english
            ? `A next step based on your own priorities\n${futureAnswer || 'Choose one goal that matters to you and identify a small, realistic first step.'}\n\nAdapt any next step to your circumstances. This reflection report does not replace professional support.`
            : `خطوة تالية تنطلق من أولوياتك\n${futureAnswer || 'اختر هدفاً يهمك وحدد له خطوة أولى صغيرة وواقعية.'}\n\nعدّل أي خطوة وفق ظروفك. هذا التقرير التأملي لا يحل محل الدعم المهني.`
    };
}

// دالة جديدة: توليد كتاب "تقييم العلاقات الثنائية"
async function generateRelationshipBookletContent(relationshipData, user1Answers, user2Answers) {
    console.log("جاري تحليل العلاقة الثنائية وتوليد الكتاب المخصص...");

    // أنواع العلاقات لترجمتها في الـ Prompt
    const relTypes = {
        same_sex_friends: 'أصدقاء من نفس الجنس',
        mixed_friends: 'أصدقاء (ذكر وأنثى)',
        business_partners: 'شركاء عمل',
        coworkers: 'زملاء عمل',
        married: 'أزواج',
        engaged: 'خاطبين',
        dating: 'في علاقة حب وارتباط'
    };
    
    const relName = relTypes[relationshipData.type] || 'علاقة ثنائية';

    const systemPrompt = `
    أنت تلعب دور خبير عالمي في الطب النفسي، علم النفس الاجتماعي، الإرشاد الأسري والعلاقات (Couples Therapy)، والأدب.
    المهمة: بناء "كتاب مخصص" يحلل العلاقة بين شخصين بناءً على إجاباتهما.
    نوع العلاقة: ${relName}.
    نبرة الصوت: خبير علاقات متفهم، عميق، وموجه نحو بناء علاقة صحية.
    
    الضوابط:
    1. التحليل يجب أن يخضع بالكامل لأسس علم النفس (مثل نظرية التعلق Attachment Theory، ولغات الحب، وأنماط التواصل).
    2. يُمنع تقديم استشارات طبية دوائية.
    3. إذا تبين وجود علاقة سامة (Toxic) أو مسيئة، يجب توجيه نصيحة علمية هادئة بضرورة اللجوء لمستشار علاقات.
    
    هيكل الكتاب المطلوب (JSON):
    {
        "cover_prompt": "وصف دقيق لمولد صور لغلاف يعبر عن نوع هذه العلاقة (${relName}) والانسجام بين شخصين",
        "free_preview": "ملخص تشويقي (3 أسطر) يصف ديناميكية العلاقة بينهما مجاناً",
        "title": "عنوان الكتاب (4 كلمات كحد أقصى يعبر عن علاقتهما)",
        "chapter1_mirror": "مرآة العلاقة: تحليل الإجابات وتوضيح نقاط التشابه والاختلاف بينهما",
        "chapter2_diagnosis": "الديناميكية النفسية: تحليل عميق لأسلوب تواصلهما ونقاط القوة والضعف في علاقتهما",
        "chapter3_history": "ثنائيات من التاريخ: قصص لشركاء أو أصدقاء من التاريخ مشابهين لديناميكية علاقتهما",
        "chapter4_literature": "استراحة الروح: اقتباسات أدبية وشعرية تناسب ${relName} ولمسة من الفكاهة حول العلاقات",
        "chapter5_roadmap": "خارطة طريق العلاقة: نصائح نفسية وإرشادية لتعزيز الرابطة وحل النزاعات بينهما"
    }
    `;

    // محاكاة الاستجابة لاختبار النظام
    return {
        cover_prompt: "Abstract minimalist art of two overlapping circles in warm colors, symbolizing connection and balance, watercolor --ar 3:4",
        free_preview: `يبدو من تحليل إجاباتكما أن علاقتكما كـ (${relName}) مبنية على تواصل فكري قوي، لكن هناك بعض التحديات في التعبير العاطفي. هذا الكتاب سيكشف لكم كيف تعززان هذا الرابط.`,
        title: "تناغم الأرواح والعقول",
        chapter1_mirror: "بتحليل إجابات الطرف الأول والطرف الثاني، نلاحظ توافقاً مذهلاً في القيم الأساسية...",
        chapter2_diagnosis: "من منظور علم نفس العلاقات، أنتما تمثلان نمط التعلق الآمن مع بعض ملامح القلق لدى أطراف محددة...",
        chapter3_history: "علاقتكما تذكرنا بالشراكة العظيمة بين بيير وماري كوري، حيث كان الدعم المتبادل هو الأساس...",
        chapter4_literature: "يقول جبران خليل جبران عن الروابط الإنسانية: 'قفوا معاً ولكن لا يقترب أحدكم من الآخر كثيراً'... وفي الجانب الطريف، يقال أن سر العلاقة الناجحة هو ضعف الذاكرة!",
        chapter5_roadmap: "1. تخصيص وقت للحوار المفتوح أسبوعياً. 2. احترام مساحة الاختلاف. 3. استخدام لغة 'أنا أشعر' بدلاً من 'أنت تفعل'."
    };
}

module.exports = { generateBookletContent, generateRelationshipBookletContent };

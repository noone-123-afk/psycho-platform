const { questionnaire, scoreAssessment } = require('./assessmentProfile');

async function generateBookletContent(userProfile, assessmentAnswers) {
    const language = userProfile.language === 'en' ? 'en' : 'ar';
    const english = language === 'en';
    const profile = scoreAssessment(assessmentAnswers, language);
    const strongest = [...profile].sort((a, b) => b.score - a.score)[0];
    const areaToExplore = [...profile].sort((a, b) => a.score - b.score)[0];
    const reflectionAnswers = questionnaire.reflections
        .map((reflection) => ({
            prompt: reflection[language],
            answer: assessmentAnswers[reflection.id]?.trim()
        }))
        .filter(({ answer }) => answer);
    const reflection = (id) => assessmentAnswers[id]?.trim();
    const strengths = profile.map(({ title, score, interpretation }) =>
        `${title} (${score}/5): ${interpretation}`
    ).join('\n');
    const action = {
        connection: english
            ? 'Choose one conversation this week in which you can express a need or listen with curiosity.'
            : 'اختر هذا الأسبوع حواراً واحداً تعبّر فيه عن احتياج أو تنصت فيه بفضول.',
        curiosity: english
            ? 'Set aside a short time to explore one topic or viewpoint that is new to you.'
            : 'خصص وقتاً قصيراً لاستكشاف موضوع أو وجهة نظر جديدة عليك.',
        followThrough: english
            ? 'Turn one goal into a first step that takes less than fifteen minutes.'
            : 'حوّل هدفاً واحداً إلى خطوة أولى لا تستغرق أكثر من خمس عشرة دقيقة.',
        cooperation: english
            ? 'Notice one moment when you can offer support while respecting your own capacity.'
            : 'لاحظ موقفاً واحداً يمكنك فيه تقديم الدعم مع احترام قدرتك وحدودك.',
        selfAwareness: english
            ? 'Pause once a day to name what you are feeling and what might help in that moment.'
            : 'توقف مرة يومياً لتسمية ما تشعر به وما قد يساعدك في تلك اللحظة.',
        values: english
            ? 'Choose one small action this week that reflects something you consider important.'
            : 'اختر هذا الأسبوع فعلاً صغيراً يعكس قيمة تعدّها مهمة.'
    }[areaToExplore.id];
    const title = english ? 'A Reflective Map of You' : 'خريطة تأملية لذاتك';
    const reflectionText = reflectionAnswers.length
        ? reflectionAnswers.map(({ prompt, answer }) => `${prompt}\n${answer}`).join('\n\n')
        : (english ? 'You chose not to add written reflections.' : 'اخترت عدم إضافة إجابات سردية.');

    return {
        cover_prompt: 'An original, calm abstract illustration about self-reflection and personal growth',
        free_preview: english
            ? `Your responses point to ${strongest.title} as a resource you often draw on. ${areaToExplore.title} may be worth exploring in the context of your own experiences. These are reflection prompts, not a diagnosis or a fixed judgment.`
            : `تشير إجاباتك إلى أن ${strongest.title} جانب تستند إليه غالباً، وقد يكون ${areaToExplore.title} مجالاً للتأمل في ضوء تجاربك وظروفك. هذه مؤشرات للتفكير وليست تشخيصاً أو حكماً ثابتاً.`,
        title,
        chapter1_mirror: english
            ? `Your self-reported response patterns\n${strengths}`
            : `ملامح إجاباتك كما وصفتها\n${strengths}`,
        chapter2_diagnosis: english
            ? `This exploratory questionnaire is not a standardized psychological test and cannot diagnose a condition. Your responses are self-descriptions that may vary with context, time, and circumstances.\n\n${reflectionText}`
            : `هذا الاستبيان التأملي ليس اختباراً نفسياً مقنناً ولا يشخّص أي حالة. إجاباتك أوصاف ذاتية قد تتغير باختلاف السياق والوقت والظروف.\n\n${reflectionText}`,
        chapter3_history: english
            ? `A resource you identified\nYour responses most often highlighted ${strongest.title}. ${reflection('r1') ? `You also described an experience you value: “${reflection('r1')}”` : 'You can use this section to note an experience you value and what helped you through it.'}`
            : `جانب تستند إليه\nأبرزت إجاباتك غالباً ${strongest.title}. ${reflection('r1') ? `ووصفت تجربة تعتز بها: «${reflection('r1')}»` : 'يمكنك تدوين تجربة تعتز بها وما الذي ساعدك على خوضها.'}`,
        chapter4_literature: english
            ? `A pause for reflection\nWhat you wrote about restoring your energy: ${reflection('r2') || 'Consider which people, places, or activities help you feel settled.'}\n\nKeep your own words as a reminder of what matters to you.`
            : `وقفة للتأمل\nكتبت عن استعادة طاقتك: ${reflection('r2') || 'تأمل في الأشخاص أو الأماكن أو الأنشطة التي تمنحك شعوراً بالراحة.'}\n\nاحتفظ بكلماتك كتذكير بما يهمك.`,
        chapter5_roadmap: english
            ? `One small experiment\n${action}\n\nNotice what works for you, adapt it to your circumstances, and review it without judging yourself. This report is for self-reflection and does not replace professional support.`
            : `تجربة صغيرة قابلة للتعديل\n${action}\n\nلاحظ ما يناسبك، وعدّل الخطوة وفق ظروفك، وراجع تجربتك دون إصدار أحكام على نفسك. هذا التقرير للتأمل الذاتي ولا يحل محل الدعم المهني.`
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

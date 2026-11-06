const TRAIT_DETAILS = {
    extraversion: {
        ar: 'تصف إجابات هذه العينة جوانب مرتبطة بالتفاعل الاجتماعي والحيوية.',
        en: 'Responses in this sample describe aspects related to social interaction and energy.'
    },
    openness: {
        ar: 'تصف إجابات هذه العينة جوانب مرتبطة بالأفكار والتجارب الجديدة.',
        en: 'Responses in this sample describe aspects related to ideas and new experiences.'
    },
    conscientiousness: {
        ar: 'تصف إجابات هذه العينة جوانب مرتبطة بالتنظيم والإنجاز.',
        en: 'Responses in this sample describe aspects related to organization and follow-through.'
    },
    agreeableness: {
        ar: 'تصف إجابات هذه العينة جوانب مرتبطة بالتعاون ومراعاة الآخرين.',
        en: 'Responses in this sample describe aspects related to cooperation and consideration of others.'
    },
    neuroticism: {
        ar: 'تتضمن العينة بندين فقط لهذه السمة، لذا لا تكفي لتفسير موثوق.',
        en: 'This sample includes only two items for this trait, so it is insufficient for reliable interpretation.'
    }
};

const STRENGTH_DETAILS = {
    creativity: {
        ar: ['الإبداع', 'التفكير في طرق جديدة ومبتكرة', 'استخدم إبداعك لتجربة حلول مختلفة للمواقف اليومية، وشارك أفكارك عندما يكون ذلك مناسباً.'],
        en: ['Creativity', 'Thinking of new and innovative ways', 'Try different approaches to everyday situations and share your ideas when useful.']
    },
    curiosity: {
        ar: ['الفضول', 'الرغبة في الاستكشاف والتعلم', 'استكشف موضوعاً يثير اهتمامك، واطرح الأسئلة، أو جرّب تعلم مهارة جديدة.'],
        en: ['Curiosity', 'The desire to explore and learn', 'Explore a topic that interests you, ask questions, or try learning a new skill.']
    },
    open_mindedness: {
        ar: ['الانفتاح الذهني', 'النظر للأمور من زوايا مختلفة', 'امنح نفسك وقتاً للنظر في وجهات نظر متعددة قبل تكوين رأي أو اتخاذ قرار.'],
        en: ['Open-Mindedness', 'Considering things from different perspectives', 'Give yourself time to consider multiple viewpoints before forming an opinion or making a decision.']
    },
    judgment: {
        ar: ['حكمة العقل', 'النظر للأمور من جميع الجوانب', 'خذ وقتاً للنظر في وجهات نظر متعددة قبل اتخاذ قرار.'],
        en: ['Judgment', 'Looking at things from all sides', 'Take time to consider multiple perspectives before making a decision.']
    },
    love_of_learning: {
        ar: ['حب التعلم', 'إتقان مهارات جديدة باستمرار', 'اختر موضوعاً أو مهارة تود التعمق فيها، وشارك ما تعلمته مع الآخرين.'],
        en: ['Love of Learning', 'Continuously developing new skills', 'Choose a topic or skill to explore further, and share what you learn with others.']
    },
    perspective: {
        ar: ['حكمة المنظور', 'تقديم نصائح قيمة للآخرين', 'استمع لوجهات النظر المختلفة وشارك نصيحتك عندما يطلبها الآخرون.'],
        en: ['Perspective', 'Offering helpful perspective to others', 'Listen to different viewpoints and offer advice when it is welcome.']
    },
    bravery: {
        ar: ['الشجاعة', 'التصرف رغم الخوف', 'ابدأ بخطوة آمنة ومدروسة نحو أمر مهم تتردد في مواجهته.'],
        en: ['Bravery', 'Acting despite fear', 'Take a safe, considered first step toward something important that you have been hesitant to face.']
    },
    perseverance: {
        ar: ['المثابرة', 'الاستمرار رغم الصعوبات', 'قسّم هدفاً طويل المدى إلى خطوات صغيرة واحتفل بالتقدم الواقعي.'],
        en: ['Perseverance', 'Continuing despite difficulties', 'Break a long-term goal into small steps and acknowledge realistic progress.']
    },
    honesty: {
        ar: ['الصدق', 'العيش بطريقة صادقة', 'احرص على الوضوح والصدق مع مراعاة مشاعر الآخرين وحدودك.'],
        en: ['Honesty', 'Living authentically', 'Aim for honesty and clarity while respecting others’ feelings and your own boundaries.']
    },
    zest: {
        ar: ['الحماس', 'العيش بحماس ونشاط', 'وجّه طاقتك إلى نشاط أو مشروع يهمك، مع ترك مساحة للراحة والتوازن.'],
        en: ['Zest', 'Living with enthusiasm and energy', 'Direct your energy toward an activity or project that matters to you, while making room for rest and balance.']
    },
    love: {
        ar: ['القدرة على الحب', 'تقدير العلاقات الحميمة', 'عبّر عن التقدير لمن تحب، وامنح العلاقات المهمة وقتاً واهتماماً.'],
        en: ['Capacity to Love', 'Valuing close relationships', 'Show appreciation to people you care about and give important relationships time and attention.']
    },
    kindness: {
        ar: ['اللطف', 'فعل الخير للآخرين', 'ابحث عن لفتة دعم صغيرة ومستدامة، مع الحفاظ على حدودك الشخصية.'],
        en: ['Kindness', 'Doing good for others', 'Look for a small, sustainable way to support others while maintaining your personal boundaries.']
    },
    social_intelligence: {
        ar: ['الذكاء الاجتماعي', 'فهم مشاعر الآخرين', 'تحقق مما فهمته من مشاعر الآخرين بدلاً من افتراضها، وعبّر بوضوح عن مشاعرك أيضاً.'],
        en: ['Social Intelligence', 'Understanding others’ feelings', 'Check your understanding of others’ feelings rather than assuming, and communicate your own feelings clearly too.']
    },
    fairness: {
        ar: ['الإنصاف', 'معاملة الجميع بعدل', 'راعِ الإنصاف في قراراتك اليومية، وساند المعاملة العادلة مع احترام سلامتك وحدودك.'],
        en: ['Fairness', 'Treating everyone fairly', 'Consider fairness in everyday decisions and support fair treatment while respecting safety and boundaries.']
    },
    leadership: {
        ar: ['القيادة', 'تنظيم الأنشطة والعمل نحو أهداف مشتركة', 'ساعد الفريق على وضوح الأدوار والأهداف، وشجّع المشاركة في القرارات.'],
        en: ['Leadership', 'Organizing activities and working toward shared goals', 'Help a team clarify roles and goals, and encourage participation in decisions.']
    },
    teamwork: {
        ar: ['العمل الجماعي', 'العمل بفعالية في فريق', 'ساهم في المشاريع المشتركة عبر التواصل الواضح والوفاء بالمهام المتفق عليها.'],
        en: ['Teamwork', 'Working effectively in a team', 'Contribute to shared projects through clear communication and following through on agreed tasks.']
    },
    self_regulation: {
        ar: ['ضبط النفس', 'تنظيم المشاعر والسلوك', 'جرّب التوقف للحظة قبل رد الفعل، واستخدم روتيناً واقعياً يدعم هدفك.'],
        en: ['Self-Regulation', 'Regulating emotions and behavior', 'Try pausing before reacting and using a realistic routine that supports your goal.']
    },
    forgiveness: {
        ar: ['التسامح', 'التعامل مع الأذى والمضي قدماً', 'فكّر فيما يساعدك على المضي قدماً، مع العلم أن التسامح لا يلزمك باستئناف علاقة أو التنازل عن حدودك.'],
        en: ['Forgiveness', 'Working through hurt and moving forward', 'Consider what may help you move forward; forgiveness does not require resuming a relationship or giving up your boundaries.']
    },
    humility: {
        ar: ['التواضع', 'تقدير الذات دون طلب الأضواء', 'ابقَ منفتحاً للتعلم من الآخرين، واعترف بما لا تعرفه وبالأخطاء عند حدوثها.'],
        en: ['Humility', 'Valuing yourself without seeking the spotlight', 'Stay open to learning from others and acknowledge what you do not know and any mistakes.']
    },
    prudence: {
        ar: ['التروي', 'التفكير بعناية قبل الاختيار', 'وازن بين الخيارات والعواقب، وخطط للخطوات المهمة دون مبالغة في تجنب المخاطر.'],
        en: ['Prudence', 'Thinking carefully before choosing', 'Weigh options and consequences, and plan important steps without becoming overly risk-averse.']
    },
    appreciation_of_beauty: {
        ar: ['تقدير الجمال والتميز', 'ملاحظة الجمال والمهارة والتميز', 'خصص وقتاً لملاحظة ما تقدّره في الطبيعة أو الفن أو إنجازات الآخرين.'],
        en: ['Appreciation of Beauty and Excellence', 'Noticing beauty, skill, and excellence', 'Make time to notice what you value in nature, art, or others’ achievements.']
    },
    gratitude: {
        ar: ['الامتنان', 'ملاحظة ما تقدّره في حياتك', 'دوّن شيئاً تقدّره أو عبّر عن شكرك لشخص ما، مع الاعتراف بأن المشاعر الصعبة قد تتعايش مع الامتنان.'],
        en: ['Gratitude', 'Noticing what you appreciate in your life', 'Write down something you appreciate or thank someone, while recognizing that difficult feelings can coexist with gratitude.']
    },
    hope: {
        ar: ['الأمل', 'التطلع إلى إمكانات مستقبلية', 'حدد هدفاً واقعياً وخطوة ممكنة نحوه، مع ترك مجال لتعديل الخطة عند الحاجة.'],
        en: ['Hope', 'Looking toward future possibilities', 'Set a realistic goal and a possible step toward it, while leaving room to adjust the plan when needed.']
    },
    humor: {
        ar: ['خفة الظل', 'تقدير المرح والفكاهة', 'شارك لحظات مرحة تراعي السياق ومشاعر الآخرين، واترك لنفسك مساحة للبهجة.'],
        en: ['Humor', 'Appreciating playfulness and humor', 'Share light moments with regard for context and others’ feelings, and make room for joy.']
    },
    spirituality: {
        ar: ['الروحانية والمعنى', 'البحث عن معنى أو غاية أوسع', 'خصص وقتاً للتأمل في القيم والمعاني التي تهمك، وفق معتقداتك واختياراتك.'],
        en: ['Spirituality and Meaning', 'Seeking broader meaning or purpose', 'Take time to reflect on the values and meanings that matter to you, in keeping with your beliefs and choices.']
    }
};

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function textToHtml(value) {
    return escapeHtml(value).split(/\n{2,}/).map((paragraph) =>
        `<p>${paragraph.replaceAll('\n', '<br>')}</p>`
    ).join('');
}

function getChapter1Introduction(userData = {}, language = 'ar') {
    const english = language === 'en';
    const name = escapeHtml(userData.fullName || (english ? 'Reader' : 'القارئ'));
    const summary = userData.summary ? `<div class="info-box"><strong>${english ? 'A note from your responses' : 'لمحة من إجاباتك'}</strong>${textToHtml(userData.summary)}</div>` : '';
    const paragraphs = english
        ? `<p>Welcome, <strong>${name}</strong>. This book offers a reflective summary of the responses you chose to share.</p>
           <p>Use it as a starting point for curiosity and self-reflection—not as a fixed definition of who you are.</p>
           <p>The report draws on the project’s sample personality and strengths items, and on any optional written reflections you chose to submit.</p>`
        : `<p>أهلاً بك يا <strong>${name}</strong> في كتابك الشخصي.</p>
           <p>يقدم هذا الكتاب قراءة تأملية لإجاباتك، لا تعريفاً ثابتاً لشخصيتك. خذه كبداية للتساؤل وفهم ما تراه مهماً في حياتك.</p>
           <p>يعتمد التقرير على عينات أسئلة الشخصية ونقاط القوة الخاصة بالمشروع، وعلى أي تأملات مكتوبة اخترت مشاركتها.</p>`;
    const disclaimer = english
        ? `<div class="warning-box"><strong>Important note</strong><p>This report is for self-reflection and is not a clinical assessment, diagnosis, or substitute for professional care. The project’s item samples are incomplete and non-standardized; their translations and psychometric properties have not been established here.</p><p>If you are experiencing severe distress, consider contacting a licensed health professional or local emergency support.</p></div>`
        : `<div class="warning-box"><strong>تنبيه مهم</strong><p>هذا التقرير للتأمل الذاتي، وليس تقييماً سريرياً أو تشخيصاً أو بديلاً عن الرعاية المتخصصة. عينات البنود المستخدمة جزئية وغير معيارية، ولم تُثبت هنا صلاحية ترجمتها أو خصائصها السيكومترية.</p><p>إذا كنت تمر بضيق شديد، ففكر في التواصل مع مختص صحي مرخص أو خدمات الطوارئ المحلية.</p></div>`;

    return `<section class="chapter-body">${paragraphs}${summary}${disclaimer}</section>`;
}

function getChapter2Personality(userData = {}, language = 'ar') {
    const english = language === 'en';
    const metrics = Array.isArray(userData.personality)
        ? userData.personality
        : Array.isArray(userData.assessmentProfile?.personality)
            ? userData.assessmentProfile.personality
            : [];
    const cards = metrics.map((metric) => {
        const validMean = Number.isFinite(metric.mean) && metric.mean >= 1 && metric.mean <= 5;
        const mean = validMean ? metric.mean : null;
        const progress = validMean ? Math.max(0, Math.min(100, (mean / 5) * 100)) : 0;
        const label = escapeHtml(metric.label || '');
        const count = `${Number(metric.answered) || 0}/${Number(metric.total) || 0}`;
        const description = TRAIT_DETAILS[metric.id]?.[language] || (english
            ? 'A descriptive average of the answered project-sample items; it does not define the person.'
            : 'متوسط وصفي للبنود التي تمت الإجابة عنها من عينة المشروع؛ ولا يعرّف الشخص أو يختزله.');

        return `<article class="score-card">
          <div class="score-header"><div class="score-name">${label}</div><div class="score-value">${mean === null ? '—' : `${mean}/5`}</div></div>
          <div class="score-bar"><div class="score-fill" style="width:${progress}%"></div></div>
          <p class="score-description">${description}<br>${english ? 'Answered items' : 'البنود المجاب عنها'}: ${count}</p>
        </article>`;
    }).join('');
    const coverageNote = english
        ? 'These are descriptive response averages, not percentages, population norms, or diagnoses. The project sample is uneven and incomplete; the neuroticism section has only two items.'
        : 'هذه متوسطات وصفية للإجابات، وليست نسباً مئوية أو معايير سكانية أو تشخيصاً. عينة المشروع غير مكتملة وغير متوازنة؛ وقسم العصابية يحتوي على بندين فقط.';
    const title = english ? 'Big Five sample — response summary' : 'عينة السمات الخمس — ملخص الإجابات';
    const empty = english
        ? 'Detailed trait averages are unavailable for this report version.'
        : 'لا تتوفر متوسطات تفصيلية للسمات في هذا الإصدار من التقرير.';

    return `<section class="chapter-body">
      <p>${english
        ? 'The following cards summarize only the items answered in this project sample. They are prompts for reflection, not conclusions about you.'
        : 'تلخص البطاقات التالية البنود التي أجبت عنها من عينة المشروع فقط. وهي نقاط للتأمل وليست استنتاجات نهائية عنك.'}</p>
      ${cards || `<div class="info-box">${empty}</div>`}
      ${userData.scopeNote ? `<div class="chapter-content">${textToHtml(userData.scopeNote)}</div>` : ''}
      <div class="info-box">${coverageNote}</div>
    </section>`;
}

function getChapter3Strengths(userData = {}, language = 'ar') {
    const english = language === 'en';
    const strengths = Array.isArray(userData.strengths) ? userData.strengths : [];
    const virtues = Array.isArray(userData.virtues) ? userData.virtues : [];
    const renderCards = (metrics, includeDetails = false) => metrics.map((metric) => {
        const validMean = Number.isFinite(metric.mean) && metric.mean >= 1 && metric.mean <= 5;
        const progress = validMean ? Math.max(0, Math.min(100, (metric.mean / 5) * 100)) : 0;
        const count = `${Number(metric.answered) || 0}/${Number(metric.total) || 0}`;
        const detail = includeDetails ? STRENGTH_DETAILS[metric.id]?.[language] : null;
        const label = detail?.[0] || metric.label || '';
        const description = detail
            ? `<p class="score-description">${escapeHtml(detail[1])}</p>
               <p class="score-description"><strong>${english ? 'Try this' : 'للتجربة'}:</strong> ${escapeHtml(detail[2])}</p>`
            : '';
        return `<article class="score-card">
          <div class="score-header"><div class="score-name">${escapeHtml(label)}</div>
          <div class="score-value">${validMean ? `${metric.mean}/5` : '—'}</div></div>
          <div class="score-bar"><div class="score-fill" style="width:${progress}%"></div></div>
          ${description}
          <p class="score-description">${english ? 'Answered items' : 'البنود المجاب عنها'}: ${count}</p>
        </article>`;
    }).join('');
    const strengthCards = renderCards(strengths, true);
    const virtueCards = renderCards(virtues);
    const empty = english
        ? 'No detailed strengths averages are available for this report.'
        : 'لا تتوفر متوسطات تفصيلية لنقاط القوة في هذا التقرير.';
    const note = english
        ? 'These are descriptive averages of the project’s limited item sample (1–5), not standardized scores, rankings, or conclusions about your character. The VIA framework describes 24 strengths, but this report does not assess all of them.'
        : 'هذه متوسطات وصفية لعينة بنود المشروع المحدودة (1–5)، وليست درجات معيارية أو ترتيباً أو أحكاماً على شخصيتك. يتناول إطار VIA أربعاً وعشرين قوة، لكن هذا التقرير لا يقيسها جميعاً.';
    const reference = english
        ? '<div class="info-box"><strong>Reference for the VIA framework</strong><p>Peterson, C., &amp; Seligman, M. E. (2004). <em>Character strengths and virtues: A handbook and classification</em>. Oxford University Press.</p><p>This reference describes the framework; it does not establish the validity or standardization of this project’s sample items.</p></div>'
        : '<div class="info-box"><strong>مرجع إطار VIA</strong><p>Peterson, C., &amp; Seligman, M. E. (2004). <em>Character strengths and virtues: A handbook and classification</em>. Oxford University Press.</p><p>يرجع هذا المصدر إلى الإطار النظري، ولا يثبت صلاحية بنود عينة المشروع أو تقنينها.</p></div>';

    return `<section class="chapter-body">
      <p>${english
        ? 'Character strengths are positive qualities that can be expressed in different ways. VIA is one framework for describing them; the cards below summarize only the strengths represented in the project items you answered. They are not a “top five” ranking.'
        : 'نقاط القوة الشخصية صفات إيجابية قد تظهر بطرق مختلفة. ويُعد VIA أحد الأطر لوصفها؛ أما البطاقات أدناه فتلخص فقط القوى التي تناولتها بنود المشروع التي أجبت عنها، ولا تمثل ترتيباً لـ«أفضل خمس» نقاط قوة.'}</p>
      <h3>${english ? 'Strengths' : 'نقاط القوة'}</h3>
      ${strengthCards || `<div class="info-box">${empty}</div>`}
      ${virtueCards ? `<h3>${english ? 'Virtue groups' : 'مجموعات الفضائل'}</h3>${virtueCards}` : ''}
      <div class="info-box">${note}</div>
      ${reference}
    </section>`;
}

function getChapter4LifeNarrative(userData = {}, language = 'ar') {
    const english = language === 'en';
    const reflections = Array.isArray(userData.reflections) ? userData.reflections : [];
    const sectionLabels = {
        childhood: english ? 'Childhood environment' : 'بيئة النشأة',
        turning_points: english ? 'Pivotal moments' : 'اللحظات المفصلية',
        current_challenges: english ? 'Current challenges' : 'التحديات الحالية',
        self_reconciliation: english ? 'Self-acceptance and reconciliation' : 'التصالح مع الذات',
        future_vision: english ? 'Future vision' : 'الرؤية المستقبلية'
    };
    const reflectionCards = reflections.map(({ category, prompt, answer }) => {
        const heading = sectionLabels[category]
            || (english ? 'Your reflection' : 'تأملاتك');
        return `<div class="timeline-item">
          <div class="timeline-date">${escapeHtml(heading)}</div>
          <div class="timeline-content">
            ${prompt ? `<p class="score-description">${escapeHtml(prompt)}</p>` : ''}
            <p>${escapeHtml(answer || '')}</p>
          </div>
        </div>`;
    }).join('');
    const intro = english
        ? `<p>Each person’s life is a <span class="highlight">unique story</span> understood over time. Life-narrative perspectives associated with Dan McAdams explore how people make meaning of experiences and their sense of identity through personal stories. The sections below organize the reflections you chose to share; they do not infer facts beyond your answers.</p>`
        : `<p>لكل إنسان <span class="highlight">قصة فريدة</span> يفهمها عبر الزمن. وتتناول وجهات نظر سردية الهوية المرتبطة بدان ماك آدامز كيفية بناء المعنى وفهم الهوية من خلال القصص الشخصية. ترتب الأقسام أدناه التأملات التي اخترت مشاركتها، ولا تستنتج معلومات تتجاوز إجاباتك.</p>`;
    const noData = english
        ? '<p class="score-description"><em>No narrative responses were provided for this report.</em></p>'
        : '<p class="score-description"><em>لم تُقدَّم إجابات سردية لهذا التقرير.</em></p>';
    const quote = english ? 'We are the stories we tell ourselves.' : 'نحن القصص التي نرويها لأنفسنا.';
    const insight = english
        ? '<div class="success-box"><strong>A reflection to keep in mind</strong><p>Your challenges are part of your experience, but they do not define all of who you are. You may draw on what matters to you, take manageable steps, and seek support when helpful.</p></div>'
        : '<div class="success-box"><strong>ملاحظة للتأمل</strong><p>التحديات جزء من تجربتك، لكنها لا تختصر هويتك كلها. يمكنك الاستناد إلى ما يهمك، واتخاذ خطوات مناسبة، وطلب الدعم حين تحتاج إليه.</p></div>';
    const reference = english
        ? '<div class="info-box"><strong>Reference for narrative identity</strong><p>McAdams, D. P. (2006). <em>The redemptive self: Stories Americans live by</em>. Oxford University Press.</p><p>This reference provides theoretical context; it is not a clinical interpretation of your answers.</p></div>'
        : '<div class="info-box"><strong>مرجع حول الهوية السردية</strong><p>McAdams, D. P. (2006). <em>The redemptive self: Stories Americans live by</em>. Oxford University Press.</p><p>يوفر هذا المرجع سياقاً نظرياً، ولا يمثل تفسيراً سريرياً لإجاباتك.</p></div>';

    return `<section class="chapter-body">
      ${intro}
      <div class="timeline">${reflectionCards || noData}</div>
      <div class="quote-box"><p>${quote}</p><p class="score-description">${english ? 'A prompt for reflection' : 'عبارة للتأمل'}</p></div>
      ${insight}
      ${reference}
    </section>`;
}

function getChapter5Challenges(userData = {}, language = 'ar') {
    const english = language === 'en';
    const reflections = Array.isArray(userData.reflections) ? userData.reflections : [];
    const challenge = reflections.find(({ category }) => category === 'current_challenges');
    const challengeSection = challenge?.answer
        ? `<div class="timeline-item">
            <div class="timeline-date">${english ? 'Your reflection on current challenges' : 'تأملك حول التحديات الحالية'}</div>
            <div class="timeline-content">
              <p class="score-description">${escapeHtml(challenge.prompt || '')}</p>
              <p>${escapeHtml(challenge.answer)}</p>
            </div>
          </div>`
        : `<div class="info-box">${english
            ? 'No response about current challenges was included. The educational material below is general and does not infer anything about your circumstances.'
            : 'لم تُدرج إجابة عن التحديات الحالية. المادة التثقيفية أدناه عامة ولا تستنتج شيئاً عن ظروفك.'}</div>`;
    const distortions = english ? [
        ['Catastrophizing', 'Expecting the worst outcome, such as “If this goes wrong, everything will be ruined.”'],
        ['Overgeneralization', 'Treating one event as proof that the same thing will always happen.'],
        ['Mind reading', 'Assuming you know what someone else thinks without checking.'],
        ['Black-and-white thinking', 'Seeing only extremes, with no room for partial success or mixed outcomes.'],
        ['Mental filtering', 'Focusing on one negative detail while overlooking other relevant information.'],
        ['Self-blame', 'Taking responsibility for events beyond your control or assigning yourself all the blame.']
    ] : [
        ['التفكير الكارثي', 'توقع أسوأ نتيجة، مثل: «إذا تعثر هذا الأمر فستنهار حياتي كلها».'],
        ['التعميم المفرط', 'اعتبار حدث واحد دليلاً على أن الأمر نفسه سيحدث دائماً.'],
        ['قراءة الأفكار', 'افتراض معرفة ما يفكر فيه شخص آخر من دون التحقق.'],
        ['التفكير بالأبيض والأسود', 'رؤية النتائج كطرفين متناقضين، من دون مساحة للنجاح الجزئي أو النتائج المختلطة.'],
        ['التصفية الذهنية', 'التركيز على تفصيل سلبي واحد وإغفال معلومات أخرى ذات صلة.'],
        ['اللوم الذاتي', 'تحميل نفسك مسؤولية أمور خارجة عن سيطرتك أو إلقاء اللوم كله عليك.']
    ];
    const distortionCards = distortions.map(([title, description]) => `
      <article class="column">
        <h4>${escapeHtml(title)}</h4>
        <p>${escapeHtml(description)}</p>
      </article>
    `).join('');
    const educationalNote = english
        ? 'These are examples of thinking patterns, not diagnoses or proof that a thought is false. Context matters; a thought may be accurate, incomplete, or uncertain. This educational overview is not CBT treatment.'
        : 'هذه أمثلة لأنماط تفكير وليست تشخيصات أو دليلاً على أن الفكرة خاطئة. للسياق أهميته؛ فقد تكون الفكرة دقيقة أو ناقصة أو غير مؤكدة. هذا العرض التثقيفي ليس علاجاً سلوكياً معرفياً.';
    const intro = english
        ? 'Challenges are part of life and do not by themselves indicate weakness. Cognitive behavioral approaches explore how situations, thoughts, feelings, and actions may influence one another. The overview below is general and does not analyze or diagnose your responses.'
        : 'التحديات جزء من الحياة ولا تدل بحد ذاتها على الضعف. تستكشف المقاربات السلوكية المعرفية كيف قد تؤثر المواقف والأفكار والمشاعر والسلوك بعضها في بعض. العرض أدناه عام، ولا يحلل إجاباتك أو يشخّصها.';
    const practicalTips = english ? [
        ['A brief thought record', 'When useful, note a situation, the thought that came up, and the feeling or action that followed. Ask what supports the thought, what might be missing, and what a balanced alternative could be.'],
        ['A more balanced perspective', 'Write down a recurring thought, then consider another plausible way to view the situation. The goal is not forced positivity, but a fairer look at the available information.'],
        ['Small, manageable steps', 'If you are avoiding a safe, mildly difficult situation, consider a small step at your own pace. Do not force yourself; seek guidance from a qualified professional if fear is intense or linked to trauma.'],
        ['Grounding and breathing', 'Some people find a few minutes of comfortable, unforced breathing or noticing their surroundings helpful. Stop if it feels uncomfortable; this is an optional exercise, not a treatment.']
    ] : [
        ['تدوين موجز للفكرة', 'عندما يفيدك ذلك، دوّن الموقف والفكرة التي خطرت لك والشعور أو التصرف الذي تبعها. اسأل: ما الذي يدعم الفكرة؟ ما المعلومات التي قد تكون غائبة؟ وما البديل المتوازن؟'],
        ['النظر من زاوية أكثر توازناً', 'اكتب فكرة متكررة، ثم فكّر في تفسير آخر محتمل للموقف. الهدف ليس فرض الإيجابية، بل النظر بإنصاف أكبر إلى المعلومات المتاحة.'],
        ['خطوات صغيرة ومناسبة', 'إذا كنت تتجنب موقفاً آمناً وصعباً بدرجة بسيطة، ففكّر في خطوة صغيرة تناسب وتيرتك. لا تجبر نفسك؛ واطلب إرشاد مختص مؤهل إذا كان الخوف شديداً أو مرتبطاً بصدمة.'],
        ['التنفس والانتباه للحاضر', 'قد يجد بعض الناس فائدة في دقائق من التنفس المريح دون تكلف أو ملاحظة ما حولهم. توقف إن سبب ذلك انزعاجاً؛ فهذا تمرين اختياري وليس علاجاً.']
    ];
    const practicalTipCards = practicalTips.map(([title, description], index) => `
      <article class="action-item">
        <div class="action-number">${index + 1}</div>
        <div class="action-content">
          <div class="action-title">${escapeHtml(title)}</div>
          <div class="action-description">${escapeHtml(description)}</div>
        </div>
      </article>
    `).join('');
    const supportNote = english
        ? 'If a challenge is causing significant distress or disrupting daily life, consider speaking with a licensed mental-health professional. This report does not include or interpret health-screening responses.'
        : 'إذا كان أحد التحديات يسبب ضيقاً شديداً أو يؤثر في حياتك اليومية، ففكّر في التحدث إلى مختص صحة نفسية مرخص. لا يتضمن هذا التقرير إجابات الفحص الصحي ولا يفسرها.';
    const references = english
        ? '<div class="info-box"><strong>Further reading</strong><ul><li>Beck, A. T. (1979). <em>Cognitive therapy and the emotional disorders</em>. Penguin Books.</li><li>Burns, D. D. (1980). <em>Feeling good: The new mood therapy</em>. Avon Books.</li><li>Leahy, R. L. (2017). <em>Cognitive therapy techniques: A practitioner’s guide</em>. Guilford Press.</li></ul><p>These references provide general context and do not make this report a clinical assessment or treatment.</p></div>'
        : '<div class="info-box"><strong>للمطالعة</strong><ul><li>Beck, A. T. (1979). <em>Cognitive therapy and the emotional disorders</em>. Penguin Books.</li><li>Burns, D. D. (1980). <em>Feeling good: The new mood therapy</em>. Avon Books.</li><li>Leahy, R. L. (2017). <em>Cognitive therapy techniques: A practitioner’s guide</em>. Guilford Press.</li></ul><p>توفر هذه المراجع سياقاً عاماً، ولا تجعل هذا التقرير تقييماً سريرياً أو علاجاً.</p></div>';

    return `<section class="chapter-body">
      <p>${intro}</p>
      <div class="info-box"><strong>${english ? 'CBT-informed reflection' : 'تأمل مستلهم من CBT'}</strong>
        <p>${english
          ? 'A thought can affect how we feel and what we do, while our actions and circumstances can also affect our thoughts and feelings.'
          : 'قد تؤثر الفكرة في شعورنا وتصرفنا، كما قد تؤثر أفعالنا وظروفنا في أفكارنا ومشاعرنا.'}</p>
      </div>
      <div class="timeline">${challengeSection}</div>
      <h3>${english ? 'Common thinking patterns' : 'أنماط تفكير شائعة'}</h3>
      <p>${english
        ? 'People sometimes notice patterns like these under stress. Noticing one does not mean you have a disorder or that your reaction is unreasonable.'
        : 'قد يلاحظ الناس أحياناً أنماطاً كهذه في أوقات الضغط. ملاحظة أحدها لا تعني وجود اضطراب أو أن استجابتك غير معقولة.'}</p>
      <div class="two-columns">${distortionCards}</div>
      <div class="info-box">${educationalNote}</div>
      <h3>${english ? 'Optional practical tools' : 'أدوات عملية اختيارية'}</h3>
      ${practicalTipCards}
      <div class="warning-box">${supportNote}</div>
      ${references}
    </section>`;
}

function getChapter6ActionPlan(userData = {}, language = 'ar') {
    const english = language === 'en';
    const reflections = Array.isArray(userData.reflections) ? userData.reflections : [];
    const futureVision = reflections.find(({ category }) => category === 'future_vision')?.answer;
    const strengthLabels = (Array.isArray(userData.strengths) ? userData.strengths : [])
        .map(({ label }) => label)
        .filter(Boolean);
    const strengthText = strengthLabels.length
        ? strengthLabels.map(escapeHtml).join(english ? ', ' : '، ')
        : (english ? 'qualities you would like to draw on' : 'الصفات التي ترغب في الاستفادة منها');
    const aspiration = futureVision
        ? `<div class="info-box"><strong>${english ? 'Your stated future vision' : 'رؤيتك المستقبلية كما كتبتها'}</strong><p>${escapeHtml(futureVision)}</p></div>`
        : `<div class="info-box">${english
            ? 'No future-vision response was included. Choose a personally meaningful direction before setting a goal.'
            : 'لم تُدرج إجابة عن الرؤية المستقبلية. اختر اتجاهاً ذا معنى لك قبل وضع هدف.'}</div>`;
    const phases = english ? [
        {
            title: 'Days 1–30: Foundation and awareness',
            goals: [
                ['A quiet pause', 'If useful, set aside a few minutes for comfortable breathing or quiet reflection.'],
                ['Notice what you appreciate', 'You may note one thing you value; there is no need to force positive feelings.'],
                ['Observe thoughts without judgment', 'When you notice a difficult thought, write it down neutrally and look for patterns over time.'],
                ['A routine that supports rest', 'Consider a regular sleep and wake routine that fits your needs; avoid treating one number of hours as right for everyone.'],
                ['Reading or learning', 'Choose a topic that interests you and make a small, realistic amount of time for it when possible.']
            ]
        },
        {
            title: 'Days 31–60: Practice and adjustment',
            goals: [
                ['Use a valued strength', 'Try drawing on a quality you value—such as ' + strengthText + '—in one everyday situation. These sample averages are not rankings.'],
                ['A manageable challenge', 'Choose a small, safe step toward something you have been putting off. Do not force exposure; get professional guidance if distress is intense.'],
                ['Build a flexible habit', 'Choose one small habit and try it at a pace that fits your life. Missing a day does not mean you have failed.'],
                ['Connection, if it feels right', 'Consider a meaningful check-in with someone you trust, while respecting your needs and boundaries.'],
                ['A balanced thought', 'When a difficult thought appears, note it and consider another plausible perspective without dismissing real problems.']
            ]
        },
        {
            title: 'Days 61–90: Consolidation and reflection',
            goals: [
                ['Review your progress', 'At a pace that suits you, notice what you tried, what felt useful, and what you may want to change. Acknowledge effort as well as outcomes.'],
                ['Contribute if you choose', 'Consider using a quality you value to support someone or take part in your community, if this fits your circumstances and boundaries.'],
                ['Clarify a longer-term direction', 'Write a few lines about what matters to you and revisit them when helpful; this is a reflection, not a required life mission.'],
                ['Keep a restorative practice flexible', 'Continue a quiet or reflective practice only if it is helpful. There is no need to increase its duration or use any particular technique.'],
                ['Choose a next step', 'Use what you learned to choose a manageable direction for the coming months, rather than treating day 90 as a pass-or-fail test.']
            ]
        }
    ] : [
        {
            title: 'الأيام 1–30: التأسيس والوعي',
            goals: [
                ['وقفة هادئة', 'إذا كان ذلك مفيداً، خصص بضع دقائق لتنفس مريح أو تأمل هادئ.'],
                ['ملاحظة ما تقدّره', 'يمكنك تدوين أمر واحد تقدّره، دون إجبار نفسك على مشاعر إيجابية.'],
                ['ملاحظة الأفكار دون حكم', 'عندما تلاحظ فكرة صعبة، دوّنها بحياد وانتبه إلى الأنماط مع مرور الوقت.'],
                ['روتين يدعم الراحة', 'فكّر في انتظام وقت النوم والاستيقاظ بما يلائم احتياجاتك، دون اعتبار عدد ساعات واحد مناسباً للجميع.'],
                ['القراءة أو التعلم', 'اختر موضوعاً يثير اهتمامك وخصص له وقتاً بسيطاً وواقعياً متى أمكن.']
            ]
        },
        {
            title: 'الأيام 31–60: التطبيق والتعديل',
            goals: [
                ['توظيف صفة تقدّرها', 'جرّب الاستفادة من صفة تقدّرها، مثل ' + strengthText + '، في موقف يومي واحد. متوسطات العينة ليست ترتيباً.'],
                ['تحدٍ مناسب', 'اختر خطوة صغيرة وآمنة نحو أمر تؤجله. لا تجبر نفسك على المواجهة؛ واطلب توجيه مختص إذا كان الضيق شديداً.'],
                ['بناء عادة مرنة', 'اختر عادة صغيرة وجربها بوتيرة تناسب حياتك. تفويت يوم لا يعني الفشل.'],
                ['التواصل إن رغبت', 'فكّر في تواصل ذي معنى مع شخص تثق به، مع احترام احتياجاتك وحدودك.'],
                ['فكرة أكثر توازناً', 'عندما تظهر فكرة صعبة، دوّنها وفكر في منظور محتمل آخر دون إنكار المشكلات الواقعية.']
            ]
        },
        {
            title: 'الأيام 61–90: التثبيت والتأمل',
            goals: [
                ['مراجعة التقدم', 'لاحظ ما جربته وما كان مفيداً وما تود تغييره، بالوتيرة التي تناسبك. قدّر الجهد إلى جانب النتائج.'],
                ['المساهمة إن رغبت', 'فكّر في توظيف صفة تقدّرها لدعم شخص أو المشاركة في مجتمعك، إذا ناسبت ظروفك وحدودك.'],
                ['توضيح اتجاه طويل المدى', 'اكتب بضعة أسطر عما يهمك وارجع إليها حين يفيدك ذلك؛ فهذا تأمل وليس رسالة حياة إلزامية.'],
                ['مرونة في الممارسات المريحة', 'واصل ممارسة هادئة أو تأملية فقط إن كانت مفيدة لك. لا حاجة لزيادة مدتها أو اتباع أسلوب بعينه.'],
                ['اختيار خطوة تالية', 'استفد مما تعلمته لاختيار اتجاه مناسب للأشهر المقبلة، بدلاً من اعتبار اليوم التسعين اختبار نجاح أو فشل.']
            ]
        }
    ];
    const phaseCards = phases.map(({ title, goals }, index) => `
      <div class="timeline-item">
        <div class="timeline-date">${escapeHtml(title)}</div>
        <div class="timeline-content">
          <div class="action-number">${index + 1}</div>
          <ul>${goals.map(([goal, description]) => `
            <li><strong>${escapeHtml(goal)}:</strong> ${escapeHtml(description)}</li>
          `).join('')}</ul>
        </div>
      </div>
    `).join('');
    const intro = english
        ? 'This 90-day outline turns reflection into small, revisable actions. It draws on values-guided action associated with ACT and the practical structure of SMART goals; it is a self-development aid, not therapy or a promise of specific results.'
        : 'تحول هذه الخطة الممتدة على 90 يوماً التأمل إلى أفعال صغيرة قابلة للمراجعة. وتستلهم العمل الموجّه بالقيم المرتبط بـACT والبنية العملية للأهداف الذكية SMART؛ وهي أداة للتطوير الذاتي وليست علاجاً أو ضماناً لنتائج محددة.';
    const smart = english
        ? 'A useful goal is specific, measurable in a way that suits you, achievable, relevant to what matters, and time-bounded. Adjust these ideas to your situation.'
        : 'يمكن أن يكون الهدف واضحاً، قابلاً للمتابعة بما يناسبك، ممكناً، مرتبطاً بما يهمك، ومحدداً بإطار زمني. عدّل هذه الأفكار وفق ظروفك.';
    const routine = english ? [
        ['Morning or a chosen time', 'A brief pause, breathing, or noting something you appreciate — only if useful.'],
        ['During the day', 'Try one small action connected to a quality or goal that matters to you.'],
        ['Evening or another convenient time', 'Optional reading, reflection, or a short note about your day.']
    ] : [
        ['الصباح أو وقت تختاره', 'وقفة قصيرة أو تنفس مريح أو تدوين أمر تقدّره، إن كان ذلك مفيداً.'],
        ['خلال اليوم', 'جرّب فعلاً صغيراً يرتبط بصفة أو هدف يهمك.'],
        ['المساء أو وقت مناسب', 'قراءة اختيارية أو تأمل أو تدوين قصير عن يومك.']
    ];
    const routineHtml = routine.map(([time, activity]) => `
      <tr><td>${escapeHtml(time)}</td><td>${escapeHtml(activity)}</td></tr>
    `).join('');
    const progressAreas = english
        ? ['Awareness of thoughts and feelings', 'How you respond to emotions', 'Connection and boundaries in relationships', 'Steps toward a personally chosen goal', 'Your own sense of life satisfaction']
        : ['الوعي بالأفكار والمشاعر', 'طريقة تعاملك مع المشاعر', 'التواصل والحدود في العلاقات', 'خطواتك نحو هدف اخترته', 'شعورك الشخصي بالرضا عن الحياة'];
    const progressNote = english
        ? 'If useful, make a private weekly note or rate an area from 1 to 10 based on your own experience. These informal check-ins are not validated measures, diagnoses, or a way to compare yourself with others. You do not need to track every area.'
        : 'إن أفادك ذلك، دوّن ملاحظة أسبوعية خاصة أو قيّم مجالاً من 1 إلى 10 وفق تجربتك الشخصية. هذه المتابعة غير الرسمية ليست مقياساً معتمداً أو تشخيصاً أو وسيلة لمقارنة نفسك بالآخرين، ولا يلزم تتبع كل المجالات.';
    const reflectiveQuote = english
        ? 'Let your next step reflect what matters to you.'
        : 'اجعل خطوتك التالية متصلة بما يهمك.';
    const references = english
        ? '<div class="info-box"><strong>Further reading</strong><ul><li>Hayes, S. C., Strosahl, K. D., &amp; Wilson, K. G. (2012). <em>Acceptance and commitment therapy: The process and practice of mindful change</em>. Guilford Press.</li><li>Doran, G. T. (1981). There’s a S.M.A.R.T. way to write management’s goals and objectives. <em>Management Review</em>, 70(11), 35–36.</li><li>Clear, J. (2018). <em>Atomic habits: An easy &amp; proven way to build good habits &amp; break bad ones</em>. Avery.</li></ul><p>These references provide context; they do not establish that this suggested plan is therapy or a guaranteed method.</p></div>'
        : '<div class="info-box"><strong>للمطالعة</strong><ul><li>Hayes, S. C., Strosahl, K. D., &amp; Wilson, K. G. (2012). <em>Acceptance and commitment therapy: The process and practice of mindful change</em>. Guilford Press.</li><li>Doran, G. T. (1981). There’s a S.M.A.R.T. way to write management’s goals and objectives. <em>Management Review</em>, 70(11), 35–36.</li><li>Clear, J. (2018). <em>Atomic habits: An easy &amp; proven way to build good habits &amp; break bad ones</em>. Avery.</li></ul><p>توفر هذه المراجع سياقاً عاماً، ولا تثبت أن هذه الخطة المقترحة علاج أو طريقة مضمونة النتائج.</p></div>';
    const note = english
        ? 'You can pause or revise this plan at any time. If a goal causes significant distress or feels unsafe, do not force it; consider seeking support from a qualified professional.'
        : 'يمكنك إيقاف هذه الخطة أو تعديلها في أي وقت. إذا سبب هدف ما ضيقاً شديداً أو بدا غير آمن، فلا تجبر نفسك عليه، وفكر في طلب دعم مختص مؤهل.';

    return `<section class="chapter-body">
      <p>${intro}</p>
      ${aspiration}
      <div class="info-box"><strong>${english ? 'A simple SMART check' : 'مراجعة سريعة وفق SMART'}</strong><p>${smart}</p></div>
      <div class="timeline">${phaseCards}</div>
      <h3>${english ? 'Optional daily rhythm' : 'روتين يومي اختياري'}</h3>
      <table><thead><tr><th>${english ? 'When' : 'الوقت'}</th><th>${english ? 'Possible activity' : 'نشاط مقترح'}</th></tr></thead><tbody>${routineHtml}</tbody></table>
      <h3>${english ? 'Optional progress check-in' : 'متابعة اختيارية للتقدم'}</h3>
      <div class="success-box"><p>${progressAreas.map(escapeHtml).join(' · ')}</p><p>${progressNote}</p></div>
      <div class="quote-box"><p>${reflectiveQuote}</p><p class="score-description">${english ? 'A reflection prompt' : 'عبارة للتأمل'}</p></div>
      <div class="warning-box">${note}</div>
      ${references}
    </section>`;
}

function getChapter7Appendix(_userData = {}, language = 'ar') {
    const english = language === 'en';
    const intro = english
        ? 'This appendix describes the conceptual frameworks that inform the project’s sample questions. The questions used here are limited project samples; they are not complete, validated, or normed psychological measures, and the report does not constitute a scientific personality assessment.'
        : 'يشرح هذا الملحق الأطر المفاهيمية التي تستلهم منها عينات الأسئلة المستخدمة في المشروع. البنود هنا عينات محدودة خاصة بالمشروع، وليست مقاييس نفسية كاملة أو مثبتة الصلاحية أو مقننة، ولا يشكل التقرير تقييماً علمياً للشخصية.';
    const dimensions = english ? [
        ['Openness', 'Interest in ideas, creativity, and new experiences.'],
        ['Conscientiousness', 'Organization, persistence, and responsibility.'],
        ['Extraversion', 'Patterns of social engagement and energy.'],
        ['Agreeableness', 'Cooperation, consideration, and trust.'],
        ['Neuroticism', 'Emotional sensitivity; the project sample contains only two items for this dimension.']
    ] : [
        ['الانفتاح على الخبرة', 'الاهتمام بالأفكار والإبداع والتجارب الجديدة.'],
        ['يقظة الضمير', 'التنظيم والمثابرة وتحمل المسؤولية.'],
        ['الانبساطية', 'أنماط التفاعل الاجتماعي والطاقة.'],
        ['المقبولية', 'التعاون ومراعاة الآخرين والثقة.'],
        ['العصابية', 'الحساسية الانفعالية؛ وتتضمن عينة المشروع بندين فقط لهذا البعد.']
    ];
    const dimensionList = dimensions.map(([label, description]) =>
        `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(description)}</li>`
    ).join('');
    const frameworkNote = english
        ? 'The Big Five is a widely researched framework for describing personality dimensions. This project’s items are inspired by the public-domain IPIP item pool, but they do not constitute the full IPIP-NEO instrument or a validated translation. Scores are descriptive averages of responses and must not be interpreted as percentiles, population norms, diagnoses, or fixed traits.'
        : 'السمات الخمس الكبرى إطار واسع البحث لوصف أبعاد الشخصية. تستلهم بنود المشروع من مجموعة IPIP المتاحة للعموم، لكنها لا تمثل أداة IPIP-NEO الكاملة ولا ترجمة مثبتة الصلاحية. المتوسطات وصف لإجابات العينة، ولا ينبغي تفسيرها كنسب مئوية أو معايير سكانية أو تشخيصات أو سمات ثابتة.';
    const source = english
        ? '<div class="info-box"><strong>Background source</strong><p>Goldberg, L. R. (1999). <em>A broad-bandwidth, public-domain, mood inventory.</em></p><p>This citation provides background on IPIP; it does not establish the validity of this project’s sample items.</p></div>'
        : '<div class="info-box"><strong>مصدر للخلفية النظرية</strong><p>Goldberg, L. R. (1999). <em>A broad-bandwidth, public-domain, mood inventory.</em></p><p>يوفر هذا المرجع خلفية عن IPIP، ولا يثبت صلاحية عينات المشروع.</p></div>';
    const limitation = english
        ? 'Limitations: the item sample is incomplete and uneven, self-reported, and not norm-referenced. Results describe only answers to the items included here. They are intended for reflection, not for clinical, employment, or other high-stakes decisions.'
        : 'القيود: عينة البنود غير مكتملة وغير متوازنة، وتعتمد على التقرير الذاتي، ولا تستند إلى معايير سكانية. تصف النتائج الإجابات عن البنود المدرجة هنا فقط، وهي للتأمل لا للاستخدام السريري أو الوظيفي أو لاتخاذ قرارات عالية الأثر.';
    const virtues = english ? [
        ['Wisdom', 'Creativity, curiosity, judgment, love of learning, and perspective'],
        ['Courage', 'Bravery, perseverance, honesty, and zest'],
        ['Humanity', 'Love, kindness, and social intelligence'],
        ['Justice', 'Teamwork, fairness, and leadership'],
        ['Temperance', 'Forgiveness, humility, prudence, and self-regulation'],
        ['Transcendence', 'Appreciation of beauty and excellence, gratitude, hope, humor, and spirituality']
    ] : [
        ['الحكمة', 'الإبداع والفضول وحكم العقل وحب التعلم والمنظور'],
        ['الشجاعة', 'البسالة والمثابرة والصدق والحيوية'],
        ['الإنسانية', 'الحب واللطف والذكاء الاجتماعي'],
        ['العدالة', 'العمل الجماعي والإنصاف والقيادة'],
        ['الاعتدال', 'التسامح والتواضع والتروي وضبط النفس'],
        ['التعالي', 'تقدير الجمال والتميز والامتنان والأمل والفكاهة والروحانية']
    ];
    const virtueList = virtues.map(([name, description]) =>
        `<li><strong>${escapeHtml(name)}:</strong> ${escapeHtml(description)}</li>`
    ).join('');
    const viaSection = english
        ? `<h3>VIA character-strengths framework</h3>
          <p>The VIA framework describes 24 character strengths grouped under six virtues:</p>
          <ul>${virtueList}</ul>
          <div class="info-box"><p>Project note: the questionnaire here includes only a subset of VIA-inspired items. It is not the complete VIA Inventory of Strengths (VIA-IS or VIA-IS-R), and its scores do not establish a person’s “top strengths.”</p>
          <p><strong>Background source:</strong> Peterson, C., &amp; Seligman, M. E. (2004). <em>Character strengths and virtues: A handbook and classification</em>. Oxford University Press.</p></div>`
        : `<h3>إطار نقاط القوة VIA</h3>
          <p>يصف إطار VIA أربعاً وعشرين قوة شخصية موزعة على ست فضائل:</p>
          <ul>${virtueList}</ul>
          <div class="info-box"><p>ملاحظة عن المشروع: يتضمن الاستبيان هنا مجموعة جزئية من البنود المستلهمة من VIA، وليس جرد VIA الكامل (VIA-IS أو VIA-IS-R). ولا تثبت درجاته ترتيب «أبرز نقاط القوة» لدى الشخص.</p>
          <p><strong>مصدر للخلفية النظرية:</strong> Peterson, C., &amp; Seligman, M. E. (2004). <em>Character strengths and virtues: A handbook and classification</em>. Oxford University Press.</p></div>`;
    const screeningSection = english
        ? `<h3>Health-screening questionnaires</h3>
          <p>PHQ-9 and GAD-7 are screening questionnaires often used to identify symptoms that may warrant further assessment; they do not by themselves establish a diagnosis.</p>
          <div class="warning-box"><strong>Privacy and scope</strong><p>Answers to health-screening questions are not included in this booklet and were not used to generate its personalized chapters.</p></div>
          <p><strong>Background sources:</strong> Kroenke, K., Spitzer, R. L., &amp; Williams, J. B. (2001). The PHQ-9: Validity of a brief depression severity measure. <em>Journal of General Internal Medicine</em>, 16(9), 606–613. Spitzer, R. L., Kroenke, K., Williams, J. B., &amp; Löwe, B. (2006). A brief measure for assessing generalized anxiety disorder: The GAD-7. <em>Archives of Internal Medicine</em>, 166(10), 1092–1097.</p>`
        : `<h3>استبيانات الفحص الصحي</h3>
          <p>يُستخدم PHQ-9 وGAD-7 في الفحص الأولي للأعراض التي قد تستدعي تقييماً إضافياً؛ ولا يثبت أي منهما التشخيص بمفرده.</p>
          <div class="warning-box"><strong>الخصوصية ونطاق التقرير</strong><p>لا تُدرج إجابات أسئلة الفحص الصحي في هذا الكتاب، ولم تُستخدم لتوليد فصوله الشخصية.</p></div>
          <p><strong>مصادر للخلفية:</strong> Kroenke, K., Spitzer, R. L., &amp; Williams, J. B. (2001). The PHQ-9: Validity of a brief depression severity measure. <em>Journal of General Internal Medicine</em>, 16(9), 606–613. Spitzer, R. L., Kroenke, K., Williams, J. B., &amp; Löwe, B. (2006). A brief measure for assessing generalized anxiety disorder: The GAD-7. <em>Archives of Internal Medicine</em>, 166(10), 1092–1097.</p>`;
    const therapySection = english
        ? `<h3>Therapeutic frameworks mentioned in this booklet</h3>
          <p><strong>Cognitive Behavioral Therapy (CBT):</strong> A therapeutic approach that explores relationships among situations, thoughts, feelings, and behavior.</p>
          <p><strong>Acceptance and Commitment Therapy (ACT):</strong> An approach that includes psychological flexibility and values-guided action.</p>
          <p><strong>Narrative approaches:</strong> Explore how people make meaning of experiences and stories about their lives.</p>
          <div class="warning-box">These frameworks provide general context only. This booklet does not deliver CBT, ACT, or narrative therapy and does not replace care from a qualified professional.</div>`
        : `<h3>الأطر العلاجية المذكورة في هذا الكتاب</h3>
          <p><strong>العلاج السلوكي المعرفي (CBT):</strong> مقاربة علاجية تستكشف العلاقة بين المواقف والأفكار والمشاعر والسلوك.</p>
          <p><strong>العلاج بالقبول والالتزام (ACT):</strong> مقاربة تتضمن المرونة النفسية والعمل الموجّه بالقيم.</p>
          <p><strong>المقاربات السردية:</strong> تستكشف كيفية بناء الناس للمعنى من التجارب والقصص التي يروونها عن حياتهم.</p>
          <div class="warning-box">توفر هذه الأطر سياقاً عاماً فقط. لا يقدم هذا الكتاب علاج CBT أو ACT أو علاجاً سردياً، ولا يحل محل رعاية مختص مؤهل.</div>`;
    const references = english
        ? `<h3>Selected references</h3><ol>
          <li>Beck, A. T. (1979). <em>Cognitive therapy and the emotional disorders</em>. Penguin Books.</li>
          <li>Burns, D. D. (1980). <em>Feeling good: The new mood therapy</em>. Avon Books.</li>
          <li>Clear, J. (2018). <em>Atomic habits: An easy &amp; proven way to build good habits &amp; break bad ones</em>. Avery.</li>
          <li>Doran, G. T. (1981). There’s a S.M.A.R.T. way to write management’s goals and objectives. <em>Management Review</em>, 70(11), 35–36.</li>
          <li>Goldberg, L. R. (1999). A broad-bandwidth, public-domain, mood inventory. <em>Personality Psychology in Europe</em>, 7.</li>
          <li>Hayes, S. C., Strosahl, K. D., &amp; Wilson, K. G. (2012). <em>Acceptance and commitment therapy: The process and practice of mindful change</em>. Guilford Press.</li>
          <li>Kroenke, K., Spitzer, R. L., &amp; Williams, J. B. (2001). The PHQ-9: Validity of a brief depression severity measure. <em>Journal of General Internal Medicine</em>, 16(9), 606–613.</li>
          <li>Leahy, R. L. (2017). <em>Cognitive therapy techniques: A practitioner’s guide</em>. Guilford Press.</li>
          <li>McAdams, D. P. (2006). <em>The redemptive self: Stories Americans live by</em>. Oxford University Press.</li>
          <li>McCrae, R. R., &amp; Costa, P. T. (2003). <em>Personality in adulthood: A five-factor theory perspective</em>. Guilford Press.</li>
          <li>Peterson, C., &amp; Seligman, M. E. (2004). <em>Character strengths and virtues: A handbook and classification</em>. Oxford University Press.</li>
          <li>Spitzer, R. L., Kroenke, K., Williams, J. B., &amp; Löwe, B. (2006). A brief measure for assessing generalized anxiety disorder: The GAD-7. <em>Archives of Internal Medicine</em>, 166(10), 1092–1097.</li>
        </ol>`
        : `<h3>مراجع مختارة</h3><ol>
          <li>Beck, A. T. (1979). <em>Cognitive therapy and the emotional disorders</em>. Penguin Books.</li>
          <li>Burns, D. D. (1980). <em>Feeling good: The new mood therapy</em>. Avon Books.</li>
          <li>Clear, J. (2018). <em>Atomic habits: An easy &amp; proven way to build good habits &amp; break bad ones</em>. Avery.</li>
          <li>Doran, G. T. (1981). There’s a S.M.A.R.T. way to write management’s goals and objectives. <em>Management Review</em>, 70(11), 35–36.</li>
          <li>Goldberg, L. R. (1999). A broad-bandwidth, public-domain, mood inventory. <em>Personality Psychology in Europe</em>, 7.</li>
          <li>Hayes, S. C., Strosahl, K. D., &amp; Wilson, K. G. (2012). <em>Acceptance and commitment therapy: The process and practice of mindful change</em>. Guilford Press.</li>
          <li>Kroenke, K., Spitzer, R. L., &amp; Williams, J. B. (2001). The PHQ-9: Validity of a brief depression severity measure. <em>Journal of General Internal Medicine</em>, 16(9), 606–613.</li>
          <li>Leahy, R. L. (2017). <em>Cognitive therapy techniques: A practitioner’s guide</em>. Guilford Press.</li>
          <li>McAdams, D. P. (2006). <em>The redemptive self: Stories Americans live by</em>. Oxford University Press.</li>
          <li>McCrae, R. R., &amp; Costa, P. T. (2003). <em>Personality in adulthood: A five-factor theory perspective</em>. Guilford Press.</li>
          <li>Peterson, C., &amp; Seligman, M. E. (2004). <em>Character strengths and virtues: A handbook and classification</em>. Oxford University Press.</li>
          <li>Spitzer, R. L., Kroenke, K., Williams, J. B., &amp; Löwe, B. (2006). A brief measure for assessing generalized anxiety disorder: The GAD-7. <em>Archives of Internal Medicine</em>, 166(10), 1092–1097.</li>
        </ol>`;
    const closing = english
        ? '<div class="success-box"><strong>A final reflection</strong><p>Self-understanding can continue beyond this booklet. Keep what feels useful, question what does not fit, and choose next steps that respect your circumstances. You do not need to be perfect or follow a single path.</p></div>'
        : '<div class="success-box"><strong>كلمة ختامية</strong><p>يمكن أن يستمر فهم الذات بعد هذا الكتاب. احتفظ بما يفيدك، وراجع ما لا يلائمك، واختر خطوات تحترم ظروفك. لست مطالباً بالكمال أو باتباع مسار واحد.</p></div>';

    return `<section class="chapter-body">
      <p>${intro}</p>
      <h3>${english ? 'Big Five framework (OCEAN)' : 'إطار السمات الخمس الكبرى (OCEAN)'}</h3>
      <p>${english
        ? 'The framework describes personality through five broad dimensions:'
        : 'يصف هذا الإطار الشخصية من خلال خمسة أبعاد عامة:'}</p>
      <ul>${dimensionList}</ul>
      <div class="info-box">${frameworkNote}</div>
      <div class="warning-box"><strong>${english ? 'How to read this report' : 'كيفية قراءة التقرير'}</strong><p>${limitation}</p></div>
      ${source}
      ${viaSection}
      ${screeningSection}
      ${therapySection}
      ${references}
      ${closing}
    </section>`;
}

module.exports = {
    getChapter1Introduction,
    getChapter2Personality,
    getChapter3Strengths,
    getChapter4LifeNarrative,
    getChapter5Challenges,
    getChapter6ActionPlan,
    getChapter7Appendix,
    textToHtml
};

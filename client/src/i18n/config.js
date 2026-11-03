import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  ar: {
    translation: {
      "appName": "بوصلة النفس",
      "homeTitle": "اكتشف خفايا شخصيتك",
      "homeSubtitle": "منصة علمية للتحليل النفسي والاجتماعي. أجب عن أسئلة مصممة بعناية، واحصل على كتاب مخصص يحلل شخصيتك ويقدم لك نصائح وحلولاً بأسلوب علمي، أدبي، وملهم.",
      "startIndividualBtn": "ابدأ الاختبار الشخصي",
      "startCoupleBtn": "اختبار العلاقات (لشخصين)",
      "language": "English",
      "footer": "جميع الحقوق محفوظة © 2026 - بوصلة النفس",
      "prevBtn": "السابق",
      "nextBtn": "التالي",
      "finishBtn": "إنهاء الاختبار",
      "individualTest": "الاختبار الفردي",
      "coupleTest": "اختبار العلاقات",
      "questionOf": "سؤال {{current}} من {{total}}",
      "freePreview": "لمحة سريعة",
      "testFinished": "لقد أتممت الاختبار بنجاح!",
      "processingAnswers": "نحن الآن نقوم بتحليل إجاباتك العميقة...",
      "choosePackage": "اختر باقتك للحصول على كتابك المخصص الكامل:",
      "pdfPackage": "النسخة الرقمية (PDF)",
      "pdfDesc": "كتاب إلكتروني بتصميم فني أنيق",
      "audioPackage": "الباقة الشاملة (PDF + كتاب صوتي)",
      "audioDesc": "استمع لتحليلك بصوت هادئ ومريح",
      "giftPackage": "أهدِ هذا الاختبار لصديق",
      "giftDesc": "احصل على كود هدية ترسله لمن تحب",
      "payPaypal": "شراء عبر PayPal",
      "buyGift": "شراء كود هدية",
      "generating": "جاري تأليف كتابك... الرجاء الانتظار",
      "downloadReady": "كتابك جاهز! انقر هنا للتحميل",
      "q1": "كيف تتصرف عادةً في المواقف الاجتماعية المكتظة بالأشخاص غير المألوفين؟",
      "q1_o1": "أندمج بسهولة وأستمتع بالتعرف عليهم",
      "q1_o2": "أتفاعل إذا بادر أحدهم بالحديث معي",
      "q1_o3": "أشعر بالتوتر وأفضل البقاء صامتاً",
      "q1_o4": "أشعر بإرهاق شديد وأغادر بأسرع وقت",
      "q2": "عندما تواجه تغيرات جذرية مفاجئة في حياتك المهنية أو الشخصية، ما هو رد فعلك الأولي؟",
      "q2_o1": "أشعر بالحماس وأعتبرها فرصة جديدة للنمو",
      "q2_o2": "أقلق قليلاً لكنني أتكيف مع الوضع تدريجياً",
      "q2_o3": "أشعر بالتوتر الشديد وأقاوم التغيير",
      "q2_o4": "أشعر بالشلل التام وعدم القدرة على اتخاذ قرار",
      "q3": "إلى أي مدى تتفق: 'غالباً ما أضع احتياجات الآخرين قبل احتياجاتي الشخصية'؟",
      "q3_o1": "أتفق بشدة (أفعل ذلك دائماً)",
      "q3_o2": "أتفق نوعاً ما (أفعل ذلك مع المقربين فقط)",
      "q3_o3": "لا أتفق (أوازن بين احتياجاتي واحتياجاتهم)",
      "q3_o4": "لا أتفق بشدة (أولويتي دائماً لنفسي)",
      "q4": "كيف تتعامل مع مشاعر الغضب أو الإحباط الشديد؟",
      "q4_o1": "أعبر عنها بهدوء وعقلانية بعد أن أهدأ",
      "q4_o2": "أكبتها بداخلي ولا أظهرها للآخرين",
      "q4_o3": "أنفجر غضباً ثم أشعر بالندم السريع",
      "q4_o4": "أوجه طاقتي نحو نشاط بدني أو إبداعي",
      "q5": "صِف لنا بكلماتك الخاصة: متى كانت آخر مرة شعرت فيها بـ 'السلام الداخلي'؟ وماذا كنت تفعل حينها؟"
    }
  },
  en: {
    translation: {
      "appName": "Soul Compass",
      "homeTitle": "Discover Your Inner Self",
      "homeSubtitle": "A scientific platform for psycho-social analysis. Answer carefully designed questions and get a personalized book that analyzes your personality and provides solutions.",
      "startIndividualBtn": "Start Individual Test",
      "startCoupleBtn": "Relationship Test",
      "language": "العربية",
      "footer": "All Rights Reserved © 2026 - Soul Compass",
      "prevBtn": "Previous",
      "nextBtn": "Next",
      "finishBtn": "Finish Assessment",
      "individualTest": "Individual Assessment",
      "coupleTest": "Relationship Assessment",
      "questionOf": "Question {{current}} of {{total}}",
      "freePreview": "Quick Insights",
      "testFinished": "Assessment Completed Successfully!",
      "processingAnswers": "We are now deeply analyzing your responses...",
      "choosePackage": "Choose a package to get your full personalized book:",
      "pdfPackage": "Digital Copy (PDF)",
      "pdfDesc": "An elegantly designed eBook",
      "audioPackage": "Premium Package (PDF + Audio)",
      "audioDesc": "Listen to your analysis in a soothing voice",
      "giftPackage": "Gift this to a friend",
      "giftDesc": "Get a gift code to share",
      "payPaypal": "Pay with PayPal",
      "buyGift": "Buy Gift Code",
      "generating": "Authoring your book... Please wait",
      "downloadReady": "Your book is ready! Click to download",
      "q1": "How do you usually behave in crowded social situations with unfamiliar people?",
      "q1_o1": "I blend in easily and enjoy meeting them",
      "q1_o2": "I interact if someone initiates the conversation",
      "q1_o3": "I feel anxious and prefer to stay quiet",
      "q1_o4": "I feel extremely drained and try to leave ASAP",
      "q2": "When facing sudden, drastic changes in your life, what is your initial reaction?",
      "q2_o1": "I feel excited and see it as a new opportunity",
      "q2_o2": "I worry a little but gradually adapt",
      "q2_o3": "I feel highly stressed and resist the change",
      "q2_o4": "I feel completely paralyzed",
      "q3": "To what extent do you agree: 'I often put others' needs before my own'?",
      "q3_o1": "Strongly agree (I always do this)",
      "q3_o2": "Somewhat agree (Only with close ones)",
      "q3_o3": "Disagree (I balance my needs and theirs)",
      "q3_o4": "Strongly disagree (My priority is myself)",
      "q4": "How do you handle feelings of intense anger or frustration?",
      "q4_o1": "I express them calmly after cooling down",
      "q4_o2": "I suppress them and do not show them",
      "q4_o3": "I explode in anger and quickly feel regretful",
      "q4_o4": "I channel my energy into physical activity",
      "q5": "In your own words: When was the last time you felt true 'inner peace'? What were you doing?"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
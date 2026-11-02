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
      "footer": "جميع الحقوق محفوظة © 2026 - بوصلة النفس"
    }
  },
  en: {
    translation: {
      "appName": "Soul Compass",
      "homeTitle": "Discover Your Inner Self",
      "homeSubtitle": "A scientific platform for psycho-social analysis. Answer carefully designed questions and get a personalized book that analyzes your personality and provides solutions in a scientific, literary, and inspiring way.",
      "startIndividualBtn": "Start Individual Test",
      "startCoupleBtn": "Relationship Test (For Couples)",
      "language": "العربية",
      "footer": "All Rights Reserved © 2026 - Soul Compass"
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
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './legal-pages.css';

const updated = { ar: '6 نوفمبر 2026', en: 'November 6, 2026' };

const copy = {
  ar: {
    draft: 'هذه مسودة معلومات عامة وليست استشارة قانونية. قبل النشر، أضف اسم الجهة المسؤولة ووسيلة تواصل فعلية، وتحقق من مزودي الخدمة ومواقع معالجة البيانات ومدد الاحتفاظ، واطلب مراجعة قانونية مناسبة للبلدان التي تستهدفها المنصة.',
    home: 'العودة للرئيسية',
    links: [
      ['إخلاء المسؤولية', '/legal/disclaimer'],
      ['الخصوصية', '/legal/privacy'],
      ['شروط الاستخدام', '/legal/terms']
    ],
    disclaimer: {
      title: 'إخلاء المسؤولية الطبي',
      intro: 'تقدم بوصلة النفس مواداً للتأمل الذاتي والفهم الشخصي.',
      sections: [
        { title: 'ليست خدمة علاجية', content: 'المحتوى والتقييمات والتقارير لا تقدم تشخيصاً طبياً أو نفسياً، ولا علاجاً أو استشارة سريرية، ولا تحل محل مختص صحي مرخص أو الرعاية الطارئة.' },
        { title: 'حدود التقييم والتقرير', content: 'الأسئلة الحالية من إعداد المنصة وهي استكشافية وغير معيارية. ملخصات الإجابات وصفية ومحدودة بما يقدمه المستخدم، ولا تثبت وجود اضطراب أو سمة ثابتة ولا ينبغي استخدامها لاتخاذ قرار طبي أو مهني أو قانوني.' },
        { title: 'حالات الطوارئ', content: 'لا تستخدم الموقع لطلب مساعدة عاجلة. إذا كان هناك خطر فوري أو أفكار لإيذاء النفس، اتصل بخدمات الطوارئ المحلية أو توجّه إلى أقرب قسم طوارئ، وتواصل مع شخص موثوق أو مختص صحي مرخص.' },
        { title: 'المسؤولية عن الاستخدام', content: 'استخدم المواد بوصفها نقطة بداية للتأمل، وقيّم مدى ملاءمتها لظروفك. لا يمكن لهذا الإشعار استبعاد أي حقوق أو مسؤوليات لا يسمح القانون باستبعادها.' }
      ]
    },
    privacy: {
      title: 'إشعار الخصوصية والبيانات',
      intro: 'يوضح هذا الإشعار فئات البيانات التي يعالجها التطبيق حالياً. لا يمثل ادعاءً بالامتثال لنظام خصوصية بعينه.',
      sections: [
        { title: 'البيانات التي قد يعالجها التطبيق', list: [
          'بيانات الحساب: الاسم والبريد الإلكتروني وكلمة المرور بصيغة تجزئة وإعدادات اللغة والإشعارات.',
          'بيانات التقييم: الإجابات والدرجات والنصوص التأملية، وقد تشمل إجابات الشخص الآخر في تقييم العلاقة.',
          'بيانات المتابعة أو طلب التواصل بشأن الدعم، إذا أرسلها المستخدم.',
          'بيانات المعاملة مثل معرّفات طلب/تحصيل PayPal وحالة الدفع؛ لا يطلب التطبيق بيانات البطاقة مباشرة.',
          'سجلات البريد الوصفية: عنوان المستلم والموضوع ونوع الرسالة وحالة الإرسال ورمز الخطأ. لا يحفظ سجل التطبيق نص الرسالة أو المرفق.'
        ] },
        { title: 'كيف تستخدم البيانات وتُرسل', content: 'تُستخدم البيانات لتشغيل الحساب والتقييم وإنشاء التقرير وإيصاله، ومعالجة الدفع وإرسال رسائل الخدمة التي تسمح بها إعدادات المستخدم. قد تُرسل مسودة التقرير ومرفق PDF إلى عنوان الإدارة المهيأ للمراجعة، كما قد يُرسل التقرير للمستخدم عبر مزود البريد المهيأ. قد يتضمن التقرير إجابات وتأملات شخصية؛ لا تضع فيه معلومات لا ترغب بمشاركتها مع مستلم الرسالة.' },
        { title: 'مزودو الخدمات', content: 'يعتمد التشغيل على إعدادات النشر: قاعدة بيانات MongoDB والاستضافة، PayPal لمعالجة الدفع، ومزود البريد المحدد على الخادم (SendGrid عند تهيئة مفتاحه، أو SMTP خلاف ذلك). يجب على مشغل الخدمة التحقق من العقود ومواقع المعالجة والنقل الدولي لكل مزود قبل النشر.' },
        { title: 'التخزين في المتصفح', content: 'يُحفظ رمز الدخول في sessionStorage ويُحفظ مسودّة التقييم غير المكتملة في localStorage على الجهاز. تجنب استخدام جهاز مشترك، واحذف المسودات المحلية عند الحاجة. لا يعتمد التطبيق حالياً على Google Analytics أو ملفات تعريف ارتباط تحليلية وفق الشيفرة الحالية.' },
        { title: 'الاحتفاظ والحذف', content: 'تُضبط سجلات تقارير الأزمات على الانتهاء بعد 90 يوماً، وسجلات تقييمات المتابعة بعد 365 يوماً. لا يوجد انتهاء تلقائي مماثل لسجلات الحساب والتقييم الرئيسية أو سجلات البريد. تتضمن الخدمة عملية حذف للحساب وبيانات مرتبطة به، لكن واجهة المستخدم الحالية لا تعرض إجراءً ذاتياً لذلك؛ كما يجب التحقق من سلوك النسخ الاحتياطية وسجلات مزودي الخدمة قبل الوعد بحذف نهائي أو بمدة محددة.' },
        { title: 'الحقوق وطلبات الخصوصية', content: 'قد تمنحك القوانين المنطبقة حقوقاً مثل الاطلاع أو التصحيح أو الحذف أو الاعتراض. لم تُحدد في التطبيق الحالي جهة اتصال خصوصية أو قناة مكتملة لتقديم جميع هذه الطلبات. يجب على مشغل الخدمة إضافة وسيلة اتصال فعلية والتحقق من المتطلبات القانونية قبل النشر.' },
        { title: 'الجهة المسؤولة والتغييرات', content: 'اسم الجهة المسؤولة عن الخدمة وبلدها ووسيلة التواصل معها غير محددة في التطبيق بعد. يجب استكمالها قبل اعتماد هذا الإشعار. عند تحديثه، ينبغي بيان تاريخ التعديل وأي تغيير جوهري في البيانات أو مزودي الخدمة.' }
      ]
    },
    terms: {
      title: 'شروط الاستخدام',
      intro: 'هذه مسودة شروط عامة؛ يجب استكمال معلومات الجهة والاختصاص القانوني ومراجعتها قبل اعتمادها.',
      sections: [
        { title: 'طبيعة الخدمة', content: 'تقدم المنصة محتوى للتأمل الذاتي وتقارير وصفية وليست خدمة تشخيص أو علاج أو استشارة طبية أو نفسية.' },
        { title: 'الحساب والاستخدام', content: 'أنت مسؤول عن تقديم معلومات صحيحة، والمحافظة على سرية بيانات الدخول، واستخدام المنصة بطريقة قانونية. لا تستخدمها لتعطيل الخدمة أو الوصول غير المصرح به أو انتهاك حقوق الآخرين.' },
        { title: 'محتوى المستخدم', content: 'تظل مسؤولاً عن النصوص والإجابات التي ترسلها وعن امتلاكك الحق في إرسالها، بما في ذلك أي معلومات تخص شخصاً آخر. لا ترسل معلومات حساسة عن الغير دون مسوغ وموافقة مناسبة.' },
        { title: 'التقارير والملكية', content: 'التقرير المُنشأ يعكس مدخلات المستخدم وحدود أدوات المنصة، ولا يمثل حكماً مهنياً. تخضع حقوق المستخدم والمنصة في المواد للقوانين المنطبقة؛ ولا يحد هذا النص من الحقوق التي لا يجوز التنازل عنها قانوناً.' },
        { title: 'المدفوعات', content: 'تُعرض تفاصيل السعر والمنتج عند إتمام الطلب، وقد يعالج PayPal الدفع وفق شروطه. لا تنطبق سياسة استرداد ثابتة في هذا النص؛ تخضع عمليات الإلغاء والاسترداد لبيان الشراء والقانون الإلزامي المنطبق.' },
        { title: 'التوفر والتغييرات', content: 'قد تتغير ميزات الخدمة أو تتوقف للصيانة. لا يضمن هذا النص توفر الخدمة دون انقطاع، ولا يستبعد الضمانات أو المسؤوليات التي يفرضها القانون.' },
        { title: 'القانون والاتصال', content: 'لم تُحدد جهة تشغيل أو ولاية قضائية في التطبيق. يجب إدخال اسم الجهة وبلدها وآلية التعامل مع النزاعات ومعلومات الاتصال بعد مراجعة قانونية، قبل نشر الشروط للاعتماد.' }
      ]
    }
  },
  en: {
    draft: 'This is a general-information draft, not legal advice. Before publication, identify the responsible entity and a real contact method, verify service providers, processing locations and retention periods, and obtain legal review for the jurisdictions the service targets.',
    home: 'Back to home',
    links: [
      ['Disclaimer', '/legal/disclaimer'],
      ['Privacy', '/legal/privacy'],
      ['Terms', '/legal/terms']
    ],
    disclaimer: {
      title: 'Medical Disclaimer',
      intro: 'Soul Compass provides material for self-reflection and personal understanding.',
      sections: [
        { title: 'Not a clinical service', content: 'The content, assessments and reports do not provide a medical or psychological diagnosis, treatment, or clinical consultation, and are not a substitute for a licensed health professional or emergency care.' },
        { title: 'Assessment and report limits', content: 'The current questions are exploratory, project-created, and non-standardized. Response summaries are descriptive and limited to what users provide. They do not establish a disorder or fixed trait and should not be used to make medical, employment, or legal decisions.' },
        { title: 'Emergencies', content: 'Do not use this website to request urgent help. If there is immediate danger or thoughts of self-harm, contact local emergency services or go to the nearest emergency department, and reach out to a trusted person or licensed health professional.' },
        { title: 'Use of the material', content: 'Use the material as a starting point for reflection and decide whether it suits your circumstances. This notice does not exclude rights or liabilities that cannot legally be excluded.' }
      ]
    },
    privacy: {
      title: 'Privacy and Data Notice',
      intro: 'This notice describes data categories the application currently processes. It is not a claim of compliance with any particular privacy law.',
      sections: [
        { title: 'Data the application may process', list: [
          'Account data: name, email address, password hash, language and notification preferences.',
          'Assessment data: answers, scores and reflective text; a relationship assessment may also include another participant’s answers.',
          'Follow-up data or a request for support contact, if submitted by the user.',
          'Transaction data such as PayPal order/capture identifiers and payment status; the application does not directly request card details.',
          'Email metadata: recipient address, subject, message type, delivery status and error code. The application email log does not store message bodies or attachments.'
        ] },
        { title: 'Use and sharing', content: 'Data is used to operate accounts and assessments, generate and deliver reports, process payments, and send service messages allowed by user settings. A report draft and PDF attachment may be sent to the configured administrator for review, and a report may be emailed to the user through the configured mail provider. Reports can include personal answers and reflections; do not include information you do not want shared with the email recipient.' },
        { title: 'Service providers', content: 'The deployment configuration relies on MongoDB and the hosting provider, PayPal for payment processing, and the server-configured email provider (SendGrid when its key is configured, otherwise SMTP). The service operator must verify provider agreements, processing locations and international transfers before publication.' },
        { title: 'Browser storage', content: 'The sign-in token is stored in sessionStorage and an incomplete assessment draft is stored in localStorage on the device. Avoid shared devices and clear local drafts when appropriate. The current code does not use Google Analytics or analytics cookies.' },
        { title: 'Retention and deletion', content: 'Crisis-report records are configured to expire after 90 days and follow-up assessment records after 365 days. Main account and assessment records, and email logs, do not have equivalent automatic expiry. The service includes an account/data deletion operation, but the current user interface does not expose a self-service action; backup and provider-log behavior must also be verified before promising permanent deletion or a specific timeline.' },
        { title: 'Rights and privacy requests', content: 'Applicable law may provide rights such as access, correction, deletion or objection. The current application does not identify a privacy contact or a complete channel for submitting all such requests. The operator must add a real contact method and verify legal requirements before publication.' },
        { title: 'Responsible entity and changes', content: 'The service operator’s legal name, country and contact details are not yet specified in the application. Add them before adopting this notice. When it changes, state the revision date and any material changes to data or providers.' }
      ]
    },
    terms: {
      title: 'Terms of Service',
      intro: 'These are draft general terms; identify the operator and governing jurisdiction and obtain review before adopting them.',
      sections: [
        { title: 'Nature of the service', content: 'The platform provides self-reflection material and descriptive reports. It is not a diagnostic, therapeutic, medical or psychological consultation service.' },
        { title: 'Account and acceptable use', content: 'You are responsible for providing accurate information, protecting your sign-in details, and using the platform lawfully. Do not disrupt the service, seek unauthorized access, or infringe another person’s rights.' },
        { title: 'User-submitted content', content: 'You remain responsible for the answers and text you submit and for having the right to submit them, including information about another person. Do not submit another person’s sensitive information without an appropriate basis and consent.' },
        { title: 'Reports and ownership', content: 'A generated report reflects user-provided inputs and the platform’s limitations; it is not a professional judgment. User and platform rights in materials are subject to applicable law. These terms do not limit rights that cannot legally be waived.' },
        { title: 'Payments', content: 'Price and product details are shown at checkout, and PayPal may process payment under its terms. This draft does not set a blanket refund rule; cancellations and refunds are governed by the purchase disclosure and applicable mandatory law.' },
        { title: 'Availability and changes', content: 'Features may change or be unavailable for maintenance. These terms do not guarantee uninterrupted service or exclude warranties or liabilities imposed by law.' },
        { title: 'Law and contact', content: 'The application does not yet identify an operating entity or jurisdiction. Add the operator name, country, dispute process and contact details after legal review, before publishing these terms as final.' }
      ]
    }
  }
};

function LegalPage({ page }) {
  const { i18n } = useTranslation();
  const language = i18n.language === 'en' ? 'en' : 'ar';
  const text = copy[language];
  const content = text[page];

  return (
    <main className="legal-page" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <article className="legal-card">
        <p className="legal-draft-notice" role="note">{text.draft}</p>
        <h1>{content.title}</h1>
        <p className="legal-updated">{language === 'ar' ? 'آخر تحديث مبدئي: ' : 'Draft last updated: '}{updated[language]}</p>
        <p className="legal-intro">{content.intro}</p>
        {content.sections.map((section) => (
          <section className="legal-section" key={section.title}>
            <h2>{section.title}</h2>
            {section.content && <p>{section.content}</p>}
            {section.list && (
              <ul>
                {section.list.map((item) => <li key={item}>{item}</li>)}
              </ul>
            )}
          </section>
        ))}
        <nav className="legal-links" aria-label={language === 'ar' ? 'صفحات قانونية' : 'Legal pages'}>
          <Link to="/">{text.home}</Link>
          {text.links.filter(([, path]) => path !== `/legal/${page}`).map(([label, path]) => (
            <Link to={path} key={path}>{label}</Link>
          ))}
        </nav>
      </article>
    </main>
  );
}

export function DisclaimerPage() {
  return <LegalPage page="disclaimer" />;
}

export function PrivacyPage() {
  return <LegalPage page="privacy" />;
}

export function TermsPage() {
  return <LegalPage page="terms" />;
}

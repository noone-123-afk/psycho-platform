import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '../../components/SEO';

export default function DisclaimerPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';

  const content = {
    ar: {
      title: 'إخلاء المسؤولية الطبي والقانوني',
      lastUpdated: 'آخر تحديث: 6 نوفمبر 2026',
      sections: [
        { title: '1. طبيعة الخدمة', content: 'هذا الموقع يقدم أداة للتطوير الذاتي والفهم الشخصي مبنية على أسس علمية ونفسية معتمدة. الخدمة هي لأغراض تعليمية وتطويرية فقط، وهي ليست بديلاً عن:', list: ['التشخيص الطبي أو النفسي السريري', 'العلاج النفسي المتخصص', 'الاستشارة الطبية من مختص مرخص', 'الرعاية الصحية الطارئة'] },
        { title: '2. حدود المسؤولية', content: 'الموقع غير مسؤول عن:', list: ['أي قرارات يتخذها المستخدم بناءً على المعلومات المقدمة', 'أي ضرر نفسي أو جسدي ناتج عن استخدام الخدمة', 'دقة النتائج في حالات الاضطرابات النفسية الشديدة', 'أي خسائر مالية ناتجة عن استخدام الخدمة'] },
        { title: '3. حالات الطوارئ', content: 'إذا كنت تعاني من:', list: ['أفكار إيذاء الذات أو الانتحار', 'ضيق نفسي شديد', 'أزمة نفسية حادة', 'أي حالة طارئة'], afterList: 'يرجى التواصل فوراً مع: خط المساعدة النفسية في بلدك، أقرب مستشفى، أو خدمات الطوارئ المحلية (911/999).' },
        { title: '4. الدقة العلمية', content: 'رغم أن الموقع يستخدم مقاييس علمية معتمدة، إلا أن:', list: ['النتائج ليست تشخيصاً طبياً', 'الدقة تعتمد على صدق إجابات المستخدم', 'الترجمة العربية قد لا تعكس جميع الفروق الدقيقة', 'السياق الثقافي قد يؤثر على النتائج'] },
        { title: '5. الموافقة المستنيرة', content: 'باستخدامك للخدمة، فإنك تقر بأنك:', list: ['قرأت وفهمت إخلاء المسؤولية هذا', 'تستخدم الخدمة طوعاً وبموافقتك', 'لست في حالة طوارئ نفسية', 'ستطلب المساعدة المهنية إذا لزم الأمر'] }
      ],
      contact: 'لأي استفسار قانوني، تواصل معنا على: legal@personalbook.com',
      back: 'العودة للرئيسية',
      privacy: 'سياسة الخصوصية'
    },
    en: {
      title: 'Medical and Legal Disclaimer',
      lastUpdated: 'Last Updated: November 6, 2026',
      sections: [
        { title: '1. Nature of Service', content: 'This website provides a tool for self-development and personal understanding based on validated scientific and psychological foundations. The service is for educational and developmental purposes only, and is not a substitute for:', list: ['Clinical medical or psychological diagnosis', 'Specialized psychological therapy', 'Medical consultation from a licensed professional', 'Emergency healthcare'] },
        { title: '2. Limits of Liability', content: 'The website is not responsible for:', list: ['Any decisions made by the user based on the information provided', 'Any psychological or physical harm resulting from using the service', 'Accuracy of results in cases of severe psychological disorders', 'Any financial losses resulting from using the service'] },
        { title: '3. Emergency Situations', content: 'If you are experiencing:', list: ['Thoughts of self-harm or suicide', 'Severe psychological distress', 'Acute psychological crisis', 'Any emergency situation'], afterList: 'Please contact immediately: Your country\'s mental health helpline, nearest hospital, or local emergency services (911/999).' },
        { title: '4. Scientific Accuracy', content: 'Although the website uses validated scientific measures:', list: ['Results are not a medical diagnosis', 'Accuracy depends on the honesty of user responses', 'Arabic translation may not reflect all nuances', 'Cultural context may affect results'] },
        { title: '5. Informed Consent', content: 'By using the service, you acknowledge that you:', list: ['Have read and understood this disclaimer', 'Are using the service voluntarily and with your consent', 'Are not in a psychological emergency', 'Will seek professional help if needed'] }
      ],
      contact: 'For any legal inquiries, contact us at: legal@personalbook.com',
      back: 'Back to Home',
      privacy: 'Privacy Policy'
    }
  };

  const c = content[lang];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <SEO title={c.title} description={c.sections[0].content} path="/legal/disclaimer" />
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{c.title}</h1>
          <p className="text-sm text-gray-500 mb-8">{c.lastUpdated}</p>
          <div className="space-y-6">
            {c.sections.map((section, idx) => (
              <div key={idx}>
                {section.title && <h2 className="text-xl font-bold text-gray-800 mb-3">{section.title}</h2>}
                {section.content && <p className="text-gray-700 mb-3">{section.content}</p>}
                {section.list && (
                  <ul className="list-disc list-inside space-y-2 text-gray-700 mb-3 mr-6">
                    {section.list.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                )}
                {section.afterList && <p className="text-gray-700 mt-3 font-medium">{section.afterList}</p>}
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t"><p className="text-sm text-gray-600">{c.contact}</p></div>
          <div className="mt-6 flex gap-4">
            <Link to="/" className="text-blue-600 hover:text-blue-800 underline">{c.back}</Link>
            <Link to="/legal/privacy" className="text-blue-600 hover:text-blue-800 underline">{c.privacy}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

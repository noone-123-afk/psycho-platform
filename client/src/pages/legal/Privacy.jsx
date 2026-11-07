import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '../../components/SEO';

export default function PrivacyPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';

  const content = {
    ar: {
      title: 'سياسة الخصوصية وحماية البيانات',
      lastUpdated: 'آخر تحديث: 6 نوفمبر 2026',
      sections: [
        { title: '1. البيانات التي نجمعها', content: 'نجمع البيانات التالية:', list: ['البيانات الديموغرافية (العمر، الجنس، المستوى التعليمي، الدولة)', 'نتائج الاختبارات النفسية (Big Five, VIA, PHQ-9, GAD-7)', 'السيرة الذاتية التي تكتبها (النصوص المفتوحة)', 'بيانات الدفع (تُعالج بشكل آمن عبر PayPal، ولا نحتفظ ببيانات البطاقة)', 'بيانات تقنية (IP, المتصفح، نظام التشغيل)'] },
        { title: '2. كيفية استخدام البيانات', content: 'نستخدم بياناتك لـ:', list: ['توليد كتابك الشخصي', 'تحسين خدمات الموقع', 'إرسال إشعارات مهمة (مع موافقتك)', 'الامتثال للمتطلبات القانونية', 'ضمان أمان الموقع'] },
        { title: '3. ما لا نفعله', content: 'نحن لا:', list: ['نبيع بياناتك لأطراف ثالثة', 'نستخدم بياناتك لتدريب نماذج ذكاء اصطناعي عامة', 'نشارك بياناتك مع المعلنين', 'نحتفظ ببيانات الدفع (تُعالج عبر PayPal فقط)'] },
        { title: '4. حماية البيانات', content: 'نتخذ الإجراءات التالية لحماية بياناتك:', list: ['تشفير جميع البيانات الحساسة (AES-256)', 'تشفير كلمات المرور (bcrypt)', 'تخزين البيانات على سيرفرات آمنة (SSL/TLS)', 'الوصول محدود للموظفين المصرح لهم', 'نسخ احتياطي يومي مشفر'] },
        { title: '5. حقوقك (GDPR)', content: 'لديك الحقوق التالية:', list: ['حق الوصول: طلب نسخة من جميع بياناتك', 'حق التصحيح: تصحيح بيانات غير دقيقة', 'حق الحذف (حق النسيان): حذف جميع بياناتك نهائياً', 'حق النقل: نقل بياناتك إلى خدمة أخرى', 'حق الاعتراض: الاعتراض على معالجة بياناتك', 'حق تقييد المعالجة: تقييد استخدام بياناتك'] },
        { title: '6. مدة الاحتفاظ بالبيانات', content: 'نحتفظ ببياناتك طالما حسابك نشط. عند حذف الحساب:', list: ['جميع البيانات تُحذف نهائياً خلال 30 يوماً', 'النسخ الاحتياطية تُحفظ لمدة 90 يوماً ثم تُحذف', 'سجلات الأزمات تُحفظ لمدة سنة واحدة لأسباب قانونية'] },
        { title: '7. ملفات تعريف الارتباط (Cookies)', content: 'نستخدم ملفات تعريف الارتباط لـ:', list: ['تسجيل الدخول والحفاظ على الجلسة', 'حفظ تفضيلات اللغة', 'تحليل أداء الموقع (Google Analytics - اختياري)'] },
        { title: '8. التغييرات على السياسة', content: 'قد نحدث سياسة الخصوصية من وقت لآخر. سنُعلمك بالتغييرات الجوهرية عبر البريد الإلكتروني أو إشعار على الموقع.' }
      ],
      contact: 'لأي استفسار حول الخصوصية، تواصل معنا على: privacy@personalbook.com',
      back: 'العودة للرئيسية',
      disclaimer: 'إخلاء المسؤولية'
    },
    en: {
      title: 'Privacy Policy and Data Protection',
      lastUpdated: 'Last Updated: November 6, 2026',
      sections: [
        { title: '1. Data We Collect', content: 'We collect the following data:', list: ['Demographic data (age, gender, education level, country)', 'Psychological test results (Big Five, VIA, PHQ-9, GAD-7)', 'Your life narrative (open-ended texts)', 'Payment data (processed securely via PayPal, we do not store card data)', 'Technical data (IP, browser, operating system)'] },
        { title: '2. How We Use Data', content: 'We use your data to:', list: ['Generate your personal book', 'Improve website services', 'Send important notifications (with your consent)', 'Comply with legal requirements', 'Ensure website security'] },
        { title: '3. What We Don\'t Do', content: 'We do not:', list: ['Sell your data to third parties', 'Use your data to train general AI models', 'Share your data with advertisers', 'Store payment data (processed via PayPal only)'] },
        { title: '4. Data Protection', content: 'We take the following measures to protect your data:', list: ['Encryption of all sensitive data (AES-256)', 'Password encryption (bcrypt)', 'Data storage on secure servers (SSL/TLS)', 'Access limited to authorized personnel', 'Daily encrypted backups'] },
        { title: '5. Your Rights (GDPR)', content: 'You have the following rights:', list: ['Right to access: Request a copy of all your data', 'Right to rectification: Correct inaccurate data', 'Right to erasure (right to be forgotten): Delete all your data permanently', 'Right to data portability: Transfer your data to another service', 'Right to object: Object to processing of your data', 'Right to restrict processing: Restrict use of your data'] },
        { title: '6. Data Retention Period', content: 'We retain your data as long as your account is active. Upon account deletion:', list: ['All data is permanently deleted within 30 days', 'Backups are kept for 90 days then deleted', 'Crisis logs are kept for one year for legal reasons'] },
        { title: '7. Cookies', content: 'We use cookies for:', list: ['Login and session maintenance', 'Saving language preferences', 'Website performance analysis (Google Analytics - optional)'] },
        { title: '8. Policy Changes', content: 'We may update this privacy policy from time to time. We will notify you of material changes via email or website notification.' }
      ],
      contact: 'For any privacy inquiries, contact us at: privacy@personalbook.com',
      back: 'Back to Home',
      disclaimer: 'Disclaimer'
    }
  };

  const c = content[lang];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <SEO title={c.title} description={c.sections[0].content} path="/legal/privacy" />
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
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t"><p className="text-sm text-gray-600">{c.contact}</p></div>
          <div className="mt-6 flex gap-4">
            <Link to="/" className="text-blue-600 hover:text-blue-800 underline">{c.back}</Link>
            <Link to="/legal/disclaimer" className="text-blue-600 hover:text-blue-800 underline">{c.disclaimer}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

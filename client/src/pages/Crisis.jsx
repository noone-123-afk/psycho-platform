import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { hasAuthToken } from '../utils/auth';

const CrisisPage = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [error, setError] = useState('');

  async function submitContactRequest(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await axios.post('/api/crisis-reports', { consent: true });
      setRequestSent(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || (
        isArabic ? 'تعذر إرسال الطلب الآن. حاول مجدداً لاحقاً.' : 'Unable to send your request right now. Please try again later.'
      ));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      style={{
        minHeight: '100vh',
        padding: '48px 16px',
        background: '#fff7ed',
        color: '#1f2937',
        fontFamily: isArabic ? '"Tajawal", sans-serif' : '"Segoe UI", sans-serif',
      }}
    >
      <section
        aria-labelledby="crisis-page-title"
        style={{
          width: 'min(100%, 680px)',
          margin: '0 auto',
          padding: 'clamp(22px, 5vw, 36px)',
          border: '1px solid #fed7aa',
          borderRadius: '16px',
          background: '#fff',
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)',
          lineHeight: 1.8,
        }}
      >
        <h1 id="crisis-page-title" style={{ color: '#9a3412' }}>
          {t('crisisTitle')}
        </h1>
        <p>{t('crisisImmediateHelp')}</p>
        <p>{t('crisisTrustedPerson')}</p>
        <p>{t('crisisProfessionalHelp')}</p>

        <section
          aria-label={t('crisisDirectory')}
          style={{
            margin: '24px 0',
            padding: '20px',
            borderRadius: '12px',
            background: '#fff7ed',
          }}
        >
          <h2 style={{ marginTop: 0, color: '#9a3412' }}>
            {t('crisisDirectory')}
          </h2>
          <a
            href="https://findahelpline.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              padding: '12px 16px',
              borderRadius: '8px',
              background: '#1d4ed8',
              color: '#fff',
              textAlign: 'center',
              fontWeight: 700,
            }}
          >
            {t('crisisOpenDirectory')}
          </a>
        </section>

        <section
          aria-labelledby="crisis-contact-title"
          style={{
            margin: '24px 0',
            padding: '20px',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            background: '#f8fafc',
          }}
        >
          <h2 id="crisis-contact-title" style={{ marginTop: 0 }}>
            {isArabic ? 'طلب تواصل اختياري' : 'Optional contact request'}
          </h2>
          <p>
            {isArabic
              ? 'يمكنك طلب أن يتواصل معك فريق الدعم باستخدام بريد حسابك. هذا الطلب ليس خدمة طوارئ ولا يضمن الرد أو زمنه.'
              : 'You may ask the support team to contact you using your account email. This is not an emergency service and does not guarantee a response or response time.'}
          </p>
          <p style={{ marginTop: '10px', color: '#475569', fontSize: '0.92rem' }}>
            {isArabic
              ? 'نحفظ طلب التواصل وحالته فقط؛ لا نحفظ نص إجاباتك أو نتائج الفحص الصحي. تُحذف بيانات الطلب وسجل مراجعته بعد 90 يوماً.'
              : 'Only the contact request and its status are stored; your answers and health-screening results are not. The request and its review log are deleted after 90 days.'}
          </p>
          {!hasAuthToken() ? (
            <Link
              to="/account?mode=login&next=%2Fcrisis"
              style={{ display: 'inline-block', marginTop: '16px', color: '#1d4ed8', fontWeight: 700 }}
            >
              {isArabic ? 'سجّل الدخول لطلب التواصل' : 'Sign in to request contact'}
            </Link>
          ) : requestSent ? (
            <p role="status" style={{ marginTop: '16px', color: '#166534', fontWeight: 700 }}>
              {isArabic ? 'تم إرسال طلبك. لا يعني ذلك ضمان التواصل.' : 'Your request was submitted. This does not guarantee follow-up.'}
            </p>
          ) : (
            <form onSubmit={submitContactRequest} style={{ marginTop: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  required
                />
                <span>
                  {isArabic
                    ? 'أوافق على حفظ طلب التواصل وربطه بحسابي، ليتمكن فريق الدعم المخوّل من رؤية اسمي وبريدي الإلكتروني.'
                    : 'I agree to store this contact request linked to my account so authorized support staff can see my name and email address.'}
                </span>
              </label>
              {error && <p role="alert" style={{ marginTop: '10px', color: '#b91c1c' }}>{error}</p>}
              <button
                type="submit"
                disabled={!consent || submitting}
                style={{
                  marginTop: '14px',
                  padding: '10px 16px',
                  border: 0,
                  borderRadius: '8px',
                  background: !consent || submitting ? '#94a3b8' : '#1d4ed8',
                  color: '#fff',
                  font: 'inherit',
                  fontWeight: 700,
                  cursor: !consent || submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting
                  ? (isArabic ? 'جارٍ الإرسال…' : 'Sending…')
                  : (isArabic ? 'إرسال طلب التواصل' : 'Send contact request')}
              </button>
            </form>
          )}
        </section>

        <p role="note" style={{ color: '#64748b', fontSize: '0.92rem' }}>
          {t('crisisDisclaimer')}
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '16px',
            marginTop: '24px',
          }}
        >
          <Link to="/">{t('crisisHome')}</Link>
          <Link to="/assessment">{t('crisisAssessment')}</Link>
        </div>
      </section>
    </main>
  );
};

export default CrisisPage;

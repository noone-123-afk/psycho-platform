import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CrisisPage = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

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

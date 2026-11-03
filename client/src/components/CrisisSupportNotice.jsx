import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CrisisSupportNotice = ({ onClose }) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflowY: 'auto',
        padding: '20px',
        background: 'rgba(15, 23, 42, 0.72)',
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="crisis-notice-title"
        dir={isArabic ? 'rtl' : 'ltr'}
        style={{
          width: 'min(100%, 620px)',
          padding: 'clamp(22px, 5vw, 36px)',
          border: '2px solid #b45309',
          borderRadius: '16px',
          background: '#fffbeb',
          color: '#1f2937',
          lineHeight: 1.8,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
        }}
      >
        <h2 id="crisis-notice-title" style={{ color: '#92400e' }}>
          {t('crisisSignalTitle')}
        </h2>
        <p>{t('crisisSignalMessage')}</p>
        <p>{t('crisisImmediateHelp')}</p>
        <Link
          to="/crisis"
          style={{
            display: 'block',
            margin: '20px 0',
            padding: '12px 16px',
            borderRadius: '8px',
            background: '#1d4ed8',
            color: '#fff',
            textAlign: 'center',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          {t('crisisOpenResources')}
        </Link>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            padding: '11px 16px',
            border: 0,
            borderRadius: '8px',
            background: '#e5e7eb',
            color: '#111827',
            font: 'inherit',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {t('crisisCloseAndReview')}
        </button>
      </section>
    </div>
  );
};

export default CrisisSupportNotice;

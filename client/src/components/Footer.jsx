import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <footer className="bg-white border-t border-gray-200 py-8 mt-12">
      <div className="max-w-6xl mx-auto px-4 text-center text-gray-600">
        <p className="mb-4">{t('footer')}</p>
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <Link to="/legal/privacy" className="hover:text-blue-600 underline">{t('privacy', { defaultValue: 'Privacy Policy' })}</Link>
          <Link to="/legal/disclaimer" className="hover:text-blue-600 underline">{t('disclaimer', { defaultValue: 'Disclaimer' })}</Link>
          <a href="mailto:support@personalbook.com" className="hover:text-blue-600 underline">{t('contact', { defaultValue: 'Contact' })}</a>
        </div>
      </div>
    </footer>
  );
}

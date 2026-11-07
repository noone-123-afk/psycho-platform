import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

export default function SEO({ title, description, path }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const siteUrl = import.meta.env.VITE_FRONTEND_URL || 'https://your-domain.com';
  const url = `${siteUrl}${path || ''}`;

  return (
    <Helmet>
      <title>{title} | بوصلة النفس</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <html lang={lang} />
    </Helmet>
  );
}

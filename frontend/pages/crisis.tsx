import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import type { CrisisSupport } from '../components/CrisisModal';
import { useLanguage } from '../context/LanguageContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const GENERIC_SUPPORT: CrisisSupport = {
  name: 'Directory for finding local support helplines',
  alternative: '',
  website: 'https://findahelpline.com/',
  phone_number: null,
  requires_local_verification: true,
};

function getSafeHttpsUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

const pageText = {
  ar: {
    title: 'نحن هنا من أجلك',
    intro:
      'إذا كنت في خطر فوري، اتصل بخدمات الطوارئ المحلية أو توجّه إلى أقرب قسم طوارئ.',
    directory: 'ابحث عن خط دعم محلي',
    trustedPerson: 'تواصل الآن مع شخص تثق به، واطلب منه البقاء معك إن أمكن.',
    professional: 'يمكنك أيضاً التواصل مع مختص صحي مرخص.',
    loading: 'جارٍ تحميل معلومات الدعم...',
    unavailable:
      'تعذر تحميل الدليل الآن. يمكنك فتح دليل الدعم مباشرة أو التواصل مع خدمات الطوارئ المحلية.',
    home: 'العودة إلى الصفحة الرئيسية',
  },
  en: {
    title: 'We are here for you',
    intro:
      'If you are in immediate danger, contact local emergency services or go to the nearest emergency department.',
    directory: 'Find a local support helpline',
    trustedPerson:
      'Contact someone you trust now, and ask them to stay with you if possible.',
    professional: 'You can also contact a licensed health professional.',
    loading: 'Loading support information...',
    unavailable:
      'The directory could not be loaded. You can open it directly or contact local emergency services.',
    home: 'Back to the home page',
  },
};

export default function CrisisPage() {
  const { lang } = useLanguage();
  const text = pageText[lang];
  const [support, setSupport] = useState<CrisisSupport | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const safeWebsite = support ? getSafeHttpsUrl(support.website) : null;

  useEffect(() => {
    let active = true;

    axios
      .get<CrisisSupport>(`${API_URL}/api/crisis/helplines/DEFAULT`, {
        params: { lang },
      })
      .then((response) => {
        if (active) setSupport(response.data);
      })
      .catch(() => {
        if (active) {
          setSupport({
            ...GENERIC_SUPPORT,
            name:
              lang === 'ar'
                ? 'دليل للعثور على خطوط دعم محلية'
                : GENERIC_SUPPORT.name,
            alternative:
              lang === 'ar'
                ? 'إذا كان هناك خطر فوري، اتصل بخدمات الطوارئ المحلية أو توجّه إلى أقرب قسم طوارئ.'
                : 'If there is immediate danger, contact local emergency services or go to the nearest emergency department.',
          });
          setLoadError(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [lang]);

  return (
    <main
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      style={{
        minHeight: 'calc(100vh - 65px)',
        padding: '48px 16px',
        background: '#fff7ed',
        color: '#1f2937',
        fontFamily: 'Arial, sans-serif',
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
          {text.title}
        </h1>
        <p>{text.intro}</p>
        <p>{text.trustedPerson}</p>
        <p>{text.professional}</p>

        {loading && <p role="status">{text.loading}</p>}
        {loadError && (
          <p role="status" style={{ color: '#9a3412' }}>
            {text.unavailable}
          </p>
        )}

        {support && (
          <section
            aria-label={support.name}
            style={{
              margin: '24px 0',
              padding: '20px',
              borderRadius: '12px',
              background: '#fff7ed',
            }}
          >
            <h2 style={{ marginTop: 0, color: '#9a3412' }}>{support.name}</h2>
            {support.alternative && <p>{support.alternative}</p>}
            {safeWebsite && (
              <a
                href={safeWebsite}
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
                {text.directory}
              </a>
            )}
          </section>
        )}

        <Link
          href="/"
          style={{ display: 'block', marginTop: '24px', textAlign: 'center' }}
        >
          {text.home}
        </Link>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          {lang === 'ar'
            ? 'هذا الدليل لا يقيّم مستوى الخطر ولا يغني عن المساعدة المهنية.'
            : 'This directory does not assess risk and is not a substitute for professional help.'}
        </p>
      </section>
    </main>
  );
}

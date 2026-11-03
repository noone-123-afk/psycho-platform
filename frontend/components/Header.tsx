import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';

export default function Header() {
  const { lang, setLang } = useLanguage();
  const isArabic = lang === 'ar';

  return (
    <header
      style={{
        padding: '14px 20px',
        borderBottom: '1px solid #e2e8f0',
        background: '#fff',
      }}
    >
      <nav
        aria-label={isArabic ? 'التنقل الرئيسي' : 'Main navigation'}
        dir={isArabic ? 'rtl' : 'ltr'}
        style={{
          width: 'min(100%, 1120px)',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <Link
          href="/"
          style={{
            color: '#2563eb',
            fontSize: '1.25rem',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          {isArabic ? 'كتابي الشخصي' : 'My Personal Book'}
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            href="/crisis"
            style={{
              padding: '9px 14px',
              borderRadius: '8px',
              background: '#b91c1c',
              color: '#fff',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            {isArabic ? '🆘 مساعدة طارئة' : '🆘 Emergency support'}
          </Link>
          <label>
            <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
              {isArabic ? 'اللغة' : 'Language'}
            </span>
            <select
              value={lang}
              onChange={(event) => setLang(event.target.value as 'ar' | 'en')}
              style={{
                padding: '8px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                background: '#fff',
              }}
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>
      </nav>
    </header>
  );
}

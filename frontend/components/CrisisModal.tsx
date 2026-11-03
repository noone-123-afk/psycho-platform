import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';

export interface CrisisSupport {
  name: string;
  alternative: string;
  website: string;
  phone_number?: string | null;
  requires_local_verification?: boolean;
}

interface CrisisModalProps {
  message: string;
  support: CrisisSupport;
  onClose?: () => void;
}

const copy = {
  ar: {
    title: 'قد تكون بحاجة إلى دعم',
    subtitle:
      'هذه إشارة لغوية آلية وليست تقييماً سريرياً. إذا كنت في خطر فوري، اتصل بخدمات الطوارئ المحلية.',
    directory: 'دليل للعثور على دعم محلي',
    fullPage: 'عرض جميع موارد الدعم',
    alternative: 'معلومات إضافية',
    close: 'إغلاق',
    note: 'إذا أمكن، تواصل الآن مع شخص تثق به أو مختص صحي مرخص.',
    direction: 'rtl',
  },
  en: {
    title: 'You may need support',
    subtitle:
      'This is an automated language signal, not a clinical assessment. If you are in immediate danger, contact local emergency services.',
    directory: 'Find local support',
    fullPage: 'View all support resources',
    alternative: 'Additional information',
    close: 'Close',
    note: 'If possible, contact someone you trust or a licensed health professional now.',
    direction: 'ltr',
  },
} as const;

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflowY: 'auto' as const,
    padding: '20px',
    background: 'rgba(15, 23, 42, 0.72)',
  },
  dialog: {
    width: 'min(100%, 620px)',
    maxHeight: 'calc(100vh - 40px)',
    overflowY: 'auto' as const,
    padding: 'clamp(22px, 5vw, 36px)',
    border: '2px solid #b45309',
    borderRadius: '16px',
    background: '#fffbeb',
    color: '#1f2937',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
    lineHeight: 1.8,
  },
  panel: {
    margin: '20px 0',
    padding: '18px',
    borderRadius: '12px',
    background: '#fff',
  },
  link: {
    display: 'block',
    marginTop: '14px',
    padding: '12px 16px',
    borderRadius: '8px',
    background: '#1d4ed8',
    color: '#fff',
    textAlign: 'center' as const,
    fontWeight: 700,
    textDecoration: 'none',
  },
  close: {
    width: '100%',
    padding: '11px 16px',
    border: 0,
    borderRadius: '8px',
    background: '#e5e7eb',
    color: '#111827',
    font: 'inherit',
    fontWeight: 700,
    cursor: 'pointer',
  },
};

function getSafeHttpsUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export default function CrisisModal({
  message,
  support,
  onClose,
}: CrisisModalProps) {
  const { lang } = useLanguage();
  const text = copy[lang];
  const dialogRef = useRef<HTMLDivElement>(null);
  const safeWebsite = getSafeHttpsUrl(support.website);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialogRef.current?.focus();
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div style={styles.overlay}>
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="crisis-dialog-title"
        aria-describedby="crisis-dialog-description"
        tabIndex={-1}
        dir={text.direction}
        style={styles.dialog}
      >
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div aria-hidden="true" style={{ fontSize: '42px' }}>
            !
          </div>
          <h2
            id="crisis-dialog-title"
            style={{ margin: '8px 0', color: '#92400e', fontSize: '26px' }}
          >
            {text.title}
          </h2>
          <p id="crisis-dialog-description" style={{ margin: 0 }}>
            {text.subtitle}
          </p>
        </div>

        <section style={styles.panel} aria-label={text.title}>
          <p style={{ marginTop: 0 }}>{message}</p>
          <p style={{ marginBottom: 0, color: '#475569' }}>{text.note}</p>
        </section>

        <section style={styles.panel}>
          <h3 style={{ marginTop: 0 }}>{support.name}</h3>
          {support.alternative && <p>{support.alternative}</p>}
          {safeWebsite && (
            <a
              href={safeWebsite}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
            >
              {text.directory}
            </a>
          )}
          {support.requires_local_verification && (
            <p style={{ marginBottom: 0, fontSize: '0.9rem', color: '#64748b' }}>
              {text.alternative}
            </p>
          )}
        </section>

        <Link href="/crisis" style={styles.link}>
          {text.fullPage}
        </Link>

        {onClose && (
          <button type="button" onClick={onClose} style={styles.close}>
            {text.close}
          </button>
        )}
      </div>
    </div>
  );
}

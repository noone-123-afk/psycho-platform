import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import CrisisModal, { type CrisisSupport } from '../components/CrisisModal';
import { useLanguage } from '../context/LanguageContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type AssessmentStep = 'consent' | 'demographics' | 'preview';

interface DemographicData {
  age: string;
  gender: string;
  education_level: string;
  marital_status: string;
  occupation: string;
  family_environment: string;
  social_context: string;
  major_life_events: string;
  current_challenges: string;
  future_aspirations: string;
}

const initialDemographics: DemographicData = {
  age: '',
  gender: '',
  education_level: '',
  marital_status: '',
  occupation: '',
  family_environment: '',
  social_context: '',
  major_life_events: '',
  current_challenges: '',
  future_aspirations: '',
};

function getFallbackCrisisSupport(lang: 'ar' | 'en'): CrisisSupport {
  return {
    name:
      lang === 'ar'
        ? 'دليل للعثور على خطوط دعم محلية'
        : 'Directory for finding local support helplines',
    alternative:
      lang === 'ar'
        ? 'إذا كان هناك خطر فوري، اتصل بخدمات الطوارئ المحلية أو توجّه إلى أقرب قسم طوارئ.'
        : 'If there is immediate danger, contact local emergency services or go to the nearest emergency department.',
    website: 'https://findahelpline.com/',
    phone_number: null,
    requires_local_verification: true,
  };
}

const cardStyle = {
  width: 'min(100% - 32px, 720px)',
  margin: '0 auto',
  padding: '32px',
  border: '1px solid #e5e7eb',
  borderRadius: '16px',
  background: '#fff',
  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)',
} as const;

const fieldStyle = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box' as const,
  marginTop: '6px',
  padding: '11px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  font: 'inherit',
};

const labelStyle = {
  display: 'block',
  marginBottom: '18px',
  color: '#334155',
  fontWeight: 600,
} as const;

const buttonStyle = {
  padding: '11px 22px',
  border: 0,
  borderRadius: '8px',
  background: '#2563eb',
  color: '#fff',
  font: 'inherit',
  fontWeight: 700,
  cursor: 'pointer',
} as const;

export default function Assessment() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [step, setStep] = useState<AssessmentStep>('consent');
  const [token, setToken] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  const [demographics, setDemographics] =
    useState<DemographicData>(initialDemographics);
  const [errorMessage, setErrorMessage] = useState('');
  const [crisisSignal, setCrisisSignal] = useState<{
    message: string;
    support: CrisisSupport;
  } | null>(null);

  useEffect(() => {
    const storedToken = window.localStorage.getItem('token');
    if (!storedToken) {
      void router.replace('/login');
      return;
    }

    setToken(storedToken);
    setAuthChecked(true);
  }, [router]);

  const submit = async (
    endpoint: string,
    data: Record<string, boolean | number | string>,
    nextStep: AssessmentStep,
  ) => {
    if (!token) return;

    setLoading(true);
    setErrorMessage('');
    setCrisisSignal(null);
    try {
      const response = await axios.post<{
        status?: string;
        message?: string;
        support?: CrisisSupport;
      }>(`${API_URL}${endpoint}?lang=${lang}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === 'potential_crisis_signal') {
        setCrisisSignal({
          message:
            response.data.message ||
            (lang === 'ar'
              ? 'تم رصد إشارة لغوية تستحق الانتباه. هذا ليس تقييماً سريرياً. إذا كنت في خطر فوري، اتصل بخدمات الطوارئ المحلية.'
              : 'A language signal that may need attention was detected. This is not a clinical assessment. If you are in immediate danger, contact local emergency services.'),
          support: response.data.support || getFallbackCrisisSupport(lang),
        });
        return;
      }
      setStep(nextStep);
    } catch (error: unknown) {
      const errorData = axios.isAxiosError<{
        detail?: string;
        status?: string;
        message?: string;
        support?: CrisisSupport;
      }>(error)
        ? error.response?.data
        : undefined;
      if (errorData?.status === 'potential_crisis_signal') {
        setCrisisSignal({
          message:
            errorData.message ||
            (lang === 'ar'
              ? 'تم رصد إشارة لغوية تستحق الانتباه. هذا ليس تقييماً سريرياً. إذا كنت في خطر فوري، اتصل بخدمات الطوارئ المحلية.'
              : 'A language signal that may need attention was detected. This is not a clinical assessment. If you are in immediate danger, contact local emergency services.'),
          support: errorData.support || getFallbackCrisisSupport(lang),
        });
        return;
      }
      setErrorMessage(
        errorData?.detail || 'تعذر حفظ البيانات. تحقق من اتصالك وحاول مرة أخرى.',
      );
    } finally {
      setLoading(false);
    }
  };

  const submitDemographics = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const age = Number(demographics.age);
    if (!Number.isInteger(age) || age < 0 || age > 120) {
      setErrorMessage('يرجى إدخال عمر صحيح بين 0 و120.');
      return;
    }

    const { age: _age, ...textFields } = demographics;
    if (Object.values(textFields).some((value) => !value.trim())) {
      setErrorMessage('يرجى إكمال الحقول المطلوبة قبل المتابعة.');
      return;
    }

    void submit(
      '/api/assessment/demographics',
      { ...textFields, age },
      'preview',
    );
  };

  if (!authChecked) {
    return (
      <main dir="rtl" style={{ padding: '64px 16px', textAlign: 'center' }}>
        جارٍ التحقق من تسجيل الدخول...
      </main>
    );
  }

  const progress =
    step === 'consent' ? 33 : step === 'demographics' ? 66 : 100;

  return (
    <main
      dir="rtl"
      style={{
        minHeight: '100vh',
        padding: '48px 0',
        background: '#f8fafc',
        color: '#0f172a',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div style={{ width: 'min(100% - 32px, 720px)', margin: '0 auto 24px' }}>
        <p style={{ margin: '0 0 8px', color: '#475569' }}>
          {step === 'consent'
            ? 'الخطوة 1 من 3: الموافقة'
            : step === 'demographics'
              ? 'الخطوة 2 من 3: البيانات الأساسية'
              : 'الخطوة 3 من 3: معاينة التقييم'}
        </p>
        <div
          role="progressbar"
          aria-label="تقدم التقييم"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          style={{ height: '8px', borderRadius: '8px', background: '#e2e8f0' }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              borderRadius: '8px',
              background: '#2563eb',
              transition: 'width 200ms ease',
            }}
          />
        </div>
      </div>

      <section style={cardStyle}>
        {step === 'consent' && (
          <>
            <h1 style={{ marginTop: 0 }}>الموافقة المستنيرة</h1>
            <p style={{ lineHeight: 1.8, color: '#475569' }}>
              هذا التقييم مخصص للتأمل والتطوير الذاتي، وليس تشخيصاً أو بديلاً
              عن الرعاية النفسية. ستُرسل البيانات التي تدخلها إلى خادم المنصة
              لحفظ التقييم. راجع سياسة الخصوصية قبل المتابعة، ولا تدخل معلومات
              لا ترغب في حفظها. يجب نشر سياسة الخصوصية والتحقق من تفاصيلها
              قبل إتاحة هذه الصفحة للمستخدمين.
            </p>
            <p style={{ lineHeight: 1.8, color: '#475569' }}>
              إذا كنت تمر بضيق شديد أو حالة طارئة، تواصل مع مختص مرخص أو خدمات
              الطوارئ المحلية.
            </p>
            <label
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                margin: '24px 0',
              }}
            >
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
              />
              قرأت التنبيه وأوافق على إرسال بيانات التقييم لحفظها.
            </label>
            <button
              type="button"
              onClick={() =>
                void submit(
                  '/api/assessment/consent',
                  { consent_signed: true },
                  'demographics',
                )
              }
              disabled={!consent || loading}
              style={{
                ...buttonStyle,
                opacity: !consent || loading ? 0.55 : 1,
              }}
            >
              {loading ? 'جارٍ الحفظ...' : 'متابعة'}
            </button>
          </>
        )}

        {step === 'demographics' && (
          <>
            <h1 style={{ marginTop: 0 }}>البيانات الأساسية</h1>
            <p style={{ marginBottom: '24px', color: '#475569' }}>
              الحقول مطلوبة لحفظ هذه المرحلة. أجب بالقدر الذي ترتاح لمشاركته.
            </p>
            <form onSubmit={submitDemographics}>
              <label style={labelStyle}>
                العمر
                <input
                  type="number"
                  min="0"
                  max="120"
                  required
                  value={demographics.age}
                  onChange={(event) =>
                    setDemographics({
                      ...demographics,
                      age: event.target.value,
                    })
                  }
                  style={fieldStyle}
                />
              </label>
              {(
                [
                  ['gender', 'الجنس'],
                  ['education_level', 'المستوى التعليمي'],
                  ['marital_status', 'الحالة الاجتماعية'],
                  ['occupation', 'العمل أو الدراسة'],
                ] as const
              ).map(([field, label]) => (
                <label key={field} style={labelStyle}>
                  {label}
                  <input
                    required
                    maxLength={field === 'gender' ? 20 : field === 'education_level' ? 50 : field === 'marital_status' ? 30 : 100}
                    value={demographics[field]}
                    onChange={(event) =>
                      setDemographics({
                        ...demographics,
                        [field]: event.target.value,
                      })
                    }
                    style={fieldStyle}
                  />
                </label>
              ))}
              {(
                [
                  ['family_environment', 'صف بيئة نشأتك'],
                  ['social_context', 'صف بيئتك الاجتماعية الحالية'],
                  ['major_life_events', 'أحداث مهمة في حياتك'],
                  ['current_challenges', 'ما التحديات التي تواجهها حالياً؟'],
                  ['future_aspirations', 'ما الذي تطمح إلى تحقيقه؟'],
                ] as const
              ).map(([field, label]) => (
                <label key={field} style={labelStyle}>
                  {label}
                  <textarea
                    required
                    maxLength={10000}
                    rows={3}
                    value={demographics[field]}
                    onChange={(event) =>
                      setDemographics({
                        ...demographics,
                        [field]: event.target.value,
                      })
                    }
                    style={{ ...fieldStyle, resize: 'vertical' }}
                  />
                </label>
              ))}
              <button type="submit" disabled={loading} style={buttonStyle}>
                {loading ? 'جارٍ الحفظ...' : 'حفظ ومتابعة'}
              </button>
            </form>
          </>
        )}

        {step === 'preview' && (
          <>
            <h1 style={{ marginTop: 0 }}>معاينة التقييم</h1>
            <p style={{ lineHeight: 1.8, color: '#475569' }}>
              المثال التالي للعرض فقط. لا تُحفظ منه درجات ولا يُرسل إلى الخادم؛
              فالاستبيان الكامل وطريقة احتساب نتائجه لم يُجهزا بعد.
            </p>
            <fieldset
              style={{
                margin: '24px 0',
                padding: '20px',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
              }}
            >
              <legend>سؤال تجريبي</legend>
              <p>أشعر بالراحة في التجمعات الكبيرة.</p>
              <div
                aria-label="خيارات نموذجية غير محفوظة"
                style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}
              >
                {['لا أوافق إطلاقاً', 'لا أوافق', 'محايد', 'أوافق', 'أوافق بشدة'].map(
                  (option) => (
                    <span
                      key={option}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: '#f1f5f9',
                        color: '#475569',
                      }}
                    >
                      {option}
                    </span>
                  ),
                )}
              </div>
            </fieldset>
            <p
              role="note"
              style={{
                padding: '14px',
                borderRadius: '8px',
                background: '#fffbeb',
                color: '#854d0e',
                lineHeight: 1.8,
              }}
            >
              لن نرسل إجابات افتراضية أو فحصاً صحياً غير مكتمل. أكمل إعداد
              الأسئلة والتحقق منها قبل تفعيل التقييم.
            </p>
          </>
        )}

        {errorMessage && (
          <p role="alert" style={{ marginTop: '20px', color: '#b91c1c' }}>
            {errorMessage}
          </p>
        )}
      </section>
        {crisisSignal && (
          <CrisisModal
            message={crisisSignal.message}
            support={crisisSignal.support}
            onClose={() => void router.push('/crisis')}
          />
        )}
    </main>
  );
}

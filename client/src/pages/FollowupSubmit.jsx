import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clearAuthToken, hasAuthToken } from '../utils/auth';
import './Followup.css';

const copy = {
  ar: {
    title: 'التقييم الدوري',
    subtitle: 'تأمل في تجربتك منذ التقييم السابق.',
    back: 'العودة للمتابعات',
    login: 'سجّل الدخول لإرسال تقييمك.',
    goLogin: 'تسجيل الدخول',
    period: 'رقم فترة المتابعة',
    phq9: 'مجموع PHQ‑9 الذي أدخلته بنفسك',
    gad7: 'مجموع GAD‑7 الذي أدخلته بنفسك',
    scoreNote: 'أدخل المجموع الذي حسبته وفق أداتك؛ هذه الصفحة لا تحسب إجابات البنود ولا تقدم تشخيصاً.',
    screening: 'الدرجات المبلغ عنها ذاتياً',
    selfRating: 'التقييم الذاتي (من 1 إلى 10)',
    awareness: 'الوعي الذاتي',
    regulation: 'التنظيم العاطفي',
    relationships: 'جودة العلاقات',
    productivity: 'الإنتاجية',
    satisfaction: 'الرضا العام',
    notes: 'ملاحظاتك (اختيارية)',
    progress: 'ما الذي تحقق منذ التقييم السابق؟',
    challenges: 'ما التحديات التي واجهتها؟',
    achievements: 'ما إنجازاتك؟',
    goals: 'ما أهدافك للفترة القادمة؟',
    consent: 'أوافق على حفظ الدرجات والملاحظات التي أرسلها وربطها بحسابي لمدة سنة من اكتمال هذا التقييم. أفهم أن هذه البيانات ليست تشخيصاً أو خدمة طوارئ.',
    privacy: 'لا نرسل هذه المعلومات إلا عند الإرسال بعد الموافقة. يمكنك ترك حقول الملاحظات فارغة. تُحذف البيانات بعد سنة من إكمال التقييم.',
    submit: 'إرسال التقييم',
    submitting: 'جارٍ الإرسال…',
    success: 'تم إرسال تقييم المتابعة.',
    error: 'تعذر إرسال التقييم.',
    retry: 'إعادة المحاولة',
    notAvailable: 'لم يحن موعد هذا التقييم بعد أو لا يوجد تقييم مجدول صالح.',
    loading: 'جارٍ التحقق من موعد المتابعة…',
    required: 'الموافقة مطلوبة قبل حفظ الدرجات والملاحظات.'
  },
  en: {
    title: 'Follow-up Assessment',
    subtitle: 'Reflect on your experience since your previous assessment.',
    back: 'Back to follow-ups',
    login: 'Sign in to submit your follow-up.',
    goLogin: 'Sign in',
    period: 'Follow-up period',
    phq9: 'Self-reported PHQ‑9 total',
    gad7: 'Self-reported GAD‑7 total',
    scoreNote: 'Enter totals you have calculated using your own instrument; this page does not score item responses or provide a diagnosis.',
    screening: 'Self-reported scores',
    selfRating: 'Self-rating (1 to 10)',
    awareness: 'Self-awareness',
    regulation: 'Emotional regulation',
    relationships: 'Relationship quality',
    productivity: 'Productivity',
    satisfaction: 'Overall satisfaction',
    notes: 'Your notes (optional)',
    progress: 'What have you achieved since the previous assessment?',
    challenges: 'What challenges did you face?',
    achievements: 'What are your achievements?',
    goals: 'What are your goals for the next period?',
    consent: 'I consent to storing the scores and notes I submit, linked to my account, for one year after this assessment is completed. I understand this is not a diagnosis or emergency service.',
    privacy: 'This information is sent only when you submit after consenting. Notes are optional. Data is deleted one year after completing the assessment.',
    submit: 'Submit assessment',
    submitting: 'Submitting…',
    success: 'Your follow-up was submitted.',
    error: 'Unable to submit your follow-up.',
    retry: 'Try again',
    notAvailable: 'This follow-up is not due yet or no valid scheduled assessment exists.',
    loading: 'Checking follow-up availability…',
    required: 'Consent is required before scores and notes can be saved.'
  }
};

const scoreFields = [
  { field: 'self_rating_awareness', key: 'awareness' },
  { field: 'self_rating_regulation', key: 'regulation' },
  { field: 'self_rating_relationships', key: 'relationships' },
  { field: 'self_rating_productivity', key: 'productivity' },
  { field: 'self_rating_satisfaction', key: 'satisfaction' }
];

const noteFields = [
  { field: 'progress_notes', key: 'progress' },
  { field: 'challenges_faced', key: 'challenges' },
  { field: 'achievements', key: 'achievements' },
  { field: 'goals_for_next_period', key: 'goals' }
];

const initialForm = {
  phq9_score: 0,
  gad7_score: 0,
  self_rating_awareness: 5,
  self_rating_regulation: 5,
  self_rating_relationships: 5,
  self_rating_productivity: 5,
  self_rating_satisfaction: 5,
  progress_notes: '',
  challenges_faced: '',
  achievements: '',
  goals_for_next_period: ''
};

export default function FollowupSubmit() {
  const { i18n } = useTranslation();
  const language = i18n.language === 'en' ? 'en' : 'ar';
  const text = copy[language];
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const number = Number(searchParams.get('number'));
  const [formData, setFormData] = useState(initialForm);
  const [consent, setConsent] = useState(false);
  const [available, setAvailable] = useState(false);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!hasAuthToken()) {
      setChecking(false);
      return undefined;
    }
    let active = true;
    async function checkAvailability() {
      setChecking(true);
      setError('');
      try {
        const response = await axios.get('/api/followup/my-followups');
        if (!active) return;
        const match = response.data.followups.find((item) =>
          item.followup_number === number && item.status === 'scheduled' && item.available
        );
        setAvailable(Boolean(match));
        if (!match) setError(text.notAvailable);
      } catch (requestError) {
        if (!active) return;
        if (requestError.response?.status === 401) {
          clearAuthToken();
          setAvailable(false);
        }
        setError(requestError.response?.data?.message || text.error);
      } finally {
        if (active) setChecking(false);
      }
    }
    checkAvailability();
    return () => { active = false; };
  }, [number, reload, text.error, text.notAvailable]);

  function updateField(field, value) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!consent) {
      setError(text.required);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await axios.post('/api/followup/submit', {
        ...formData,
        followup_number: number,
        consent: true
      });
      navigate('/followup', { replace: true, state: { followupSubmitted: true } });
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        clearAuthToken();
        navigate('/account?mode=login&next=%2Ffollowup', { replace: true });
        return;
      }
      setError(requestError.response?.data?.message || text.error);
    } finally {
      setSubmitting(false);
    }
  }

  if (!hasAuthToken()) {
    return (
      <main className="followup-page" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="followup-shell"><section className="followup-empty">
          <p>{text.login}</p>
          <Link className="followup-button" to="/account?mode=login&next=%2Ffollowup">{text.goLogin}</Link>
        </section></div>
      </main>
    );
  }

  return (
    <main className="followup-page" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="followup-shell">
        <header className="followup-header">
          <Link to="/followup">{text.back}</Link>
          <h1>{text.title} #{number}</h1>
          <p>{text.subtitle}</p>
          <p className="followup-warning">{text.scoreNote}</p>
          <p className="followup-muted">{text.privacy}</p>
        </header>

        {checking ? <p className="followup-empty">{text.loading}</p> : error && !available ? (
          <section className="followup-empty">
            <p className="followup-error" role="alert">{error}</p>
            <button type="button" className="followup-secondary" onClick={() => setReload((value) => value + 1)}>{text.retry}</button>
          </section>
        ) : available && (
          <form onSubmit={handleSubmit}>
            <section className="followup-section">
              <h2>{text.screening}</h2>
              <div className="followup-score-grid">
                <label>{text.phq9} (0–27)
                  <input type="number" min="0" max="27" step="1" required value={formData.phq9_score} onChange={(event) => updateField('phq9_score', Number(event.target.value))} />
                </label>
                <label>{text.gad7} (0–21)
                  <input type="number" min="0" max="21" step="1" required value={formData.gad7_score} onChange={(event) => updateField('gad7_score', Number(event.target.value))} />
                </label>
              </div>
            </section>

            <section className="followup-section">
              <h2>{text.selfRating}</h2>
              <div className="followup-rating-list">
                {scoreFields.map(({ field, key }) => (
                  <label className="followup-rating" key={field}>
                    {text[key]}: {formData[field]}
                    <input type="range" min="1" max="10" step="1" value={formData[field]} onChange={(event) => updateField(field, Number(event.target.value))} />
                    <span className="followup-rating-scale"><span>1</span><span>10</span></span>
                  </label>
                ))}
              </div>
            </section>

            <section className="followup-section">
              <h2>{text.notes}</h2>
              <div className="followup-note-list">
                {noteFields.map(({ field, key }) => (
                  <label key={field}>{text[key]}
                    <textarea maxLength={2000} value={formData[field]} onChange={(event) => updateField(field, event.target.value)} />
                  </label>
                ))}
              </div>
            </section>

            <label className="followup-consent">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required />
              <span>{text.consent}</span>
            </label>
            {error && <p className="followup-error" role="alert">{error}</p>}
            <div className="followup-page-actions">
              <button type="submit" disabled={submitting || !consent}>{submitting ? text.submitting : text.submit}</button>
              <Link to="/followup" className="followup-button followup-secondary">{text.back}</Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

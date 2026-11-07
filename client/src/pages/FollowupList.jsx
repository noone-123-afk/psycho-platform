import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clearAuthToken, hasAuthToken } from '../utils/auth';
import './Followup.css';

const copy = {
  ar: {
    title: 'التقييمات الدورية',
    subtitle: 'تابع تقدمك بعد 30 و60 و90 يوماً من التقييم الفردي.',
    progress: 'ملخص التقدم',
    back: 'الرئيسية',
    logout: 'تسجيل الخروج',
    followup: 'متابعة',
    days: 'يوماً',
    scheduled: 'مجدول',
    completed: 'مكتمل',
    missed: 'فائت',
    start: 'ابدأ التقييم',
    view: 'عرض النتائج',
    notYet: 'يُتاح في',
    noFollowups: 'لا توجد متابعات مجدولة حالياً. ستظهر المتابعة بعد إكمال تقييم فردي.',
    loading: 'جارٍ تحميل المتابعات…',
    error: 'تعذر تحميل المتابعات.',
    retry: 'إعادة المحاولة',
    login: 'سجّل الدخول للاطلاع على متابعاتك.',
    goLogin: 'تسجيل الدخول',
    accessError: 'تعذر التحقق من الحساب.',
    privacy: 'تُحفظ الدرجات والملاحظات فقط بعد موافقتك، وتُحذف بيانات المتابعة بعد سنة.'
  },
  en: {
    title: 'Follow-up Assessments',
    subtitle: 'Track your progress 30, 60, and 90 days after an individual assessment.',
    progress: 'Progress summary',
    back: 'Home',
    logout: 'Log out',
    followup: 'Follow-up',
    days: 'days',
    scheduled: 'Scheduled',
    completed: 'Completed',
    missed: 'Missed',
    start: 'Start assessment',
    view: 'View results',
    notYet: 'Available on',
    noFollowups: 'No follow-ups are scheduled. They will appear after you complete an individual assessment.',
    loading: 'Loading follow-ups…',
    error: 'Unable to load follow-ups.',
    retry: 'Try again',
    login: 'Sign in to see your follow-ups.',
    goLogin: 'Sign in',
    accessError: 'Unable to verify your account.',
    privacy: 'Scores and notes are stored only with your consent; follow-up data is deleted after one year.'
  }
};

function formatDate(value, locale) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));
}

export default function FollowupList() {
  const { i18n } = useTranslation();
  const language = i18n.language === 'en' ? 'en' : 'ar';
  const text = copy[language];
  const navigate = useNavigate();
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!hasAuthToken()) {
      setLoading(false);
      return undefined;
    }
    let active = true;
    async function fetchFollowups() {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get('/api/followup/my-followups');
        if (active) setFollowups(response.data.followups);
      } catch (requestError) {
        if (!active) return;
        if (requestError.response?.status === 401) {
          clearAuthToken();
          setFollowups([]);
        }
        setError(requestError.response?.data?.message || text.error);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchFollowups();
    return () => { active = false; };
  }, [reload, text.error]);

  function logout() {
    clearAuthToken();
    setFollowups([]);
    navigate('/account?mode=login&next=%2Ffollowup', { replace: true });
  }

  const locale = language === 'ar' ? 'ar' : 'en';

  return (
    <main className="followup-page" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="followup-shell">
        <header className="followup-header">
          <nav className="followup-nav">
            <Link to="/">{text.back}</Link>
            {hasAuthToken() && <button className="followup-secondary" type="button" onClick={logout}>{text.logout}</button>}
          </nav>
          <h1>{text.title}</h1>
          <p>{text.subtitle}</p>
        </header>

        {!hasAuthToken() ? (
          <section className="followup-empty">
            <p>{text.login}</p>
            <Link className="followup-button" to="/account?mode=login&next=%2Ffollowup">{text.goLogin}</Link>
          </section>
        ) : loading ? (
          <p className="followup-empty">{text.loading}</p>
        ) : error ? (
          <section className="followup-empty">
            <p className="followup-error" role="alert">{error}</p>
            <button type="button" onClick={() => setReload((value) => value + 1)}>{text.retry}</button>
          </section>
        ) : followups.length === 0 ? (
          <section className="followup-empty"><p>{text.noFollowups}</p></section>
        ) : (
          followups.map((followup) => (
            <article className="followup-card" key={followup.id}>
              <div className="followup-card-head">
                <div>
                  <h2>{text.followup} #{followup.followup_number}</h2>
                  <span className="followup-period">{followup.followup_number * 30} {text.days}</span>
                </div>
                <span className={`followup-status followup-status-${followup.status}`}>
                  {text[followup.status] || followup.status}
                </span>
              </div>
              <div className="followup-card-foot">
                <p className="followup-date">{text.notYet}: {formatDate(followup.scheduled_date, locale)}</p>
                {followup.status === 'scheduled' && followup.available && (
                  <Link className="followup-button" to={`/followup/submit?number=${followup.followup_number}`}>
                    {text.start}
                  </Link>
                )}
                {followup.status === 'scheduled' && !followup.available && (
                  <button type="button" disabled>{text.start}</button>
                )}
                {followup.status === 'completed' && (
                  <Link className="followup-button" to="/followup/progress">{text.view}</Link>
                )}
              </div>
            </article>
          ))
        )}

        {hasAuthToken() && <p className="followup-muted">{text.privacy}</p>}
        <p className="followup-page-actions">
          <Link to="/followup/progress">{text.progress}</Link>
        </p>
      </div>
    </main>
  );
}

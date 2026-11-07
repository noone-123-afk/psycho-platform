import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clearAuthToken, hasAuthToken } from '../utils/auth';
import './Followup.css';

const copy = {
  ar: {
    title: 'ملخص التقدم',
    subtitle: 'مراجعة وصفية لدرجاتك وتقييمك الذاتي عبر الزمن.',
    back: 'العودة للتقييمات',
    home: 'الرئيسية',
    logout: 'تسجيل الخروج',
    total: 'إجمالي المتابعات المكتملة',
    latest: 'أحدث متابعة',
    trends: 'التغير عبر المتابعات',
    noProgress: 'لا توجد بيانات تقدم بعد.',
    phq9: 'مجموع PHQ‑9 المبلغ عنه ذاتياً',
    gad7: 'مجموع GAD‑7 المبلغ عنه ذاتياً',
    awareness: 'الوعي الذاتي',
    regulation: 'التنظيم العاطفي',
    relationships: 'جودة العلاقات',
    productivity: 'الإنتاجية',
    satisfaction: 'الرضا العام',
    days: 'اليوم',
    completed: 'تاريخ الإكمال',
    scoreDisclaimer: 'الدرجات المبلغ عنها ذاتياً ليست تشخيصاً ولا تُظهر وحدها تحسناً أو تراجعاً سريرياً.',
    login: 'سجّل الدخول لعرض ملخصك.',
    goLogin: 'تسجيل الدخول',
    loading: 'جارٍ تحميل الملخص…',
    error: 'تعذر تحميل ملخص التقدم.',
    retry: 'إعادة المحاولة'
  },
  en: {
    title: 'Progress Summary',
    subtitle: 'A descriptive view of your self-reported scores and ratings over time.',
    back: 'Back to follow-ups',
    home: 'Home',
    logout: 'Log out',
    total: 'Completed follow-ups',
    latest: 'Latest follow-up',
    trends: 'Change across follow-ups',
    noProgress: 'There is no progress data yet.',
    phq9: 'Self-reported PHQ‑9 total',
    gad7: 'Self-reported GAD‑7 total',
    awareness: 'Self-awareness',
    regulation: 'Emotional regulation',
    relationships: 'Relationship quality',
    productivity: 'Productivity',
    satisfaction: 'Overall satisfaction',
    days: 'days',
    completed: 'Completed',
    scoreDisclaimer: 'Self-reported scores are not a diagnosis and do not alone indicate clinical improvement or decline.',
    login: 'Sign in to view your summary.',
    goLogin: 'Sign in',
    loading: 'Loading progress summary…',
    error: 'Unable to load your progress summary.',
    retry: 'Try again'
  }
};

const metricDefinitions = [
  { key: 'phq9', field: 'phq9_score', label: 'phq9', max: 27, clinical: true },
  { key: 'gad7', field: 'gad7_score', label: 'gad7', max: 21, clinical: true },
  { key: 'awareness', field: 'self_rating_awareness', label: 'awareness', max: 10 },
  { key: 'regulation', field: 'self_rating_regulation', label: 'regulation', max: 10 },
  { key: 'relationships', field: 'self_rating_relationships', label: 'relationships', max: 10 },
  { key: 'productivity', field: 'self_rating_productivity', label: 'productivity', max: 10 },
  { key: 'satisfaction', field: 'self_rating_satisfaction', label: 'satisfaction', max: 10 }
];

function formatDate(value, locale) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));
}

export default function FollowupProgress() {
  const { i18n } = useTranslation();
  const language = i18n.language === 'en' ? 'en' : 'ar';
  const text = copy[language];
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!hasAuthToken()) {
      setLoading(false);
      return undefined;
    }
    let active = true;
    async function loadSummary() {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get('/api/followup/progress-summary');
        if (active) setSummary(response.data.summary);
      } catch (requestError) {
        if (!active) return;
        if (requestError.response?.status === 401) {
          clearAuthToken();
          setSummary(null);
        }
        setError(requestError.response?.data?.message || text.error);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadSummary();
    return () => { active = false; };
  }, [reload, text.error]);

  function logout() {
    clearAuthToken();
    navigate('/account?mode=login&next=%2Ffollowup%2Fprogress', { replace: true });
  }

  const locale = language === 'ar' ? 'ar' : 'en';
  const periods = summary?.periods || [];

  return (
    <main className="followup-page" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="followup-shell">
        <header className="followup-header">
          <nav className="followup-nav">
            <Link to="/followup">{text.back}</Link>
            <Link to="/">{text.home}</Link>
            {hasAuthToken() && <button type="button" className="followup-secondary" onClick={logout}>{text.logout}</button>}
          </nav>
          <h1>{text.title}</h1>
          <p>{text.subtitle}</p>
        </header>

        {!hasAuthToken() ? (
          <section className="followup-empty">
            <p>{text.login}</p>
            <Link className="followup-button" to="/account?mode=login&next=%2Ffollowup%2Fprogress">{text.goLogin}</Link>
          </section>
        ) : loading ? (
          <p className="followup-empty">{text.loading}</p>
        ) : error ? (
          <section className="followup-empty">
            <p className="followup-error" role="alert">{error}</p>
            <button type="button" onClick={() => setReload((value) => value + 1)}>{text.retry}</button>
          </section>
        ) : !summary ? (
          <section className="followup-empty"><p>{text.noProgress}</p></section>
        ) : (
          <>
            <section className="followup-section">
              <h2>{text.total}</h2>
              <div className="followup-stat"><span>{text.total}</span><strong>{summary.total_completed}</strong></div>
            </section>

            <section className="followup-section">
              <div className="followup-section-heading">
                <h2>{text.latest}</h2>
                <span className="followup-date">{text.completed}: {formatDate(summary.latest.completed_date, locale)}</span>
              </div>
              <div className="followup-score-grid">
                {metricDefinitions.map((metric) => (
                  <div className="followup-stat" key={metric.key}>
                    <span>{text[metric.label]}</span>
                    <strong>
                      {summary.latest[metric.field] ?? '—'}
                      {!metric.clinical && summary.latest[metric.field] !== null && summary.latest[metric.field] !== undefined ? '/10' : ''}
                    </strong>
                  </div>
                ))}
              </div>
              <p className="followup-warning">{text.scoreDisclaimer}</p>
            </section>

            <section className="followup-section">
              <h2>{text.trends}</h2>
              <div className="followup-trend-list">
                {metricDefinitions.map((metric) => {
                  const values = summary.trends?.[metric.key] || [];
                  if (values.length === 0) return null;
                  let valueIndex = 0;
                  return (
                    <div className="followup-trend" key={metric.key}>
                      <span className="followup-trend-label">{text[metric.label]}</span>
                      <div className="followup-trend-points">
                        {periods.map((period) => {
                          const hasScore = values[valueIndex] !== undefined;
                          const score = hasScore ? values[valueIndex++] : null;
                          if (!hasScore) return null;
                          return (
                            <div className="followup-trend-point" key={`${metric.key}-${period.completed_date}`}>
                              <span className="followup-trend-value">{score}/{metric.max}</span>
                              <div className="followup-trend-track" aria-hidden="true">
                                <div
                                  className={`followup-trend-fill${metric.clinical ? ' followup-trend-fill-clinical' : ''}`}
                                  style={{ width: `${Math.min(100, Math.max(0, (score / metric.max) * 100))}%` }}
                                />
                              </div>
                              <span className="followup-trend-date">
                                {period.followup_number * 30} {text.days} · {formatDate(period.completed_date, locale)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="followup-warning">{text.scoreDisclaimer}</p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

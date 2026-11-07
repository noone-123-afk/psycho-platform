import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clearAuthToken } from '../utils/auth';
import useAdminSession from '../hooks/useAdminSession';
import './AdminDashboard.css';
import './AdminCrisisPages.css';

const PAGE_SIZE = 25;

const copy = {
  ar: {
    title: 'قائمة طلبات التواصل',
    subtitle: 'طلبات اختيارية؛ لا تتضمن درجات خطورة أو نصوص إجابات.',
    back: 'العودة للوحة الإدارة',
    logout: 'تسجيل الخروج',
    status: 'الحالة',
    all: 'كل الحالات',
    statuses: { new: 'جديد', reviewed: 'تمت المراجعة', closed: 'مغلق' },
    date: 'تاريخ الطلب',
    name: 'المستخدم',
    email: 'البريد الإلكتروني',
    expires: 'يحذف في',
    actions: 'الإجراء',
    details: 'التفاصيل',
    empty: 'لا توجد طلبات مطابقة.',
    loading: 'جارٍ تحميل الطلبات…',
    loadError: 'تعذر تحميل الطلبات.',
    retry: 'إعادة المحاولة',
    previous: 'السابق',
    next: 'التالي',
    accessDenied: 'ليس لديك صلاحية الوصول إلى هذه الصفحة.',
    noName: 'حساب محذوف'
  },
  en: {
    title: 'Contact Requests',
    subtitle: 'Voluntary requests; no risk scores or assessment answers are included.',
    back: 'Back to dashboard',
    logout: 'Log out',
    status: 'Status',
    all: 'All statuses',
    statuses: { new: 'New', reviewed: 'Reviewed', closed: 'Closed' },
    date: 'Submitted',
    name: 'User',
    email: 'Email',
    expires: 'Deletes on',
    actions: 'Action',
    details: 'Details',
    empty: 'No matching requests.',
    loading: 'Loading requests…',
    loadError: 'Unable to load requests.',
    retry: 'Try again',
    previous: 'Previous',
    next: 'Next',
    accessDenied: 'You do not have permission to access this page.',
    noName: 'Deleted account'
  }
};

function formatDate(value, locale) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function AdminCrisisIncidents() {
  const { status: authStatus, admin, error: authError } = useAdminSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const language = i18n.language === 'en' ? 'en' : 'ar';
  const text = copy[language];
  const requestedStatus = searchParams.get('status');
  const currentStatus = ['new', 'reviewed', 'closed'].includes(requestedStatus) ? requestedStatus : 'all';
  const parsedPage = Number.parseInt(searchParams.get('page') || '1', 10);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const [incidents, setIncidents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (authStatus !== 'ready') return undefined;
    let active = true;
    async function fetchIncidents() {
      setLoading(true);
      setError('');
      const params = { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE };
      if (currentStatus !== 'all') params.status = currentStatus;
      try {
        const response = await axios.get('/api/admin/crisis/incidents', { params });
        if (!active) return;
        if (response.data.incidents.length === 0 && page > 1) {
          setSearchParams((previous) => {
            const nextParams = new URLSearchParams(previous);
            nextParams.set('page', String(page - 1));
            return nextParams;
          }, { replace: true });
          return;
        }
        setIncidents(response.data.incidents);
        setTotal(response.data.total);
      } catch (requestError) {
        if (!active) return;
        if (requestError.response?.status === 401) {
          clearAuthToken();
          navigate('/admin-dashboard', { replace: true });
          return;
        }
        setError(requestError.response?.data?.message || text.loadError);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchIncidents();
    return () => { active = false; };
  }, [authStatus, currentStatus, page, reload, navigate, setSearchParams, text.loadError]);

  function setPage(nextPage) {
    setSearchParams((previous) => {
      const nextParams = new URLSearchParams(previous);
      nextParams.set('page', String(nextPage));
      return nextParams;
    });
  }

  function setStatus(nextStatus) {
    setSearchParams(nextStatus === 'all' ? {} : { status: nextStatus });
  }

  function logout() {
    clearAuthToken();
    navigate('/admin-dashboard', { replace: true });
  }

  if (authStatus === 'checking') {
    return <main className="admin-page" dir={language === 'ar' ? 'rtl' : 'ltr'}><p className="admin-loading">{text.loading}</p></main>;
  }
  if (authStatus === 'denied') {
    return <main className="admin-page" dir={language === 'ar' ? 'rtl' : 'ltr'}><section className="admin-login-card"><h1>{text.accessDenied}</h1><Link to="/admin-dashboard">{text.back}</Link></section></main>;
  }
  if (authStatus === 'error') {
    return <main className="admin-page" dir={language === 'ar' ? 'rtl' : 'ltr'}><div className="admin-error" role="alert">{authError}</div></main>;
  }

  const locale = language === 'ar' ? 'ar' : 'en';
  const shownFrom = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const shownTo = Math.min(page * PAGE_SIZE, total);

  return (
    <main className="admin-page" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="admin-header">
        <div>
          <Link to="/admin-dashboard" className="admin-home-link">{text.back}</Link>
          <h1>{text.title}</h1>
          <p>{text.subtitle}</p>
        </div>
        <div className="admin-account">
          <span>{admin?.name}</span>
          <button type="button" className="admin-secondary-button" onClick={logout}>{text.logout}</button>
        </div>
      </header>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <h2>{text.title} <span>({total})</span></h2>
          <label className="admin-filter">
            {text.status}
            <select value={currentStatus} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">{text.all}</option>
              {Object.entries(text.statuses).map(([key, label]) => <option value={key} key={key}>{label}</option>)}
            </select>
          </label>
        </div>

        {error && <div className="admin-error admin-banner" role="alert"><span>{error}</span><button type="button" className="admin-secondary-button" onClick={() => setReload((value) => value + 1)}>{text.retry}</button></div>}
        {loading ? <p className="admin-empty">{text.loading}</p> : incidents.length === 0 ? (
          <p className="admin-empty">{text.empty}</p>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-incidents-table">
              <thead>
                <tr>
                  <th>{text.date}</th>
                  <th>{text.name}</th>
                  <th>{text.email}</th>
                  <th>{text.status}</th>
                  <th>{text.expires}</th>
                  <th>{text.actions}</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <tr key={incident.id}>
                    <td>{formatDate(incident.detected_at, locale)}</td>
                    <td>{incident.user?.name || text.noName}</td>
                    <td>{incident.user?.email || '—'}</td>
                    <td><span className={`admin-status admin-status-${incident.status}`}>{text.statuses[incident.status]}</span></td>
                    <td>{formatDate(incident.expires_at, locale)}</td>
                    <td><Link className="admin-details-link" to={`/admin/crisis/${incident.id}`}>{text.details}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && total > PAGE_SIZE && (
          <div className="admin-pagination">
            <button type="button" className="admin-secondary-button" disabled={page <= 1} onClick={() => setPage(page - 1)}>{text.previous}</button>
            <span>{shownFrom}–{shownTo} / {total}</span>
            <button type="button" className="admin-secondary-button" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>{text.next}</button>
          </div>
        )}
      </section>
    </main>
  );
}

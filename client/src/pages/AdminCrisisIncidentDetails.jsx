import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clearAuthToken } from '../utils/auth';
import useAdminSession from '../hooks/useAdminSession';
import './AdminDashboard.css';
import './AdminCrisisPages.css';

const copy = {
  ar: {
    title: 'تفاصيل طلب التواصل',
    subtitle: 'هذا الطلب ليس خدمة طوارئ ولا يتضمن بيانات تقييم سريري.',
    back: 'العودة للقائمة',
    logout: 'تسجيل الخروج',
    loading: 'جارٍ تحميل التفاصيل…',
    notFound: 'لم يُعثر على الطلب أو انتهت مدة الاحتفاظ به.',
    loadError: 'تعذر تحميل تفاصيل الطلب.',
    retry: 'إعادة المحاولة',
    request: 'معلومات الطلب',
    user: 'معلومات صاحب الطلب',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    status: 'الحالة',
    statuses: { new: 'جديد', reviewed: 'تمت المراجعة', closed: 'مغلق' },
    submitted: 'تاريخ الطلب',
    expires: 'يحذف في',
    reviewed: 'تاريخ المراجعة',
    reviewedBy: 'راجعه',
    markReviewed: 'تسجيل المراجعة',
    close: 'إغلاق الطلب',
    updating: 'جارٍ التحديث…',
    updateError: 'تعذر تحديث حالة الطلب.',
    success: 'تم تحديث حالة الطلب.',
    accessDenied: 'ليس لديك صلاحية الوصول إلى هذه الصفحة.',
    noName: 'حساب محذوف'
  },
  en: {
    title: 'Contact Request Details',
    subtitle: 'This is not an emergency service and contains no clinical assessment data.',
    back: 'Back to requests',
    logout: 'Log out',
    loading: 'Loading request details…',
    notFound: 'The request was not found or its retention period has ended.',
    loadError: 'Unable to load request details.',
    retry: 'Try again',
    request: 'Request information',
    user: 'Requester information',
    name: 'Name',
    email: 'Email',
    status: 'Status',
    statuses: { new: 'New', reviewed: 'Reviewed', closed: 'Closed' },
    submitted: 'Submitted',
    expires: 'Deletes on',
    reviewed: 'Reviewed at',
    reviewedBy: 'Reviewed by',
    markReviewed: 'Mark reviewed',
    close: 'Close request',
    updating: 'Updating…',
    updateError: 'Unable to update request status.',
    success: 'Request status updated.',
    accessDenied: 'You do not have permission to access this page.',
    noName: 'Deleted account'
  }
};

function formatDate(value, locale) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function AdminCrisisIncidentDetails() {
  const { status: authStatus, admin, error: authError } = useAdminSession();
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const language = i18n.language === 'en' ? 'en' : 'ar';
  const text = copy[language];
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (authStatus !== 'ready') return undefined;
    let active = true;
    async function fetchIncident() {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`/api/admin/crisis/incidents/${incidentId}`);
        if (active) setIncident(response.data.incident);
      } catch (requestError) {
        if (!active) return;
        if (requestError.response?.status === 401) {
          clearAuthToken();
          navigate('/admin-dashboard', { replace: true });
          return;
        }
        setError(requestError.response?.status === 404
          ? text.notFound
          : requestError.response?.data?.message || text.loadError);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchIncident();
    return () => { active = false; };
  }, [authStatus, incidentId, navigate, reload, text.loadError, text.notFound]);

  async function updateStatus(status) {
    setSubmitting(true);
    setError('');
    try {
      await axios.put(`/api/admin/crisis/incidents/${incidentId}/review`, { status });
      setIncident((current) => ({
        ...current,
        status,
        reviewedAt: new Date().toISOString(),
        reviewedBy: { name: admin.name, email: admin.email }
      }));
      setError(text.success);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        clearAuthToken();
        navigate('/admin-dashboard', { replace: true });
        return;
      }
      setError(requestError.response?.data?.message || text.updateError);
    } finally {
      setSubmitting(false);
    }
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
  const canReview = ['owner', 'admin', 'psychologist'].includes(admin?.adminRole);

  return (
    <main className="admin-page" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="admin-header">
        <div>
          <Link to="/admin/crisis" className="admin-home-link">{text.back}</Link>
          <h1>{text.title}</h1>
          <p>{text.subtitle}</p>
        </div>
        <div className="admin-account">
          <span>{admin?.name}</span>
          <button type="button" className="admin-secondary-button" onClick={logout}>{text.logout}</button>
        </div>
      </header>

      {error && <div className={`admin-banner ${error === text.success ? 'admin-success' : 'admin-error'}`} role={error === text.success ? 'status' : 'alert'}><span>{error}</span>{error !== text.success && !incident && <button type="button" className="admin-secondary-button" onClick={() => setReload((value) => value + 1)}>{text.retry}</button>}</div>}

      {loading ? <p className="admin-loading">{text.loading}</p> : incident ? (
        <div className="admin-detail-grid">
          <section className="admin-panel">
            <h2>{text.request}</h2>
            <dl className="admin-detail-list">
              <div><dt>{text.status}</dt><dd><span className={`admin-status admin-status-${incident.status}`}>{text.statuses[incident.status]}</span></dd></div>
              <div><dt>{text.submitted}</dt><dd>{formatDate(incident.requestedAt, locale)}</dd></div>
              <div><dt>{text.expires}</dt><dd>{formatDate(incident.expiresAt, locale)}</dd></div>
              {incident.reviewedAt && <div><dt>{text.reviewed}</dt><dd>{formatDate(incident.reviewedAt, locale)}</dd></div>}
              {incident.reviewedBy && <div><dt>{text.reviewedBy}</dt><dd>{incident.reviewedBy.name}</dd></div>}
            </dl>
          </section>

          <section className="admin-panel">
            <h2>{text.user}</h2>
            <dl className="admin-detail-list">
              <div><dt>{text.name}</dt><dd>{incident.user?.name || text.noName}</dd></div>
              <div><dt>{text.email}</dt><dd>{incident.user?.email ? <a href={`mailto:${incident.user.email}`}>{incident.user.email}</a> : '—'}</dd></div>
            </dl>
          </section>

          {canReview && incident.status !== 'closed' && (
            <section className="admin-panel admin-review-panel">
              <h2>{text.status}</h2>
              <div className="admin-request-actions">
                {incident.status === 'new' && <button type="button" className="admin-secondary-button" disabled={submitting} onClick={() => updateStatus('reviewed')}>{submitting ? text.updating : text.markReviewed}</button>}
                <button type="button" className="admin-close-button" disabled={submitting} onClick={() => updateStatus('closed')}>{submitting ? text.updating : text.close}</button>
              </div>
            </section>
          )}
        </div>
      ) : !error ? <p className="admin-empty">{text.notFound}</p> : null}
    </main>
  );
}

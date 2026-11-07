import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clearAuthToken, hasAuthToken, saveAuthToken } from '../utils/auth';
import './AdminDashboard.css';

const copy = {
  ar: {
    title: 'لوحة مراجعة طلبات التواصل',
    subtitle: 'الطلبات اختيارية ولا تتضمن نصوص إجابات أو نتائج فحص صحي.',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    signIn: 'دخول الإدارة',
    signingIn: 'جارٍ التحقق…',
    logout: 'تسجيل الخروج',
    home: 'العودة للموقع',
    accessDenied: 'هذا الحساب لا يملك صلاحية الإدارة.',
    otherAccount: 'استخدام حساب آخر',
    loadError: 'تعذر تحميل بيانات لوحة الإدارة.',
    retry: 'إعادة المحاولة',
    loading: 'جارٍ تحميل لوحة الإدارة…',
    stats: ['إجمالي المستخدمين', 'إجمالي التقييمات', 'تقارير تم تسليمها', 'إجمالي الطلبات', 'طلبات جديدة', 'تمت مراجعتها', 'طلبات آخر 7 أيام', 'مغلقة'],
    requests: 'طلبات التواصل',
    allRequests: 'عرض جميع الطلبات',
    details: 'التفاصيل',
    filter: 'تصفية الحالة',
    all: 'كل الحالات',
    previous: 'السابق',
    next: 'التالي',
    statuses: { new: 'جديد', reviewed: 'تمت المراجعة', closed: 'مغلق' },
    empty: 'لا توجد طلبات في هذه الحالة.',
    submitted: 'تاريخ الطلب',
    expires: 'يحذف في',
    markReviewed: 'تسجيل المراجعة',
    close: 'إغلاق الطلب',
    updating: 'جارٍ التحديث…',
    updateError: 'تعذر تحديث حالة الطلب.',
    audit: 'سجل الإجراءات الإدارية',
    noAudit: 'لا توجد إجراءات مسجلة.',
    adminTeam: 'إدارة فريق الإدارة',
    addAdmin: 'إضافة مستخدم موجود كمدير',
    role: 'الدور',
    add: 'إضافة',
    adding: 'جارٍ الإضافة…',
    addError: 'تعذر تعيين الدور. تحقق من البريد ومن أن الحساب مفعل.',
    roleError: 'تعذر تحديث الدور.',
    roles: {
      owner: 'مالك النظام',
      admin: 'مدير',
      psychologist: 'أخصائي نفسي',
      support: 'دعم'
    },
    revoke: 'إزالة الصلاحية',
    roleInfo: 'المالك وحده يستطيع إدارة الأدوار. المدير والأخصائي يستطيعان تحديث حالة الطلب؛ الدعم يطّلع على الطلبات فقط.',
    credentialsError: 'تعذر تسجيل الدخول. تحقق من البيانات أو صلاحية الحساب.',
    noName: 'حساب محذوف'
  },
  en: {
    title: 'Contact Request Review',
    subtitle: 'Requests are voluntary and contain no assessment answers or health-screening results.',
    email: 'Email',
    password: 'Password',
    signIn: 'Admin sign in',
    signingIn: 'Verifying…',
    logout: 'Log out',
    home: 'Back to site',
    accessDenied: 'This account does not have administrator access.',
    otherAccount: 'Use another account',
    loadError: 'Unable to load the administrator dashboard.',
    retry: 'Try again',
    loading: 'Loading administrator dashboard…',
    stats: ['Total users', 'Total assessments', 'Reports delivered', 'All requests', 'New requests', 'Reviewed', 'Last 7 days', 'Closed'],
    requests: 'Contact requests',
    allRequests: 'View all requests',
    details: 'Details',
    filter: 'Filter by status',
    all: 'All statuses',
    previous: 'Previous',
    next: 'Next',
    statuses: { new: 'New', reviewed: 'Reviewed', closed: 'Closed' },
    empty: 'There are no requests in this status.',
    submitted: 'Submitted',
    expires: 'Deletes on',
    markReviewed: 'Mark reviewed',
    close: 'Close request',
    updating: 'Updating…',
    updateError: 'Unable to update the request.',
    audit: 'Administrator action log',
    noAudit: 'No actions recorded.',
    adminTeam: 'Administrator team',
    addAdmin: 'Assign a role to an existing account',
    role: 'Role',
    add: 'Add',
    adding: 'Adding…',
    addError: 'Unable to assign this role. Check the email and account verification.',
    roleError: 'Unable to update the role.',
    roles: {
      owner: 'System owner',
      admin: 'Admin',
      psychologist: 'Psychologist',
      support: 'Support'
    },
    revoke: 'Remove access',
    roleInfo: 'Only the owner can manage roles. Admins and psychologists can update request status; support can view requests only.',
    credentialsError: 'Unable to sign in. Check your credentials and account access.',
    noName: 'Deleted account'
  }
};

const roleOptions = ['admin', 'psychologist', 'support'];
const roleFor = (role, text) => text.roles[role] || role;

function formatDate(value, locale) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function AdminDashboard() {
  const { i18n } = useTranslation();
  const language = i18n.language === 'en' ? 'en' : 'ar';
  const text = copy[language];
  const [authStatus, setAuthStatus] = useState('checking');
  const [admin, setAdmin] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [dashboardError, setDashboardError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [totalReports, setTotalReports] = useState(0);
  const [filter, setFilter] = useState('all');
  const [offset, setOffset] = useState(0);
  const [updatingId, setUpdatingId] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [admins, setAdmins] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('support');
  const [teamError, setTeamError] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    async function checkSession() {
      if (!hasAuthToken()) {
        setAuthStatus('signed-out');
        return;
      }
      try {
        const response = await axios.get('/api/auth/me');
        if (!active) return;
        if (!response.data.user?.adminRole) {
          setAdmin(null);
          setAuthStatus('denied');
          return;
        }
        setAdmin(response.data.user);
        setAuthStatus('ready');
      } catch (error) {
        if (!active) return;
        if (error.response?.status === 401) {
          clearAuthToken();
          setAuthStatus('signed-out');
        } else {
          setDashboardError(error.response?.data?.message || text.loadError);
          setAuthStatus('error');
        }
      }
    }
    checkSession();
    return () => { active = false; };
  }, [text.loadError]);

  useEffect(() => {
    if (authStatus !== 'ready' || !admin) return undefined;
    let active = true;
    async function loadDashboard() {
      setLoading(true);
      setDashboardError('');
      const params = { limit: 50, offset };
      if (filter !== 'all') params.status = filter;
      const tasks = [
        axios.get('/api/admin/dashboard/stats'),
        axios.get('/api/admin/crisis/incidents', { params })
      ];
      if (['owner', 'admin'].includes(admin.adminRole)) {
        tasks.push(axios.get('/api/admin/actions-log', { params: { limit: 20, offset: 0 } }));
      }
      if (admin.adminRole === 'owner') {
        tasks.push(axios.get('/api/admin/admins'));
      }

      try {
        const responses = await Promise.all(tasks);
        if (!active) return;
        setStats(responses[0].data);
        if (responses[1].data.incidents.length === 0 && offset > 0) {
          setOffset(Math.max(0, offset - 50));
          return;
        }
        setReports(responses[1].data.incidents);
        setTotalReports(responses[1].data.total);
        let responseIndex = 2;
        if (['owner', 'admin'].includes(admin.adminRole)) {
          setAuditLogs(responses[responseIndex].data.logs);
          responseIndex += 1;
        } else {
          setAuditLogs([]);
        }
        if (admin.adminRole === 'owner') {
          setAdmins(responses[responseIndex].data.admins);
        } else {
          setAdmins([]);
        }
      } catch (error) {
        if (!active) return;
        if (error.response?.status === 401) {
          clearAuthToken();
          setAdmin(null);
          setAuthStatus('signed-out');
        }
        setDashboardError(error.response?.data?.message || text.loadError);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadDashboard();
    return () => { active = false; };
  }, [admin, authStatus, filter, offset, refreshKey, text.loadError]);

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      if (!response.data.user?.adminRole) {
        setLoginError(text.accessDenied);
        return;
      }
      saveAuthToken(response.data.token);
      setAdmin(response.data.user);
      setAuthStatus('ready');
      setPassword('');
    } catch (error) {
      setLoginError(error.response?.data?.message || text.credentialsError);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearAuthToken();
    setAdmin(null);
    setStats(null);
    setAuthStatus('signed-out');
  }

  async function updateReport(report, status) {
    setUpdatingId(report.id);
    setDashboardError('');
    try {
      await axios.put(`/api/admin/crisis/incidents/${report.id}/review`, { status });
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setDashboardError(error.response?.data?.message || text.updateError);
    } finally {
      setUpdatingId('');
    }
  }

  async function addAdmin(event) {
    event.preventDefault();
    setTeamError('');
    setAddingAdmin(true);
    try {
      await axios.post('/api/admin/admins', { email: newAdminEmail, role: newAdminRole });
      setNewAdminEmail('');
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setTeamError(error.response?.data?.message || text.addError);
    } finally {
      setAddingAdmin(false);
    }
  }

  async function changeAdminRole(person, role) {
    if (role === 'none' && !window.confirm(language === 'ar' ? 'إزالة صلاحية هذا المستخدم؟' : 'Remove this user’s administrator access?')) {
      setRefreshKey((value) => value + 1);
      return;
    }
    setTeamError('');
    try {
      await axios.put(`/api/admin/admins/${person.id}/role`, { role });
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setTeamError(error.response?.data?.message || text.roleError);
    }
  }

  const locale = language === 'ar' ? 'ar' : 'en';
  const statsItems = stats ? [
    { label: text.stats[0], value: stats.total_users },
    { label: text.stats[1], value: stats.total_assessments },
    { label: text.stats[2], value: stats.delivered_books },
    { label: text.stats[3], value: stats.total_reports },
    { label: text.stats[4], value: stats.new_reports },
    { label: text.stats[5], value: stats.reviewed_reports },
    { label: text.stats[6], value: stats.recent_reports_7days },
    { label: text.stats[7], value: stats.closed_reports }
  ] : [];

  if (authStatus === 'checking') {
    return <main className="admin-page" dir={language === 'ar' ? 'rtl' : 'ltr'}><p className="admin-loading">{text.loading}</p></main>;
  }

  if (authStatus === 'signed-out' || authStatus === 'error') {
    return (
      <main className="admin-page" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <form className="admin-login-card" onSubmit={handleLogin}>
          <Link to="/" className="admin-home-link">{text.home}</Link>
          <h1>{text.title}</h1>
          <p>{text.subtitle}</p>
          <label>{text.email}<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>{text.password}<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {(loginError || dashboardError) && <p className="admin-error" role="alert">{loginError || dashboardError}</p>}
          <button type="submit" disabled={loading}>{loading ? text.signingIn : text.signIn}</button>
        </form>
      </main>
    );
  }

  if (authStatus === 'denied') {
    return (
      <main className="admin-page" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <section className="admin-login-card">
          <Link to="/" className="admin-home-link">{text.home}</Link>
          <h1>{text.accessDenied}</h1>
          <button type="button" onClick={handleLogout}>{text.otherAccount}</button>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="admin-header">
        <div>
          <Link to="/" className="admin-home-link">{text.home}</Link>
          <h1>{text.title}</h1>
          <p>{text.subtitle}</p>
        </div>
        <div className="admin-account">
          <span>{admin?.name} · {roleFor(admin?.adminRole, text)}</span>
          <button type="button" className="admin-secondary-button" onClick={handleLogout}>{text.logout}</button>
        </div>
      </header>

      {dashboardError && (
        <div className="admin-error admin-banner" role="alert">
          <span>{dashboardError}</span>
          <button type="button" className="admin-secondary-button" onClick={() => setRefreshKey((value) => value + 1)}>{text.retry}</button>
        </div>
      )}

      <section className="admin-stats" aria-label={text.title}>
        {statsItems.map((item) => (
          <article className="admin-stat-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>{text.requests}</h2>
            <span>{totalReports} {language === 'ar' ? 'طلب' : 'requests'}</span>
          </div>
          <div className="admin-panel-tools">
            <label className="admin-filter">
              {text.filter}
              <select value={filter} onChange={(event) => { setOffset(0); setFilter(event.target.value); }}>
                <option value="all">{text.all}</option>
                {Object.entries(text.statuses).map(([status, label]) => <option value={status} key={status}>{label}</option>)}
              </select>
            </label>
            <Link to="/admin/crisis" className="admin-details-link">{text.allRequests}</Link>
          </div>
        </div>

        {loading ? <p className="admin-empty">{text.loading}</p> : reports.length === 0 ? (
          <p className="admin-empty">{text.empty}</p>
        ) : (
          <div className="admin-request-list">
            {reports.map((report) => (
              <article className="admin-request" key={report.id}>
                <div className="admin-request-details">
                  <div className="admin-request-title">
                    <strong>{report.user?.name || text.noName}</strong>
                    <span className={`admin-status admin-status-${report.status}`}>{text.statuses[report.status]}</span>
                  </div>
                  <a href={`mailto:${report.user?.email || ''}`}>{report.user?.email || '—'}</a>
                  <span>{text.submitted}: {formatDate(report.detected_at, locale)}</span>
                  <span>{text.expires}: {formatDate(report.expires_at, locale)}</span>
                </div>
                <div className="admin-request-actions">
                  {['owner', 'admin', 'psychologist'].includes(admin?.adminRole) && report.status !== 'closed' && (
                    <>
                    {report.status === 'new' && (
                      <button type="button" className="admin-secondary-button" disabled={updatingId === report.id} onClick={() => updateReport(report, 'reviewed')}>
                        {updatingId === report.id ? text.updating : text.markReviewed}
                      </button>
                    )}
                    <button type="button" className="admin-close-button" disabled={updatingId === report.id} onClick={() => updateReport(report, 'closed')}>
                      {updatingId === report.id ? text.updating : text.close}
                    </button>
                    </>
                  )}
                  <Link className="admin-details-link" to={`/admin/crisis/${report.id}`}>{text.details}</Link>
                </div>
              </article>
            ))}
          </div>
        )}
        {!loading && totalReports > 50 && (
          <div className="admin-pagination">
            <button type="button" className="admin-secondary-button" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 50))}>{text.previous}</button>
            <span>{offset + 1}–{Math.min(offset + reports.length, totalReports)} / {totalReports}</span>
            <button type="button" className="admin-secondary-button" disabled={offset + reports.length >= totalReports} onClick={() => setOffset(offset + 50)}>{text.next}</button>
          </div>
        )}
      </section>

      {admin?.adminRole === 'owner' && (
        <section className="admin-panel">
          <h2>{text.adminTeam}</h2>
          <p className="admin-muted">{text.roleInfo}</p>
          <form className="admin-team-form" onSubmit={addAdmin}>
            <label>{text.email}<input type="email" required value={newAdminEmail} onChange={(event) => setNewAdminEmail(event.target.value)} /></label>
            <label>{text.role}
              <select value={newAdminRole} onChange={(event) => setNewAdminRole(event.target.value)}>
                {roleOptions.map((role) => <option value={role} key={role}>{roleFor(role, text)}</option>)}
              </select>
            </label>
            <button type="submit" disabled={addingAdmin}>{addingAdmin ? text.adding : text.add}</button>
          </form>
          {teamError && <p className="admin-error" role="alert">{teamError}</p>}
          <div className="admin-team-list">
            {admins.map((person) => (
              <div className="admin-team-row" key={person.id}>
                <span><strong>{person.name}</strong><small>{person.email}</small></span>
                {person.role === 'owner' ? (
                  <strong>{roleFor(person.role, text)}</strong>
                ) : (
                  <select aria-label={`${text.role}: ${person.email}`} value={person.role} onChange={(event) => changeAdminRole(person, event.target.value)}>
                    {roleOptions.map((role) => <option value={role} key={role}>{roleFor(role, text)}</option>)}
                    <option value="none">{text.revoke}</option>
                  </select>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {['owner', 'admin'].includes(admin?.adminRole) && (
        <section className="admin-panel">
          <h2>{text.audit}</h2>
          {auditLogs.length === 0 ? <p className="admin-empty">{text.noAudit}</p> : (
            <ul className="admin-audit-list">
              {auditLogs.map((log) => (
                <li key={log.id}>
                  <span>
                    {log.admin?.name || text.noName} · {log.actionType.replaceAll('_', ' ')}
                    {log.targetUser ? ` · ${log.targetUser.name} (${log.targetUser.email})` : ''}
                  </span>
                  <span>{log.previousValue || '—'} → {log.newValue || '—'}</span>
                  <time>{formatDate(log.createdAt, locale)}</time>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}

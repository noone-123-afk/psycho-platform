import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Home from './pages/Home'
import Assessment from './pages/Assessment'
import AdminDashboard from './pages/AdminDashboard'
import AdminCrisisIncidents from './pages/AdminCrisisIncidents'
import AdminCrisisIncidentDetails from './pages/AdminCrisisIncidentDetails'
import FollowupList from './pages/FollowupList'
import FollowupSubmit from './pages/FollowupSubmit'
import FollowupProgress from './pages/FollowupProgress'
import DisclaimerPage from './pages/legal/Disclaimer'
import PrivacyPage from './pages/legal/Privacy'
import CrisisPage from './pages/Crisis'
import Account from './pages/Account'
import NotificationSettings from './pages/NotificationSettings'
import VerifyEmail from './pages/VerifyEmail'
import Footer from './components/Footer'
import { DisclaimerPage, PrivacyPage, TermsPage } from './pages/LegalPages'

// مكون مساعد لتحديث لغة واتجاه الصفحة ومراقبة التنقل
const AppWrapper = () => {
  const { i18n, t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    // تطبيق الاتجاه الصحيح بناءً على اللغة
    document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // العودة لأعلى الصفحة عند التبديل بين الروابط
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin/crisis" element={<AdminCrisisIncidents />} />
        <Route path="/admin/crisis/:incidentId" element={<AdminCrisisIncidentDetails />} />
        <Route path="/followup" element={<FollowupList />} />
        <Route path="/followup/submit" element={<FollowupSubmit />} />
        <Route path="/followup/progress" element={<FollowupProgress />} />
        <Route path="/legal/disclaimer" element={<DisclaimerPage />} />
        <Route path="/legal/privacy" element={<PrivacyPage />} />
        <Route path="/crisis" element={<CrisisPage />} />
        <Route path="/account" element={<Account />} />
        <Route path="/settings" element={<NotificationSettings />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/legal/disclaimer" element={<DisclaimerPage />} />
        <Route path="/legal/privacy" element={<PrivacyPage />} />
        <Route path="/legal/terms" element={<TermsPage />} />
      </Routes>
      {location.pathname !== '/crisis' && (
        <Link
          to="/crisis"
          style={{
            position: 'fixed',
            insetInlineStart: '16px',
            bottom: '16px',
            zIndex: 900,
            padding: '12px 16px',
            borderRadius: '999px',
            background: '#b91c1c',
            color: '#fff',
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(127, 29, 29, 0.3)',
          }}
        >
          🆘 {t('crisisEmergencyLink')}
        </Link>
      )}
      <Footer />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  )
}

export default App

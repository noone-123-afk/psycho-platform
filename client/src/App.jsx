import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Home from './pages/Home'
import Assessment from './pages/Assessment'
import AdminDashboard from './pages/AdminDashboard'
import CrisisPage from './pages/Crisis'
import Account from './pages/Account'
import NotificationSettings from './pages/NotificationSettings'
import VerifyEmail from './pages/VerifyEmail'

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
        <Route path="/crisis" element={<CrisisPage />} />
        <Route path="/account" element={<Account />} />
        <Route path="/settings" element={<NotificationSettings />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
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

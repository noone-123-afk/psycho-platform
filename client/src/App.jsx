import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Home from './pages/Home'
import Assessment from './pages/Assessment'
import AdminDashboard from './pages/AdminDashboard'

// مكون مساعد لتحديث لغة واتجاه الصفحة ومراقبة التنقل
const AppWrapper = () => {
  const { i18n } = useTranslation();
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
      </Routes>
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

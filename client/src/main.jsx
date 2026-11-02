import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n/config' // تفعيل الترجمة
import { useTranslation } from 'react-i18next'

// مكون صغير لضبط اتجاه الصفحة (RTL/LTR) حسب اللغة
const Root = () => {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)

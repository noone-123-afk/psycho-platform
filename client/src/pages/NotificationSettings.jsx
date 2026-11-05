import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clearAuthToken, hasAuthToken } from '../utils/auth';

const fields = {
  ar: [
    ['welcomeEmail', 'رسائل الترحيب'],
    ['bookReadyEmail', 'إشعار جاهزية التقرير'],
    ['followUpEmails', 'رسائل المتابعة بعد استلام التقرير'],
    ['marketingEmails', 'الرسائل والعروض التسويقية']
  ],
  en: [
    ['welcomeEmail', 'Welcome messages'],
    ['bookReadyEmail', 'Report-ready notifications'],
    ['followUpEmails', 'Follow-up messages after receiving a report'],
    ['marketingEmails', 'Marketing messages and offers']
  ]
};

export default function NotificationSettings() {
  const { i18n } = useTranslation();
  const language = i18n.language === 'en' ? 'en' : 'ar';
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState(null);
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const text = language === 'ar'
    ? { title: 'تفضيلات البريد الإلكتروني', save: 'حفظ التفضيلات', saved: 'تم حفظ التفضيلات.', error: 'تعذر تحميل التفضيلات أو حفظها.', home: 'الرئيسية', logout: 'تسجيل الخروج' }
    : { title: 'Email preferences', save: 'Save preferences', saved: 'Preferences saved.', error: 'Unable to load or save preferences.', home: 'Home', logout: 'Sign out' };

  useEffect(() => {
    if (!hasAuthToken()) {
      navigate('/account?mode=login&next=/settings', { replace: true });
      return;
    }
    axios.get('/api/notifications/preferences')
      .then((response) => setPreferences(response.data))
      .catch((error) => {
        setMessage(error.response?.data?.message || text.error);
        if (error.response?.status === 401) {
          clearAuthToken();
          navigate('/account?mode=login&next=/settings', { replace: true });
        }
      });
  }, [navigate, text.error]);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');
    try {
      await axios.put('/api/notifications/preferences', preferences);
      navigate('/assessment', { replace: true, state: { preferencesSaved: true } });
    } catch (error) {
      setMessage(error.response?.data?.message || text.error);
    } finally {
      setIsSaving(false);
    }
  }

  function signOut() {
    clearAuthToken();
    navigate('/', { replace: true });
  }

  return (
    <main className="account-page" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <section className="account-card settings-card">
        <Link to="/" className="account-home">{text.home}</Link>
        <h1>{text.title}</h1>
        {preferences ? (
          <form onSubmit={handleSubmit}>
            <div className="notification-fields">
              {fields[language].map(([key, label]) => (
                <label className="notification-option" key={key}>
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(preferences[key])}
                    onChange={(event) => setPreferences({ ...preferences, [key]: event.target.checked })}
                  />
                </label>
              ))}
            </div>
            <button className="account-submit" type="submit" disabled={isSaving}>
              {isSaving ? '…' : text.save}
            </button>
          </form>
        ) : <p role="status">{message || '…'}</p>}
        {message && preferences && <p className="account-status" role="status">{message}</p>}
        <button className="account-switch" type="button" onClick={signOut}>{text.logout}</button>
      </section>
    </main>
  );
}

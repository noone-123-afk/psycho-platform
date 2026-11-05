import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { saveAuthToken } from '../utils/auth';

const copy = {
  ar: {
    title: 'حساب بوصلة النفس',
    create: 'إنشاء حساب',
    signIn: 'تسجيل الدخول',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور (12 حرفاً على الأقل)',
    submitCreate: 'إنشاء الحساب',
    submitSignIn: 'دخول',
    switchCreate: 'ليس لديك حساب؟ أنشئ حساباً',
    switchSignIn: 'لديك حساب؟ سجّل الدخول',
    verificationSent: 'أرسلنا رابط التفعيل إلى بريدك. افتح الرابط قبل تسجيل الدخول.',
    resend: 'إعادة إرسال رابط التفعيل',
    resent: 'إذا كان الحساب غير مفعل، أرسلنا رابطاً جديداً.',
    home: 'الرئيسية',
    error: 'تعذر إكمال الطلب. تحقق من البيانات وحاول مجدداً.'
  },
  en: {
    title: 'Soul Compass account',
    create: 'Create account',
    signIn: 'Sign in',
    name: 'Name',
    email: 'Email',
    password: 'Password (at least 12 characters)',
    submitCreate: 'Create account',
    submitSignIn: 'Sign in',
    switchCreate: "Don't have an account? Create one",
    switchSignIn: 'Already have an account? Sign in',
    verificationSent: 'We sent an activation link to your email. Verify it before signing in.',
    resend: 'Resend verification link',
    resent: 'If the account is unverified, a new link has been sent.',
    home: 'Home',
    error: 'Unable to continue. Check your details and try again.'
  }
};

export default function Account() {
  const { i18n } = useTranslation();
  const language = i18n.language === 'en' ? 'en' : 'ar';
  const text = copy[language];
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isRegistering, setIsRegistering] = useState(searchParams.get('mode') !== 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSent, setRegistrationSent] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegistering
        ? { name, email, password, language }
        : { email, password };
      if (isRegistering) {
        const next = searchParams.get('next');
        if (next?.startsWith('/') && !next.startsWith('//')) {
          sessionStorage.setItem('postVerificationRedirect', next);
        }
      }
      const response = await axios.post(endpoint, payload);
      if (response.data.verificationRequired) {
        setRegistrationSent(true);
        setPassword('');
        return;
      }
      saveAuthToken(response.data.token);
      const next = searchParams.get('next');
      navigate(next?.startsWith('/') && !next.startsWith('//') ? next : '/assessment', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || text.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendVerification() {
    setError('');
    try {
      await axios.post('/api/auth/resend-verification', { email });
      setError(text.resent);
    } catch (requestError) {
      setError(requestError.response?.data?.message || text.error);
    }
  }

  return (
    <main className="account-page" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <form className="account-card" onSubmit={handleSubmit}>
        <Link to="/" className="account-home">{text.home}</Link>
        <h1>{text.title}</h1>
        <div className="account-tabs">
          <button type="button" aria-pressed={isRegistering} onClick={() => { setRegistrationSent(false); setIsRegistering(true); }}>{text.create}</button>
          <button type="button" aria-pressed={!isRegistering} onClick={() => { setRegistrationSent(false); setIsRegistering(false); }}>{text.signIn}</button>
        </div>
        {registrationSent ? (
          <div className="account-status" role="status">
            <p>{text.verificationSent}</p>
            <button className="account-switch" type="button" onClick={resendVerification}>{text.resend}</button>
          </div>
        ) : isRegistering && (
          <label>
            {text.name}
            <input autoComplete="name" maxLength={100} required value={name} onChange={(event) => setName(event.target.value)} />
          </label>
        )}
        {!registrationSent && <label>
          {text.email}
          <input autoComplete="email" type="email" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>}
        {!registrationSent && <label>
          {text.password}
          <input autoComplete={isRegistering ? 'new-password' : 'current-password'} type="password" minLength={isRegistering ? 12 : undefined} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>}
        {error && <p className="account-error" role="alert">{error}</p>}
        {!registrationSent && <button className="account-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? '…' : isRegistering ? text.submitCreate : text.submitSignIn}
        </button>}
        {!registrationSent && <button className="account-switch" type="button" onClick={() => { setError(''); setIsRegistering(!isRegistering); }}>
          {isRegistering ? text.switchSignIn : text.switchCreate}
        </button>}
      </form>
    </main>
  );
}

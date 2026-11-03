import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function VerifyEmail() {
  const { i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState(token ? 'loading' : 'failure');
  const language = i18n.language === 'en' ? 'en' : 'ar';
  const pendingRedirect = sessionStorage.getItem('postVerificationRedirect');
  const nextPath = pendingRedirect?.startsWith('/') && !pendingRedirect.startsWith('//')
    ? pendingRedirect
    : '/settings';
  const text = language === 'ar'
    ? {
      title: 'تأكيد البريد الإلكتروني',
      loading: 'جارٍ تأكيد بريدك الإلكتروني…',
      success: 'تم تأكيد بريدك. يمكنك الآن تسجيل الدخول.',
      failure: 'رابط التأكيد غير صالح أو انتهت صلاحيته.',
      signIn: 'تسجيل الدخول',
      home: 'الرئيسية'
    }
    : {
      title: 'Verify your email',
      loading: 'Verifying your email…',
      success: 'Your email is verified. You can now sign in.',
      failure: 'This verification link is invalid or has expired.',
      signIn: 'Sign in',
      home: 'Home'
    };

  useEffect(() => {
    if (!token) {
      return;
    }
    let active = true;
    axios.get('/api/auth/verify-email', { params: { token } })
      .then(() => { if (active) setState('success'); })
      .catch(() => { if (active) setState('failure'); });
    return () => { active = false; };
  }, [token]);

  return (
    <main className="account-page" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <section className="account-card">
        <h1>{text.title}</h1>
        <p role="status">{state === 'loading' ? text.loading : state === 'success' ? text.success : text.failure}</p>
        {state !== 'loading' && (
          <Link className="account-submit" to={state === 'success' ? `/account?mode=login&next=${encodeURIComponent(nextPath)}` : '/'}>
            {state === 'success' ? text.signIn : text.home}
          </Link>
        )}
      </section>
    </main>
  );
}

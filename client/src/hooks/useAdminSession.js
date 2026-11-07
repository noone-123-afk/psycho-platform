import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { clearAuthToken, hasAuthToken } from '../utils/auth';

export default function useAdminSession() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking');
  const [admin, setAdmin] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function checkSession() {
      if (!hasAuthToken()) {
        navigate('/admin-dashboard', { replace: true });
        return;
      }
      try {
        const response = await axios.get('/api/auth/me');
        if (!active) return;
        if (!response.data.user?.adminRole) {
          setStatus('denied');
          return;
        }
        setAdmin(response.data.user);
        setStatus('ready');
      } catch (requestError) {
        if (!active) return;
        if (requestError.response?.status === 401) {
          clearAuthToken();
          navigate('/admin-dashboard', { replace: true });
          return;
        }
        setError(requestError.response?.data?.message || 'Unable to verify administrator access');
        setStatus('error');
      }
    }
    checkSession();
    return () => { active = false; };
  }, [navigate]);

  return { status, admin, error };
}

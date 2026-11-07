import axios from 'axios';

const TOKEN_KEY = 'soulCompassToken';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

axios.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function saveAuthToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function hasAuthToken() {
  return Boolean(sessionStorage.getItem(TOKEN_KEY));
}

export function getAuthUserId() {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const payload = token?.split('.')[1];
  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
    const subject = JSON.parse(decoded).sub;
    return typeof subject === 'string' && subject ? subject : null;
  } catch {
    return null;
  }
}

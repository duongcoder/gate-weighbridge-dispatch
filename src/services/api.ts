import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const API_BASE_URL = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api');

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  adapter: 'fetch',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token from localStorage
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const token = localStorage.getItem('gw_auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Ensure Content-Length is never manually forced, letting browser Fetch handle framing
      if (config.headers) {
        delete (config.headers as Record<string, unknown>)['Content-Length'];
        delete (config.headers as Record<string, unknown>)['content-length'];
      }
    } catch (err) {
      console.error('Error reading auth token:', err);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear expired credentials
      localStorage.removeItem('gw_auth_token');
      localStorage.removeItem('gw_user_session');
      // Dispatch custom event for React components to respond immediately
      window.dispatchEvent(new CustomEvent('gw:unauthorized'));
    }
    return Promise.reject(error);
  }
);

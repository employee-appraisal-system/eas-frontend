import axios from 'axios';
import { clearEmployeeSession, getAccessToken } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Centralized Axios instance for all API calls.
 * Ensures consistent base URL, headers, and error handling.
 */
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * Response interceptor — unwraps `response.data` for convenience.
 * Error interceptor — normalizes errors into a consistent format.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = String(error.config?.url || '');

    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/sso/login') ||
      url.includes('/auth/sso/callback');

    if ((status === 401 || status === 403) && !isAuthEndpoint) {
      clearEmployeeSession();

      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(
            new CustomEvent('auth:logout', {
              detail: { status, url },
            })
          );
        } catch {
          // ignore
        }
      }
    }

    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred.';

    console.error(
      `[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`,
      message
    );

    return Promise.reject({ message, status, raw: error });
  }
);

export default apiClient;

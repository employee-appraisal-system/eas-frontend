import apiClient from './client';

/**
 * Authenticate user with email and password.
 * @returns {{ message: string, employee_id: string, role: string }}
 */
export const loginAuth = async (email, password) => {
  const response = await apiClient.post(
    '/auth/login',
    { email, password },
    { withCredentials: true }
  );
  return response.data;
};

/**
 * Initiate SSO login — returns the redirect URL.
 * @returns {{ login_url: string }}
 */
export const getSSOLoginUrl = async () => {
  const response = await apiClient.get('/auth/sso/login');
  return response.data;
};

/**
 * Complete SSO callback with the authorization code.
 * @returns {{ employee_id: string, role: string, ... }}
 */
export const completeSSOCallback = async (code) => {
  const response = await apiClient.post('/auth/sso/callback', { code });
  return response.data;
};

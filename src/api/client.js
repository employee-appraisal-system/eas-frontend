import axios from 'axios';

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

/**
 * Response interceptor — unwraps `response.data` for convenience.
 * Error interceptor — normalizes errors into a consistent format.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred.';

    console.error(
      `[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`,
      message
    );

    return Promise.reject({
      message,
      status: error.response?.status,
      raw: error,
    });
  }
);

export default apiClient;

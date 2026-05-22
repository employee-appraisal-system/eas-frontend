import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const login_auth = async (email, password) => {
  try {
    const response = await axios.post(
      `${API_URL}/auth/login`,
      { email, password },
      { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
    );
    return response.data; // Expecting { message, employee_id, role }
  } catch (error) {
    throw error.response
      ? error.response.data.detail
      : 'Login failed. Please try again.';
  }
};

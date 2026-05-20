import axios from 'axios';

// const API_URL = "http://localhost:8000";
const API_URL = process.env.REACT_APP_BASE_URL; // from .env file

export const fetchQuestions = async () => {
  try {
    const response = await axios.get(`${API_URL}/question`);
    return response.data;
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

export const addQuestion = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/question`, data);
    return response.data;
  } catch (error) {
    console.error('Error while adding a question:', error);
    throw error;
  }
};

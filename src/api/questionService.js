import apiClient from './client';

/**
 * Fetch all questions.
 */
export const fetchQuestions = async () => {
  const response = await apiClient.get('/question/question');
  return response.data;
};

/**
 * Add a new question.
 */
export const addQuestion = async (data) => {
  const response = await apiClient.post('/question/question', data);
  return response.data;
};

/**
 * Fetch all questions with their options.
 */
export const fetchQuestionsWithOptions = async () => {
  const response = await apiClient.get('/question/questions-with-options');
  return response.data;
};

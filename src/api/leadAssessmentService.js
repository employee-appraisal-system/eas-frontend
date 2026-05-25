import apiClient from './client';

/**
 * Fetch employee ratings for a cycle (historical report).
 */
export const fetchEmployeeRatings = async (cycleId) => {
  const response = await apiClient.get(
    `/lead_assessment/employees_ratings/${cycleId}`
  );
  return response.data;
};

/**
 * Fetch previous lead-assessment data for an employee in a cycle.
 */
export const fetchPreviousAssessmentData = async (cycleId, employeeId) => {
  const response = await apiClient.get(
    `/lead_assessment/lead_assessment/previous_data/${cycleId}/${employeeId}`
  );
  return response.data;
};

/**
 * Save lead-assessment rating.
 */
export const saveLeadAssessmentRating = async (payload) => {
  const response = await apiClient.post(
    '/lead_assessment/save_rating',
    payload
  );
  return response.data;
};

/**
 * Fetch parameters for lead assessment.
 */
export const fetchParameters = async (cycleId, employeeId) => {
  const response = await apiClient.get(
    `/parameters/${cycleId}/${employeeId}`
  );
  return response.data;
};

import apiClient from './client';

/**
 * Fetch assessment cycles for a regular employee.
 */
export const fetchAssessmentCycles = async (employeeId) => {
  const response = await apiClient.get(`/assessment/cycles/${employeeId}`);
  return response.data;
};

/**
 * Fetch assessment cycles for a team lead.
 */
export const fetchTeamLeadCycles = async (employeeId) => {
  const response = await apiClient.get(
    `/assessment/teamlead/cycles/${employeeId}`
  );
  return response.data;
};

/**
 * Fetch assessment questions for an employee in a cycle.
 */
export const fetchAssessmentQuestions = async (employeeId, cycleId) => {
  const response = await apiClient.get(
    `/assessment/questions/${employeeId}/${cycleId}`
  );
  return response.data;
};

/**
 * Fetch assessment responses for an employee in a cycle.
 */
export const fetchAssessmentResponses = async (employeeId, cycleId) => {
  const response = await apiClient.get(
    `/assessment/responses/${employeeId}/${cycleId}`
  );
  return response.data;
};

/**
 * Submit assessment responses.
 */
export const submitAssessment = async (payload) => {
  const response = await apiClient.post('/assessment/submit', payload);
  return response.data;
};

/**
 * Create assignments (assign employees to questions for a cycle).
 */
export const createAssignment = async (assignmentData) => {
  const response = await apiClient.post('/assignments/', assignmentData);
  return response.data;
};

/**
 * Fetch self-assessment report responses for a cycle.
 */
export const fetchCycleResponses = async (cycleId) => {
  const response = await apiClient.get(`/self-assessment-report/${cycleId}`);
  return response.data;
};

/**
 * Fetch stage status for self-assessment.
 */
export const fetchSelfAssessmentStage = async (cycleId) => {
  const response = await apiClient.get(`/stages/self-assessment/${cycleId}`);
  return response.data;
};

/**
 * Fetch stage status for lead-assessment.
 */
export const fetchLeadAssessmentStage = async (cycleId) => {
  const response = await apiClient.get(`/stages/lead-assessment/${cycleId}`);
  return response.data;
};

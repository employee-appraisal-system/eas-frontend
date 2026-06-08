import apiClient from './client';

/**
 * Create a new appraisal cycle.
 */
export const createAppraisalCycle = async (cycleData) => {
  const response = await apiClient.post('/appraisal_cycle/', cycleData);
  return response.data;
};

/**
 * Create a new stage within an appraisal cycle.
 */
export const createStage = async (stageData) => {
  const response = await apiClient.post('/stages/', stageData);
  return response.data;
};

/**
 * Create a new parameter within an appraisal cycle.
 */
export const createParameter = async (parameterData) => {
  const response = await apiClient.post('/parameter/', parameterData);
  return response.data;
};

/**
 * Fetch all appraisal cycles with their stage names.
 */
export const fetchAppraisalCycles = async () => {
  const response = await apiClient.get('/appraisal_cycle/with-stage-names');
  return response.data;
};

/**
 * Delete an appraisal cycle by ID.
 */
export const deleteAppraisalCycle = async (cycleId) => {
  const response = await apiClient.delete(`/appraisal_cycle/${cycleId}`);
  return response.data;
};

/**
 * Fetch a single appraisal cycle by ID for editing.
 */
export const getCycleById = async (cycleId) => {
  const response = await apiClient.get(
    `/edit-appraisal-cycle/edit-appraisal-cycle/${cycleId}`
  );
  return response.data;
};

/**
 * Update an existing appraisal cycle.
 */
export const editAppraisalCycle = async (cycleData) => {
  const response = await apiClient.put(
    `/edit-appraisal-cycle/edit-appraisal-cycle/${cycleData.cycle_id}`,
    cycleData
  );
  return response.data;
};

/**
 * Fetch cycles for the self-assessment report page.
 */
export const fetchSelfAssessmentCycles = async () => {
  const response = await apiClient.get(
    '/appraisal_cycle/appraisal-cycles/self-assessment-report'
  );
  return response.data;
};

/**
 * Fetch cycles for the lead assessment report page.
 */
export const fetchLeadAssessmentReportCycles = async () => {
  const response = await apiClient.get(
    '/appraisal_cycle/appraisal-cycles/lead-assessment-report'
  );
  return response.data;
};

/**
 * Get the status of a specific appraisal cycle.
 */
export const getCycleStatus = async (cycleId) => {
  const response = await apiClient.get(`/appraisal_cycle/status/${cycleId}`);
  return response.data;
};

/**
 * Get a single cycle by ID.
 */
export const getAppraisalCycle = async (cycleId) => {
  const response = await apiClient.get(`/appraisal_cycle/${cycleId}`);
  return response.data;
};

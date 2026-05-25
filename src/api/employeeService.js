import apiClient from './client';

/**
 * Fetch all employees (root endpoint).
 */
export const fetchAllEmployees = async () => {
  const response = await apiClient.get('/');
  return response.data;
};

/**
 * Fetch employees list (named endpoint).
 */
export const fetchEmployeesList = async () => {
  const response = await apiClient.get('/employees');
  return response.data;
};

/**
 * Fetch a specific employee's details.
 */
export const fetchEmployeeDetails = async (employeeId) => {
  const response = await apiClient.get(`/employee_details/${employeeId}`);
  return response.data;
};

/**
 * Fetch employees assigned to a specific cycle for a given employee.
 */
export const fetchCycleEmployees = async (cycleId, employeeId) => {
  const response = await apiClient.get(`/employees/${cycleId}/${employeeId}`);
  return response.data;
};

/**
 * Fetch employees reporting to a team lead.
 */
export const fetchReportingEmployees = async (employeeId) => {
  const response = await apiClient.get(`/reporting/${employeeId}`);
  return response.data;
};

/**
 * Fetch the reporting manager info for an employee.
 */
export const fetchReportingManager = async (employeeId) => {
  const response = await apiClient.get(`/reporting_manager/${employeeId}`);
  return response.data;
};

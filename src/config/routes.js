/** Named route constants for the EAS frontend */
const ROUTES = {
  LOGIN: '/login',
  SSO_CALLBACK: '/auth/callback',

  // HR / Admin routes
  HR_HOME: '/hr-home',
  ADD_APPRAISAL: '/add-appraisal',
  EDIT_APPRAISAL: '/edit-appraisal/:cycle_id',
  QUESTIONNAIRE: '/questionnaire',
  LEAD_ASSESSMENT_REPORT: '/lead-assessment-report',
  SELF_ASSESSMENT_REPORT: '/self-assessment-report',

  // Employee / Lead routes
  EMPLOYEE_HOME: '/employee-home',

  // Admin-only
  ADMIN_HOME: '/admin-home',
};

export default ROUTES;

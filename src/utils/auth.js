const STORAGE_KEYS = {
  employee: 'employee',
  employeeId: 'employee_id',
  userRole: 'user_role',
  tokenCandidates: ['access_token', 'authToken', 'token', 'jwt', 'id_token'],
};

const normalizeRole = (role) =>
  String(role ?? '')
    .trim()
    .toLowerCase();

const safeJsonParse = (value) => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const getCookieValue = (name) => {
  if (typeof document === 'undefined') {
    return null;
  }

  const escapedName = name.replace(/([.*+?^${}()|[\]\\])/g, '\\$1');
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${escapedName}=([^;]*)`)
  );

  return match ? decodeURIComponent(match[1]) : null;
};

const getStoredToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  for (const key of STORAGE_KEYS.tokenCandidates) {
    const localToken = window.localStorage.getItem(key);

    if (localToken) {
      return localToken;
    }

    const sessionToken = window.sessionStorage.getItem(key);

    if (sessionToken) {
      return sessionToken;
    }

    const cookieToken = getCookieValue(key);

    if (cookieToken) {
      return cookieToken;
    }
  }

  return null;
};

export const getStoredEmployee = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const employee = safeJsonParse(
    window.localStorage.getItem(STORAGE_KEYS.employee)
  );

  if (employee) {
    return employee;
  }

  const legacyRole = window.localStorage.getItem(STORAGE_KEYS.userRole);
  const legacyEmployeeId = window.localStorage.getItem(STORAGE_KEYS.employeeId);

  if (!legacyRole && !legacyEmployeeId) {
    return null;
  }

  return {
    employee_id: legacyEmployeeId,
    role: legacyRole,
  };
};

export const getAuthenticatedRole = () => {
  const employee = getStoredEmployee();

  return normalizeRole(
    employee?.role ?? employee?.user_role ?? employee?.designation
  );
};

export const isAuthenticated = () =>
  Boolean(getStoredToken() || getStoredEmployee());

export const getDefaultRouteForRole = (role) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === 'hr') {
    return '/hr-home';
  }

  if (normalizedRole === 'admin') {
    return '/admin-home';
  }

  return '/employee-home';
};

export const storeEmployeeSession = (employeeData) => {
  if (typeof window === 'undefined') {
    return;
  }

  const normalizedRole = normalizeRole(
    employeeData?.role ?? employeeData?.user_role ?? employeeData?.designation
  );
  const employee = {
    ...employeeData,
    role: normalizedRole,
  };

  window.localStorage.setItem(STORAGE_KEYS.employee, JSON.stringify(employee));

  if (
    employeeData?.employee_id !== undefined &&
    employeeData?.employee_id !== null
  ) {
    window.localStorage.setItem(
      STORAGE_KEYS.employeeId,
      String(employeeData.employee_id)
    );
  }

  if (normalizedRole) {
    window.localStorage.setItem(STORAGE_KEYS.userRole, normalizedRole);
  }

  if (employeeData?.token) {
    window.localStorage.setItem('access_token', employeeData.token);
  }
};

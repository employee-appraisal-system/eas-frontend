import { createContext, useState, useCallback, useEffect } from 'react';
import {
  getAuthenticatedRole,
  getStoredEmployee,
  isAuthenticated,
  clearEmployeeSession,
} from '../utils/auth';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Initialise from localStorage on mount
  useEffect(() => {
    if (isAuthenticated()) {
      const employee = getStoredEmployee();
      if (employee) {
        setUser({
          employee_id: employee.employee_id,
          employee_name: employee.employee_name,
          email: employee.email,
          role: employee.role,
        });
      }
    }
  }, []);

  // Listen for logout events dispatched by the API interceptor
  useEffect(() => {
    const handleLogout = () => setUser(null);
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const updateUser = useCallback((employeeData) => {
    setUser({
      employee_id: employeeData.employee_id,
      employee_name: employeeData.employee_name,
      email: employeeData.email,
      role: employeeData.role,
    });
  }, []);

  const logout = useCallback(() => {
    clearEmployeeSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? getAuthenticatedRole(),
        isAuthenticated: !!user || isAuthenticated(),
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

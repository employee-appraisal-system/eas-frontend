import { Navigate, useLocation } from 'react-router-dom';
import { getAuthenticatedRole, isAuthenticated } from '../utils/auth';

const normalizeRole = (role) =>
  String(role ?? '')
    .trim()
    .toLowerCase();

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation();
  const role = getAuthenticatedRole();
  const authenticated = isAuthenticated();
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (
    normalizedAllowedRoles.length > 0 &&
    (!role || !normalizedAllowedRoles.includes(role))
  ) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;

import { Navigate, useLocation } from 'react-router-dom';
import { getAuthenticatedRole, getDefaultRouteForRole, isAuthenticated } from '../utils/auth';

// Strip spaces, underscores, dashes for flexible role matching
const normalizeRole = (role) =>
  String(role ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation();
  const role = getAuthenticatedRole();
  const authenticated = isAuthenticated();
  const normalizedRole = normalizeRole(role);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (
    normalizedAllowedRoles.length > 0 &&
    (!normalizedRole || !normalizedAllowedRoles.includes(normalizedRole))
  ) {
    
    const correctRoute = role ? getDefaultRouteForRole(role) : null;

    
    if (!correctRoute || correctRoute === location.pathname) {
      return children;
    }

    return <Navigate to={correctRoute} replace />;
  }

  return children;
};

export default ProtectedRoute;

import { Navigate, useLocation } from 'react-router-dom';
import {
  getAuthenticatedRole,
  getDefaultRouteForRole,
  isAuthenticated,
} from '../utils/auth';
import ROUTES from '../config/routes';

const normalizeRole = (role) =>
  String(role ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const location = useLocation();
  const role = getAuthenticatedRole();
  const authenticated = isAuthenticated();
  const normalizedRole = normalizeRole(role);
  const normalizedAllowed = allowedRoles.map(normalizeRole);

  if (!authenticated) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  if (
    normalizedAllowed.length > 0 &&
    (!normalizedRole || !normalizedAllowed.includes(normalizedRole))
  ) {
    const correctRoute = role ? getDefaultRouteForRole(role) : null;
    if (!correctRoute || correctRoute === location.pathname) return children;
    return <Navigate to={correctRoute} replace />;
  }

  return children;
}

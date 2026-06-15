import { getAuthenticatedRole } from '../utils/auth';

const normalizeRole = (role) =>
  String(role ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');

/**
 * Returns boolean helpers for role-based conditional rendering.
 * Reads directly from localStorage so it stays in sync with
 * the existing auth utility without needing React Context.
 */
export default function useRoleAccess() {
  const raw = getAuthenticatedRole();
  const role = normalizeRole(raw);

  return {
    role,
    isAdmin: role === 'admin',
    isHR: role === 'hr',
    isLead: role === 'teamlead' || role === 'lead',
    isEmployee: role === 'employee',
    /** Non-employee = admin | hr | teamlead | lead */
    isManager: ['admin', 'hr', 'teamlead', 'lead'].includes(role),
    /** HR + Admin can manage appraisal cycles */
    canManageCycles: role === 'admin' || role === 'hr',
    /** Admin + Lead can see the admin home */
    canSeeAdmin: role === 'admin',
  };
}

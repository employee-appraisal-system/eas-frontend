import { useEffect, useRef } from 'react';
import { completeSSOCallback } from '../api';
import { getDefaultRouteForRole, storeEmployeeSession } from '../utils/auth';

function SSOCallback() {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;

    hasRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      completeSSOCallback(code)
        .then((data) => {
          storeEmployeeSession({
            employee_id: data.employee_id,
            role: data.role,
            employee_name: data.employee_name,
            email: data.email,
            token: data.access_token ?? data.token,
          });

          const role = data.role;
          const targetRoute = getDefaultRouteForRole(role);

          if (role === 'HR') {
            window.location.href = targetRoute;
          } else if (role === 'Admin') {
            window.location.href = targetRoute;
          } else {
            window.location.href = targetRoute;
          }
        })
        .catch((error) => {
          console.error('SSO LOGIN ERROR', error);
        });
    }
  }, []);

  return <h2>Logging in...</h2>;
}

export default SSOCallback;

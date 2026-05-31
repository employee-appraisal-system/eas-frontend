import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeSSOCallback } from '../api';
import { getDefaultRouteForRole, storeEmployeeSession } from '../utils/auth';

function SSOCallback() {
  const hasRun = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (hasRun.current) return;

    hasRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      completeSSOCallback(code)
        .then((data) => {
          const token = data?.access_token ?? data?.token ?? data?.jwt;
          const role = data?.role ? String(data.role).toLowerCase() : '';

          if (!token) {
            navigate('/login', {
              replace: true,
              state: {
                ssoError:
                  'SSO completed but no access token was returned. Please log in with email/password.',
              },
            });
            return;
          }

          storeEmployeeSession({
            employee_id: data.employee_id,
            role,
            employee_name: data.employee_name,
            email: data.email,
            access_token: token,
          });

          const targetRoute = getDefaultRouteForRole(role);
          navigate(targetRoute, { replace: true });
        })
        .catch((error) => {
          console.error('SSO LOGIN ERROR', error);
          navigate('/login', {
            replace: true,
            state: { ssoError: 'SSO login failed. Please try again.' },
          });
        });
    }
  }, [navigate]);

  return <h2>Logging in...</h2>;
}

export default SSOCallback;

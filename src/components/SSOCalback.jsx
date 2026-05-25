import { useEffect, useRef } from 'react';
import { completeSSOCallback } from '../api';

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
          // Store employee_id and user_role consistently with normal login path
          localStorage.setItem('employee_id', data.employee_id);
          localStorage.setItem('user_role', data.role?.toLowerCase());

          const role = data.role;

          if (role === 'HR') {
            window.location.href = '/hr-home';
          } else if (role === 'Admin') {
            window.location.href = '/admin-home';
          } else {
            window.location.href = '/employee-home';
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
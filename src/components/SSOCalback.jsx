import { useEffect, useRef } from 'react';
import axios from 'axios';

function SSOCallback() {

  const hasRun = useRef(false);

  useEffect(() => {

    if (hasRun.current) return;

    hasRun.current = true;

    const params = new URLSearchParams(window.location.search);

    const code = params.get('code');

    if (code) {

      axios
        .post('http://localhost:8000/auth/sso/callback', {
          code: code,
        })
        .then((response) => {

          console.log('LOGIN SUCCESS', response.data);

          localStorage.setItem(
            'employee',
            JSON.stringify(response.data)
          );

          const role = response.data.role;

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
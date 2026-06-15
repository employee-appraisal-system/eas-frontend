import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { completeSSOCallback } from '../../api';
import { getDefaultRouteForRole, storeEmployeeSession } from '../../utils/auth';
import ROUTES from '../../config/routes';

function SSOCallbackPage() {
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
          const employee = data?.employee ?? {};
          const role = (employee?.role ?? data?.role)
            ? String(employee?.role ?? data?.role).toLowerCase()
            : '';

          if (!token) {
            navigate(ROUTES.LOGIN, {
              replace: true,
              state: {
                ssoError:
                  'SSO completed but no access token was returned. Please log in with email/password.',
              },
            });
            return;
          }

          storeEmployeeSession({
            employee_id: employee?.employee_id ?? data?.employee_id,
            role,
            employee_name: employee?.employee_name ?? data?.employee_name,
            email: data?.email ?? employee?.email,
            access_token: token,
          });

          navigate(getDefaultRouteForRole(role), { replace: true });
        })
        .catch((error) => {
          console.error('SSO LOGIN ERROR', error);
          navigate(ROUTES.LOGIN, {
            replace: true,
            state: { ssoError: 'SSO login failed. Please try again.' },
          });
        });
    }
  }, [navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        color: '#1E3A8A',
      }}
    >
      <CircularProgress color="inherit" />
      <Typography sx={{ fontWeight: 600, color: '#1E3A8A' }}>Signing you in…</Typography>
    </Box>
  );
}

export default SSOCallbackPage;

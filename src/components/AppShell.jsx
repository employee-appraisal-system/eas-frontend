import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { isAuthenticated } from '../utils/auth';
import { Box } from '@mui/material';

export default function AppShell() {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  useEffect(() => {
    const handler = () => {
      navigate('/login', { replace: true, state: { unauthorized: true } });
    };

    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [navigate]);

  if (!authenticated) {
    return <Outlet />;
  }

  return (
    <>
      <Navbar />
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Outlet />
      </Box>
    </>
  );
}

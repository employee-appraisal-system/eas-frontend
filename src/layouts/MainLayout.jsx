import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import { isAuthenticated } from '../utils/auth';
import ROUTES from '../config/routes';

export default function MainLayout() {
  const navigate = useNavigate();
  const [, setCollapsed] = useState(false);

  useEffect(() => {
    const handler = () => {
      navigate(ROUTES.LOGIN, { replace: true, state: { unauthorized: true } });
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [navigate]);

  if (!isAuthenticated()) {
    return <Outlet />;
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      <Sidebar onToggle={setCollapsed} />

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          overflow: 'auto',
          transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
          p: { xs: 1.5, sm: 2, md: 2 },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

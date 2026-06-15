import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';

/** Centered layout for login / SSO pages */
export default function AuthLayout() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: '#f5f6fa',
        p: 2,
      }}
    >
      <Outlet />
    </Box>
  );
}

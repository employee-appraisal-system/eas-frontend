import {
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  clearEmployeeSession,
  getAuthenticatedRole,
  getDefaultRouteForRole,
} from '../utils/auth';

const getNavItemsForRole = (role) => {
  const normalizedRole = String(role || '').toLowerCase();

  const hrItems = [
    { label: 'Dashboard', to: '/hr-home' },
    { label: 'Add Cycle', to: '/add-appraisal' },
    { label: 'Questionnaire', to: '/questionnaire' },
    { label: 'Lead Assessment Report', to: '/lead-assessment-report' },
    { label: 'Self Assessment Report', to: '/self-assessment-report' },
  ];

  if (normalizedRole === 'admin') {
    return [
      { label: 'Admin', to: '/admin-home' },
      { label: 'Assessment', to: '/employee-home' },
      ...hrItems,
    ];
  }

  if (normalizedRole === 'hr') {
    return hrItems;
  }

  // employee / team lead / fallback
  return [{ label: 'Assessment', to: '/employee-home' }];
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = getAuthenticatedRole();
  const navItems = getNavItemsForRole(role);

  const handleLogout = () => {
    clearEmployeeSession();
    navigate('/login', { replace: true });
  };

  const handleHome = () => {
    const target = getDefaultRouteForRole(role);
    navigate(target, { replace: true });
  };

  return (
    <AppBar position="sticky" color="primary" elevation={4} sx={{ top: 0, zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar variant="dense" sx={{ gap: 2 }}>
        <Typography
          variant="h6"
          component="button"
          onClick={handleHome}
          sx={{
            cursor: 'pointer',
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            font: 'inherit',
            fontWeight: 700,
            p: 0,
          }}
        >
          EAS
        </Typography>

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexGrow: 1,
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          }}
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;

            return (
              <Button
                key={item.to}
                color="inherit"
                onClick={() => navigate(item.to)}
                sx={{
                  textTransform: 'none',
                  fontWeight: isActive ? 700 : 500,
                  flexShrink: 0,
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Box>

        <IconButton color="inherit" aria-label="logout" onClick={handleLogout}>
          <LogoutOutlinedIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

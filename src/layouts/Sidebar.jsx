import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
  Tooltip,
  IconButton,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentIcon from '@mui/icons-material/Assignment';
import QuizIcon from '@mui/icons-material/Quiz';
import BarChartIcon from '@mui/icons-material/BarChart';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import useRoleAccess from '../hooks/useRoleAccess';
import ROUTES from '../config/routes';
import { getStoredEmployee, clearEmployeeSession } from '../utils/auth';

const SIDEBAR_BG = '#0f1b4c';
const ACTIVE_BG = 'rgba(255,255,255,0.14)';
const HOVER_BG = 'rgba(255,255,255,0.08)';
const ACTIVE_BORDER = '#60a5fa';
const TEXT_DIM = 'rgba(255,255,255,0.60)';
const TEXT_BRIGHT = '#ffffff';
const GRADIENT = 'linear-gradient(135deg, #1E3A8A 0%, #00236f 100%)';

const SIDEBAR_EXPANDED = 240;
const SIDEBAR_COLLAPSED = 64;

export default function Sidebar({ onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isHR, canManageCycles } = useRoleAccess();
  const [collapsed, setCollapsed] = useState(false);

  const employee = getStoredEmployee();
  const name = employee?.employee_name || 'User';
  // const role = employee?.role || '';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  function buildNavItems() {
    const items = [];

    // Admin Panel — admin only
    if (isAdmin) {
      items.push({
        label: 'Admin Panel',
        icon: <AdminPanelSettingsIcon fontSize="small" />,
        path: ROUTES.ADMIN_HOME,
      });
    }


    // Self Assessment — visible to admin, employees, and leads; hidden from HR
    if (!isHR) {
      items.push({
        label: 'Self Assessment',
        icon: <SelfImprovementIcon fontSize="small" />,
        path: ROUTES.EMPLOYEE_HOME,
      });
    }

    // HR / Admin specific items
    if (canManageCycles) {
      items.push(
        {
          label: 'Appraisal Cycles',
          icon: <HomeIcon fontSize="small" />,
          path: ROUTES.HR_HOME,
        },
        {
          label: 'Questionnaire',
          icon: <QuizIcon fontSize="small" />,
          path: ROUTES.QUESTIONNAIRE,
        },
        {
          label: 'Lead Assessments',
          icon: <PersonSearchIcon fontSize="small" />,
          path: ROUTES.LEAD_ASSESSMENT_REPORT,
        },
        {
          label: 'Self Assessments',
          icon: <BarChartIcon fontSize="small" />,
          path: ROUTES.SELF_ASSESSMENT_REPORT,
        }
      );
    }

    return items;
  }

  const navItems = buildNavItems();

  function handleToggle() {
    const next = !collapsed;
    setCollapsed(next);
    onToggle?.(next);
  }

  function handleLogout() {
    clearEmployeeSession();
    navigate(ROUTES.LOGIN, { replace: true });
  }

  const width = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  const isActive = (path) => {
    if (path === ROUTES.EMPLOYEE_HOME)
      return location.pathname === ROUTES.EMPLOYEE_HOME;
    return location.pathname.startsWith(path);
  };

  return (
    <Box
      sx={{
        width,
        minHeight: '100vh',
        bgcolor: SIDEBAR_BG,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '2px 0 12px rgba(0,0,0,0.20)',
      }}
    >
      {/* ── Logo / App name ── */}
      <Box
        sx={{
          px: collapsed ? 0 : 2,
          pt: 2,
          pb: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 1,
          flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          minHeight: 56,
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            background: GRADIENT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AssignmentIcon sx={{ color: '#fff', fontSize: 18 }} />
        </Box>
        {!collapsed && (
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: 16,
              color: TEXT_BRIGHT,
              letterSpacing: '0.03em',
              whiteSpace: 'nowrap',
            }}
          >
            EAS
          </Typography>
        )}
      </Box>

      {/* ── User profile ── */}
      <Box
        sx={{
          px: collapsed ? 0 : 2,
          py: 1.5,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: 60,
          flexShrink: 0,
          gap: 1,
        }}
      >
        {/* Avatar + name (hidden text when collapsed) */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? 0 : 1.5,
            overflow: 'hidden',
            flex: collapsed ? 'none' : 1,
            minWidth: 0,
          }}
        >
          <Tooltip title={collapsed ? name : ''} placement="right">
            <Avatar
              sx={{
                width: 34,
                height: 34,
                fontSize: 13,
                fontWeight: 800,
                borderRadius: 1.5,
                background: GRADIENT,
                flexShrink: 0,
                cursor: 'default',
              }}
            >
              {initials}
            </Avatar>
          </Tooltip>

          {!collapsed && (
            <Box sx={{ overflow: 'hidden', minWidth: 0 }}>
              <Typography
                sx={{ fontWeight: 700, fontSize: 13.5, color: TEXT_BRIGHT, lineHeight: 1.2 }}
                noWrap
              >
                {name}
              </Typography>
            
            </Box>
          )}
        </Box>

        {/* Collapse toggle — only shown in expanded state inside profile row */}
        {!collapsed && (
          <Tooltip title="Collapse" placement="right">
            <IconButton
              onClick={handleToggle}
              size="small"
              sx={{
                flexShrink: 0,
                color: 'rgba(255,255,255,0.45)',
                '&:hover': { color: TEXT_BRIGHT, bgcolor: HOVER_BG },
              }}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* ── Expand button when collapsed (own row, no overlap) ── */}
      {collapsed && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            pt: 1,
            pb: 0.5,
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <Tooltip title="Expand" placement="right">
            <IconButton
              onClick={handleToggle}
              size="small"
              sx={{
                color: 'rgba(255,255,255,0.45)',
                '&:hover': { color: TEXT_BRIGHT, bgcolor: HOVER_BG },
              }}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* ── Navigation items ── */}
      <List sx={{ px: collapsed ? 0.5 : 1.5, py: 1.5, flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          const btnSx = {
            borderRadius: 1.5,
            mb: 0.5,
            px: collapsed ? 0 : 1.5,
            py: 1,
            justifyContent: collapsed ? 'center' : 'flex-start',
            color: active ? TEXT_BRIGHT : TEXT_DIM,
            bgcolor: active ? `${ACTIVE_BG} !important` : 'transparent',
            borderRight: `3px solid ${active ? ACTIVE_BORDER : 'transparent'}`,
            '&:hover': { bgcolor: HOVER_BG, color: TEXT_BRIGHT },
            transition: 'all 0.15s',
            minHeight: 40,
          };

          if (collapsed) {
            return (
              <Tooltip key={item.label} title={item.label} placement="right">
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={active}
                  sx={btnSx}
                >
                  <ListItemIcon
                    sx={{ minWidth: 0, color: 'inherit', justifyContent: 'center' }}
                  >
                    {item.icon}
                  </ListItemIcon>
                </ListItemButton>
              </Tooltip>
            );
          }

          return (
            <ListItemButton
              key={item.label}
              onClick={() => navigate(item.path)}
              selected={active}
              sx={btnSx}
            >
              <ListItemIcon
                sx={{ minWidth: 34, color: 'inherit', justifyContent: 'center' }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography sx={{ fontSize: 13.5, fontWeight: active ? 700 : 400, color: 'inherit' }}>
                    {item.label}
                  </Typography>
                }
              />
            </ListItemButton>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* ── Logout ── */}
      <List sx={{ px: collapsed ? 0.5 : 1.5, py: 1, flexShrink: 0 }}>
        {collapsed ? (
          <Tooltip title="Logout" placement="right">
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: 1.5,
                px: 0,
                py: 0.8,
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.50)',
                '&:hover': { color: TEXT_BRIGHT, bgcolor: HOVER_BG },
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, color: 'inherit', justifyContent: 'center' }}>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>
        ) : (
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 1.5,
              px: 1.5,
              py: 0.8,
              color: 'rgba(255,255,255,0.50)',
              '&:hover': { color: TEXT_BRIGHT, bgcolor: HOVER_BG },
            }}
          >
            <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={<Typography sx={{ fontSize: 13, color: 'inherit' }}>Logout</Typography>}
            />
          </ListItemButton>
        )}
      </List>
    </Box>
  );
}

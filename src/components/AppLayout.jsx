import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  CssBaseline,
  Divider,
  Toolbar,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssessmentIcon from '@mui/icons-material/Assessment';

// Width of the drawer when open
const drawerWidth = 240;

/**
 * AppLayout component that adds a sidebar navigation
 * @param {Object} props
 * @param {React.ReactNode} props.children - The page content to render
 * @param {Function} props.onNavigate - Function to call when a nav item is clicked
 * @param {string} props.activePage - ID of the currently active page
 */
const AppLayout = ({ children, onNavigate, activePage }) => {
  const [open, setOpen] = useState(false);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const Toolbar = (props) => <div style={{ padding: '16px' }} {...props} />;
  const menuItems = [
    {
      text: 'Appraisal Cycle Setup',
      icon: <DashboardIcon />,
      id: 'hr-dashboard',
    },
    {
      text: 'Assessment',
      icon: <AssessmentIcon />,
      id: 'assessment',
    },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography
          variant="h6"
          noWrap
          component="div"
          color="primary"
          sx={{ fontWeight: 'bold', textAlign: 'center' }}
        >
          Admin Panel
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={activePage === item.id}
              onClick={() => {
                onNavigate(item.id);
                handleDrawerToggle(); // Always close drawer on click
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* Toggle button for the drawer */}
      <Box sx={{ position: 'fixed', top: 0, left: 16, zIndex: 1200 }}>
        <IconButton
          color="primary"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{
            backgroundColor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
            },
          }}
        >
          <MenuIcon />
        </IconButton>
      </Box>

      <Drawer
        variant="temporary"
        open={open}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default AppLayout;

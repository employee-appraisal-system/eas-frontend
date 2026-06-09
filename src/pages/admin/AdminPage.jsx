import { Box, Typography, Card, CardContent } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

/**
 * Admin home page – replaces old MainPage.jsx that used AppLayout.
 * Additional admin features can be added here as needed.
 */
const AdminPage = () => {
  return (
    <Card sx={{ width: '100%' }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
            mb: 2,
          }}
        >
          <Typography variant="h6" color="primary" fontWeight="bold">
            Admin Panel
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
            color: 'text.secondary',
          }}
        >
          <AdminPanelSettingsIcon sx={{ fontSize: 64, mb: 2, color: 'primary.light', opacity: 0.7 }} />
          <Typography variant="h6" color="text.secondary">
            Admin Dashboard
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
            Administration features will appear here.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AdminPage;

import { Box, Typography, Card, CardContent } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

/**
 * Admin home page – replaces old MainPage.jsx that used AppLayout.
 * Additional admin features can be added here as needed.
 */
const AdminPage = () => {
  return (
    <>
      {/* Page header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          pb: 2,
          mb: 2,
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Admin Panel
          </Typography>
        </Box>
      </Box>

      <Card sx={{ width: '100%' }}>
        <CardContent>
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
    </>
  );
};

export default AdminPage;

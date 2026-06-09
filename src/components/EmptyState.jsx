
import { Box, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export default function EmptyState({ 
  title = 'No Data Found', 
  message = 'There are no items to display at the moment.',
  icon: Icon = InfoOutlinedIcon
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '220px',
        padding: 4,
        textAlign: 'center',
        backgroundColor: '#FCFDFD',
        border: '1px dashed #E5E7EB',
        borderRadius: 2,
        gap: 1.5,
        my: 2,
      }}
    >
      <Icon sx={{ fontSize: 48, color: 'text.disabled' }} />
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 360 }}>
          {message}
        </Typography>
      </Box>
    </Box>
  );
}

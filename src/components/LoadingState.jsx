
import { Box, CircularProgress, Typography } from '@mui/material';

export default function LoadingState({ message = 'Loading data, please wait...' }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        padding: 4,
        gap: 2,
      }}
    >
      <CircularProgress color="primary" size={40} thickness={4} />
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
        {message}
      </Typography>
    </Box>
  );
}

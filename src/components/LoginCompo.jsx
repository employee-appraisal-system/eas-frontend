import { useState } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Modal,
  Box,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { loginAuth, getSSOLoginUrl } from '../api';
import CardMedia from '@mui/material/CardMedia';
import logo from '../assets/titled_logo.jpg';
import MicrosoftIcon from '@mui/icons-material/Microsoft';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await loginAuth(email, password);

      if (response.message === 'Login successful') {
        const userRole = response.role.toLowerCase();
        localStorage.setItem('employee_id', response.employee_id); // Store ID
        localStorage.setItem('user_role', userRole); // Store role

        // Redirect based on role
        if (userRole === 'hr') {
          navigate('/hr-home'); // HR landing page
        } else if (userRole === 'admin') {
          navigate('/admin-home'); // admin landing page (Can see both appraisal cycle steup and assessment)
        } else {
          navigate('/employee-home'); // Employee landing page
        }
      } else {
        setError(response.detail || 'Invalid credentials');
        setOpen(true);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      setOpen(true);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      const data = await getSSOLoginUrl();
      window.location.href = data.login_url;
    } catch (err) {
      console.error('SSO Login Error:', err);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      <Card sx={{ width: 300, p: 2 }}>
        <CardMedia
          component="img"
          height="40"
          sx={{ objectFit: 'contain' }}
          image={logo}
          alt="Company logo"
        />
        <CardContent>
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleLogin}
            disabled={loading}
            sx={{ mt: 2, p: 1 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
          </Button>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<MicrosoftIcon />}
            onClick={handleMicrosoftLogin}
            sx={{
              mt: 2,
              p: 1.2,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 'bold',
            }}
          >
            Continue with Microsoft
          </Button>
        </CardContent>
      </Card>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            p: 3,
          }}
        >
          <Typography>{error}</Typography>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default Login;

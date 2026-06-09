import { useState } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  Typography,
  Divider,
} from '@mui/material';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { loginAuth, getSSOLoginUrl } from '../../api';
import CardMedia from '@mui/material/CardMedia';
import logo from '../../assets/titled_logo.jpg';
import MicrosoftIcon from '@mui/icons-material/Microsoft';
import {
  getAuthenticatedRole,
  getDefaultRouteForRole,
  isAuthenticated,
  storeEmployeeSession,
} from '../../utils/auth';


const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const navigate = useNavigate();
  const location = useLocation();
  const isUnauthorized = Boolean(location.state?.unauthorized);
  const ssoError = location.state?.ssoError;

  const authenticated = isAuthenticated();
  const role = getAuthenticatedRole();
  const defaultRoute = role ? getDefaultRouteForRole(role) : null;

  const emailError = touched.email && !String(email).trim() ? 'Email is required' : '';
  const passwordError =
    touched.password && !String(password).trim() ? 'Password is required' : '';

  const handleLogin = async () => {
    setTouched({ email: true, password: true });
    if (!String(email).trim() || !String(password).trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await loginAuth(email, password);
      const token = response?.access_token ?? response?.token ?? response?.jwt;
      const employee = response?.employee;
      const employeeId = employee?.employee_id;
      const employeeName = employee?.employee_name;
      const userRole = employee?.role ? String(employee.role).toLowerCase() : '';

      if (!token || !employeeId || !userRole) {
        setError(response?.detail || 'Invalid credentials');
        return;
      }

      storeEmployeeSession({
        employee_id: employeeId,
        role: userRole,
        employee_name: employeeName,
        email,
        access_token: token,
      });

      const intendedRoute = location.state?.from?.pathname;
      navigate(intendedRoute || getDefaultRouteForRole(userRole), { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      const data = await getSSOLoginUrl();
      window.location.href = data.login_url;
    } catch (err) {
      setError(
        err?.message ? `SSO login failed: ${err.message}` : 'SSO login failed. Please try again.'
      );
    }
  };

  if (authenticated && defaultRoute && !isUnauthorized) {
    return <Navigate to={defaultRoute} replace />;
  }

  return (
    <Card
      sx={{
        width: '100%',
        maxWidth: 400,
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(15,27,76,0.12)',
        overflow: 'hidden',
      }}
    >
      {/* Header band */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1E3A8A 0%, #00236f 100%)',
          py: 3,
          px: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <CardMedia
          component="img"
          sx={{ height: 44, objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.92 }}
          image={logo}
          alt="Company logo"
        />
        <Typography
          variant="h6"
          sx={{ color: '#fff', fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em' }}
        >
          Employee Appraisal System
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
          Sign in to your account
        </Typography>
      </Box>

      <CardContent sx={{ p: 3 }}>
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!loading) handleLogin();
          }}
          noValidate
        >
          {(isUnauthorized || ssoError) && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {ssoError || 'Session expired. Please log in again.'}
            </Alert>
          )}

          {error && !(isUnauthorized || ssoError) && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="username"
            autoFocus
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
            error={Boolean(emailError)}
            helperText={emailError || ' '}
            disabled={loading}
            size="small"
          />

          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
            error={Boolean(passwordError)}
            helperText={passwordError || ' '}
            disabled={loading}
            size="small"
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              mt: 1.5,
              py: 1.1,
              fontWeight: 700,
              fontSize: 14,
              background: 'linear-gradient(135deg, #1E3A8A 0%, #2d4fd6 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #163070 0%, #2240c0 100%)',
              },
            }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
          </Button>

          <Divider sx={{ my: 2, color: 'text.secondary', fontSize: 12 }}>or</Divider>

          <Button
            type="button"
            variant="outlined"
            fullWidth
            startIcon={<MicrosoftIcon />}
            onClick={handleMicrosoftLogin}
            disabled={loading}
            sx={{
              py: 1.1,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#1E3A8A',
              color: '#1E3A8A',
              '&:hover': { borderColor: '#163070', bgcolor: 'rgba(30,58,138,0.04)' },
            }}
          >
            Continue with Microsoft
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LoginPage;

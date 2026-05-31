import { useState } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { loginAuth, getSSOLoginUrl } from '../api';
import CardMedia from '@mui/material/CardMedia';
import logo from '../assets/titled_logo.jpg';
import MicrosoftIcon from '@mui/icons-material/Microsoft';
import {
  getAuthenticatedRole,
  getDefaultRouteForRole,
  isAuthenticated,
  storeEmployeeSession,
} from '../utils/auth';

const Login = () => {
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

  const emailError =
    touched.email && !String(email).trim() ? 'Email is required' : '';
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
      const userRole = employee?.role
        ? String(employee.role).toLowerCase()
        : '';

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
      navigate(intendedRoute || getDefaultRouteForRole(userRole), {
        replace: true,
      });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      const data = await getSSOLoginUrl();
      window.location.href = data.login_url;
    } catch (err) {
      setError(
        err?.message
          ? `SSO login failed: ${err.message}`
          : 'SSO login failed. Please try again.'
      );
    }
  };

  return authenticated && defaultRoute && !isUnauthorized ? (
    <Navigate to={defaultRoute} replace />
  ) : (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 360, p: 2 }}>
        <CardMedia
          component="img"
          height="40"
          sx={{ objectFit: 'contain' }}
          image={logo}
          alt="Company logo"
        />
        <CardContent>
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!loading) handleLogin();
            }}
            noValidate
          >
            {(isUnauthorized || ssoError) && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {ssoError || 'Session expired. Please log in again.'}
              </Alert>
            )}

            {error && !(isUnauthorized || ssoError) && (
              <Alert severity="error" sx={{ mb: 2 }}>
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
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              sx={{ mt: 1.5, py: 1 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Login'
              )}
            </Button>

            <Button
              type="button"
              variant="outlined"
              fullWidth
              startIcon={<MicrosoftIcon />}
              onClick={handleMicrosoftLogin}
              disabled={loading}
              sx={{
                mt: 2,
                py: 1.1,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
              }}
            >
              Continue with Microsoft
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;

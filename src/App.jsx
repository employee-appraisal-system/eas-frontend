import {
  BrowserRouter as Router,
  Navigate,
  Routes,
  Route,
} from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './layouts/ProtectedRoute';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import SSOCallbackPage from './pages/auth/SSOCallbackPage';

// Appraisal pages
import AppraisalCyclePage from './pages/appraisal/AppraisalCyclePage';
import AddAppraisalPage from './pages/appraisal/AddAppraisalPage';
import EditAppraisalPage from './pages/appraisal/EditAppraisalPage';

// Assessment pages
import AssessmentPage from './pages/assessment/AssessmentPage';
import HistoricalReportPage from './pages/assessment/HistoricalReportPage';

// Reports pages
import SelfAssessmentReportPage from './pages/reports/SelfAssessmentReportPage';

// Admin pages
import AdminPage from './pages/admin/AdminPage';

// Questionnaire (stays in components — complex, imported from there)
import Questionnaire from './components/Questionnaire';

// Auth provider
import AuthProvider from './auth/AuthContext';

// Global CSS
import './assets/styles/global.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1E3A8A', // Deep Indigo/Blue
      light: '#3B82F6',
      dark: '#172554',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#10B981', // Emerald green
      light: '#34D399',
      dark: '#065F46',
      contrastText: '#ffffff',
    },
    error: {
      main: '#EF4444',
      light: '#FCA5A5',
      dark: '#B91C1C',
    },
    warning: {
      main: '#F59E0B',
      light: '#FDE047',
      dark: '#B45309',
    },
    success: {
      main: '#10B981',
      light: '#A7F3D0',
      dark: '#047857',
    },
    grey: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    background: {
      default: '#F3F4F6', // Tailwind gray-100 for premium modern background
      paper: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: '#4B5563',
      disabled: '#9CA3AF',
    },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h1: { fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.025em', color: '#111827' },
    h2: { fontSize: '1.875rem', fontWeight: 700, letterSpacing: '-0.025em', color: '#111827' },
    h3: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em', color: '#111827' },
    h4: { fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.015em', color: '#111827' },
    h5: { fontSize: '1.125rem', fontWeight: 600, color: '#111827' },
    h6: { fontSize: '1rem', fontWeight: 600, color: '#111827' },
    body1: { fontSize: '1rem', lineHeight: 1.5, color: '#374151' },
    body2: { fontSize: '0.875rem', lineHeight: 1.5, color: '#4B5563' },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    ...Array(20).fill('0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'),
  ],
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '6px 16px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        containedPrimary: {
          backgroundColor: '#1E3A8A',
          '&:hover': {
            backgroundColor: '#172554',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
          border: '1px solid #E5E7EB',
          borderRadius: 8,
          overflow: 'visible',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
        variant: 'outlined',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          backgroundColor: '#FFFFFF',
          transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: '2px',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #E5E7EB',
          padding: '12px 16px',
        },
        head: {
          fontWeight: 700,
          backgroundColor: '#F9FAFB',
          color: '#374151',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: '1px solid #E5E7EB',
          borderRadius: 8,
          backgroundColor: '#FFFFFF',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#F9FAFB',
            borderBottom: '1px solid #E5E7EB',
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #F3F4F6',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: '#F9FAFB',
          },
        },
      },
    },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router>
          <CssBaseline />
          <Routes>
            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Auth routes (centered layout, no sidebar) */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<SSOCallbackPage />} />
            </Route>

            {/* Protected routes with sidebar layout */}
            <Route element={<MainLayout />}>
              <Route
                path="/hr-home"
                element={
                  <ProtectedRoute allowedRoles={['hr', 'admin']}>
                    <AppraisalCyclePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employee-home"
                element={
                  <ProtectedRoute allowedRoles={['employee', 'team lead', 'lead', 'admin']}>
                    <AssessmentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-home"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/add-appraisal"
                element={
                  <ProtectedRoute allowedRoles={['hr', 'admin']}>
                    <AddAppraisalPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit-appraisal/:cycle_id"
                element={
                  <ProtectedRoute allowedRoles={['hr', 'admin']}>
                    <EditAppraisalPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/questionnaire"
                element={
                  <ProtectedRoute allowedRoles={['hr', 'admin']}>
                    <Questionnaire />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lead-assessment-report"
                element={
                  <ProtectedRoute allowedRoles={['hr', 'admin']}>
                    <HistoricalReportPage />
                  </ProtectedRoute>
                }
              />
              {/* Legacy redirect */}
              <Route
                path="/historical-report"
                element={<Navigate to="/lead-assessment-report" replace />}
              />
              <Route
                path="/self-assessment-report"
                element={
                  <ProtectedRoute allowedRoles={['hr', 'admin']}>
                    <SelfAssessmentReportPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch-all → login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

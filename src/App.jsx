import {
  BrowserRouter as Router,
  Navigate,
  Routes,
  Route,
} from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import AddAppraisalCycle from './components/AddAppraisalCycle';
import EditAppraisalCycle from './components/EditAppraisalCycle';
import Questionnaire from './components/Questionnaire';
import HRLandingPage from './components/HRLandingPage';
import Login from './components/LoginCompo';
import LeadAssessmentReportTable from './components/HistoricalReport';
import ProtectedRoute from './components/ProtectedRoute';
import SelfAssessmentRepo from './components/SelfAssessmentRepo';
import DropdownPage from './components/employee_assessment';
import MainPage from './components/MainPage';
import SSOCallback from './components/SSOCalback';
import AppShell from './components/AppShell';

export default function App() {
  return (
    <Router>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<SSOCallback />} />

        <Route element={<AppShell />}>
          <Route
            path="/hr-home"
            element={
              <ProtectedRoute allowedRoles={['hr', 'admin']}>
                <HRLandingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee-home"
            element={
              <ProtectedRoute allowedRoles={['employee', 'team lead', 'lead', 'admin']}>
                <DropdownPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-home"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MainPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-appraisal"
            element={
              <ProtectedRoute allowedRoles={['hr', 'admin']}>
                <AddAppraisalCycle />
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
                <LeadAssessmentReportTable />
              </ProtectedRoute>
            }
          />
          <Route
            path="/historical-report"
            element={<Navigate to="/lead-assessment-report" replace />}
          />
          <Route
            path="/edit-appraisal/:cycle_id"
            element={
              <ProtectedRoute allowedRoles={['hr', 'admin']}>
                <EditAppraisalCycle />
              </ProtectedRoute>
            }
          />
          <Route
            path="/self-assessment-report"
            element={
              <ProtectedRoute allowedRoles={['hr', 'admin']}>
                <SelfAssessmentRepo />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

import { useState, useEffect, useCallback } from 'react';
import {
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  Typography,
  TextField,
  Tooltip,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Button,
  FormGroup,
} from '@mui/material';
import LeadAssessmentModal from '../../components/LeadAssessmentModal';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import { IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import {
  fetchEmployeeDetails,
  fetchTeamLeadCycles,
  fetchReportingEmployees,
  fetchReportingManager,
  fetchAssessmentCycles,
  fetchCycleEmployees,
  fetchSelfAssessmentStage,
  fetchLeadAssessmentStage,
  fetchAssessmentQuestions,
  fetchAssessmentResponses,
  submitAssessment,
} from '../../api';

const AssessmentPage = () => {
  const [appraisalCycles, setAppraisalCycles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [teamLeadName, setTeamLeadName] = useState('');
  const [userRole, setUserRole] = useState('');
  const employeeId = localStorage.getItem('employee_id');
  const [isModalOpen, setModalOpen] = useState(false);
  const [isCycleActive, setIsCycleActive] = useState(false);
  const [assessmentData, setAssessmentData] = useState([]);
  const [responses, setResponses] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [loadingCycles, setLoadingCycles] = useState(true);
  const [isReadOnly, setReadOnly] = useState(true);
  const [isLeadAssessmentDisabled, setIsLeadAssessmentDisabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leadAssessmentActive, setLeadAssessmentActive] = useState(false);
  const [leadAssessmentCompleted, setLeadAssessmentCompleted] = useState(false);
  const [modalSelectedEmployee, setModalSelectedEmployee] = useState('');
  const [initialLoadCompleted, setInitialLoadCompleted] = useState(false);

  const checkLeadAssessmentStage = useCallback(async (cycleId) => {
    if (!cycleId) return;
    try {
      const selfAssessmentData = await fetchSelfAssessmentStage(cycleId);
      const { is_active: selfAssessmentActive, is_completed: selfAssessmentCompleted } = selfAssessmentData;
      const leadAssessmentData = await fetchLeadAssessmentStage(cycleId);
      const { is_active, is_completed } = leadAssessmentData;
      setLeadAssessmentActive(is_active);
      setLeadAssessmentCompleted(is_completed);
      if ((selfAssessmentActive && !selfAssessmentCompleted) || (!is_active && !is_completed)) {
        setIsLeadAssessmentDisabled(true);
      } else {
        setIsLeadAssessmentDisabled(false);
      }
    } catch (err) {
      console.error('Failed to fetch stage info:', err);
      setIsLeadAssessmentDisabled(true);
    }
  }, []);

  useEffect(() => {
    if (!employeeId) return;
    const fetchUserRoleAndCycles = async () => {
      try {
        const userData = await fetchEmployeeDetails(employeeId);
        const role = localStorage.getItem('user_role') || userData.role.toLowerCase();
        setUserRole(role);
        setLoadingCycles(true);

        if (role === 'team lead' || role === 'lead' || role === 'admin') {
          const [cycles, reportingEmployees, managerData] = await Promise.all([
            fetchTeamLeadCycles(employeeId),
            fetchReportingEmployees(employeeId),
            fetchReportingManager(employeeId),
          ]);
          setAppraisalCycles(cycles);
          const activeCycle = cycles.find((cycle) => cycle.status === 'active');
          if (activeCycle) {
            setSelectedCycle(activeCycle.cycle_id);
            setIsCycleActive(true);
            try {
              if (reportingEmployees.length > 0) {
                setEmployees(reportingEmployees);
                setSelectedEmployee(employeeId);
              } else {
                setEmployees([]);
              }
            } catch (err) {
              console.error('Error fetching employees: ', err);
              setEmployees([]);
            }
            const { reporting_manager_id, reporting_manager_name } = managerData;
            setTeamLeadName(`${reporting_manager_id} - ${reporting_manager_name}`);
            await checkLeadAssessmentStage(activeCycle.cycle_id);
          }
        } else {
          const cyclesData = await fetchAssessmentCycles(employeeId);
          setAppraisalCycles(cyclesData);
          const activeCycle = cyclesData.find((cycle) => cycle.status === 'active');
          if (activeCycle) {
            setSelectedCycle(activeCycle.cycle_id);
            setIsCycleActive(true);
            setSelectedEmployee(employeeId);
            setEmployees([{ id: Number(employeeId), full_name: 'Self' }]);
            const managerData = await fetchReportingManager(employeeId);
            const { reporting_manager_id, reporting_manager_name } = managerData;
            setTeamLeadName(`${reporting_manager_id} - ${reporting_manager_name}`);
          }
        }
      } catch (error) {
        console.error('Error fetching user role or cycles:', error);
      } finally {
        setLoadingCycles(false);
        setInitialLoadCompleted(true);
      }
    };
    fetchUserRoleAndCycles();
  }, [employeeId, checkLeadAssessmentStage]);

  useEffect(() => {
    const fetchAssessmentDataAndResponses = async () => {
      if (!selectedCycle || !selectedEmployee) return;
      const questionOwnerId = selectedEmployee;
      const responseOwnerId = selectedEmployee;
      try {
        if (isCycleActive) {
          const stageData = await fetchSelfAssessmentStage(selectedCycle);
          const { is_active, is_completed } = stageData;
          if (!is_active && !is_completed) {
            setAssessmentData([]);
            setResponses({});
            return;
          }
          if (is_completed) { setReadOnly(true); } else { setReadOnly(false); }
        }
        const [questions, responseData] = await Promise.all([
          fetchAssessmentQuestions(questionOwnerId, selectedCycle),
          fetchAssessmentResponses(responseOwnerId, selectedCycle).catch((err) => {
            if (err.status === 404) return [];
            throw err;
          }),
        ]);
        setAssessmentData(questions || []);
        try {
          const previous = {};
          (responseData || []).forEach((res) => {
            previous[res.question_id] = res.option_ids?.length > 0 ? res.option_ids : res.response_text?.[0] || '';
          });
          setResponses(previous);
        } catch (err) {
          if (err.response?.status === 404) { setResponses({}); }
          else { console.error('Error fetching responses:', err); }
        }
      } catch (error) {
        console.error('Error fetching assessment questions:', error);
        setAssessmentData([]);
        setResponses({});
      }
    };
    fetchAssessmentDataAndResponses();
  }, [selectedCycle, selectedEmployee, userRole, employeeId, isCycleActive]);

  useEffect(() => {
    if (!selectedCycle || !initialLoadCompleted) return;
    if ((userRole === 'team lead' || userRole === 'lead' || userRole === 'admin') && isCycleActive) {
      checkLeadAssessmentStage(selectedCycle);
    }
  }, [selectedCycle, initialLoadCompleted, userRole, isCycleActive, checkLeadAssessmentStage]);

  const openModal = () => { setModalSelectedEmployee(selectedEmployee); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);

  const handleEmployeeChange = async (e) => {
    const empId = e.target.value;
    setSelectedEmployee(empId);
    setTeamLeadName('');
    setAssessmentData([]);
    setResponses({});
    try {
      const managerData = await fetchReportingManager(empId);
      const { reporting_manager_id, reporting_manager_name } = managerData;
      setTeamLeadName(`${reporting_manager_id} - ${reporting_manager_name}`);
    } catch (err) {
      console.error('Error fetching reporting manager:', err);
    }
  };

  const handleCycleChange = async (e) => {
    const cycleId = e.target.value;
    setSelectedCycle(cycleId);
    try {
      const selectedCycleObj = appraisalCycles.find((cycle) => cycle.cycle_id === cycleId);
      if (selectedCycleObj) setIsCycleActive(selectedCycleObj.status === 'active');
      const managerData = await fetchReportingManager(employeeId);
      let employeesData = employees;
      if (userRole === 'team lead' || userRole === 'lead' || userRole === 'admin') {
        employeesData = await fetchCycleEmployees(cycleId, employeeId);
      } else {
        employeesData = [{ id: Number(employeeId), full_name: 'Self' }];
      }
      if (userRole === 'team lead' || userRole === 'lead' || userRole === 'admin') {
        await checkLeadAssessmentStage(cycleId);
      }
      setEmployees(employeesData);
      setSelectedEmployee(employeeId);
      const { reporting_manager_id, reporting_manager_name } = managerData;
      setTeamLeadName(`${reporting_manager_id} - ${reporting_manager_name}`);
    } catch (error) {
      console.error('Error handling cycle change:', error);
      const selectedCycleObj = appraisalCycles.find((cycle) => cycle.cycle_id === cycleId);
      if (selectedCycleObj) setIsCycleActive(selectedCycleObj.status === 'active');
    }
  };

  const canUserSubmit = () => {
    if (userRole !== 'team lead' && userRole !== 'lead' && userRole !== 'admin' && String(selectedEmployee) === String(employeeId)) return isCycleActive;
    if ((userRole === 'team lead' || userRole === 'lead' || userRole === 'admin') && String(selectedEmployee) === String(employeeId)) return isCycleActive;
    if (isReadOnly) return true;
    return false;
  };

  const handleResponseChange = (questionId, value) => {
    setResponses((prevResponses) => ({ ...prevResponses, [questionId]: value }));
  };

  const renderInputField = (question) => {
    const { question_id, question_type, options = [] } = question;
    const isViewingOtherEmployee = (userRole === 'team lead' || userRole === 'lead' || userRole === 'admin') && String(selectedEmployee) !== String(employeeId);
    const isDisabled = !isCycleActive || isViewingOtherEmployee || isReadOnly;

    switch (question_type.toLowerCase()) {
      case 'mcq':
        return (
          <Box sx={{ mt: 1 }}>
            <FormGroup>
              {options.map((option) => {
                const prev = responses[question_id];
                const prevArray = Array.isArray(prev) ? prev : [];
                const checked = prevArray.some((id) => Number(id) === Number(option.option_id));
                return (
                  <FormControlLabel key={option.option_id}
                    control={<Checkbox checked={checked} onChange={(e) => {
                      const wasChecked = checked;
                      const base = Array.isArray(responses[question_id]) ? responses[question_id] : [];
                      let newValue;
                      if (e.target.checked && !wasChecked) {
                        newValue = [...base.map((v) => Number(v)), Number(option.option_id)];
                      } else {
                        newValue = base.map((v) => Number(v)).filter((id) => id !== Number(option.option_id));
                      }
                      handleResponseChange(question_id, newValue);
                    }} disabled={isDisabled} />}
                    label={option.option_text}
                  />
                );
              })}
            </FormGroup>
          </Box>
        );
      case 'single choice':
      case 'yes/no':
        return (
          <Box sx={{ mt: 1 }}>
            <RadioGroup value={responses[question_id] || ''} onChange={(e) => handleResponseChange(question_id, e.target.value)}>
              {options.map((option) => (
                <FormControlLabel key={option.option_id} value={option.option_id} control={<Radio disabled={isDisabled} />} label={option.option_text} />
              ))}
            </RadioGroup>
          </Box>
        );
      case 'descriptive':
        return (
          <Box sx={{ mt: 1 }}>
            <TextField multiline minRows={3} fullWidth value={responses[question_id] || ''} onChange={(e) => handleResponseChange(question_id, e.target.value)} disabled={isDisabled} variant="outlined" size="small" />
          </Box>
        );
      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const payload = assessmentData.map((question) => {
        const response = responses[question.question_id];
        const question_type = question.question_type.toLowerCase();
        if (question_type === 'mcq') {
          return { question_id: question.question_id, allocation_id: question.allocation_id, cycle_id: selectedCycle, employee_id: selectedEmployee, option_ids: response || [], response_text: null };
        } else if (['single choice', 'yes/no'].includes(question_type)) {
          return { question_id: question.question_id, allocation_id: question.allocation_id, cycle_id: selectedCycle, employee_id: selectedEmployee, option_ids: [Number(response)], response_text: null };
        } else if (question_type === 'descriptive') {
          return { question_id: question.question_id, allocation_id: question.allocation_id, cycle_id: selectedCycle, employee_id: selectedEmployee, option_ids: [], response_text: [response] };
        } else {
          return null;
        }
      }).filter(Boolean);
      await submitAssessment(payload);
      setSnackbarMessage('Responses submitted successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch {
      setSnackbarMessage('Failed to submit responses.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const refreshAssessmentData = async () => {
    if (!selectedCycle || !selectedEmployee) return;
    try {
      const questionsData = await fetchAssessmentQuestions(selectedEmployee, selectedCycle);
      setAssessmentData(questionsData || []);
      try {
        const responseData = await fetchAssessmentResponses(selectedEmployee, selectedCycle);
        const previous = {};
        (responseData || []).forEach((res) => {
          previous[res.question_id] = res.option_ids?.length > 0 ? res.option_ids : res.response_text?.[0] || '';
        });
        setResponses(previous);
      } catch (err) {
        if (err.status === 404) { setResponses({}); }
        else { console.error('Error fetching responses:', err); }
      }
    } catch (err) {
      console.error('Error refreshing assessment data:', err);
      setAssessmentData([]);
      setResponses({});
    }
  };

  return (
    <>
      <Card sx={{ width: '100%', mb: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap',
              pb: 2,
              mb: 3,
              borderBottom: '1px solid #E5E7EB',
            }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                Self Assessment
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Fill out and submit your appraisal questions for the active cycle.
              </Typography>
            </Box>
          </Box>

          {loadingCycles ? (
            <LoadingState message="Loading appraisal cycles and employee assignments..." />
          ) : (
            <>
              {/* Controls bar */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  mb: 4,
                  p: 2,
                  backgroundColor: 'grey.50',
                  borderRadius: 1.5,
                  border: '1px solid #E5E7EB',
                }}
              >
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  <FormControl sx={{ minWidth: 220 }} size="small">
                    <InputLabel id="appraisal-cycle-label">Appraisal Cycle</InputLabel>
                    <Select
                      labelId="appraisal-cycle-label"
                      label="Appraisal Cycle"
                      value={selectedCycle}
                      onChange={handleCycleChange}
                    >
                      {appraisalCycles && appraisalCycles.length > 0 ? (
                        [...appraisalCycles]
                          .sort((a, b) => a.cycle_name.localeCompare(b.cycle_name))
                          .map((cycle) => (
                          <MenuItem key={cycle.cycle_id} value={cycle.cycle_id}>
                            <Tooltip title={`${cycle.cycle_id} - ${cycle.cycle_name}`} placement="top" arrow>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', maxWidth: '180px' }}>
                                {cycle.cycle_name}
                              </span>
                            </Tooltip>
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem value="" disabled>No cycles available</MenuItem>
                      )}
                    </Select>
                  </FormControl>

                  <FormControl sx={{ minWidth: 220 }} size="small">
                    <InputLabel id="employee-label">Employee</InputLabel>
                    <Select
                      labelId="employee-label"
                      label="Employee"
                      value={selectedEmployee}
                      onChange={handleEmployeeChange}
                    >
                      {employees && employees.length > 0 ? (
                        employees.map((emp) => (
                          <MenuItem key={emp.id} value={emp.id}>
                            <Tooltip title={emp.full_name} placement="top" arrow>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', maxWidth: '180px' }}>
                                {emp.id} - {emp.full_name}
                              </span>
                            </Tooltip>
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem value="" disabled>No employees available</MenuItem>
                      )}
                    </Select>
                  </FormControl>

                  {selectedEmployee && teamLeadName && (
                    <Box sx={{ ml: { xs: 0, sm: 1 } }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                        REPORTING TO
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {teamLeadName}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {(userRole === 'team lead' || userRole === 'Team Lead' || userRole === 'lead' || userRole === 'admin') && (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={openModal}
                    disabled={isLeadAssessmentDisabled}
                    sx={{
                      fontWeight: 600,
                      px: 3,
                      '&.Mui-disabled': {
                        backgroundColor: 'grey.200',
                        color: 'text.disabled',
                      }
                    }}
                  >
                    Lead Assessment
                  </Button>
                )}
              </Box>

              {/* Assessment Section */}
              <Box sx={{ mt: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Cycle Questions
                  </Typography>
                  {assessmentData.length > 0 && (
                    <Tooltip title="Refresh responses" arrow>
                      <IconButton onClick={refreshAssessmentData} size="small" color="primary">
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>

                {assessmentData.length > 0 ? (
                  <Box>
                    {assessmentData.map((question, index) => (
                      <Box 
                        key={question.question_id} 
                        sx={{ 
                          mb: 4, 
                          p: 2.5, 
                          border: '1px solid #F3F4F6', 
                          borderRadius: 1.5,
                          backgroundColor: '#FCFDFD',
                          '&:hover': {
                            borderColor: 'grey.200',
                          }
                        }}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', mb: 1.5 }}>
                          {index + 1}. {question.question_text}
                        </Typography>
                        {renderInputField(question)}
                      </Box>
                    ))}
                    
                    {canUserSubmit() && (
                      <Box mt={4} display="flex" justifyContent="flex-end" pt={3} borderTop="1px solid #E5E7EB">
                        <Button 
                          variant="contained" 
                          color="primary" 
                          onClick={handleSubmit} 
                          disabled={isReadOnly}
                          sx={{ px: 4, py: 1 }}
                        >
                          Submit Responses
                        </Button>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <EmptyState 
                    title="No Questions Available" 
                    message="There are no assessment questions assigned to this employee for the selected appraisal cycle."
                  />
                )}
              </Box>
            </>
          )}

          <LeadAssessmentModal
            open={isModalOpen}
            onClose={closeModal}
            selectedCycle={selectedCycle}
            employees={employees}
            selectedEmployee={modalSelectedEmployee}
            setSelectedEmployee={setModalSelectedEmployee}
            employeeId={employeeId}
            isCycleActive={isCycleActive}
            leadAssessmentActive={leadAssessmentActive}
            leadAssessmentCompleted={leadAssessmentCompleted}
            prefilledData={null}
          />
        </CardContent>
      </Card>
      
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={4000} 
        onClose={() => setSnackbarOpen(false)} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%', boxShadow: 3 }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={saving}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
};

export default AssessmentPage;

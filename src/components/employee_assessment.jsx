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
  Skeleton,
  Divider,
  FormGroup,
} from '@mui/material';
import LeadAssessmentModal from './LeadAssessmentModal';
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
} from '../api';

const DropdownPage = () => {
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
  const [isLeadAssessmentDisabled, setIsLeadAssessmentDisabled] =
    useState(true); // Starting with disabled by default
  const [saving, setSaving] = useState(false);
  const [leadAssessmentActive, setLeadAssessmentActive] = useState(false);
  const [leadAssessmentCompleted, setLeadAssessmentCompleted] = useState(false);
  const [modalSelectedEmployee, setModalSelectedEmployee] = useState('');
  const [initialLoadCompleted, setInitialLoadCompleted] = useState(false);

  // Function to check lead assessment stage status (stable across renders)
  const checkLeadAssessmentStage = useCallback(async (cycleId) => {
    if (!cycleId) return;

    try {
      // check self-assessment stage
      const selfAssessmentData = await fetchSelfAssessmentStage(cycleId);
      const {
        is_active: selfAssessmentActive,
        is_completed: selfAssessmentCompleted,
      } = selfAssessmentData;

      // check lead-assessment stage
      const leadAssessmentData = await fetchLeadAssessmentStage(cycleId);
      const { is_active, is_completed } = leadAssessmentData;

      setLeadAssessmentActive(is_active);
      setLeadAssessmentCompleted(is_completed);

      // Logic to determine if Lead Assessment should be disabled:
      // 1. If self-assessment is active and not completed, disable lead assessment
      // 2. If lead-assessment is neither active nor completed, disable
      // 3. Otherwise, enable it

      if (
        (selfAssessmentActive && !selfAssessmentCompleted) ||
        (!is_active && !is_completed)
      ) {
        setIsLeadAssessmentDisabled(true);
      } else {
        setIsLeadAssessmentDisabled(false);
      }
    } catch (err) {
      console.error('Failed to fetch stage info:', err);
      setIsLeadAssessmentDisabled(true); // Safe fallback
    }
  }, []);

  useEffect(() => {
    if (!employeeId) return;
    const fetchUserRoleAndCycles = async () => {
      try {
        // To get the details(including reporting manager) of user
        const userData = await fetchEmployeeDetails(employeeId);
        const role =
          localStorage.getItem('user_role') || userData.role.toLowerCase();
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

            // Fetch employees under the team lead
            try {
              if (reportingEmployees.length > 0) {
                setEmployees(reportingEmployees);
                setSelectedEmployee(employeeId); // Default to the team lead
              } else {
                // If no employees found under the team lead
                setEmployees([]);
              }
            } catch (err) {
              console.error('Error fetching employees: ', err);
              setEmployees([]);
            }

            const { reporting_manager_id, reporting_manager_name } =
              managerData;
            setTeamLeadName(
              `${reporting_manager_id} - ${reporting_manager_name}`
            );

            // Check Lead Assessment stage here for the active cycle
            await checkLeadAssessmentStage(activeCycle.cycle_id);
          }
        } else {
          // Regular employee
          const cyclesData = await fetchAssessmentCycles(employeeId);
          setAppraisalCycles(cyclesData);

          const activeCycle = cyclesData.find(
            (cycle) => cycle.status === 'active'
          );
          if (activeCycle) {
            setSelectedCycle(activeCycle.cycle_id);
            setIsCycleActive(true);

            setSelectedEmployee(employeeId);

            // Regular employees can only assess themselves; the backend endpoint that
            // returns cycle employees is restricted to team leads.
            setEmployees([
              {
                id: Number(employeeId),
                full_name: 'Self',
              },
            ]);

            const managerData = await fetchReportingManager(employeeId);
            const { reporting_manager_id, reporting_manager_name } =
              managerData;
            setTeamLeadName(
              `${reporting_manager_id} - ${reporting_manager_name}`
            );
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
        // STEP 1: If selected cycle is active, If Self Assessment stage is active
        if (isCycleActive) {
          const stageData = await fetchSelfAssessmentStage(selectedCycle);
          const { is_active, is_completed } = stageData;
          if (!is_active && !is_completed) {
            setAssessmentData([]);
            setResponses({});
            return;
          }
          if (is_completed) {
            setReadOnly(true);
          } else {
            setReadOnly(false);
          }
        }

        // STEP 2: Fetching assessment questions
        const [questions, responseData] = await Promise.all([
          fetchAssessmentQuestions(questionOwnerId, selectedCycle),
          fetchAssessmentResponses(responseOwnerId, selectedCycle).catch(
            (err) => {
              if (err.status === 404) {
                return [];
              }
              throw err;
            }
          ),
        ]);

        setAssessmentData(questions || []);

        try {
          const previous = {};
          (responseData || []).forEach((res) => {
            previous[res.question_id] =
              res.option_ids?.length > 0
                ? res.option_ids
                : res.response_text?.[0] || '';
          });

          setResponses(previous);
        } catch (err) {
          if (err.response?.status === 404) {
            console.log('No responses found (404)');
            setResponses({});
          } else {
            console.error('Error fetching responses:', err);
          }
        }
      } catch (error) {
        console.error('Error fetching assessment questions:', error);
        setAssessmentData([]);
        setResponses({});
      }
    };

    fetchAssessmentDataAndResponses();
  }, [selectedCycle, selectedEmployee, userRole, employeeId, isCycleActive]);

  // Checking Lead Assessment stage when cycle changes
  useEffect(() => {
    if (!selectedCycle || !initialLoadCompleted) return;

    if (
      (userRole === 'team lead' ||
        userRole === 'lead' ||
        userRole === 'admin') &&
      isCycleActive
    ) {
      checkLeadAssessmentStage(selectedCycle);
    }
  }, [
    selectedCycle,
    initialLoadCompleted,
    userRole,
    isCycleActive,
    checkLeadAssessmentStage,
  ]);

  const openModal = () => {
    setModalSelectedEmployee(selectedEmployee);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    // Don't update selectedEmployee here
  };

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
      // Finding selected cycle in the already loaded cycles
      const selectedCycleObj = appraisalCycles.find(
        (cycle) => cycle.cycle_id === cycleId
      );

      if (selectedCycleObj) {
        setIsCycleActive(selectedCycleObj.status === 'active');
      }

      const managerData = await fetchReportingManager(employeeId);

      let employeesData = employees;
      if (
        userRole === 'team lead' ||
        userRole === 'lead' ||
        userRole === 'admin'
      ) {
        employeesData = await fetchCycleEmployees(cycleId, employeeId);
      } else {
        // Keep regular employees scoped to self.
        employeesData = [
          {
            id: Number(employeeId),
            full_name: 'Self',
          },
        ];
      }

      if (
        userRole === 'team lead' ||
        userRole === 'lead' ||
        userRole === 'admin'
      ) {
        await checkLeadAssessmentStage(cycleId);
      }

      setEmployees(employeesData);

      if (
        userRole === 'team lead' ||
        userRole === 'lead' ||
        userRole === 'admin'
      ) {
        // For Team Leads, always defaulting to themselves
        setSelectedEmployee(employeeId);
        const { reporting_manager_id, reporting_manager_name } = managerData;
        setTeamLeadName(`${reporting_manager_id} - ${reporting_manager_name}`);
      } else {
        // Regular employee: always default to self
        setSelectedEmployee(employeeId);
        const { reporting_manager_id, reporting_manager_name } = managerData;
        setTeamLeadName(`${reporting_manager_id} - ${reporting_manager_name}`);
      }
    } catch (error) {
      console.error('Error handling cycle change:', error);
      const selectedCycleObj = appraisalCycles.find(
        (cycle) => cycle.cycle_id === cycleId
      );
      if (selectedCycleObj) {
        setIsCycleActive(selectedCycleObj.status === 'active');
      }
    }
  };

  const canUserSubmit = () => {
    // For regular employee - view their own assessment
    if (
      userRole !== 'team lead' &&
      userRole !== 'lead' &&
      userRole !== 'admin' &&
      String(selectedEmployee) === String(employeeId)
    ) {
      return isCycleActive;
    }

    // For team lead - submit their own assessment
    if (
      (userRole === 'team lead' ||
        userRole === 'lead' ||
        userRole === 'admin') &&
      String(selectedEmployee) === String(employeeId)
    ) {
      return isCycleActive;
    }

    // Team lead is selecting the active cycle and and self assessment stage is completed
    if (isReadOnly) {
      return true;
    }

    return false;
  };

  const handleResponseChange = (questionId, value) => {
    setResponses((prevResponses) => ({
      ...prevResponses,
      [questionId]: value,
    }));
  };

  const renderInputField = (question) => {
    const { question_id, question_type, options = [] } = question;

    const isViewingOtherEmployee =
      (userRole === 'team lead' ||
        userRole === 'lead' ||
        userRole === 'admin') &&
      String(selectedEmployee) !== String(employeeId);

    const isDisabled = !isCycleActive || isViewingOtherEmployee || isReadOnly;

    switch (question_type.toLowerCase()) {
      case 'mcq':
        return (
          <Box sx={{ mt: 1 }}>
            <FormGroup>
              {options.map((option) => {
                const prev = responses[question_id];
                const prevArray = Array.isArray(prev) ? prev : [];
                const checked = prevArray.some(
                  (id) => Number(id) === Number(option.option_id)
                );

                return (
                  <FormControlLabel
                    key={option.option_id}
                    control={
                      <Checkbox
                        checked={checked}
                        onChange={(e) => {
                          const wasChecked = checked;
                          const base = Array.isArray(responses[question_id])
                            ? responses[question_id]
                            : [];
                          let newValue;
                          if (e.target.checked && !wasChecked) {
                            newValue = [
                              ...base.map((v) => Number(v)),
                              Number(option.option_id),
                            ];
                          } else {
                            newValue = base
                              .map((v) => Number(v))
                              .filter((id) => id !== Number(option.option_id));
                          }
                          handleResponseChange(question_id, newValue);
                        }}
                        disabled={isDisabled}
                      />
                    }
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
            <RadioGroup
              value={responses[question_id] || ''}
              onChange={(e) =>
                handleResponseChange(question_id, e.target.value)
              }
            >
              {options.map((option) => (
                <FormControlLabel
                  key={option.option_id}
                  value={option.option_id}
                  control={<Radio disabled={isDisabled} />}
                  label={option.option_text}
                />
              ))}
            </RadioGroup>
          </Box>
        );

      case 'descriptive':
        return (
          <Box sx={{ mt: 1 }}>
            <TextField
              multiline
              minRows={3}
              fullWidth
              value={responses[question_id] || ''}
              onChange={(e) =>
                handleResponseChange(question_id, e.target.value)
              }
              disabled={isDisabled}
              variant="outlined"
              size="small"
            />
          </Box>
        );

      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const payload = assessmentData
        .map((question) => {
          const response = responses[question.question_id];
          const question_type = question.question_type.toLowerCase();

          if (question_type === 'mcq') {
            return {
              question_id: question.question_id,
              allocation_id: question.allocation_id,
              cycle_id: selectedCycle,
              employee_id: selectedEmployee,
              option_ids: response || [],
              response_text: null,
            };
          } else if (['single choice', 'yes/no'].includes(question_type)) {
            return {
              question_id: question.question_id,
              allocation_id: question.allocation_id,
              cycle_id: selectedCycle,
              employee_id: selectedEmployee,
              option_ids: [Number(response)],
              response_text: null,
            };
          } else if (question_type === 'descriptive') {
            return {
              question_id: question.question_id,
              allocation_id: question.allocation_id,
              cycle_id: selectedCycle,
              employee_id: selectedEmployee,
              option_ids: [],
              response_text: [response],
            };
          } else {
            return null;
          }
        })
        .filter(Boolean);

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

    // selected employee's data
    const questionOwnerId = selectedEmployee;
    const responseOwnerId = selectedEmployee;

    try {
      const questionsData = await fetchAssessmentQuestions(
        questionOwnerId,
        selectedCycle
      );
      setAssessmentData(questionsData || []);

      try {
        const responseData = await fetchAssessmentResponses(
          responseOwnerId,
          selectedCycle
        );
        const previous = {};
        (responseData || []).forEach((res) => {
          previous[res.question_id] =
            res.option_ids?.length > 0
              ? res.option_ids
              : res.response_text?.[0] || '';
        });
        setResponses(previous);
      } catch (err) {
        if (err.status === 404) {
          setResponses({});
        } else {
          console.error('Error fetching responses:', err);
        }
      }
    } catch (err) {
      console.error('Error refreshing assessment data:', err);
      setAssessmentData([]);
      setResponses({});
    }
  };

  return (
    <>
      <Card sx={{ width: '100%' }}>
        <CardContent>
          {/* Title */}
          {loadingCycles ? (
            <Skeleton
              variant="rectangular"
              width={500}
              height={25}
              sx={{ borderRadius: 1, mb: 2 }}
            />
          ) : (
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
                Self Assessment
              </Typography>
            </Box>
          )}

          {/* Cycle dropdown */}
          <Box
            sx={{
              display: 'flex',
              gap: 4,
              alignItems: 'center',
              flexWrap: 'wrap',
              mt: 2,
            }}
          >
            {loadingCycles ? (
              // Skeleton placeholder when loading
              <Skeleton
                variant="rectangular"
                width={200}
                height={40}
                sx={{ borderRadius: 1 }}
              />
            ) : (
              <FormControl sx={{ minWidth: 200 }} size="small">
                <InputLabel sx={{ background: 'white', pl: 1, pr: 1 }}>
                  Appraisal Cycle
                </InputLabel>
                <Select value={selectedCycle} onChange={handleCycleChange}>
                  {appraisalCycles && appraisalCycles.length > 0 ? (
                    appraisalCycles.map((cycle) => (
                      <MenuItem key={cycle.cycle_id} value={cycle.cycle_id}>
                        <Tooltip
                          title={`${cycle.cycle_id} - ${cycle.cycle_name}`}
                          placement="top"
                          arrow
                        >
                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'inline-block',
                              maxWidth: '200px',
                            }}
                          >
                            {cycle.cycle_name}
                          </span>
                        </Tooltip>
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      No cycles available
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            )}

            {/* Employee dropdown */}
            {loadingCycles ? (
              // Skeleton placeholder when loading
              <Skeleton
                variant="rectangular"
                width={200}
                height={40}
                sx={{ borderRadius: 1 }}
              />
            ) : (
              <FormControl sx={{ minWidth: 200 }} size="small">
                <InputLabel sx={{ background: 'white', pl: 1, pr: 1 }}>
                  Employee
                </InputLabel>
                <Select
                  value={selectedEmployee}
                  onChange={handleEmployeeChange}
                >
                  {employees && employees.length > 0 ? (
                    employees.map((emp) => (
                      <MenuItem key={emp.id} value={emp.id}>
                        <Tooltip
                          title={emp.full_name}
                          placement="top"
                          arrow
                        >
                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'inline-block',
                              maxWidth: '200px',
                            }}
                          >
                            {emp.id} - {emp.full_name}
                          </span>
                        </Tooltip>
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      No employees available
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            )}

            {/* Reporting manager name */}
            {selectedEmployee && (
              <TextField
                value={teamLeadName || 'N/A'}
                InputProps={{
                  readOnly: true,
                  disableUnderline: true,
                }}
                variant="standard"
              />
            )}

            {/* Lead assessment link */}
            {(userRole === 'team lead' ||
              userRole === 'Team Lead' ||
              userRole === 'lead' ||
              userRole === 'admin') && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  flex: 1,
                }}
              >
                {loadingCycles ? (
                  <Skeleton
                    variant="rectangular"
                    width={150}
                    height={25}
                    sx={{ borderRadius: 1 }}
                  />
                ) : (
                  <a
                    onClick={isLeadAssessmentDisabled ? null : openModal}
                    style={{
                      cursor: isLeadAssessmentDisabled
                        ? 'not-allowed'
                        : 'pointer',
                      color: isLeadAssessmentDisabled ? 'gray' : 'blue',
                      textDecoration: 'underline',
                      fontSize: '16px',
                      pointerEvents: isLeadAssessmentDisabled ? 'none' : 'auto',
                    }}
                  >
                    Lead Assessment
                  </a>
                )}
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />
          
          <Box>
            {/* Question list header */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6" color="text.secondary">
                Questions
              </Typography>
              {assessmentData.length > 0 && (
                <Tooltip title="Refresh responses" arrow>
                  <IconButton
                    onClick={refreshAssessmentData}
                    size="small"
                    color="primary"
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {/* Question list */}
            {assessmentData.length > 0 ? (
              <Box mt={0}>
                {assessmentData.map((question, index) => (
                  <Box key={question.question_id} mb={3}>
                    {index > 0 && <Divider sx={{ my: 3 }} />}
                    <Typography
                      variant="subtitle1"
                      fontWeight={'medium'}
                      mb={1}
                    >
                      {index + 1}. {question.question_text}
                    </Typography>
                    {renderInputField(question)}
                  </Box>
                ))}

                {/* Submit button */}
                {canUserSubmit() && (
                  <Box mt={3} display="flex" justifyContent="flex-end">
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSubmit}
                      disabled={isReadOnly}
                    >
                      Submit
                    </Button>
                  </Box>
                )}
              </Box>
            ) : (
              <Box mt={0}>
                {loadingCycles ? (
                  // Skeleton placeholder when loading
                  <Skeleton
                    variant="rectangular"
                    width={200}
                    height={25}
                    sx={{ borderRadius: 1 }}
                  />
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    No questions assigned.
                  </Typography>
                )}
              </Box>
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
          </Box>
        </CardContent>
      </Card>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={saving}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
};

export default DropdownPage;

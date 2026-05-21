import { useState, useEffect } from 'react';
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
  TextareaAutosize,
  Button,
  Skeleton,
} from '@mui/material';
import axios from 'axios';
import LeadAssessmentModal from './LeadAssessmentModal';
import { IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

const API_URL = process.env.REACT_APP_BASE_URL;

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

  useEffect(() => {
    if (!employeeId) return;
    const fetchUserRoleAndCycles = async () => {
      try {
        // To get the details(including reporting manager) of user
        const userResponse = await axios.get(
          `${API_URL}/employee_details/${employeeId}`
        );
        const role = userResponse.data.role.toLowerCase();
        setUserRole(role);
        setLoadingCycles(true);

        if (role === 'team lead' || role === 'admin') {
          const [allCyclesRes, employeesRes, managerResponse] =
            await Promise.all([
              axios.get(`${API_URL}/assessment/teamlead/cycles/${employeeId}`),
              axios.get(`${API_URL}/reporting/${employeeId}`),
              axios.get(`${API_URL}/reporting_manager/${employeeId}`),
            ]);

          const cycles = allCyclesRes.data;
          setAppraisalCycles(cycles);

          const activeCycle = cycles.find((cycle) => cycle.status === 'active');
          if (activeCycle) {
            setSelectedCycle(activeCycle.cycle_id);
            setIsCycleActive(true);

            // Fetch employees under the team lead
            try {
              const employees = employeesRes.data;

              if (employees.length > 0) {
                setEmployees(employees);
                setSelectedEmployee(employeeId); // Default to the team lead
              } else {
                // If no employees found under the team lead
                setEmployees([]);
              }
            } catch (error) {
              console.error('Error fetching employees: ', error);
              setEmployees([]);
            }

            const { reporting_manager_id, reporting_manager_name } =
              managerResponse.data;
            setTeamLeadName(
              `${reporting_manager_id} - ${reporting_manager_name}`
            );

            // Check Lead Assessment stage here for the active cycle
            await checkLeadAssessmentStage(activeCycle.cycle_id);
          }
        } else {
          // Regular employee
          const cyclesResponse = await axios.get(
            `${API_URL}/assessment/cycles/${employeeId}`
          );
          setAppraisalCycles(cyclesResponse.data);

          const activeCycle = cyclesResponse.data.find(
            (cycle) => cycle.status === 'active'
          );
          if (activeCycle) {
            setSelectedCycle(activeCycle.cycle_id);
            setIsCycleActive(true);

            setSelectedEmployee(employeeId);

            // For dropdown to get the employee list
            const employeesResponse = await axios.get(
              `${API_URL}/employees/${activeCycle.cycle_id}/${employeeId}`
            );
            setEmployees(employeesResponse.data);

            const managerResponse = await axios.get(
              `${API_URL}/reporting_manager/${employeeId}`
            );
            const { reporting_manager_id, reporting_manager_name } =
              managerResponse.data;
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
  }, [employeeId]);

  // Function to check lead assessment stage status
  const checkLeadAssessmentStage = async (cycleId) => {
    if (!cycleId) return;

    try {
      // check self-assessment stage
      const selfAssessmentRes = await axios.get(
        `${API_URL}/stages/self-assessment/${cycleId}`
      );
      const {
        is_active: selfAssessmentActive,
        is_completed: selfAssessmentCompleted,
      } = selfAssessmentRes.data;

      // check lead-assessment stage
      const leadAssessmentRes = await axios.get(
        `${API_URL}/stages/lead-assessment/${cycleId}`
      );
      const { is_active, is_completed } = leadAssessmentRes.data;

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
  };

  useEffect(() => {
    const fetchAssessmentDataAndResponses = async () => {
      if (!selectedCycle || !selectedEmployee) return;

      const questionOwnerId = selectedEmployee;
      const responseOwnerId = selectedEmployee;

      // viewing another employee's assessment
      const isViewingOtherEmployee =
        userRole === 'team lead' && selectedEmployee !== employeeId;

      try {
        let readOnly = false;
        // STEP 1: If selected cycle is active, If Self Assessment stage is active
        if (isCycleActive) {
          const stageRes = await axios.get(
            `${API_URL}/stages/self-assessment/${selectedCycle}`
          );
          const { is_active } = stageRes.data;
          const { is_completed } = stageRes.data;
          if (!is_active && !is_completed) {
            setAssessmentData([]);
            setResponses({});
            return;
          }
          if (is_completed) {
            readOnly = true;
            setReadOnly(true);
          } else {
            readOnly = true;
            setReadOnly(false);
          }
        }

        // STEP 2: Fetching assessment questions
        const [questionsRes, responseRes] = await Promise.all([
          axios.get(
            `${API_URL}/assessment/questions/${questionOwnerId}/${selectedCycle}`
          ),
          axios
            .get(
              `${API_URL}/assessment/responses/${responseOwnerId}/${selectedCycle}`
            )
            .catch((err) => {
              if (err.response?.status === 404) {
                return { data: [] };
              }
              throw err;
            }),
        ]);

        const questions = questionsRes.data || [];
        setAssessmentData(questions);

        try {
          const previous = {};
          responseRes.data?.forEach((res) => {
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
  }, [selectedCycle, selectedEmployee, userRole, employeeId]);

  // Checking Lead Assessment stage when cycle changes
  useEffect(() => {
    if (!selectedCycle || !initialLoadCompleted) return;

    if ((userRole === 'team lead' || userRole === 'admin') && isCycleActive) {
      checkLeadAssessmentStage(selectedCycle);
    }
  }, [selectedCycle, initialLoadCompleted, userRole, isCycleActive]);

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
      const managerResponse = await axios.get(
        `${API_URL}/reporting_manager/${empId}`
      );
      const { reporting_manager_id, reporting_manager_name } =
        managerResponse.data;
      setTeamLeadName(`${reporting_manager_id} - ${reporting_manager_name}`);
    } catch (error) {
      console.error('Error fetching reporting manager:', error);
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

      const [cycleResponse, employeesResponse, managerRes] = await Promise.all([
        axios.get(`${API_URL}/appraisal_cycle/${cycleId}`),
        axios.get(`${API_URL}/employees/${cycleId}/${employeeId}`),
        axios.get(`${API_URL}/reporting_manager/${employeeId}`),
      ]);

      setIsCycleActive(cycleResponse.data.status === 'active');

      if (userRole === 'team lead' || userRole === 'admin') {
        await checkLeadAssessmentStage(cycleId);
      }

      setEmployees(employeesResponse.data);

      if (userRole === 'team lead' || userRole === 'admin') {
        // For Team Leads, always defaulting to themselves
        setSelectedEmployee(employeeId);
        const { reporting_manager_id, reporting_manager_name } =
          managerRes.data;
        setTeamLeadName(`${reporting_manager_id} - ${reporting_manager_name}`);
      } else {
        //  For HR or employee
        const userExists = employeesResponse.data.some(
          (emp) => emp.employee_id === employeeId
        );
        const defaultEmpId = userExists
          ? employeeId
          : employeesResponse.data[0]?.employee_id || '';

        setSelectedEmployee(defaultEmpId);

        if (defaultEmpId === employeeId) {
          const { reporting_manager_id, reporting_manager_name } =
            managerRes.data;
          setTeamLeadName(
            `${reporting_manager_id} - ${reporting_manager_name}`
          );
        } else if (defaultEmpId) {
          const altManagerRes = await axios.get(
            `${API_URL}/reporting_manager/${defaultEmpId}`
          );
          const { reporting_manager_id, reporting_manager_name } =
            altManagerRes.data;
          setTeamLeadName(
            `${reporting_manager_id} - ${reporting_manager_name}`
          );
        }
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
      userRole !== 'admin' &&
      String(selectedEmployee) === String(employeeId)
    ) {
      return isCycleActive;
    }

    // For team lead - submit their own assessment
    if (
      (userRole === 'team lead' || userRole === 'admin') &&
      String(selectedEmployee) === String(employeeId)
    ) {
      return isCycleActive;
    }

    // Team lead is selecting the active cycle and and self assessment stage is completed
    if (isReadOnly === 'true') {
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
      (userRole === 'team lead' || userRole === 'admin') &&
      String(selectedEmployee) !== String(employeeId);

    const isDisabled = !isCycleActive || isViewingOtherEmployee || isReadOnly;

    switch (question_type.toLowerCase()) {
      case 'mcq':
        return (
          <Box sx={{ pl: 5 }}>
            {options.map((option) => (
              <FormControlLabel
                key={option.option_id}
                control={
                  <Checkbox
                    checked={
                      responses[question_id]?.includes(option.option_id) ||
                      false
                    }
                    onChange={(e) => {
                      const newValue = e.target.checked
                        ? [...(responses[question_id] || []), option.option_id]
                        : responses[question_id].filter(
                            (id) => id !== option.option_id
                          );
                      handleResponseChange(question_id, newValue);
                    }}
                    disabled={isDisabled}
                  />
                }
                label={option.option_text}
              />
            ))}
          </Box>
        );

      case 'single choice':
      case 'yes/no':
        return (
          <Box sx={{ pl: 5 }}>
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
          <Box sx={{ pl: 5 }}>
            <TextareaAutosize
              minRows={2}
              value={responses[question_id] || ''}
              onChange={(e) =>
                handleResponseChange(question_id, e.target.value)
              }
              disabled={isDisabled}
              style={{
                width: '30%',
                fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
                fontSize: '1rem',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
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
              option_ids: [parseInt(response)],
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

      await axios.post(`${API_URL}/assessment/submit`, payload);

      setSnackbarMessage('Responses submitted successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
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
      const questionsRes = await axios.get(
        `${API_URL}/assessment/questions/${questionOwnerId}/${selectedCycle}`
      );
      const questions = questionsRes.data || [];
      setAssessmentData(questions);

      try {
        const responseRes = await axios.get(
          `${API_URL}/assessment/responses/${responseOwnerId}/${selectedCycle}`
        );
        const previous = {};
        responseRes.data?.forEach((res) => {
          previous[res.question_id] =
            res.option_ids?.length > 0
              ? res.option_ids
              : res.response_text?.[0] || '';
        });
        setResponses(previous);
      } catch (err) {
        if (err.response?.status === 404) {
          setResponses({});
        } else {
          console.error('Error fetching responses:', err);
        }
      }
    } catch (error) {
      setAssessmentData([]);
      setResponses({});
    }
  };
  const isCurrentUser = String(selectedEmployee) === String(employeeId);

  return (
    <>
      <Card sx={{ ml: 2, mr: 2, justifyContent: 'center' }}>
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
            <Typography variant="h5" color="primary" fontWeight={'bold'}>
              Self Assessment
            </Typography>
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
                  {appraisalCycles.map((cycle) => (
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
                  ))}
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
                  {employees.map((emp) => (
                    <MenuItem key={emp.employee_id} value={emp.employee_id}>
                      <Tooltip
                        title={`${emp.employee_id} - ${emp.employee_name}`}
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
                          {emp.employee_id} - {emp.employee_name}
                        </span>
                      </Tooltip>
                    </MenuItem>
                  ))}
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
        </CardContent>

        <Card sx={{ width: '100%' }}>
          <CardContent>
            {/* Question list */}
            {assessmentData.length > 0 ? (
              <Box mt={0}>
                {assessmentData.map((question, index) => (
                  <Box key={question.question_id} mb={3}>
                    {/* For the first question, showing question and  refresh button in same line */}
                    {index === 0 ? (
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Typography variant="subtitle1" fontWeight={'bold'}>
                          {index + 1}. {question.question_text}
                        </Typography>
                        <Tooltip title="Refresh responses" arrow>
                          <IconButton
                            onClick={refreshAssessmentData}
                            size="small"
                            color="primary"
                          >
                            <RefreshIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ) : (
                      // For remaining questions,showing question only
                      <Typography variant="subtitle1" fontWeight={'bold'}>
                        {index + 1}. {question.question_text}
                      </Typography>
                    )}
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
                    No questions allocated for you.
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
      </Card>
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

import { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Tooltip,
  Snackbar,
  Alert,
  IconButton,
  Radio,
  TextareaAutosize,
  Grid,
  CircularProgress,
} from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import {
  getCycleStatus,
  fetchParameters as fetchParametersApi,
  fetchPreviousAssessmentData,
  saveLeadAssessmentRating,
} from '../api';

const LeadAssessmentModal = ({
  open,
  onClose,
  selectedCycle,
  employees,
  selectedEmployee,
  setSelectedEmployee,
  employeeId,
  leadAssessmentActive,
  leadAssessmentCompleted,
}) => {
  const [parameters, setParameters] = useState([]);
  const [employeeData, setEmployeeData] = useState({});

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error',
  });
  const [readOnly, setReadOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if the selected employee is the logged-in user and prevent self-assessment
  useEffect(() => {
    if (open && String(selectedEmployee) === String(employeeId)) {
      setSnackbar({
        open: true,
        message:
          'You cannot assess yourself. Please select a different employee.',
        severity: 'warning',
      });
      onClose();
    }
  }, [open, selectedEmployee, employeeId, onClose]);

  useEffect(() => {
    if (!selectedCycle || !selectedEmployee) {
      setLoading(false);
      return;
    }

    setLoading(true); // Start loading when fetching data

    // Fetch cycle status
    const fetchCycleStatusPromise = getCycleStatus(selectedCycle)
      .then(() => {
        // Only allow editing if leadAssessmentActive is true and leadAssessmentCompleted is false
        const shouldBeReadOnly =
          !leadAssessmentActive || leadAssessmentCompleted;
        setReadOnly(shouldBeReadOnly);
      })
      .catch(() => {
        setReadOnly(true);
      });

    // Fetch parameters
    const fetchParametersPromise = fetchParametersApi(
      selectedCycle,
      selectedEmployee
    )
      .then((data) => setParameters(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Error fetching parameters:', err);
        setParameters([]);
      });

    // Fetch previous ratings
    const fetchRatingsPromise = fetchPreviousAssessmentData(
      selectedCycle,
      selectedEmployee
    )
      .then((data) => {
        if (data && data.ratings) {
          const uniqueRatings = Array.from(
            new Map(
              data.ratings.map((item) => [item.parameter_id, item])
            ).values()
          );

          setEmployeeData((prevData) => ({
            ...prevData,
            [selectedEmployee]: {
              ratings: uniqueRatings.reduce((acc, item) => {
                acc[item.parameter_id] = item.parameter_rating;
                return acc;
              }, {}),
              discussionDate: data.discussion_date
                ? dayjs(data.discussion_date)
                : null, // Convert here
              comments:
                uniqueRatings.length > 0 ? uniqueRatings[0].specific_input : '', // Use first unique input
            },
          }));
        }
      })
      .catch((err) => console.error('Error fetching previous ratings:', err));

    // When all data fetch operations complete, set loading to false
    Promise.all([
      fetchCycleStatusPromise,
      fetchParametersPromise,
      fetchRatingsPromise,
    ]).finally(() => {
      setLoading(false);
    });
  }, [
    selectedCycle,
    selectedEmployee,
    leadAssessmentActive,
    leadAssessmentCompleted,
  ]);

  const handleEmployeeChange = (e) => {
    // Check if the selected employee is the current user
    if (e.target.value === employeeId) {
      setSnackbar({
        open: true,
        message:
          'You cannot assess yourself. Please select a different employee.',
        severity: 'warning',
      });
      return; // Don't update the selection
    }
    setSelectedEmployee(e.target.value);
  };

  const currentRatings = employeeData[selectedEmployee]?.ratings || {};
  const currentDiscussionDate =
    employeeData[selectedEmployee]?.discussionDate || null;
  const currentComments = employeeData[selectedEmployee]?.comments || '';

  const handleRatingChange = (parameterId, value) => {
    if (readOnly) return; // Prevent changes in read-only mode

    setEmployeeData((prevData) => ({
      ...prevData,
      [selectedEmployee]: {
        ...prevData[selectedEmployee],
        ratings: {
          ...prevData[selectedEmployee]?.ratings,
          [parameterId]: value,
        },
      },
    }));
  };

  const handleDiscussionDateChange = (newDate) => {
    if (readOnly) return; // Prevent changes in read-only mode

    setEmployeeData((prevData) => ({
      ...prevData,
      [selectedEmployee]: {
        ...prevData[selectedEmployee],
        discussionDate: newDate,
      },
    }));
  };

  const handleCommentsChange = (e) => {
    if (readOnly) return; // Prevent changes in read-only mode

    setEmployeeData((prevData) => ({
      ...prevData,
      [selectedEmployee]: {
        ...prevData[selectedEmployee],
        comments: e.target.value,
      },
    }));
  };

  const handleSubmit = () => {
    if (readOnly) {
      setSnackbar({
        open: true,
        message: 'Cannot submit ratings for a non-active cycle.',
        severity: 'error',
      });
      return;
    }

    if (!selectedEmployee) {
      setSnackbar({
        open: true,
        message: 'Please select an employee.',
        severity: 'error',
      });
      return;
    }

    if (selectedEmployee === employeeId) {
      setSnackbar({
        open: true,
        message: 'You cannot assess yourself.',
        severity: 'error',
      });
      return;
    }

    if (!currentDiscussionDate) {
      setSnackbar({
        open: true,
        message: 'Discussion date is required.',
        severity: 'error',
      });
      return;
    }

    const missingRatings = parameters.some(
      (param) => !currentRatings[param.parameter_id]
    );
    if (missingRatings) {
      setSnackbar({
        open: true,
        message: 'All parameters must have a rating.',
        severity: 'error',
      });
      return;
    }

    const formattedRatings = Object.entries(currentRatings).map(
      ([paramId, value]) => ({
        parameter_id: parseInt(paramId),
        parameter_rating: value,
        specific_input: currentComments || '',
      })
    );

    const formattedDate = currentDiscussionDate
      ? currentDiscussionDate.format('YYYY-MM-DD')
      : null;

    const payload = {
      employee_id: selectedEmployee,
      cycle_id: selectedCycle,
      ratings: formattedRatings,
      discussion_date: formattedDate,
    };
    setSaving(true); // Show loading backdrop
    saveLeadAssessmentRating(payload)
      .then(() => {
        setSnackbar({
          open: true,
          message: 'Assessment submitted successfully!',
          severity: 'success',
        });
      })
      .catch((err) => {
        if (err.status === 400) {
          setSnackbar({
            open: true,
            message: err.message,
            severity: 'error',
          });
        } else {
          setSnackbar({
            open: true,
            message: 'Failed to submit assessment. Try again.',
            severity: 'error',
          });
        }
      })
      .finally(() => {
        setSaving(false); // Hide loading backdrop
      });
  };

  const resetFields = () => {
    setEmployeeData({});
    setParameters([]);
    setSelectedEmployee('');
  };

  // Loading indicator content (inlined to avoid component-in-render ESLint error)
  const loadingContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '200px',
      }}
    >
      <CircularProgress size={40} />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Loading assessment data...
      </Typography>
    </Box>
  );

  return (
    <>
      <Box
        sx={{
          width: { xs: '95%', sm: '90%', md: '80%' },
          maxHeight: { xs: '90vh', sm: '90vh', md: '85vh' },
          overflowY: 'auto',
          p: { xs: 1.5, sm: 1.5, md: 1.5 },
          mx: 'auto',
          mt: { xs: 1, sm: 2 },
          bgcolor: 'white',
          borderRadius: 2,
          position: 'relative',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#888',
            borderRadius: '8px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#555',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f1f1f1',
            borderRadius: '8px',
          },
        }}
      >
        <Modal
          open={open && String(selectedEmployee) !== String(employeeId)}
          onClose={(event, reason) => reason !== 'backdropClick' && onClose()}
          disableEscapeKeyDown
        >
          <Box
            sx={{
              position: 'relative',
              top: '50%',
              left: '50%',
              height: 'auto',
              transform: 'translate(-50%, -50%)',
              width: { xs: '95%', sm: '90%', md: '80%' },
              maxHeight: '90vh', // sets limit to screen height
              bgcolor: 'white',
              borderRadius: 2,
              p: { xs: 1.5, sm: 1.5, md: 1.5 },
              overflowY: 'auto', //enables scroll if content exceeds maxHeight
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#888',
                borderRadius: '8px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                backgroundColor: '#555',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#f1f1f1',
                borderRadius: '8px',
              },
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              align="center"
              color="primary"
              fontWeight="bold"
              sx={{
                fontSize: { xs: '1rem', sm: '1.25rem' },
              }}
            >
              Lead Assessment
            </Typography>

            <IconButton
              aria-label="Close"
              color="error"
              onClick={() => {
                resetFields();
                onClose();
              }}
              sx={{
                position: 'absolute',
                right: { xs: 8, sm: 16 },
                top: { xs: 8, sm: 16 },
              }}
            >
              <CloseIcon />
            </IconButton>

            <Grid container spacing={2} alignItems="center">
              {/* Employee Dropdown */}
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel
                    sx={{
                      backgroundColor: 'background.paper',
                      px: 1,
                      top: '-4px',
                    }}
                  >
                    Employee
                  </InputLabel>
                  <Select
                    value={selectedEmployee}
                    onChange={handleEmployeeChange}
                    sx={{
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {Array.isArray(employees) &&
                      employees
                        .filter((emp) => String(emp.id) !== String(employeeId))
                        .map((emp) => (
                          <MenuItem key={emp.id} value={emp.id}>
                            <Tooltip
                              title={`${emp.id} - ${emp.full_name}`}
                              placement="top"
                              arrow
                            >
                              <span
                                style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-block',
                                  maxWidth: '100%',
                                }}
                              >
                                {emp.id} - {emp.full_name}
                              </span>
                            </Tooltip>
                          </MenuItem>
                        ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* One-on-one Discussion Date - right alignment */}
              <Grid
                size={{ xs: 12, md: 8 }}
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  textAlign: 'right',
                  ml: 'auto',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-end', sm: 'center' },
                    justifyContent: 'flex-end',
                    gap: { xs: 1, sm: 2 },
                    width: { xs: '100%', sm: 'auto' },
                  }}
                >
                  <Typography
                    align="right"
                    sx={{
                      color: 'primary.main',
                      fontWeight: 'bold',
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      width: { xs: '100%', sm: 'auto' },
                    }}
                  >
                    One-on-one discussion with employee completed on
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      width: { xs: '100%', sm: 'auto' },
                    }}
                  >
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        value={currentDiscussionDate}
                        onChange={(newDate) =>
                          handleDiscussionDateChange(newDate)
                        }
                        format="DD/MM/YYYY"
                        disabled={readOnly}
                        slotProps={{
                          textField: {
                            size: 'small',
                            sx: {
                              width: { xs: '160px', sm: '160px' },
                              minWidth: '140px',
                              ml: { xs: 'auto', sm: 0 },
                            },
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Table Container with loading state */}
            <TableContainer
              component={Paper}
              sx={{
                maxHeight: '50vh',
                mb: 2,
                mt: 2,
                boxShadow: 'none',
                border: '1px solid',
                borderColor: 'divider',
                '& ::-webkit-scrollbar': {
                  width: '8px',
                },
                '& ::-webkit-scrollbar-thumb': {
                  backgroundColor: '#888',
                  borderRadius: '8px',
                },
                '& ::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: '#555',
                },
                '& ::-webkit-scrollbar-track': {
                  borderRadius: '8px',
                },
              }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{ color: 'primary.main', fontWeight: 'bold' }}
                    >
                      Evaluation Parameter
                    </TableCell>
                    {[1, 2, 3, 4].map((value) => (
                      <TableCell
                        key={value}
                        align="center"
                        sx={{ color: 'primary.main', fontWeight: 'bold' }}
                      >
                        {
                          [
                            'Needs Improvement',
                            'Satisfactory',
                            'Good',
                            'Excellent',
                          ][value - 1]
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                {/* Conditional rendering based on loading state */}
                {loading ? (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        {loadingContent}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                ) : (
                  <TableBody sx={{ maxHeight: '50vh', overflowY: 'auto' }}>
                    {parameters
                      .filter((param) => !param.is_fixed_parameter)
                      .map((param) => (
                        <TableRow key={param.parameter_id}>
                          <TableCell
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            {param.parameter_title}
                            <Tooltip
                              title={param.helptext || 'No help text available'}
                              placement="top"
                              arrow
                              componentsProps={{
                                tooltip: {
                                  sx: {
                                    backgroundColor: '#1976d2',
                                    color: 'white',
                                    fontSize: '13px',
                                    padding: '6px',
                                    borderRadius: '4px',
                                    boxShadow: '0px 0px 8px rgba(0,0,0,0.2)',
                                    maxWidth: '200px',
                                  },
                                },
                                arrow: {
                                  sx: {
                                    color: '#1976d2',
                                  },
                                },
                              }}
                            >
                              <IconButton size="small" sx={{ p: 0.5 }}>
                                <InfoOutlineIcon
                                  sx={{ color: '#1976d2', fontSize: '18px' }}
                                />
                              </IconButton>
                            </Tooltip>
                          </TableCell>

                          {[1, 2, 3, 4].map((value) => (
                            <TableCell align="center" key={value}>
                              <Radio
                                name={`rating-${param.parameter_id}`}
                                value={value}
                                checked={
                                  currentRatings[param.parameter_id] === value
                                }
                                onChange={() =>
                                  handleRatingChange(param.parameter_id, value)
                                }
                                disabled={readOnly}
                                sx={{ padding: 0 }}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}

                    {parameters
                      .filter((param) => param.is_fixed_parameter)
                      .map((param) => (
                        <TableRow key={param.parameter_id}>
                          <TableCell
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            {param.parameter_title}
                            <Tooltip
                              title={param.helptext || 'No help text available'}
                              placement="top"
                              arrow
                              componentsProps={{
                                tooltip: {
                                  sx: {
                                    backgroundColor: '#1976d2',
                                    color: 'white',
                                    fontSize: '13px',
                                    padding: '6px',
                                    borderRadius: '4px',
                                    boxShadow: '0px 0px 8px rgba(0,0,0,0.2)',
                                    maxWidth: '200px',
                                  },
                                },
                                arrow: {
                                  sx: {
                                    color: '#1976d2',
                                  },
                                },
                              }}
                            >
                              <IconButton size="small" sx={{ p: 0.5 }}>
                                <InfoOutlineIcon
                                  sx={{ color: '#1976d2', fontSize: '18px' }}
                                />
                              </IconButton>
                            </Tooltip>
                          </TableCell>

                          {[1, 2, 3, 4].map((value) => (
                            <TableCell align="center" key={value}>
                              <Radio
                                name={`rating-${param.parameter_id}`}
                                value={value}
                                checked={
                                  currentRatings[param.parameter_id] === value
                                }
                                onChange={() =>
                                  handleRatingChange(param.parameter_id, value)
                                }
                                disabled={readOnly}
                                sx={{ padding: 0 }}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                  </TableBody>
                )}
              </Table>
            </TableContainer>

            {/* Comments Section - Only show when not loading */}
            {!loading && (
              <div style={{ position: 'relative', marginTop: '20px' }}>
                <label
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '10px',
                    backgroundColor: 'white',
                    padding: '0 5px',
                    fontSize: '0.85rem',
                    color: '#666',
                    zIndex: 1,
                    pb: '1px',
                  }}
                >
                  Any specific inputs
                </label>
                <TextareaAutosize
                  minRows={2}
                  fullWidth
                  sx={{ p: 1 }}
                  value={currentComments}
                  disabled={readOnly}
                  InputProps={{ readOnly: readOnly }}
                  onChange={handleCommentsChange}
                  style={{
                    maxWidth: '100%',
                    minWidth: '100%',
                    fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
                    fontSize: '1rem',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    padding: '12px',
                  }}
                />
              </div>
            )}

            {/* Submit Button - Only show when not loading */}
            {!loading && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  position: 'sticky',
                  p: 1,
                  mb: 0,
                }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={readOnly}
                >
                  Submit
                </Button>
              </Box>
            )}
          </Box>
        </Modal>
      </Box>

      {/* Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 10 }}
        open={saving}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
};

export default LeadAssessmentModal;

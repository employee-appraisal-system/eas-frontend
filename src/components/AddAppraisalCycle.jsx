import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Typography,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  IconButton,
  Snackbar,
  Alert,
  FormControl,
  Radio,
  RadioGroup,
  Box,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import AddIcon from '@mui/icons-material/Add';
import TextField from '@mui/material/TextField';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { createAppraisalCycle, createStage, createParameter } from '../api';
import { useNavigate } from 'react-router-dom';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

const AddAppraisalCycle = () => {
  const [cycleName, setCycleName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');

  const [endDateError, setEndDateError] = useState('');
  const [stageErrors, setStageErrors] = useState({});

  const [errorMessage, setErrorMessage] = useState('');
  const [error, setError] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const [stages, setStages] = useState([
    { name: 'Setup', startDate: '', endDate: '' },
    { name: 'Self Assessment', startDate: '', endDate: '' },
    { name: 'Lead Assessment', startDate: '', endDate: '' },
    { name: 'HR/VL Validation', startDate: '', endDate: '' },
    { name: 'Closure', startDate: '', endDate: '' },
  ]);

  const [saving, setSaving] = useState(false);

  const [parameters, setParameters] = useState([
    {
      name: 'Overall Performance Rating',
      helptext: '',
      employee: true,
      teamLead: true,
      fixed: true,
    },
  ]);

  const handleCancel = () => {
    setCycleName('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setStatus('');
    setStages([
      { name: 'Setup', startDate: '', endDate: '' },
      { name: 'Self Assessment', startDate: '', endDate: '' },
      { name: 'Lead Assessment', startDate: '', endDate: '' },
      { name: 'HR/VL Validation', startDate: '', endDate: '' },
      { name: 'Closure', startDate: '', endDate: '' },
    ]);
    setParameters([
      {
        name: 'Overall Performance Rating',
        helptext: '',
        employee: true,
        teamLead: true,
        fixed: true,
      },
    ]);
    setEndDateError('');
    setStageErrors({});
  };

  const [formValid, setFormValid] = useState(false);

  const validateForm = useCallback(() => {
    let valid = true;
    if (!cycleName.trim()) valid = false;
    if (!description.trim()) valid = false;
    if (!status) valid = false;
    if (!startDate) valid = false;

    if (!endDate) {
      setEndDateError('End date is required');
      valid = false;
    } else if (startDate > endDate) {
      setEndDateError('End date must be after start date');
      valid = false;
    } else {
      setEndDateError('');
    }

    if (startDate && endDate && startDate > endDate) {
      setEndDateError('End date must be after start date');
      valid = false;
    } else {
      setEndDateError('');
    }

    let newStageErrors = {};
    let previousEndDate = startDate;

    stages.forEach((stage, index) => {
      let error = {};
      if (!stage.startDate || !stage.endDate) valid = false;
      if (
        stage.startDate &&
        (stage.startDate < startDate || stage.startDate > endDate)
      ) {
        error.start = 'Start date must be within cycle period';
        valid = false;
      }
      if (stage.endDate && stage.endDate < stage.startDate) {
        error.end = 'End date must be after start date';
        valid = false;
      } else if (stage.endDate && stage.endDate > endDate) {
        error.end = 'End date must be within cycle period';
        valid = false;
      }
      if (
        index > 0 &&
        stage.startDate &&
        previousEndDate &&
        stage.startDate <= previousEndDate
      ) {
        error.start = "Start date must be after the previous stage's end date";
        valid = false;
      }
      previousEndDate = stage.endDate;
      newStageErrors[index] = error;
    });

    let newParameterErrors = {};
    parameters.forEach((param, index) => {
      let error = {};
      if (!param.name.trim()) {
        error.name = 'Parameter name is required';
        valid = false;
      }
      if (!param.employee && !param.teamLead) {
        error.selection =
          'At least one selection (Employee or Team Lead) is required';
        valid = false;
      }
      newParameterErrors[index] = error;
    });

    setStageErrors(newStageErrors);
    setFormValid(valid);
  }, [cycleName, description, endDate, parameters, stages, startDate, status]);

  useEffect(() => {
    validateForm();
  }, [validateForm]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const cycleData = await createAppraisalCycle({
        cycle_name: cycleName,
        description,
        status,
        start_date_of_cycle: startDate,
        end_date_of_cycle: endDate,
      });
      const cycleId = cycleData.cycle_id;
      for (const stage of stages) {
        await createStage({
          stage_name: stage.name,
          cycle_id: cycleId,
          start_date_of_stage: stage.startDate,
          end_date_of_stage: stage.endDate,
        });
      }
      for (const param of parameters) {
        await createParameter({
          parameter_title: param.name,
          helptext: param.helptext,
          cycle_id: cycleId,
          applicable_to_employee: param.employee,
          applicable_to_lead: param.teamLead,
          is_fixed_parameter: param.fixed,
        });
      }
      setSnackbar({
        open: true,
        message: 'Cycle Created Successfully!',
        severity: 'success',
      });
      setTimeout(() => {
        handleCancel();
      }, 2000);
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const addParameter = () => {
    setParameters([
      ...parameters,
      {
        name: '',
        helptext: '',
        employee: false,
        teamLead: false,
        fixed: false,
      },
    ]);
  };

  const removeParameter = (index) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setStartDate(selectedDate);
    if (selectedDate && selectedDate < today) {
      setError(true);
      setErrorMessage('Please select today or a future date');
    } else {
      setError(false);
      setErrorMessage('');
    }
  };

  return (
    <>
      <Card sx={{ width: '100%' }}>
        <CardContent sx={{ height: '100%' }}>
          {/* Header - unchanged */}
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
              Add Appraisal Cycle
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <IconButton onClick={() => navigate('/hr-home')} color="error">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Cycle Details */}
          <Card sx={{ p: 1, width: '100%', mb: 2 }}>
            <Typography color="primary" fontWeight="bold" sx={{ px: 2, pt: 1 }}>
              Appraisal Cycle Details
            </Typography>
            <CardContent>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Appraisal Cycle Name"
                    required
                    value={cycleName}
                    onChange={(e) => setCycleName(e.target.value)}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    required
                    multiline
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={startDate}
                    onChange={handleDateChange}
                    error={error}
                    helperText={errorMessage}
                    inputProps={{ min: today }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    error={!!endDateError}
                    helperText={endDateError}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl component="fieldset">
                    <Typography>Status</Typography>
                    <RadioGroup
                      row
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <FormControlLabel
                        value="active"
                        control={<Radio />}
                        label="Active"
                      />
                      <FormControlLabel
                        value="inactive"
                        control={<Radio />}
                        label="Inactive"
                      />
                    </RadioGroup>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Stages */}
          <Card sx={{ p: 1, width: '100%', mb: 2 }}>
            <CardContent>
              <Grid container spacing={2} sx={{ mb: 1 }}>
                <Grid size={4}>
                  <Typography fontWeight="bold" sx={{ color: 'primary.main' }}>
                    Stages
                  </Typography>
                </Grid>
                <Grid size={4}>
                  <Typography fontWeight="bold" sx={{ color: 'primary.main' }}>
                    Start Date
                  </Typography>
                </Grid>
                <Grid size={4}>
                  <Typography fontWeight="bold" sx={{ color: 'primary.main' }}>
                    End Date
                  </Typography>
                </Grid>
              </Grid>

              {stages.map((stage, index) => (
                <Grid
                  container
                  spacing={2}
                  key={index}
                  sx={{ mb: 1, alignItems: 'center' }}
                >
                  <Grid size={4} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography
                      sx={{ fontWeight: 'bold', color: 'primary.main' }}
                    >
                      {stage.name}
                    </Typography>
                  </Grid>
                  <Grid size={4}>
                    <TextField
                      fullWidth
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={stage.startDate}
                      onChange={(e) => {
                        const newStages = [...stages];
                        newStages[index].startDate = e.target.value;
                        setStages(newStages);
                      }}
                      error={!!stageErrors[index]?.start}
                      helperText={stageErrors[index]?.start}
                    />
                  </Grid>
                  <Grid size={4}>
                    <TextField
                      fullWidth
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={stage.endDate}
                      onChange={(e) => {
                        const newStages = [...stages];
                        newStages[index].endDate = e.target.value;
                        setStages(newStages);
                      }}
                      error={!!stageErrors[index]?.end}
                      helperText={stageErrors[index]?.end}
                    />
                  </Grid>
                </Grid>
              ))}
            </CardContent>
          </Card>

          {/* Parameters */}
          <Card sx={{ p: 1, width: '100%', mb: 2 }}>
            <CardContent>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
              >
                <Typography
                  fontWeight="bold"
                  sx={{ flex: 2, color: 'primary.main' }}
                >
                  Parameters For Lead Assessment
                </Typography>
                <Typography
                  fontWeight="bold"
                  sx={{ flex: 2, color: 'primary.main' }}
                >
                  Help Text
                </Typography>
                <Typography
                  fontWeight="bold"
                  sx={{ flex: 1, color: 'primary.main', textAlign: 'center' }}
                >
                  Employee
                </Typography>
                <Typography
                  fontWeight="bold"
                  sx={{ flex: 1, color: 'primary.main', textAlign: 'center' }}
                >
                  Team Lead
                </Typography>
                <Box sx={{ width: 40 }} />
              </Box>

              {parameters.map((param, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mb: 1.5,
                  }}
                >
                  <TextField
                    fullWidth
                    sx={{ flex: 2 }}
                    disabled={param.fixed}
                    value={param.name}
                    onChange={(e) => {
                      const newParams = [...parameters];
                      newParams[index].name = e.target.value;
                      setParameters(newParams);
                    }}
                  />
                  <TextField
                    fullWidth
                    sx={{ flex: 2 }}
                    value={param.helptext}
                    onChange={(e) => {
                      const newParams = [...parameters];
                      newParams[index].helptext = e.target.value;
                      setParameters(newParams);
                    }}
                  />
                  <Box
                    sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}
                  >
                    <Checkbox
                      checked={param.employee}
                      disabled={param.fixed}
                      onChange={(e) => {
                        const newParams = [...parameters];
                        newParams[index].employee = e.target.checked;
                        setParameters(newParams);
                      }}
                    />
                  </Box>
                  <Box
                    sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}
                  >
                    <Checkbox
                      checked={param.teamLead}
                      disabled={param.fixed}
                      onChange={(e) => {
                        const newParams = [...parameters];
                        newParams[index].teamLead = e.target.checked;
                        setParameters(newParams);
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      width: 40,
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    <IconButton
                      disabled={param.fixed}
                      onClick={() => removeParameter(index)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              ))}

              <Box
                sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1 }}
              >
                <IconButton color="primary" onClick={addParameter}>
                  <AddIcon />
                </IconButton>
              </Box>
            </CardContent>
          </Card>

          {/* Actions */}
          <Grid container justifyContent="flex-end" gap={2} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={handleCancel} color="error">
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={!formValid}
            >
              Save
            </Button>
          </Grid>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
          </Snackbar>
        </CardContent>
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

export default AddAppraisalCycle;

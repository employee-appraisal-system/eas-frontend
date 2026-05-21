import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import { useNavigate } from 'react-router-dom';
import { cycleById, editAppraisalCycle } from '../services/EditAppraisalCycle';

const EditAppraisalCycle = () => {
  const [cycle, setCycle] = useState(null);
  const { cycle_id } = useParams();

  // Appraisal Cycle State
  const [cycleName, setCycleName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');

  // Validation Errors
  const [startDateError, setStartDateError] = useState('');
  const [endDateError, setEndDateError] = useState('');
  const [stageErrors, setStageErrors] = useState({});

  // Snackbar State
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  //Save state
  const [saving, setSaving] = useState(false);

  // Stages State
  const [stages, setStages] = useState([
    { name: 'Setup', startDate: '', endDate: '' },
    { name: 'Self Assessment', startDate: '', endDate: '' },
    { name: 'Lead Assessment', startDate: '', endDate: '' },
    { name: 'HR/VL Validation', startDate: '', endDate: '' },
    { name: 'Closure', startDate: '', endDate: '' },
  ]);

  //new
  const [parameterErrors, setParameterErrors] = useState({});

  // Parameters State
  const [parameters, setParameters] = useState([
    {
      name: 'Overall Performance Rating',
      helptext: '',
      employee: true,
      teamLead: true,
      fixed: true,
    },
  ]);

  const getCycleById = async () => {
    try {
      const data = await cycleById(Number(cycle_id));
      setCycle(data);
      setCycleName(data.cycle_name);
      setDescription(data.description);
      setStatus(data.status);
      setStartDate(data.start_date_of_cycle);
      setEndDate(data.end_date_of_cycle);

      if (data.stages && Array.isArray(data.stages)) {
        const formattedStages = data.stages
          .map((stage) => ({
            stage_id: stage.stage_id,
            name: stage.stage_name,
            startDate: stage.start_date_of_stage,
            endDate: stage.end_date_of_stage,
          }))
          .sort((a, b) => a.stage_id - b.stage_id);
        setStages(formattedStages);
      }

      if (data.parameters && Array.isArray(data.parameters)) {
        const formattedParameters = data.parameters.map((parameter) => ({
          parameter_id: parameter.parameter_id,
          name: parameter.parameter_title,
          helptext: parameter.helptext,
          employee: parameter.applicable_to_employee,
          teamLead: parameter.applicable_to_lead,
          fixed: parameter.is_fixed_parameter,
        }));
        const sortedParameters = [
          ...formattedParameters.filter((p) => p.fixed),
          ...formattedParameters.filter((p) => !p.fixed),
        ];
        setParameters(sortedParameters);
      }
    } catch (error) {
      console.log('Error while fetching cycle: ' + error);
    }
  };

  useEffect(() => {
    getCycleById();
  }, []);

  const [formValid, setFormValid] = useState(false);

  useEffect(() => {
    validateForm();
  }, [cycleName, description, status, startDate, endDate, stages, parameters]);

  const validateForm = () => {
    let valid = true;

    if (!cycleName.trim()) {
      valid = false;
    }

    if (!description.trim()) {
      valid = false;
    }

    if (!status) {
      valid = false;
    }

    if (!startDate) {
      setStartDateError('Start date is required');
      valid = false;
    } else {
      setStartDateError('');
    }

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

      if (!stage.startDate || !stage.endDate) {
        valid = false;
      }

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

    setParameterErrors(newParameterErrors);
    setStageErrors(newStageErrors);
    setFormValid(valid);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const cycleData = {
        cycle_id: cycle.cycle_id,
        cycle_name: cycleName,
        description: description,
        status: status,
        start_date_of_cycle: startDate,
        end_date_of_cycle: endDate,
        stages: stages,
        parameters: parameters,
      };

      const response = await editAppraisalCycle(cycleData);

      setSnackbar({
        open: true,
        message: response.message,
        severity: 'success',
      });
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
    const updatedParameters = parameters.filter((_, i) => i !== index);
    setParameters(updatedParameters);
  };

  const navigate = useNavigate();

  return (
    <>
      <Card sx={{ p: 3, width: '90%', margin: 'auto', mt: 5, mb: 3 }}>
        <Grid container alignItems="center">
          <Grid size={11}>
            <Typography variant="h6" color="primary">
              Edit Appraisal Cycle
            </Typography>
          </Grid>
          <Grid size={0.5} sx={{ textAlign: 'right' }}>
            <IconButton onClick={getCycleById}>
              <RefreshOutlinedIcon color="primary" />
            </IconButton>
          </Grid>
          <Grid size={0.5} sx={{ textAlign: 'right' }}>
            <IconButton onClick={() => navigate('/hr-home')} color="error">
              <CloseIcon />
            </IconButton>
          </Grid>
        </Grid>
        <CardContent>
          <Card sx={{ p: 1, width: '100%' }}>
            <Typography color="primary" fontWeight="bold">
              Appraisal Cycle Details
            </Typography>
            <CardContent>
              {/* Appraisal Cycle Inputs */}
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
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={startDate}
                    error={startDateError}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </Grid>
                <Grid size={6}>
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
                <Grid item xs={12} sm={6}>
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
                      <FormControlLabel
                        value="completed"
                        control={<Radio />}
                        label="Completed"
                      />
                    </RadioGroup>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          {/* Stages Section */}
          <Card sx={{ p: 1, width: '100%', mt: 1 }}>
            <CardContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={4}>
                  <Typography fontWeight="bold" sx={{ color: 'primary.main' }}>
                    Stages
                  </Typography>
                </Grid>
                <Grid size={4}>
                  <Typography
                    fontWeight="bold"
                    sx={{ ml: 2, color: 'primary.main' }}
                  >
                    Start Date
                  </Typography>
                </Grid>
                <Grid size={4}>
                  <Typography
                    fontWeight="bold"
                    sx={{ ml: 2, color: 'primary.main' }}
                  >
                    End Date
                  </Typography>
                </Grid>
              </Grid>

              {stages.map((stage, index) => (
                <Grid
                  container
                  spacing={2}
                  key={index}
                  sx={{ mt: 1, alignItems: 'center' }}
                >
                  <Grid size={4}>
                    <Typography
                      sx={{ fontWeight: 'bold', color: 'primary.main', pb: 3 }}
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
                      helperText={stageErrors[index]?.start || '\u00A0'}
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
                      helperText={stageErrors[index]?.end || '\u00A0'}
                    />
                  </Grid>
                </Grid>
              ))}
            </CardContent>
          </Card>
          {/* Parameters Section */}

          <Card sx={{ p: 2, width: '100%', mt: 1 }}>
            <CardContent>
              {/* Header Row */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flexWrap: 'wrap',
                }}
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
                  sx={{ flex: 1, color: 'primary.main' }}
                >
                  Employee
                </Typography>
                <Typography
                  fontWeight="bold"
                  sx={{ flex: 1, color: 'primary.main' }}
                >
                  Team Lead
                </Typography>
              </Box>

              {/* Parameters List */}
              {parameters.map((param, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    flexWrap: 'wrap',
                    mt: 1,
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
                      flex: 'none',
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

              {/* Add Button */}
              <Box
                sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}
              >
                <IconButton color="primary" onClick={addParameter}>
                  <AddIcon />
                </IconButton>
              </Box>
            </CardContent>
          </Card>

          <Grid container justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={!formValid}
              sx={{ mt: 3 }}
            >
              Save
            </Button>
          </Grid>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
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

export default EditAppraisalCycle;

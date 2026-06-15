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
import { createAppraisalCycle, createStage, createParameter } from '../../api';
import { useNavigate } from 'react-router-dom';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

const AddAppraisalPage = () => {
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
      helptext: 'Performance Rating',
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
        helptext: 'Performance Rating',
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

    let newStageErrors = {};
    let previousEndDate = startDate;

    stages.forEach((stage, index) => {
      let err = {};
      if (!stage.startDate || !stage.endDate) valid = false;
      if (stage.startDate && (stage.startDate < startDate || stage.startDate > endDate)) {
        err.start = 'Start date must be within cycle period';
        valid = false;
      }
      if (stage.endDate && stage.endDate < stage.startDate) {
        err.end = 'End date must be after start date';
        valid = false;
      } else if (stage.endDate && stage.endDate > endDate) {
        err.end = 'End date must be within cycle period';
        valid = false;
      }
      if (index > 0 && stage.startDate && previousEndDate && stage.startDate <= previousEndDate) {
        err.start = "Start date must be after the previous stage's end date";
        valid = false;
      }
      previousEndDate = stage.endDate;
      newStageErrors[index] = err;
    });

    let newParameterErrors = {};
    parameters.forEach((param, index) => {
      let err = {};
      if (!param.name.trim()) {
        err.name = 'Parameter name is required';
        valid = false;
      }
      if (!param.employee && !param.teamLead) {
        err.selection = 'At least one selection (Employee or Team Lead) is required';
        valid = false;
      }
      newParameterErrors[index] = err;
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
      setSnackbar({ open: true, message: 'Cycle Created Successfully!', severity: 'success' });
      setTimeout(() => {
        handleCancel();
      }, 2000);
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const addParameter = () => {
    setParameters([
      ...parameters,
      { name: '', helptext: '', employee: false, teamLead: false, fixed: false },
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
      {/* Page header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          pb: 2,
          mb: 2,
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Add Appraisal Cycle
          </Typography>
        </Box>
        <IconButton onClick={() => navigate('/hr-home')} sx={{ color: 'grey.500', '&:hover': { color: 'error.main' } }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Card sx={{ width: '100%', mb: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Cycle Details */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
              Appraisal Cycle Details
            </Typography>
            <Grid container spacing={2.5}>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Appraisal Cycle Name"
                  required
                  value={cycleName}
                  onChange={(e) => setCycleName(e.target.value)}
                  placeholder="e.g. FY 2026-27 Appraisal Cycle"
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Description"
                  required
                  multiline
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the target audience, expectations, and cycle instructions..."
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
              <Grid size={12}>
                <FormControl component="fieldset" sx={{ mt: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.secondary' }}>Status</Typography>
                  <RadioGroup row value={status} onChange={(e) => setStatus(e.target.value)}>
                    <FormControlLabel value="active" control={<Radio size="small" />} label="Active" />
                    <FormControlLabel value="inactive" control={<Radio size="small" />} label="Inactive" />
                  </RadioGroup>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          {/* Stages */}
          <Box sx={{ mb: 4, pt: 2, borderTop: '1px solid #E5E7EB' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
              Workflow Stages
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Timeline phases must be chronological and fall within the overall cycle dates.
            </Typography>

            <Grid container spacing={2} sx={{ mb: 1.5, display: { xs: 'none', sm: 'flex' } }}>
              <Grid size={4}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>Stage Name</Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>Start Date</Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>End Date</Typography>
              </Grid>
            </Grid>

            {stages.map((stage, index) => (
              <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'center' }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {stage.name}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
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
                <Grid size={{ xs: 12, sm: 4 }}>
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
          </Box>

          {/* Parameters */}
          <Box sx={{ mb: 4, pt: 2, borderTop: '1px solid #E5E7EB' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Lead Assessment Parameters
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Define the criteria leads will evaluate. Specify role applicability.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2, mb: 1.5, px: 1 }}>
              <Typography variant="body2" sx={{ flex: 2, fontWeight: 700, color: 'text.secondary' }}>
                Parameter Name
              </Typography>
              <Typography variant="body2" sx={{ flex: 2, fontWeight: 700, color: 'text.secondary' }}>
                Help Text / Instruction
              </Typography>
              <Typography variant="body2" sx={{ flex: 1, fontWeight: 700, color: 'text.secondary', textAlign: 'center' }}>
                Employee Self-Assess
              </Typography>
              <Typography variant="body2" sx={{ flex: 1, fontWeight: 700, color: 'text.secondary', textAlign: 'center' }}>
                Lead Evaluate
              </Typography>
              <Box sx={{ width: 40 }} />
            </Box>

            {parameters.map((param, index) => (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', md: 'row' }, 
                  alignItems: { xs: 'stretch', md: 'center' }, 
                  gap: 2, 
                  mb: 2,
                  p: { xs: 2, md: 0 },
                  border: { xs: '1px solid #E5E7EB', md: 'none' },
                  borderRadius: { xs: 1, md: 0 },
                  backgroundColor: { xs: '#F9FAFB', md: 'transparent' }
                }}
              >
                <TextField
                  fullWidth
                  placeholder="e.g. Code Quality"
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
                  placeholder="e.g. Rates adherence to project patterns and linting rules."
                  sx={{ flex: 2 }}
                  value={param.helptext}
                  onChange={(e) => {
                    const newParams = [...parameters];
                    newParams[index].helptext = e.target.value;
                    setParameters(newParams);
                  }}
                />
                
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ display: { xs: 'inline', md: 'none' }, fontWeight: 600 }}>Employee:</Typography>
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
                
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ display: { xs: 'inline', md: 'none' }, fontWeight: 600 }}>Lead:</Typography>
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

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: { xs: '100%', md: 40 } }}>
                  <IconButton
                    disabled={param.fixed}
                    onClick={() => removeParameter(index)}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            ))}

            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1.5 }}>
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />} 
                onClick={addParameter}
                size="small"
              >
                Add Custom Parameter
              </Button>
            </Box>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, pt: 3, borderTop: '1px solid #E5E7EB' }}>
            <Button variant="outlined" onClick={handleCancel} color="inherit">
              Clear Form
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={!formValid}
              sx={{ px: 4 }}
            >
              Save Cycle
            </Button>
          </Box>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert severity={snackbar.severity} sx={{ width: '100%', boxShadow: 3 }}>
              {snackbar.message}
            </Alert>
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

export default AddAppraisalPage;

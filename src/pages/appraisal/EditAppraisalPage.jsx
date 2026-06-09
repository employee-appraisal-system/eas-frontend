import { useState, useEffect, useCallback } from 'react';
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
import { getCycleById as fetchCycleById, editAppraisalCycle } from '../../api';

const EditAppraisalPage = () => {
  const [cycle, setCycle] = useState(null);
  const { cycle_id } = useParams();

  const [cycleName, setCycleName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');

  const [startDateError, setStartDateError] = useState('');
  const [endDateError, setEndDateError] = useState('');
  const [stageErrors, setStageErrors] = useState({});

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [saving, setSaving] = useState(false);

  const [stages, setStages] = useState([
    { name: 'Setup', startDate: '', endDate: '' },
    { name: 'Self Assessment', startDate: '', endDate: '' },
    { name: 'Lead Assessment', startDate: '', endDate: '' },
    { name: 'HR/VL Validation', startDate: '', endDate: '' },
    { name: 'Closure', startDate: '', endDate: '' },
  ]);

  const [parameters, setParameters] = useState([
    { name: 'Overall Performance Rating', helptext: '', employee: true, teamLead: true, fixed: true },
  ]);

  const getCycleById = useCallback(async () => {
    try {
      const data = await fetchCycleById(Number(cycle_id));
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
  }, [cycle_id]);

  useEffect(() => {
    getCycleById();
  }, [getCycleById]);

  const [formValid, setFormValid] = useState(false);

  const validateForm = useCallback(() => {
    let valid = true;

    if (!cycleName.trim()) valid = false;
    if (!description.trim()) valid = false;
    if (!status) valid = false;

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

    parameters.forEach((param) => {
      let err = {};
      if (!param.name.trim()) {
        err.name = 'Parameter name is required';
        valid = false;
      }
      if (!param.employee && !param.teamLead) {
        err.selection = 'At least one selection (Employee or Team Lead) is required';
        valid = false;
      }
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
      const cycleData = {
        cycle_id: cycle.cycle_id,
        cycle_name: cycleName,
        description,
        status,
        start_date_of_cycle: startDate,
        end_date_of_cycle: endDate,
        stages,
        parameters,
      };
      const response = await editAppraisalCycle(cycleData);
      setSnackbar({ open: true, message: response.message, severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const addParameter = () => {
    setParameters([...parameters, { name: '', helptext: '', employee: false, teamLead: false, fixed: false }]);
  };

  const removeParameter = (index) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const navigate = useNavigate();

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
                Edit Appraisal Cycle
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Update appraisal cycle details, timelines, and parameters.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton onClick={getCycleById} title="Refresh details" sx={{ color: 'grey.500', '&:hover': { color: 'primary.main' } }}>
                <RefreshOutlinedIcon />
              </IconButton>
              <IconButton onClick={() => navigate('/hr-home')} sx={{ color: 'grey.500', '&:hover': { color: 'error.main' } }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

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
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={startDate}
                  error={!!startDateError}
                  helperText={startDateError}
                  onChange={(e) => setStartDate(e.target.value)}
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
                    <FormControlLabel value="completed" control={<Radio size="small" />} label="Completed" />
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
                      const s = [...stages];
                      s[index].startDate = e.target.value;
                      setStages(s);
                    }}
                    error={!!stageErrors[index]?.start}
                    helperText={stageErrors[index]?.start || '\u00A0'}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={stage.endDate}
                    onChange={(e) => {
                      const s = [...stages];
                      s[index].endDate = e.target.value;
                      setStages(s);
                    }}
                    error={!!stageErrors[index]?.end}
                    helperText={stageErrors[index]?.end || '\u00A0'}
                  />
                </Grid>
              </Grid>
            ))}
          </Box>

          {/* Parameters */}
          <Box sx={{ mb: 4, pt: 2, borderTop: '1px solid #E5E7EB' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Lead Assessment Parameters
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
              Define parameters leads will evaluate. Specify role applicability.
            </Typography>

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
                  sx={{ flex: 2 }}
                  disabled={param.fixed}
                  value={param.name}
                  onChange={(e) => {
                    const p = [...parameters];
                    p[index].name = e.target.value;
                    setParameters(p);
                  }}
                />
                <TextField
                  fullWidth
                  sx={{ flex: 2 }}
                  value={param.helptext}
                  onChange={(e) => {
                    const p = [...parameters];
                    p[index].helptext = e.target.value;
                    setParameters(p);
                  }}
                />

                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ display: { xs: 'inline', md: 'none' }, fontWeight: 600 }}>Employee:</Typography>
                  <Checkbox
                    checked={param.employee}
                    disabled={param.fixed}
                    onChange={(e) => {
                      const p = [...parameters];
                      p[index].employee = e.target.checked;
                      setParameters(p);
                    }}
                  />
                </Box>

                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ display: { xs: 'inline', md: 'none' }, fontWeight: 600 }}>Lead:</Typography>
                  <Checkbox
                    checked={param.teamLead}
                    disabled={param.fixed}
                    onChange={(e) => {
                      const p = [...parameters];
                      p[index].teamLead = e.target.checked;
                      setParameters(p);
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
            <Button variant="outlined" onClick={() => navigate('/hr-home')} color="inherit">
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={!formValid}
              sx={{ px: 4 }}
            >
              Save Changes
            </Button>
          </Box>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert severity={snackbar.severity} sx={{ width: '100%', boxShadow: 3 }}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </CardContent>
      </Card>
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={saving}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
};

export default EditAppraisalPage;

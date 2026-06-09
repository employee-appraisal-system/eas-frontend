import { useState, useMemo, useEffect } from 'react';

// External libraries (MUI)
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  IconButton,
  Snackbar,
  Alert,
  Card,
  CardContent,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

// MUI Icons
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

// Custom components
import CustomToolbar from './CustomToolbar';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';

// API services
import { fetchQuestions, addQuestion } from '../api';

export default function Questionnaire() {
  // Question list state
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingquestions] = useState(true);

  // Add-question form state
  const [question_text, setQuestionText] = useState('');
  const [question_type, setQuestionType] = useState('');
  const [mcqOptions, setMcqOptions] = useState(['']);
  const [yesNoLabels, setYesNoLabels] = useState(['Yes', 'No']);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // ── MCQ helpers ───────────────────────────────────────────────────────────
  const handleAddMcqOption = () => setMcqOptions([...mcqOptions, '']);

  const handleMcqOptionChange = (index, value) => {
    const updated = [...mcqOptions];
    updated[index] = value;
    setMcqOptions(updated);
  };

  const handleRemoveMcqOption = (index) => {
    if (mcqOptions.length > 1) {
      setMcqOptions(mcqOptions.filter((_, i) => i !== index));
    }
  };

  // ── Yes/No helpers ────────────────────────────────────────────────────────
  const handleYesNoLabelChange = (index, value) => {
    setYesNoLabels((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!question_text || !question_type) {
      setSnackbar({ open: true, message: 'Question text and type are required.', severity: 'error' });
      return;
    }
    if (question_text.trim() === '') {
      setSnackbar({ open: true, message: 'Question text cannot be empty.', severity: 'error' });
      return;
    }
    if (question_text.length > 250) {
      setSnackbar({ open: true, message: 'Question text should be less than 250 characters.', severity: 'error' });
      return;
    }

    let options = null;

    if (question_type === 'MCQ' || question_type === 'Single Choice') {
      options = mcqOptions.filter((opt) => opt.trim() !== '').map((opt) => ({ option_text: opt }));
      if (options.length === 0) {
        setSnackbar({ open: true, message: 'At least one option is required for MCQ or Single Choice questions.', severity: 'error' });
        return;
      }
      if (mcqOptions.some((opt) => opt.trim() === '')) {
        setSnackbar({ open: true, message: 'Options cannot be empty.', severity: 'error' });
        return;
      }
    }

    if (question_type === 'Yes/No') {
      options = yesNoLabels.filter((opt) => opt.trim() !== '').map((opt) => ({ option_text: opt }));
      if (options.length === 0) {
        setSnackbar({ open: true, message: 'Yes/No options cannot be empty.', severity: 'error' });
        return;
      }
      if (yesNoLabels.some((opt) => opt.trim() === '')) {
        setSnackbar({ open: true, message: 'Yes/No labels cannot be empty.', severity: 'error' });
        return;
      }
    }

    try {
      await addQuestion({ question_type, question_text, options });
      loadQuestions();
      handleCancel();
      setSnackbar({ open: true, message: 'Question added successfully!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: `Error: ${err.message}`, severity: 'error' });
    }
  };

  const handleCancel = () => {
    setQuestionText('');
    setQuestionType('');
    setMcqOptions(['']);
    setYesNoLabels(['Yes', 'No']);
  };

  // ── Load questions ────────────────────────────────────────────────────────
  const loadQuestions = async () => {
    try {
      setLoadingquestions(true);
      const data = await fetchQuestions();
      setQuestions(data);
    } catch (err) {
      setSnackbar({ open: true, message: `Error: ${err?.message || 'Failed to load questions.'}`, severity: 'error' });
    } finally {
      setLoadingquestions(false);
    }
  };

  useEffect(() => { loadQuestions(); }, []);

  const columns = useMemo(() => [
    { field: 'question_id', headerName: 'Q. No.', width: 80 },
    { field: 'question_text', headerName: 'Question', flex: 1, minWidth: 200 },
  ], []);

  const rows = useMemo(() => questions, [questions]);

  // ── Render ────────────────────────────────────────────────────────────────
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
            Questionnaire
          </Typography>
        </Box>
      </Box>

      {/* Two-column layout — true 50/50, no outer card border */}
      <Grid container spacing={2} sx={{ alignItems: 'stretch' }}>
        {/* ── Left: Questions list ── */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: { xs: 400, md: 'calc(100vh - 160px)' },
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {loadingQuestions ? (
              <LoadingState message="Loading questions database..." />
            ) : questions.length === 0 ? (
              <EmptyState
                title="No Questions Available"
                message="Use the panel on the right to create your first question."
              />
            ) : (
              <DataGrid
                rows={rows}
                columns={columns}
                getRowId={(row) => row.question_id}
                slots={{ toolbar: CustomToolbar }}
                showToolbar
                sx={{ height: '100%', border: 'none' }}
                rowHeight={48}
              />
            )}
          </Card>
        </Grid>

        {/* ── Right: Add question form ── */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: { xs: 'auto', md: 'calc(100vh - 160px)' },
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardContent
              sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                p: 3,
                '&:last-child': { pb: 3 },
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
                Add New Question
              </Typography>

              {/* Scrollable form fields */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1, overflowY: 'auto', pr: 0.5 }}>
                <TextField
                  fullWidth
                  label="Question Text"
                  value={question_text}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="e.g. Rate your alignment with core project goals."
                  multiline
                  rows={2}
                />

                <FormControl fullWidth size="small">
                  <InputLabel id="question-type-label">Question Type</InputLabel>
                  <Select
                    labelId="question-type-label"
                    id="question-type-select"
                    value={question_type}
                    onChange={(e) => setQuestionType(e.target.value)}
                    label="Question Type"
                  >
                    <MenuItem value="Descriptive">Descriptive (Text)</MenuItem>
                    <MenuItem value="MCQ">Multiple Choice (MCQ)</MenuItem>
                    <MenuItem value="Single Choice">Single Choice (Radio)</MenuItem>
                    <MenuItem value="Yes/No">Yes/No</MenuItem>
                  </Select>
                </FormControl>

                {/* MCQ Options */}
                {(question_type === 'MCQ' || question_type === 'Single Choice') && (
                  <Box sx={{ border: '1px solid #E5E7EB', borderRadius: 1, p: 2, backgroundColor: 'grey.50' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 1.5 }}>
                      Answer Options
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 1.5 }}>
                      {mcqOptions.map((option, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder={`Option ${index + 1}`}
                            value={option}
                            onChange={(e) => handleMcqOptionChange(index, e.target.value)}
                            sx={{ backgroundColor: '#ffffff' }}
                          />
                          <IconButton
                            onClick={() => handleRemoveMcqOption(index)}
                            disabled={mcqOptions.length === 1}
                            color="error"
                            size="small"
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                    <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleAddMcqOption}>
                      Add Option
                    </Button>
                  </Box>
                )}

                {/* Yes/No Labels */}
                {question_type === 'Yes/No' && (
                  <Box sx={{ border: '1px solid #E5E7EB', borderRadius: 1, p: 2, backgroundColor: 'grey.50' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 1.5 }}>
                      Yes/No Labels
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {[0, 1].map((index) => (
                        <TextField
                          key={index}
                          fullWidth
                          size="small"
                          label={index === 0 ? 'Yes Label' : 'No Label'}
                          value={yesNoLabels[index]}
                          onChange={(e) => handleYesNoLabelChange(index, e.target.value)}
                          placeholder={index === 0 ? 'Yes' : 'No'}
                          sx={{ backgroundColor: '#ffffff' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Action buttons — pinned to bottom */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 2,
                  pt: 2,
                  mt: 2,
                  borderTop: '1px solid #E5E7EB',
                  flexShrink: 0,
                }}
              >
                <Button variant="outlined" onClick={handleCancel} color="inherit">
                  Clear
                </Button>
                <Button variant="contained" onClick={handleSave} color="primary" sx={{ px: 4 }}>
                  Save Question
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%', boxShadow: 3 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

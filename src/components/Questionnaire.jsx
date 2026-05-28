import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
  Skeleton,
  Tooltip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

//MUI Icons
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

//Custom components
import CustomToolbar from './CustomeToolbar';

//API services
import { fetchQuestions, addQuestion } from '../api';

export default function Questionnaire() {
  const navigate = useNavigate();
  // To display question list.
  const [questions, setQuestions] = useState([]);

  // Add question hooks.
  const [question_text, setQuestionText] = useState('');
  const [question_type, setQuestionType] = useState('');
  const [mcqOptions, setMcqOptions] = useState(['']);
  const [yesNoLabels, setYesNoLabels] = useState(['Yes', 'No']);
  const [loadingQuestions, setLoadingquestions] = useState(true);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  let vertical = 'bottom';
  let horizontal = 'center';
  // Add MCQ option
  const handleAddMcqOption = () => {
    setMcqOptions([...mcqOptions, '']);
  };

  // Update MCQ option
  const handleMcqOptionChange = (index, value) => {
    const updatedOptions = [...mcqOptions];
    updatedOptions[index] = value;
    setMcqOptions(updatedOptions);
  };

  // Remove MCQ option
  const handleRemoveMcqOption = (index) => {
    if (mcqOptions.length > 1) {
      setMcqOptions(mcqOptions.filter((_, i) => i !== index));
    }
  };

  // Update Yes/No labels
  const handleYesNoLabelChange = (index, value) => {
    setYesNoLabels((prevLabels) => {
      const updatedLabels = [...prevLabels];
      updatedLabels[index] = value;
      return updatedLabels;
    });
  };

  // Save question
  const handleSave = async () => {
    if (!question_text || !question_type) {
      setSnackbar({
        open: true,
        message: 'Question text and type are required.',
        severity: 'error',
      });
      return;
    }

    if (question_text.trim() === '') {
      setSnackbar({
        open: true,
        message: 'Question text cannot be empty.',
        severity: 'error',
      });
      return;
    }

    if (question_text.length > 250) {
      setSnackbar({
        open: true,
        message: 'Question text should be less than 250 characters.',
        severity: 'error',
      });
      return;
    }

    let options = null;

    if (question_type === 'MCQ' || question_type === 'Single Choice') {
      options = mcqOptions
        .filter((opt) => opt.trim() !== '')
        .map((opt) => ({ option_text: opt }));
      if (options.length === 0) {
        setSnackbar({
          open: true,
          message:
            'At least one option is required for MCQ or Single Choice questions.',
          severity: 'error',
        });
        return;
      }

      if (mcqOptions.some((opt) => opt.trim() === '')) {
        setSnackbar({
          open: true,
          message: 'Options cannot be empty.',
          severity: 'error',
        });
      }
    }

    if (question_type === 'Yes/No') {
      options = yesNoLabels
        .filter((opt) => opt.trim() !== '')
        .map((opt) => ({ option_text: opt }));
      if (options.length === 0) {
        setSnackbar({
          open: true,
          message: 'Yes/No options cannot be empty.',
          severity: 'error',
        });
        return;
      }

      if (yesNoLabels.some((opt) => opt.trim() === '')) {
        setSnackbar({
          open: true,
          message: 'Yes/No labels cannot be empty.',
          severity: 'error',
        });
        return;
      }
    }

    const questionData = {
      question_type,
      question_text,
      options,
    };

    try {
      await addQuestion(questionData);
      loadQuestions();
      handleCancel();
      setSnackbar({
        open: true,
        message: 'Question added successfully!',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Error: ${err.message}`,
        severity: 'error',
      });
    }
  };

  const handleCancel = () => {
    setQuestionText('');
    setQuestionType('');
    setMcqOptions(['']);
    setYesNoLabels(['Yes', 'No']);
  };

  // Fetch question list.
  const loadQuestions = async () => {
    try {
      setLoadingquestions(true);
      const data = await fetchQuestions();
      setQuestions(data);
    } catch {
    } finally {
      setLoadingquestions(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const columns = useMemo(
    () => [
      { field: 'question_id', headerName: 'Q. No.', width: 90 },
      { field: 'question_text', headerName: 'Questions', width: 500 },
    ],
    []
  );
  const rows = useMemo(() => questions, [questions]);

  return (
    <>
      <Grid container alignItems="center">
        <Grid size={11}>
          <Typography
            variant="h6"
            color="primary"
            fontWeight={'bold'}
            sx={{ padding: '10px' }}
          >
            Questionnaire
          </Typography>
        </Grid>
        <Grid size={1} sx={{ textAlign: 'right' }}>
          <IconButton onClick={() => navigate('/hr-home')} color="error">
            <CloseIcon />
          </IconButton>
        </Grid>
      </Grid>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          mb: 2,
        }}
      >
        <Card
          sx={{
            flex: 1,
            ml: 1.5,
            height: '93vh',
            mr: 2,
            border: '1px solid',
            borderColor: '#e1e1e3',
            borderRadius: 1,
          }}
        >
          {/* Left Panel */}
          {loadingQuestions ? (
            <Box sx={{ width: '90%', p: 2 }}>
              {[...Array(20)].map((_, index) => (
                <Skeleton
                  key={index}
                  variant="rectangular"
                  height={28}
                  sx={{
                    mb: 1,
                    bgcolor: '#e6e9ed',
                    opacity: 0.3,
                  }}
                />
              ))}
            </Box>
          ) : (
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(row) => row.question_id}
              slots={{ toolbar: CustomToolbar }}
              sx={{
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 'bold',
                },
                maxWidth: '100%',
                border: 'none',
              }}
              hideFooter
            />
          )}
        </Card>
        {/* Right Panel */}
        <Card
          sx={{
            flex: 1,
            pr: '5px',
            pl: '10px',
            mr: 1.5,
            height: '93vh',
            border: '1px solid',
            borderColor: '#e1e1e3',
            borderRadius: 1,
          }}
        >
          <CardContent
            sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  mb: 2,
                  color: '#3b7dda',
                }}
              >
                <Typography
                  variant="h6"
                  color="primary"
                  sx={{ fontSize: '16px' }}
                >
                  Add a new question
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2,
                  width: '100%',
                  mt: 2,
                }}
              >
                {question_text ? (
                  <Tooltip
                    title={
                      <span style={{ maxWidth: 500 }}>{question_text}</span>
                    }
                    arrow
                  >
                    <TextField
                      value={question_text}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="Type your question here"
                      variant="standard"
                      sx={{ flex: 1, mr: 10 }}
                      InputProps={{
                        sx: {
                          '&::placeholder': {
                            fontSize: '14px',
                            color: '#888',
                            opacity: 1,
                          },
                          fontSize: '14px',
                        },
                      }}
                    />
                  </Tooltip>
                ) : (
                  <TextField
                    value={question_text}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Type your question here"
                    variant="standard"
                    sx={{ flex: 1, mr: 10 }}
                    InputProps={{
                      sx: {
                        '&::placeholder': {
                          fontSize: '14px',
                          color: '#888',
                          opacity: 1,
                        },
                        fontSize: '14px',
                      },
                    }}
                  />
                )}
                <FormControl sx={{ minWidth: 160 }}>
                  <InputLabel
                    sx={{
                      backgroundColor: 'white',
                      top: '-5px',
                      fontSize: '16px',
                    }}
                  >
                    Question Type
                  </InputLabel>
                  <Select
                    labelId="question-type-label"
                    id="question-type-select"
                    value={question_type}
                    onChange={(e) => setQuestionType(e.target.value)}
                    autoWidth
                    label="Question_Type"
                    sx={{
                      height: 40,
                      '& .MuiMenuItem-root': {
                        fontSize: '10px',
                        padding: '12px 16px',
                        minHeight: '20px',
                      },
                    }}
                  >
                    <MenuItem value="MCQ">MCQ</MenuItem>
                    <MenuItem value="Yes/No">Yes/No</MenuItem>
                    <MenuItem value="Descriptive">Descriptive</MenuItem>
                    <MenuItem value="Single Choice">Single Choice</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {question_type === 'MCQ' && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '50%',
                    minWidth: '250px',
                    padding: '7px',
                    marginTop: '15px',
                    borderRadius: '8px',
                    bgcolor: 'background.paper',
                    maxHeight: '600px',
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontSize: '16px',
                      fontWeight: 500,
                      color: '#202124',
                      alignSelf: 'flex-start',
                      marginBottom: '10px',
                    }}
                  >
                    Options
                  </Typography>

                  <Box
                    sx={{
                      flex: 1,
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      maxHeight: '250px',
                      gap: '10px',
                      paddingRight: '4px', // optional: for better scroll space
                    }}
                  >
                    {mcqOptions.map((option, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          borderRadius: '4px',
                          padding: '2px 6px',
                        }}
                      >
                        <TextField
                          fullWidth
                          variant="standard"
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) =>
                            handleMcqOptionChange(index, e.target.value)
                          }
                          InputProps={{
                            disableUnderline: false,
                            sx: {
                              fontSize: '14px',
                              padding: '8px 0',
                              background: 'transparent',
                            },
                          }}
                        />
                        <IconButton
                          onClick={() => handleRemoveMcqOption(index)}
                          disabled={mcqOptions.length === 1}
                          sx={{
                            fontSize: '18px',
                            color: '#5f6368',
                            transition: 'color 0.2s',
                            '&:hover': {
                              color: '#d93025',
                            },
                          }}
                        >
                          <CloseIcon fontSize="inherit" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>

                  <IconButton
                    onClick={handleAddMcqOption}
                    sx={{
                      alignSelf: 'flex-start',
                      fontSize: '25px',
                      color: '#5f6368',
                      textTransform: 'none',
                      marginTop: '10px',
                      '&:hover': {
                        color: '#1a73e8',
                      },
                    }}
                  >
                    <AddIcon fontSize="inherit" />
                  </IconButton>
                </Box>
              )}

              {question_type === 'Single Choice' && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '50%',
                    minWidth: '250px',
                    padding: '7px',
                    marginTop: '15px',
                    borderRadius: '8px',
                    bgcolor: 'background.paper',
                    maxHeight: '600px',
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontSize: '16px',
                      fontWeight: 500,
                      color: '#202124',
                      alignSelf: 'flex-start',
                      marginBottom: '10px',
                    }}
                  >
                    Options
                  </Typography>

                  <Box
                    sx={{
                      flex: 1,
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      maxHeight: '250px',
                      gap: '10px',
                      paddingRight: '4px',
                    }}
                  >
                    {mcqOptions.map((option, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          borderRadius: '4px',
                          padding: '2px 6px',
                        }}
                      >
                        <TextField
                          fullWidth
                          variant="standard"
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) =>
                            handleMcqOptionChange(index, e.target.value)
                          }
                          InputProps={{
                            disableUnderline: false,
                            sx: {
                              fontSize: '14px',
                              padding: '8px 0',
                              background: 'transparent',
                            },
                          }}
                        />
                        <IconButton
                          onClick={() => handleRemoveMcqOption(index)}
                          disabled={mcqOptions.length === 1}
                          sx={{
                            fontSize: '18px',
                            color: '#5f6368',
                            transition: 'color 0.2s',
                            '&:hover': {
                              color: '#d93025',
                            },
                          }}
                        >
                          <CloseIcon fontSize="inherit" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>

                  <IconButton
                    onClick={handleAddMcqOption}
                    sx={{
                      alignSelf: 'flex-start',
                      fontSize: '25px',
                      color: '#5f6368',
                      textTransform: 'none',
                      marginTop: '10px',
                      '&:hover': {
                        color: '#1a73e8',
                      },
                    }}
                  >
                    <AddIcon fontSize="inherit" />
                  </IconButton>
                </Box>
              )}

              {question_type === 'Yes/No' && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    width: '50%', //changed width
                    minWidth: '300px',
                    padding: 2,
                    mt: 2,
                    borderRadius: '8px',
                    bgcolor: 'background.paper',
                    maxHeight: 200,
                    overflowY: 'auto',
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 500,
                      fontSize: '16px',
                      color: '#202124',
                    }}
                  >
                    Labels
                  </Typography>

                  {[0, 1].map((index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        borderRadius: '4px',
                      }}
                    >
                      <TextField
                        sx={{ width: '90%' }}
                        variant="standard"
                        value={yesNoLabels[index]}
                        onChange={(e) =>
                          handleYesNoLabelChange(index, e.target.value)
                        }
                        placeholder={index === 0 ? 'Yes' : 'No'}
                      />
                    </Box>
                  ))}
                </Box>
              )}

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 1,
                  mt: 'auto',
                  mb: 5,
                  ml: 2,
                }}
              >
                <Button
                  variant="contained"
                  onClick={handleSave}
                  color="primary"
                >
                  Save
                </Button>
                <Button
                  variant="contained"
                  onClick={handleCancel}
                  color="error"
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          anchorOrigin={{ vertical, horizontal }}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </>
  );
}

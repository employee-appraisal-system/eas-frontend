import { useState, useEffect, Fragment } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  FormControl,
  MenuItem,
  Select,
  TextField,
  InputAdornment,
  Collapse,
  Divider,
  Button,
  IconButton,
  Skeleton,
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { fetchQuestionsWithOptions } from '../api';

export default function CheckboxList({ onSelect }) {
  const [questions, setQuestions] = useState([]);
  const [checked, setChecked] = useState([]);
  const [type, setType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previousChecked, setPreviousChecked] = useState([]);
  const [hasPreviewFilters, setHasPreviewFilters] = useState(false);
  const [loadingQuestions, setLoadingquestions] = useState(true);

  const fetchQuestions = () => {
    setLoadingquestions(true);
    setQuestions([]);
    setChecked([]);
    setSearchTerm('');
    setType('');
    setIsPreviewMode(false);

    fetchQuestionsWithOptions()
      .then((data) => {
        setQuestions(data);
        setLoadingquestions(false);
      })
      .catch((err) => {
        console.error('Error fetching questions:', err);
        setLoadingquestions(false);
      });
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Handling checkbox toggle
  const handleToggle = (questionId) => () => {
    setChecked((prev) => {
      const updatedChecked = prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId];

      // Get selected questions
      const selectedQuestions = questions.filter((q) =>
        updatedChecked.includes(q.question_id)
      );

      if (onSelect) {
        onSelect(selectedQuestions);
      }

      return updatedChecked;
    });
  };

  const handleQuestionClick = (questionId) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
  };

  // Toggle between preview and selection mode
  const handlePreviewToggle = () => {
    setIsPreviewMode((prev) => !prev);
    setHasPreviewFilters(false);
    setType('');
    setSearchTerm('');
  };

  const handleTypeChange = (e) => {
    setType(e.target.value);
    if (isPreviewMode) setHasPreviewFilters(true);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (isPreviewMode) setHasPreviewFilters(true);
  };

  // Filter questions based on selected type & search key word
  const filteredQuestions = questions.filter(
    (question) =>
      (type === '' || question.question_type === type) &&
      question.question_text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedQuestions = questions.filter((q) =>
    checked.includes(q.question_id)
  );

  const visibleQuestions = isPreviewMode
    ? hasPreviewFilters
      ? selectedQuestions.filter(
          (question) =>
            (type === '' || question.question_type === type) &&
            question.question_text
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
        )
      : selectedQuestions
    : filteredQuestions;

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        height: '550px',
      }}
    >
      {/* Dropdown , refresh and Search */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: { xs: 'flex-start', sm: 'space-between' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 2,
          flexWrap: 'wrap',
        }}
      >
        {/* Dropdown */}
        <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
          <Select
            labelId="question-type-label"
            id="question-type-select"
            value={type}
            onChange={handleTypeChange}
            displayEmpty
            sx={{ height: 40, mt: -2 }}
          >
            <MenuItem value="">Select Question Type</MenuItem>
            <MenuItem value="Descriptive">Descriptive</MenuItem>
            <MenuItem value="MCQ">MCQ</MenuItem>
            <MenuItem value="Single Choice">Single choice</MenuItem>
            <MenuItem value="Yes/No">Yes/No</MenuItem>
          </Select>
        </FormControl>

        {/* Refresh and search */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: -2 }}>
          <IconButton onClick={fetchQuestions} disabled={isPreviewMode}>
            <RefreshOutlinedIcon
              color={isPreviewMode ? 'disabled' : 'primary'}
            />
          </IconButton>

          <TextField
            sx={{
              width: { xs: '100%', sm: '250px' },
              '& .MuiInput-underline:before': {
                borderBottomColor: '#d9d8d4',
              },
            }}
            placeholder="Search..."
            variant="standard"
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'black', fontSize: '20px' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>

      {/* Questions List - Fixed Height to Keep Button at Bottom */}
      {loadingQuestions ? (
        <Box sx={{ width: '100%', mt: 2 }}>
          {[...Array(20)].map((_, index) => (
            <Skeleton
              key={index}
              variant="rectangular"
              height={30}
              sx={{
                mb: 1,
                bgcolor: '#e6e9ed',
                opacity: 0.3,
              }}
            />
          ))}
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: '600px' }}>
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {/* In preview mode - deselect all and restore selections  */}
            {isPreviewMode && (
              <ListItem disablePadding>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={
                      visibleQuestions.length > 0 &&
                      visibleQuestions.every((q) =>
                        checked.includes(q.question_id)
                      )
                    }
                    indeterminate={
                      visibleQuestions.some((q) =>
                        checked.includes(q.question_id)
                      ) &&
                      !visibleQuestions.every((q) =>
                        checked.includes(q.question_id)
                      )
                    }
                    onChange={() => {
                      if (
                        (checked.length === 0 && previousChecked.length > 0) ||
                        (previousChecked.length > 0 &&
                          !previousChecked.some((id) => {
                            const q = questions.find(
                              (q) => q.question_id === id
                            );
                            return (
                              q && (type === '' || q.question_type === type)
                            );
                          }))
                      ) {
                        const newChecked = [...checked, ...previousChecked];
                        setChecked(newChecked);
                        setPreviousChecked([]);

                        if (onSelect) {
                          const allSelectedQuestions = questions.filter((q) =>
                            newChecked.includes(q.question_id)
                          );
                          onSelect(allSelectedQuestions);
                        }
                      } else if (previousChecked.length > 0) {
                        const typeSpecificPreviousIds = previousChecked.filter(
                          (id) => {
                            const q = questions.find(
                              (q) => q.question_id === id
                            );
                            return (
                              q && (type === '' || q.question_type === type)
                            );
                          }
                        );

                        const newChecked = [
                          ...checked,
                          ...typeSpecificPreviousIds,
                        ];

                        const newPreviousChecked = previousChecked.filter(
                          (id) => !typeSpecificPreviousIds.includes(id)
                        );

                        setChecked(newChecked);
                        setPreviousChecked(newPreviousChecked);

                        if (onSelect) {
                          const allSelectedQuestions = questions.filter((q) =>
                            newChecked.includes(q.question_id)
                          );
                          onSelect(allSelectedQuestions);
                        }
                      } else {
                        const visibleIds = visibleQuestions.map(
                          (q) => q.question_id
                        );
                        const visibleCheckedIds = visibleIds.filter((id) =>
                          checked.includes(id)
                        );

                        setPreviousChecked((prev) => [
                          ...prev,
                          ...visibleCheckedIds,
                        ]);

                        const newChecked = checked.filter(
                          (id) => !visibleCheckedIds.includes(id)
                        );
                        setChecked(newChecked);

                        if (onSelect) {
                          const remainingSelectedQuestions = questions.filter(
                            (q) => newChecked.includes(q.question_id)
                          );
                          onSelect(remainingSelectedQuestions);
                        }
                      }
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    checked.some((id) =>
                      visibleQuestions.some((q) => q.question_id === id)
                    )
                      ? 'Deselect All'
                      : previousChecked.length > 0
                        ? 'Restore Selection'
                        : `No selected questions`
                  }
                  sx={{ ml: 2 }}
                />
              </ListItem>
            )}

            {/* In Selection mode : select all  */}
            {!isPreviewMode && (
              <ListItem disablePadding>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={
                      filteredQuestions.length > 0 &&
                      filteredQuestions.every((q) =>
                        checked.includes(q.question_id)
                      )
                    }
                    indeterminate={
                      filteredQuestions.some((q) =>
                        checked.includes(q.question_id)
                      ) &&
                      !filteredQuestions.every((q) =>
                        checked.includes(q.question_id)
                      )
                    }
                    onChange={() => {
                      const filteredIds = filteredQuestions.map(
                        (q) => q.question_id
                      );

                      if (
                        filteredQuestions.every((q) =>
                          checked.includes(q.question_id)
                        )
                      ) {
                        const newChecked = checked.filter(
                          (id) => !filteredIds.includes(id)
                        );
                        setChecked(newChecked);

                        if (onSelect) {
                          const selectedQuestions = questions.filter((q) =>
                            newChecked.includes(q.question_id)
                          );
                          onSelect(selectedQuestions);
                        }
                      } else {
                        const nonFilteredChecked = checked.filter(
                          (id) => !filteredIds.includes(id)
                        );

                        const newChecked = [
                          ...nonFilteredChecked,
                          ...filteredIds,
                        ];
                        setChecked(newChecked);

                        if (onSelect) {
                          const selectedQuestions = questions.filter((q) =>
                            newChecked.includes(q.question_id)
                          );
                          onSelect(selectedQuestions);
                        }
                      }
                    }}
                  />
                </ListItemIcon>
                <ListItemText primary="Select All" sx={{ ml: 2 }} />
              </ListItem>
            )}

            {visibleQuestions.length > 0 ? (
              visibleQuestions.map((question) => {
                const isExpanded = expandedQuestion === question.question_id;
                const isExpandable = question.question_type !== 'Descriptive';

                return (
                  <Fragment key={question.question_id}>
                    <ListItem disablePadding>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={checked.includes(question.question_id)}
                          tabIndex={-1}
                          disableRipple
                          onChange={handleToggle(question.question_id)}
                          inputProps={{
                            'aria-labelledby': `question-${question.question_id}`,
                          }}
                        />
                      </ListItemIcon>

                      <ListItemButton
                        onClick={() =>
                          isExpandable &&
                          handleQuestionClick(question.question_id)
                        }
                        dense
                      >
                        <ListItemText
                          id={`question-${question.question_id}`}
                          primary={question.question_text}
                        />

                        {isExpandable && (
                          <Box sx={{ ml: 2 }}>
                            {isExpanded ? <ExpandLess /> : <ExpandMore />}
                          </Box>
                        )}
                      </ListItemButton>
                    </ListItem>

                    {isExpandable && (
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding sx={{ pl: 10 }}>
                          {question.options.length > 0 ? (
                            question.options.map((option, index) => (
                              <ListItem key={index}>
                                <ListItemText primary={option.option_text} />
                              </ListItem>
                            ))
                          ) : (
                            <ListItem>
                              <ListItemText primary="No options available" />
                            </ListItem>
                          )}
                        </List>
                      </Collapse>
                    )}

                    <Divider sx={{ bgcolor: 'lightgray', my: 0 }} />
                  </Fragment>
                );
              })
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <ListItemText variant="body1" color="text.secondary">
                  No questions available
                </ListItemText>
              </Box>
            )}
          </List>
        </Box>
      )}

      <Box
        sx={{
          mt: 'auto',
          pt: 2,
          display: 'flex',
          justifyContent: 'flex-end',
          mb: 3,
          mr: 1,
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={handlePreviewToggle}
          disabled={checked.length === 0 && !isPreviewMode}
        >
          {isPreviewMode ? 'Go Back to Selection' : 'Preview Selection'}
        </Button>
      </Box>
    </Box>
  );
}

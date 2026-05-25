import { useState } from 'react';
import {
  Button,
  Box,
  Card,
  Snackbar,
  Alert,
  Typography,
  Grid,
} from '@mui/material';
import {
  Group as PanelGroup,
  Panel,
  Separator as PanelResizeHandle,
} from 'react-resizable-panels';
import DataGridDemo from './SelectEmployee';
import CheckboxList from './SelectQuestion';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { createAssignment } from '../api';

export default function Assignment({ cycleId, onClose, cycleName }) {
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [saving, setSaving] = useState(false); //3

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const handleEmployeeSelection = (employees) => {
    setSelectedEmployees(employees);
    console.log('Selected Employees:', employees);
  };

  const handleQuestionSelection = (questions) => {
    setSelectedQuestions(questions);
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleAssign = () => {
    const assignmentData = {
      cycle_id: cycleId,
      employee_ids: selectedEmployees.map((emp) => emp.employee_id),
      question_ids: selectedQuestions.map((q) => q.question_id),
    };
    setSaving(true);
    createAssignment(assignmentData)
      .then(() => {
        showSnackbar('Assignment successful!', 'success');
      })
      .catch((err) => {
        console.error('Error assigning:', err);
        showSnackbar(
          'The question is already assigned to the selected employee',
          'error'
        );
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const handleClose = () => {
    setSelectedEmployees([]);
    setSelectedQuestions([]);
    onClose();
  };

  return (
    <>
      <Box>
        <Card sx={{ mt: 2, width: '100%', height: 600, pr: 2, pl: 2 }}>
          <Grid
            container
            alignItems="center"
            justifyContent="space-between"
            sx={{ mt: 1, ml: 1, mb: 1 }}
          >
            <Grid item sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Typography variant="h6" color="primary" fontWeight={'bold'}>
                {cycleName}
              </Typography>

              <Typography variant="body1">
                Employees: {selectedEmployees.length}
              </Typography>
            </Grid>
          </Grid>

          <PanelGroup direction="horizontal">
            {/* Left Panel - Employee Selection */}
            <Panel defaultSize={50} minSize={30} maxSize={70}>
              <Box>
                <DataGridDemo
                  onSelect={handleEmployeeSelection}
                  selectedEmployees={selectedEmployees}
                />
              </Box>
            </Panel>

            {/* Resize feature */}
            <PanelResizeHandle
              style={{ width: '5px', background: '#ccc', cursor: 'ew-resize' }}
            />

            {/* Right Panel - Question Selection */}
            <Panel defaultSize={50} minSize={30} maxSize={70}>
              <Box
                sx={{
                  padding: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CheckboxList
                  onSelect={handleQuestionSelection}
                  selectedQuestions={selectedQuestions}
                />
              </Box>
            </Panel>
          </PanelGroup>
        </Card>

        {/* Bottom Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'right', gap: 3, mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAssign}
            disabled={
              selectedEmployees.length === 0 || selectedQuestions.length === 0
            }
          >
            Assign
          </Button>
          <Button variant="contained" color="error" onClick={handleClose}>
            Close
          </Button>
        </Box>

        {/* Snackbar Component */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={snackbarSeverity}
            onClose={() => setSnackbarOpen(false)}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={saving}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Snackbar,
  Alert,
  Skeleton,
  Box,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import CustomToolbar from '../../components/CustomToolbar';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { Edit, Delete, Visibility } from '@mui/icons-material';
import { fetchAppraisalCycles, deleteAppraisalCycle } from '../../api';
import Assignment from '../../components/Assignment';
import { getGridNumericOperators, GridFilterInputValue } from '@mui/x-data-grid';

const AppraisalCyclePage = () => {
  const navigate = useNavigate();

  const [appraisalCycles, setAppraisalCycles] = useState([]);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState(null);
  const [selectedCycleName, setSelectedCycleName] = useState(null);
  const [loadingAppraisalCycles, setLoadingAppraisalCycles] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const vertical = 'bottom';
  const horizontal = 'center';

  const findCurrentStage = (cycle) => {
    const today = new Date().toISOString().split('T')[0];
    if (!cycle || !cycle.stages) return 'Unknown';
    for (const stage of cycle.stages) {
      if (today >= stage.start_date_of_stage && today <= stage.end_date_of_stage) {
        return stage.stage_name;
      }
    }
    if (cycle.start_date_of_cycle >= today) return 'Setup';
    return 'Closure';
  };

  const findYear = (cycle) => {
    let date = cycle.end_date_of_cycle;
    return parseInt(date.slice(0, 4));
  };

  const labeledNumericOperators = getGridNumericOperators().map((op) => {
    const labelMap = {
      '>': 'Greater than',
      '<': 'Less than',
      '=': 'Equals',
      '!=': 'Not Equals',
      '>=': 'Greater or Equals',
      '<=': 'Less or Equals',
    };
    return {
      ...op,
      label: labelMap[op.value] || op.label,
      InputComponent: op.InputComponent || GridFilterInputValue,
    };
  });

  const loadAppraisalCycles = async () => {
    try {
      setLoadingAppraisalCycles(true);
      const data = await fetchAppraisalCycles();
      setAppraisalCycles(data);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.message
          ? `Failed to load appraisal cycles: ${err.message}`
          : 'Failed to load appraisal cycles.',
        severity: 'error',
      });
    } finally {
      setLoadingAppraisalCycles(false);
    }
  };

  const handleDelete = async (cycle_id) => {
    try {
      setDeleting(true);
      const cycle = appraisalCycles.find((c) => c.cycle_id === cycle_id);
      if (cycle && cycle.status === 'active') {
        setSnackbar({
          open: true,
          message: "Active cycle can't be deleted..",
          severity: 'error',
        });
        return;
      }
      await deleteAppraisalCycle(cycle_id);
      loadAppraisalCycles();
      setSnackbar({
        open: true,
        message: 'Cycle is deleted successfully.',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.message
          ? `Failed to delete cycle: ${err.message}`
          : 'Failed to delete cycle. Please try again.',
        severity: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  const toggleDetailsView = (cycleId) => {
    const selectedCycle = appraisalCycles.find((cycle) => cycle.cycle_id === cycleId);
    if (selectedCycleId === cycleId && detailsVisible) {
      setDetailsVisible(false);
      setSelectedCycleId(null);
      setSelectedCycleName(null);
    } else {
      setDetailsVisible(true);
      setSelectedCycleId(cycleId);
      setSelectedCycleName(selectedCycle?.cycle_name || 'Unknown Cycle');
    }
  };

  const handleCloseAssignment = () => {
    setDetailsVisible(false);
    setSelectedCycleId(null);
  };

  useEffect(() => {
    loadAppraisalCycles();
  }, []);

  const rowsWithStage = Array.isArray(appraisalCycles)
    ? appraisalCycles.map((cycle) => ({
        ...cycle,
        currentStage: findCurrentStage(cycle),
        years: findYear(cycle),
      }))
    : [];

  const columnsWithStage = [
    {
      field: 'cycle_name',
      headerName: 'Name',
      flex: 1,
      renderCell: (params) => {
        const cycleStr = params.value;
        return cycleStr.charAt(0).toUpperCase() + cycleStr.slice(1);
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      renderCell: (params) => {
        const statusStr = params.value;
        return statusStr.charAt(0).toUpperCase() + statusStr.slice(1);
      },
    },
    {
      field: 'years',
      headerName: 'Year',
      flex: 1,
      filterOperators: labeledNumericOperators,
    },
    { field: 'currentStage', headerName: 'Current Stage', flex: 1 },
    {
      field: 'start_date_of_cycle',
      headerName: 'Start Date',
      flex: 1,
      renderCell: (params) => {
        const dateStr = params.value;
        if (!dateStr) return '';
        return new Date(dateStr)
          .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          .replace(/ /g, ' ');
      },
    },
    {
      field: 'end_date_of_cycle',
      headerName: 'End Date',
      flex: 1,
      renderCell: (params) => {
        const dateStr = params.value;
        if (!dateStr) return '';
        return new Date(dateStr)
          .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          .replace(/ /g, ' ');
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      sortable: false,
      renderCell: (params) => {
        const isDeletable =
          params.row.status !== 'active' && params.row.status !== 'completed';
        const isVisible = params.row.status !== 'completed';
        const isEditable = params.row.status !== 'completed';

        return (
          <>
            <IconButton
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                if (isVisible) toggleDetailsView(params.row.cycle_id);
              }}
              disabled={
                !isVisible || (detailsVisible && selectedCycleId !== params.row.cycle_id)
              }
            >
              <Visibility />
            </IconButton>

            <IconButton
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                if (isEditable) navigate(`/edit-appraisal/${params.row.cycle_id}`);
              }}
              disabled={!isEditable}
            >
              <Edit />
            </IconButton>

            <IconButton
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                if (isDeletable) handleDelete(params.row.cycle_id);
              }}
              disabled={!isDeletable}
            >
              <Delete />
            </IconButton>
          </>
        );
      },
    },
  ];

  const getRowHeight = () => 38;

  return (
    <>
      <Card sx={{ width: '100%' }}>
        <CardContent sx={{ height: detailsVisible ? 300 : '100%' }}>
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
              Appraisal Cycle
            </Typography>

            <Button
              variant="contained"
              onClick={() => navigate('/add-appraisal')}
              color="primary"
            >
              Add
            </Button>
          </Box>

          {loadingAppraisalCycles ? (
            <Box sx={{ width: '100%', mt: 2 }}>
              {[...Array(20)].map((_, index) => (
                <Skeleton
                  key={index}
                  variant="rectangular"
                  height={30}
                  sx={{ mb: 1, bgcolor: 'action.hover', opacity: 0.3 }}
                />
              ))}
            </Box>
          ) : (
            <Box sx={{ height: '100%', width: '100%' }}>
              <DataGrid
                rows={rowsWithStage}
                columns={columnsWithStage}
                getRowId={(row) => row.cycle_id}
                slots={{ toolbar: CustomToolbar }}
                pageSizeOptions={[5]}
                showToolbar
                sx={{
                  height: detailsVisible ? 250 : '93vh',
                  p: 0.25,
                  minHeight: 'auto',
                  overflow: 'auto',
                  '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 'bold' },
                }}
                rowHeight={getRowHeight()}
                hideFooter
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <Box sx={{ mb: 2 }}>
        {detailsVisible && selectedCycleId && (
          <Assignment
            cycleId={selectedCycleId}
            onClose={handleCloseAssignment}
            cycleName={selectedCycleName}
          />
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        anchorOrigin={{ vertical, horizontal }}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={deleting}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
};

export default AppraisalCyclePage;

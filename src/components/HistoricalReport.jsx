import * as React from 'react';
import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import OutlinedInput from '@mui/material/OutlinedInput';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import { Typography, IconButton, Skeleton, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import CustomToolbar from './CustomeToolbar';
import {
  fetchEmployeesList,
  fetchLeadAssessmentReportCycles,
  fetchEmployeeRatings,
} from '../api';

// Helper function to format ratings
const formatRating = (ratingValue) => {
  if (
    ratingValue === undefined ||
    ratingValue === null ||
    ratingValue === '-'
  ) {
    return '-';
  }

  const numericRating = Number(ratingValue);

  switch (numericRating) {
    case 1:
      return '1 - Improvements Required';
    case 2:
      return '2 - Satisfactory';
    case 3:
      return '3 - Good';
    case 4:
      return '4 - Excellent';
    default:
      return ratingValue; // Return original value if it doesn't match any case
  }
};

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export default function LeadAssessmentReportTable({ onSelect }) {
  const [rows, setRows] = React.useState([]);

  const [originalRows, setOriginalRows] = React.useState([]);
  const [rowSelectionModel, setRowSelectionModel] = React.useState({
    type: 'include',
    ids: new Set(),
  });
  const [cycles, setCycles] = React.useState([]);
  const [selectedCycles, setSelectedCycles] = React.useState([]);
  const [baseColumns] = React.useState([
    { field: 'employee_id', headerName: 'Employee ID', width: 105 },
    { field: 'full_name', headerName: 'Name', flex: 1, minWidth: 130 },
    { field: 'role', headerName: 'Role', flex: 1, minWidth: 100 },
    {
      field: 'reporting_manager_name',
      headerName: 'Reporting Manager',
      flex: 1,
      minWidth: 130,
    },
    {
      field: 'previous_reporting_manager_name',
      headerName: 'Previous Manager',
      flex: 1,
      minWidth: 130,
    },
  ]);
  const [columns, setColumns] = React.useState(baseColumns);
  const navigate = useNavigate();
  const [loadingEmployees, setLoadingEmployees] = React.useState(true);
  const [loadingCycles, setLoadingCycles] = React.useState(true);

  // Fetch employee data
  React.useEffect(() => {
    setLoadingEmployees(true);
    fetchEmployeesList()
      .then((data) => {
        // Create a mapping of employee_id to employee_name
        const empMap = {};
        data.forEach((emp) => {
          empMap[emp.employee_id] = emp.employee_name;
        });

        // Convert API data to DataGrid format
        const formattedData = data.map((emp, index) => ({
          id: index + 1,
          employee_id: emp.id,
          full_name: emp.full_name,
          role: emp.role,
          reporting_manager_name: emp.reporting_manager_name || '-',
          previous_reporting_manager_name:
            emp.previous_reporting_manager_name || '-',
        }));

        setRows(formattedData);
        setOriginalRows(formattedData);
      })
      .catch((err) => console.error('Error fetching employee data:', err))
      .finally(() => setLoadingEmployees(false));
  }, []);

  // Fetch completed and active cycles for the lead assessment report
  React.useEffect(() => {
    setLoadingCycles(true);
    fetchLeadAssessmentReportCycles()
      .then((data) => {
        setCycles(data);
      })
      .catch((err) => console.error('Error fetching cycle data:', err))
      .finally(() => setLoadingCycles(false));
  }, []);

  // Handle cycle selection change
  const handleCycleChange = (event) => {
    const { value } = event.target;
    setSelectedCycles(value);

    // Update columns based on selected cycles
    updateColumnsBasedOnCycles(value);
  };

  // Update columns based on selected cycles
  const updateColumnsBasedOnCycles = async (selectedCycleIds) => {
    // Create dynamic columns based on selected cycles
    const cycleColumns = selectedCycleIds.map((cycleId) => {
      const cycleInfo = cycles.find((c) => c.cycle_id === cycleId);
      const cycleTitle = cycleInfo ? cycleInfo.cycle_name : `Cycle ${cycleId}`;

      return {
        field: `cycle_${cycleId}`,
        headerName: cycleTitle,
        width: 200,
        renderCell: (params) => {
          return formatRating(params.value);
        },
      };
    });

    // Combine base columns with cycle columns
    const newColumns = [...baseColumns, ...cycleColumns];
    setColumns(newColumns);
    const rowsCopy = [...originalRows].map((row) => ({ ...row }));

    // Fetch ratings data for all selected cycles
    if (selectedCycleIds.length > 0) {
      // Fetch ratings for each cycle and update rows
      for (const cycleId of selectedCycleIds) {
        try {
          const ratingsData = await fetchEmployeeRatings(cycleId);

          // Update rows with ratings data
          rowsCopy.forEach((row) => {
            // Convert employee_id to the same type as in ratingsData for comparison
            const empId = Number(row.employee_id);

            // Find the rating for this employee in this cycle
            const employeeRating = ratingsData.find(
              (r) => Number(r.employee_id) === empId
            );

            if (employeeRating) {
              row[`cycle_${cycleId}`] = employeeRating.parameter_rating;
              // console.log(`Set rating for employee ${empId} in cycle ${cycleId}:`, employeeRating.parameter_rating);
            } else {
              row[`cycle_${cycleId}`] = '-';
            }
          });
        } catch {
          // console.error(`Error fetching ratings for cycle ${cycleId}:`, error);
        }
      }

      // Remove data for cycles that are no longer selected
      rowsCopy.forEach((row) => {
        Object.keys(row).forEach((key) => {
          if (key.startsWith('cycle_')) {
            const cycleId = parseInt(key.replace('cycle_', ''));
            if (!selectedCycleIds.includes(cycleId)) {
              delete row[key];
            }
          }
        });
      });

      // Update state with the new rows
      setRows(rowsCopy);
    } else {
      // If no cycles selected, remove all cycle data
      const cleanedRows = rowsCopy.map((row) => {
        const newRow = { ...row };
        Object.keys(newRow).forEach((key) => {
          if (key.startsWith('cycle_')) {
            delete newRow[key];
          }
        });
        return newRow;
      });

      setRows(cleanedRows);
    }
  };

  // Handle row selection
  const handleRowSelection = (newModel) => {
    const normalizedModel = {
      type: newModel?.type === 'exclude' ? 'exclude' : 'include',
      ids: new Set(newModel?.ids ?? []),
    };

    setRowSelectionModel(normalizedModel);

    const isSelected = (rowId) =>
      normalizedModel.type === 'include'
        ? normalizedModel.ids.has(rowId)
        : !normalizedModel.ids.has(rowId);

    // Get selected and unselected employees, preserving all data including cycle ratings
    const selectedEmployees = rows.filter((row) => isSelected(row.id));
    const unselectedEmployees = rows.filter((row) => !isSelected(row.id));

    const newOrderedRows = [...selectedEmployees, ...unselectedEmployees];
    setRows(newOrderedRows);

    if (onSelect) {
      onSelect(selectedEmployees);
    }
  };

  const getRowHeight = () => 35;

  return (
    <>
      <Card sx={{ width: '100%' }}>
        <CardContent>
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
              Lead Assessment Report
            </Typography>
          </Box>

        <Box sx={{ px: 1.25, pb: 1.25 }}>
          {/* Cycle Selection Dropdown with Checkboxes */}
          <FormControl sx={{ mb: 1, width: 'auto', minWidth: '20%' }}>
            <InputLabel
              id="checkbox-cycles-label"
              sx={{ backgroundColor: 'background.paper', px: 0.5 }}
            >
              Select Lead Assessment Cycles
            </InputLabel>
            <Select
              labelId="checkbox-cycles-label"
              id="checkbox-cycles"
              multiple
              value={selectedCycles}
              onChange={handleCycleChange}
              input={<OutlinedInput label="Select Lead Assessment Cycles" />}
              renderValue={(selected) => (
                <Box
                  sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', py: 0.5 }}
                >
                  {selected?.length > 0 ? (
                    selected.map((value) => {
                      const cycleInfo = cycles.find(
                        (c) => c.cycle_id === value
                      );

                      return (
                        <Chip
                          key={value}
                          label={
                            cycleInfo ? cycleInfo.cycle_name : `Cycle ${value}`
                          }
                          size="small"
                        />
                      );
                    })
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      Select lead assessment cycles to view ratings
                    </Typography>
                  )}
                </Box>
              )}
              MenuProps={MenuProps}
              sx={{
                minHeight: '50px',
                width: 'auto',
                '& .MuiSelect-select': {
                  paddingTop: '8px',
                  paddingBottom: '8px',
                },
              }}
            >
              {cycles && cycles.length > 0 ? (
                cycles.map((cycle) => (
                  <MenuItem key={cycle.cycle_id} value={cycle.cycle_id}>
                    <Checkbox
                      checked={selectedCycles.indexOf(cycle.cycle_id) > -1}
                    />
                    <ListItemText primary={cycle.cycle_name} />
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>
                  <Typography variant="body2" color="textSecondary">
                    No appraisal cycles available
                  </Typography>
                </MenuItem>
              )}
            </Select>
          </FormControl>

          {/* DataGrid Table */}
          {loadingEmployees || loadingCycles ? (
            <Box sx={{ width: '100%', mt: 2 }}>
              {[...Array(20)].map((_, index) => (
                <Skeleton
                  key={index}
                  variant="rectangular"
                  height={30}
                  sx={{
                    mb: 1,
                    bgcolor: 'action.hover',
                    opacity: 0.3,
                  }}
                />
              ))}
            </Box>
          ) : (
            <DataGrid
              sx={{
                overflow: 'auto',
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 'bold',
                },
              }}
              rows={rows}
              columns={columns}
              pageSizeOptions={[5]}
              showToolbar
              checkboxSelection
              disableRowSelectionOnClick
              slots={{ toolbar: CustomToolbar }}
              slotProps={{ toolbar: { exportSelectedOnly: true } }}
              onRowSelectionModelChange={handleRowSelection}
              rowSelectionModel={rowSelectionModel}
              rowHeight={getRowHeight()}
              hideFooter
            />
          )}
          </Box>
        </CardContent>
      </Card>
    </>
  );
}

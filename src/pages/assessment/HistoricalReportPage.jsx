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
import { Typography, Card, CardContent } from '@mui/material';
import CustomToolbar from '../../components/CustomToolbar';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import {
  fetchEmployeesList,
  fetchLeadAssessmentReportCycles,
  fetchEmployeeRatings,
} from '../../api';

const formatRating = (ratingValue) => {
  if (ratingValue === undefined || ratingValue === null) return;
  const numericRating = Number(ratingValue);
  switch (numericRating) {
    case 1: return '1 - Improvements Required';
    case 2: return '2 - Satisfactory';
    case 3: return '3 - Good';
    case 4: return '4 - Excellent';
    default: return ratingValue;
  }
};

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: { style: { maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP, width: 250 } },
};

const isMissingCellValue = (value) => value === undefined || value === null;

export default function HistoricalReportPage({ onSelect }) {
  const [rows, setRows] = React.useState([]);
  const [originalRows, setOriginalRows] = React.useState([]);
  const [rowSelectionModel, setRowSelectionModel] = React.useState({ type: 'include', ids: new Set() });
  const [cycles, setCycles] = React.useState([]);
  const [selectedCycles, setSelectedCycles] = React.useState([]);
  const [baseColumns] = React.useState([
    { field: 'employee_id', headerName: 'Employee ID', width: 110 },
    { field: 'full_name', headerName: 'Name', flex: 1, minWidth: 140 },
    { field: 'role', headerName: 'Role', flex: 1, minWidth: 110 },
    { field: 'reporting_manager_name', headerName: 'Reporting Manager', flex: 1, minWidth: 150 },
    { field: 'previous_reporting_manager_name', headerName: 'Previous Manager', flex: 1, minWidth: 150 },
  ]);
  const [columns, setColumns] = React.useState(baseColumns);
  const [loadingEmployees, setLoadingEmployees] = React.useState(true);
  const [loadingCycles, setLoadingCycles] = React.useState(true);

  React.useEffect(() => {
    setLoadingEmployees(true);
    fetchEmployeesList()
      .then((data) => {
        const formattedData = data.map((emp, index) => ({
          id: index + 1,
          employee_id: emp.id,
          full_name: emp.full_name,
          role: emp.role,
          reporting_manager_name: emp.reporting_manager_name,
          previous_reporting_manager_name: emp.previous_reporting_manager_name,
        }));
        setRows(formattedData);
        setOriginalRows(formattedData);
      })
      .catch((err) => console.error('Error fetching employee data:', err))
      .finally(() => setLoadingEmployees(false));
  }, []);

  React.useEffect(() => {
    setLoadingCycles(true);
    fetchLeadAssessmentReportCycles()
      .then((data) => setCycles(data))
      .catch((err) => console.error('Error fetching cycle data:', err))
      .finally(() => setLoadingCycles(false));
  }, []);

  const handleCycleChange = (event) => {
    const { value } = event.target;
    setSelectedCycles(value);
    updateColumnsBasedOnCycles(value);
  };

  const updateColumnsBasedOnCycles = async (selectedCycleIds) => {
    const cycleColumns = selectedCycleIds.map((cycleId) => {
      const cycleInfo = cycles.find((c) => c.cycle_id === cycleId);
      const cycleTitle = cycleInfo ? cycleInfo.cycle_name : `Cycle ${cycleId}`;
      return {
        field: `cycle_${cycleId}`,
        headerName: cycleTitle,
        width: 200,
        renderCell: (params) => formatRating(params.value),
      };
    });
    const newColumns = [...baseColumns, ...cycleColumns];
    setColumns(newColumns);
    const rowsCopy = [...originalRows].map((row) => ({ ...row }));

    if (selectedCycleIds.length > 0) {
      for (const cycleId of selectedCycleIds) {
        const ratingsData = await fetchEmployeeRatings(cycleId);
        rowsCopy.forEach((row) => {
          const empId = Number(row.employee_id);
          const employeeRating = ratingsData.find((r) => Number(r.employee_id) === empId);
          if (employeeRating) row[`cycle_${cycleId}`] = employeeRating.parameter_rating;
        });
      }
      rowsCopy.forEach((row) => {
        Object.keys(row).forEach((key) => {
          if (key.startsWith('cycle_')) {
            const cycleId = parseInt(key.replace('cycle_', ''));
            if (!selectedCycleIds.includes(cycleId)) delete row[key];
          }
        });
      });
      setRows(rowsCopy);
    } else {
      const cleanedRows = rowsCopy.map((row) => {
        const newRow = { ...row };
        Object.keys(newRow).forEach((key) => { if (key.startsWith('cycle_')) delete newRow[key]; });
        return newRow;
      });
      setRows(cleanedRows);
    }
  };

  const handleRowSelection = (newModel) => {
    const normalizedModel = {
      type: newModel?.type === 'exclude' ? 'exclude' : 'include',
      ids: new Set(newModel?.ids ?? []),
    };
    setRowSelectionModel(normalizedModel);
    const isSelected = (rowId) => normalizedModel.type === 'include' ? normalizedModel.ids.has(rowId) : !normalizedModel.ids.has(rowId);
    const selectedEmployees = rows.filter((row) => isSelected(row.id));
    const unselectedEmployees = rows.filter((row) => !isSelected(row.id));
    setRows([...selectedEmployees, ...unselectedEmployees]);
    if (onSelect) onSelect(selectedEmployees);
  };

  return (
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
                Lead Assessment Report
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <FormControl sx={{ width: '100%', maxWidth: 400 }} size="small">
              <InputLabel id="checkbox-cycles-label">
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
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {selected?.length > 0 ? (
                      selected.map((value) => {
                        const cycleInfo = cycles.find((c) => c.cycle_id === value);
                        return (
                          <Chip 
                            key={value} 
                            label={cycleInfo ? cycleInfo.cycle_name : `Cycle ${value}`} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                          />
                        );
                      })
                    ) : (
                      <Typography variant="body2" color="text.secondary">Select cycles...</Typography>
                    )}
                  </Box>
                )}
                MenuProps={MenuProps}
              >
                {cycles && cycles.length > 0 ? (
                  [...cycles]
                    .sort((a, b) => a.cycle_name.localeCompare(b.cycle_name))
                    .map((cycle) => (
                      <MenuItem key={cycle.cycle_id} value={cycle.cycle_id}>
                        <Checkbox checked={selectedCycles.indexOf(cycle.cycle_id) > -1} />
                        <ListItemText primary={cycle.cycle_name} />
                      </MenuItem>
                    ))
                ) : (
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">No cycles available</Typography>
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>

          {loadingEmployees || loadingCycles ? (
            <LoadingState message="Loading historical report records and cycles..." />
          ) : rows.length === 0 ? (
            <EmptyState 
              title="No Employee Records" 
              message="Could not find any employee assessment rating history." 
            />
          ) : (
            <Box sx={{ height: 500, width: '100%' }}>
              <DataGrid
                sx={{
                  border: '1px solid #E5E7EB',
                  '& .missing-report-cell': {
                    backgroundColor: '#FEF2F2',
                    color: '#EF4444',
                  }
                }}
                rows={rows}
                columns={columns}
                pageSizeOptions={[10, 25, 50]}
                showToolbar
                checkboxSelection
                disableRowSelectionOnClick
                slots={{ toolbar: CustomToolbar }}
                slotProps={{ toolbar: { exportSelectedOnly: true } }}
                onRowSelectionModelChange={handleRowSelection}
                rowSelectionModel={rowSelectionModel}
                rowHeight={48}
                getCellClassName={(params) => isMissingCellValue(params.value) ? 'missing-report-cell' : ''}
              />
            </Box>
          )}
        </CardContent>
      </Card>
  );
}

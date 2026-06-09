import { useState, useEffect } from 'react';
import { Typography, FormControl, Box, Card, CardContent } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import CustomToolbar from '../../components/CustomToolbar';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import { InputLabel, Select, MenuItem } from '@mui/material';
import {
  fetchCycleResponses as getCycleResponses,
  fetchSelfAssessmentCycles as activeCycles,
  fetchEmployeesList as getEmpList,
} from '../../api';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

const isMissingCellValue = (value) => value === undefined || value === null;

const pivotData = (data, rows) => {
  if (!rows) return [];
  const employeeMap = {};
  const allQuestions = new Set();

  if (data) {
    data.forEach((item) => {
      allQuestions.add(item.question_text);
    });
  }

  rows.forEach((emp) => {
    employeeMap[emp.id] = {
      id: emp.id,
      employee_id: emp.employee_id ?? emp.id,
      full_name: emp?.full_name || emp.employee_name,
      role: emp.role,
      reporting_manager: emp.reporting_manager,
      previous_reporting_manager: emp.previous_reporting_manager,
    };
  });

  if (data) {
    data.forEach((item) => {
      const emp = employeeMap[item.employee_id];
      if (emp) {
        if (emp[item.question_text]) {
          emp[item.question_text] += `, ${item.response_text}`;
        } else {
          emp[item.question_text] = item.response_text;
        }
      }
    });
  }

  return Object.values(employeeMap);
};

const generateColumns = (data, columns) => {
  if (!data) return [];
  const questionSet = new Set();
  data.forEach((item) => {
    questionSet.add(item.question_text);
  });
  const questionColumns = Array.from(questionSet).map((q) => ({
    field: q,
    headerName: q,
    width: 300,
  }));
  return [...columns, ...questionColumns];
};

const SelfAssessmentReportPage = ({ onSelect }) => {
  const [rows, setRows] = useState([]);
  const [rowSelectionModel, setRowSelectionModel] = useState({
    type: 'include',
    ids: new Set(),
  });
  const [activeCycle, setActiveCycles] = useState([]);
  const [cycle_id, setCycleId] = useState(null);
  const [response, setResponseData] = useState(null);
  const [baseColumns] = useState([
    { field: 'employee_id', headerName: 'Employee ID', width: 110 },
    { field: 'full_name', headerName: 'Name', flex: 1, minWidth: 140 },
    { field: 'role', headerName: 'Role', flex: 1, minWidth: 110 },
    {
      field: 'reporting_manager',
      headerName: 'Reporting Manager',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'previous_reporting_manager',
      headerName: 'Previous Manager',
      flex: 1,
      minWidth: 150,
    },
  ]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingCycles, setLoadingCycles] = useState(true);
  const [loadingResponses, setLoadingResponses] = useState(false);

  useEffect(() => {
    const getEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const response = await getEmpList();
        const formattedData = response.map((emp) => ({
          id: emp.id,
          employee_id: emp.id,
          full_name: emp?.full_name || emp.employee_name,
          role: emp.role,
          reporting_manager: emp.reporting_manager_name,
          previous_reporting_manager: emp.previous_reporting_manager_name,
        }));
        setRows(formattedData);
      } catch (error) {
        console.log('Error while fetching employees: ' + error);
      } finally {
        setLoadingEmployees(false);
      }
    };
    getEmployees();
  }, []);

  useEffect(() => {
    const getResponses = async (cycle_id) => {
      try {
        setLoadingResponses(true);
        const data = await getCycleResponses(cycle_id);
        setResponseData(data);
        setLoadingResponses(false);
      } catch (error) {
        console.log('Error while fetching cycle: ' + error);
        setLoadingResponses(false);
      }
    };
    if (cycle_id) getResponses(cycle_id);
  }, [cycle_id]);

  useEffect(() => {
    const getActiveCycles = async () => {
      try {
        setLoadingCycles(true);
        const response = await activeCycles();
        const filteredCycles = response.filter(
          (cycle) => cycle.status === 'completed' || cycle.status === 'active'
        );
        setActiveCycles(filteredCycles);
      } catch (error) {
        console.log('Error while fetching cycle: ' + error);
      } finally {
        setLoadingCycles(false);
      }
    };
    getActiveCycles();
  }, []);

  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: { maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP, width: 250 },
    },
  };

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
    const selectedEmployees = rows.filter((row) => isSelected(row.id));
    const unselectedEmployees = rows.filter((row) => !isSelected(row.id));
    setRows([...selectedEmployees, ...unselectedEmployees]);
    if (onSelect) onSelect(selectedEmployees);
  };

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
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: 'primary.main' }}
              >
                Self Assessment Report
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <FormControl sx={{ width: '100%', maxWidth: 400 }} size="small">
              <InputLabel id="checkbox-cycles-label">
                Select Appraisal Cycles
              </InputLabel>
              <Select
                labelId="checkbox-cycles-label"
                id="self-assessment-cycle"
                value={cycle_id ?? ''}
                onChange={(e) => setCycleId(e.target.value)}
                MenuProps={MenuProps}
                label="Select Appraisal Cycles"
              >
                <MenuItem value="" disabled>
                  Select an appraisal cycle
                </MenuItem>
                {activeCycle && activeCycle.length > 0 ? (
                  [...activeCycle]
                    .sort((a, b) => a.cycle_name.localeCompare(b.cycle_name))
                    .map((cycle) => (
                      <MenuItem key={cycle.cycle_id} value={cycle.cycle_id}>
                        {cycle.cycle_name}
                      </MenuItem>
                    ))
                ) : (
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                      No appraisal cycles available
                    </Typography>
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>

          {response && response.length == 0 && (
            <Typography variant='body2' sx={{ mb:1, color:'red'}} > No Responce </Typography>
          )}

          {loadingEmployees || loadingCycles ? (
            <LoadingState message="Loading appraisal cycles and records..." />
          ) : rows.length === 0 ? (
            <EmptyState
              title="No Employee Records"
              message="Could not find any self assessment records."
            />
          ) : (
            <Box sx={{ height: 500, width: '100%' }}>
              <DataGrid
                sx={{
                  border: '1px solid #E5E7EB',
                  '& .missing-report-cell': {
                    backgroundColor: '#FEF2F2',
                    color: '#EF4444',
                  },
                }}
                rows={cycle_id ? pivotData(response, rows) : rows}
                columns={
                  cycle_id
                    ? generateColumns(response, baseColumns)
                    : baseColumns
                }
                pageSizeOptions={[10, 25, 50]}
                showToolbar
                rowHeight={48}
                onRowSelectionModelChange={handleRowSelection}
                rowSelectionModel={rowSelectionModel}
                checkboxSelection
                disableRowSelectionOnClick
                slots={{ toolbar: CustomToolbar }}
                slotProps={{ toolbar: { exportSelectedOnly: true } }}
                getCellClassName={(params) =>
                  isMissingCellValue(params.value) ? 'missing-report-cell' : ''
                }
              />
            </Box>
          )}
        </CardContent>
      </Card>
      <Backdrop sx={{ color: '#fff', zIndex: 1201 }} open={loadingResponses}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
};

export default SelfAssessmentReportPage;

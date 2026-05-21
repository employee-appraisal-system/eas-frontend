import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  IconButton,
  FormControl,
  Box,
  Skeleton,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import Grid from '@mui/material/Grid';
import CustomToolbar from './CustomeToolbar';
import CloseIcon from '@mui/icons-material/Close';
import { InputLabel, Select, MenuItem } from '@mui/material';
import {
  getCylceResponses,
  activeCycles,
  getEmpList,
} from '../services/SelfAssessReport';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

const pivotData = (data, rows) => {
  if (!rows) return [];

  const employeeMap = {};
  const answeredEmployees = new Set();
  const allQuestions = new Set();

  // Step 1: Track all question texts and responses
  if (data) {
    data.forEach((item) => {
      answeredEmployees.add(item.employee_id);
      allQuestions.add(item.question_text);
    });
  }

  // Step 2: Initialize all employees with base data
  rows.forEach((emp) => {
    employeeMap[emp.employee_id] = {
      id: emp.employee_id,
      employee_id: emp.employee_id,
      employee_name: emp.employee_name,
      role: emp.role,
      reporting_manager: emp.reporting_manager,
      previous_reporting_manager: emp.previous_reporting_manager,
    };

    // Step 3: If employee hasn't answered, add "-" for each question
    if (!answeredEmployees.has(emp.employee_id)) {
      allQuestions.forEach((question) => {
        employeeMap[emp.employee_id][question] = '-';
      });
    }
  });

  // Step 4: Add responses for employees who answered
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

  // Collect unique question_texts
  const questionSet = new Set();
  data.forEach((item) => {
    questionSet.add(item.question_text);
    // resizable: true;
  });

  const questionColumns = Array.from(questionSet).map((q) => ({
    field: q,
    headerName: q,
    width: 300,
  }));

  return [...columns, ...questionColumns];
};

const SelfAssessmentRepo = ({ onSelect }) => {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  // const [employeeMap, setEmployeeMap] = useState({});
  // const [originalRows, setOriginalRows] = useState([]);

  const [activeCycle, setActiveCycles] = useState([]);
  const [cycle_id, setCycleId] = useState(null);
  const [response, setResponseData] = useState(null);
  const [baseColumns] = useState([
    {
      field: 'employee_id',
      headerName: 'Employee ID',
      flex: 5,
      minWidth: 100,
      maxWidth: 120,
    },
    { field: 'employee_name', headerName: 'Name', flex: 5, minWidth: 130 },
    { field: 'role', headerName: 'Role', flex: 5, minWidth: 100 },
    {
      field: 'reporting_manager',
      headerName: 'Reporting Manager',
      flex: 5,
      minWidth: 130,
    },
    {
      field: 'previous_reporting_manager',
      headerName: 'Previous Manager',
      flex: 5,
      minWidth: 130,
    },
  ]);

  const [loadingEmployees, setLoadingEmployees] = useState(true); //2
  const [loadingCycles, setLoadingCycles] = useState(true); //3
  const [loadingResponses, setLoadingResponses] = useState(false);

  useEffect(() => {
    const getEmployees = async () => {
      try {
        setLoadingEmployees(true); //4
        const response = await getEmpList();
        const empMap = {};
        response.forEach((emp) => {
          empMap[emp.employee_id] = emp.employee_name;
        });

        const formattedData = response.map((emp, index) => ({
          id: index + 1,
          employee_id: emp.employee_id,
          employee_name: emp.employee_name,
          role: emp.role,
          reporting_manager: emp.reporting_manager_name || '-',
          previous_reporting_manager:
            emp.previous_reporting_manager_name || '-',
        }));

        // setEmployeeMap(empMap);
        setRows(formattedData);
        // setOriginalRows(formattedData);
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
        const data = await getCylceResponses(cycle_id);
        setResponseData(data);
        setLoadingResponses(false);
      } catch (error) {
        console.log('Error while fetching cycle: ' + error);
      }
    };

    if (cycle_id) {
      getResponses(cycle_id);
    }
  }, [cycle_id]);

  useEffect(() => {
    const getActiveCycles = async () => {
      try {
        setLoadingCycles(true); //5
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
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 250,
      },
    },
  };

  const handleRowSelection = (selectedRowIds) => {
    setSelectedIds(selectedRowIds);

    const selectedEmployees = rows.filter((row) =>
      selectedRowIds.includes(row.id)
    );
    const unselectedEmployees = rows.filter(
      (row) => !selectedRowIds.includes(row.id)
    );

    const newOrderedRows = [...selectedEmployees, ...unselectedEmployees];
    setRows(newOrderedRows);

    if (onSelect) {
      onSelect(selectedEmployees);
    }
  };

  return (
    <>
      <Box sx={{ width: '100%' }}>
        <Grid container alignItems="center">
          <Grid size={11}>
            <Typography
              variant="h6"
              color="primary"
              fontWeight={'bold'}
              sx={{
                ml: '10px',
                my: '10px',
              }}
            >
              Self Assessment Report
            </Typography>
          </Grid>
          <Grid size={1} sx={{ textAlign: 'right' }}>
            <IconButton onClick={() => navigate('/hr-home')} color="error">
              <CloseIcon />
            </IconButton>
          </Grid>
        </Grid>
        <Box sx={{ pr: '10px', pl: '10px', pb: '10px' }}>
          <FormControl sx={{ mb: 1, width: 'auto', minWidth: '20%' }}>
            <InputLabel
              id="checkbox-cycles-label"
              sx={{ background: 'white', px: 0.5 }}
            >
              Select Appraisal Cycles
            </InputLabel>
            <Select
              onChange={(e) => setCycleId(e.target.value)}
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
              {activeCycle.map((cycle) => (
                <MenuItem key={cycle.cycle_id} value={cycle.cycle_id}>
                  {cycle.cycle_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {loadingEmployees || loadingCycles ? (
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
            <DataGrid
              sx={{
                maxWidth: '100%',
                maxHeight: '50%',
                height: '200px',
                overflow: 'auto',
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 'bold',
                },
              }}
              rows={cycle_id ? pivotData(response, rows) : rows}
              columns={
                cycle_id ? generateColumns(response, baseColumns) : baseColumns
              }
              autoHeight
              pageSizeOptions={[5]}
              slots={{ toolbar: CustomToolbar }}
              rowHeight={35}
              onRowSelectionModelChange={handleRowSelection}
              selectionModel={selectedIds}
              checkboxSelection
              disableRowSelectionOnClick
              hideFooter
            />
          )}
        </Box>
      </Box>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loadingResponses}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
};

export default SelfAssessmentRepo;

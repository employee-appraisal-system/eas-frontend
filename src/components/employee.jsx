import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
import CustomToolbar from './CustomeToolbar';
import { fetchAllEmployees } from '../api';

export default function DataGridDemo() {
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [rowSelectionModel, setRowSelectionModel] = useState({
    type: 'include',
    ids: new Set(),
  });

  useEffect(() => {
    fetchAllEmployees()
      .then((data) => {
        // Mapping of employee_id to employee_name
        const empMap = {};
        data.forEach((emp) => {
          empMap[emp.employee_id] = emp.employee_name;
        });

        const formattedData = data.map((emp, index) => ({
          id: index + 1,
          employee_id: emp.id,
          employee_name: emp.full_name,
          role: emp.role,
          reporting_manager: empMap[emp.manager_id] || '',
          previous_reporting_manager: empMap[emp.previous_manager_id] || '',
        }));

        setRows(formattedData);
        setOriginalRows(formattedData);
      })
      .catch((err) => console.error('Error fetching data:', err));
  }, []);

  // Function to reorder rows based on selection and restore deselected rows
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

    const selectedRows = originalRows.filter((row) => isSelected(row.id));

    if (selectedRows.length === 0) {
      setRows(originalRows); // If nothing is selected, reseting to original order
      return;
    }

    const unselectedRows = originalRows.filter((row) => !isSelected(row.id));
    setRows([...selectedRows, ...unselectedRows]);
  };

  const columns = [
    { field: 'employee_id', headerName: 'Employee ID', width: 120 },
    { field: 'employee_name', headerName: 'Name', width: 150 },
    { field: 'role', headerName: 'Role', width: 120 },
    { field: 'reporting_manager', headerName: 'Reporting Manager', width: 200 },
    {
      field: 'previous_reporting_manager',
      headerName: 'Previous Manager',
      width: 200,
    },
  ];

  const getRowHeight = () => 35;

  return (
    <Box sx={{ height: 600, width: '90%', overflow: 'auto', ml: 5, mt: 20 }}>
      <DataGrid
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
      />
    </Box>
  );
}

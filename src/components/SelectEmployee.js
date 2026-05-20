import * as React from 'react';
import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
import {
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
  GridToolbarExport,
  GridToolbarQuickFilter,
} from '@mui/x-data-grid';
import { Skeleton } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BASE_URL;

function CustomToolbar() {
  return (
    <GridToolbarContainer
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 1,
      }}
    >
      {/* Left Side - Filters, Columns, Export */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarExport />
      </Box>

      {/* Right Side - Search Bar */}
      <Box sx={{ width: '250px' }}>
        <GridToolbarQuickFilter />
      </Box>
    </GridToolbarContainer>
  );
}

export default function DataGridDemo({ onSelect }) {
  const [rows, setRows] = React.useState([]);
  const [employeeMap, setEmployeeMap] = React.useState({});
  const [originalRows, setOriginalRows] = React.useState([]);
  const [selectedIds, setSelectedIds] = React.useState([]);
  const navigate = useNavigate();
  const [loadingEmployees, setLoadingEmployees] = React.useState(true);

  React.useEffect(() => {
    setLoadingEmployees(true);
    fetch(`${API_URL}/`)
      .then((response) => response.json())
      .then((data) => {
        const empMap = {};
        data.forEach((emp) => {
          empMap[emp.employee_id] = emp.employee_name;
        });

        const formattedData = data.map((emp, index) => ({
          id: index + 1,
          employee_id: emp.employee_id,
          employee_name: emp.employee_name,
          role: emp.role,
          reporting_manager: empMap[emp.reporting_manager] || '',
          previous_reporting_manager:
            empMap[emp.previous_reporting_manager] || '',
        }));

        setEmployeeMap(empMap);
        setRows(formattedData);
        setOriginalRows(formattedData);
      })
      .catch((error) => console.error('Error fetching data:', error))
      .finally(() => setLoadingEmployees(false));
  }, []);

  const handleRowSelection = (selectedRowIds) => {
    setSelectedIds(selectedRowIds);
    const selectedEmployees = originalRows.filter((row) =>
      selectedRowIds.includes(row.id)
    );
    const unselectedEmployees = originalRows.filter(
      (row) => !selectedRowIds.includes(row.id)
    );

    const newOrderedRows = [...selectedEmployees, ...unselectedEmployees];

    setRows(newOrderedRows);

    if (onSelect) {
      onSelect(selectedEmployees);
    }
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
    <>
      {loadingEmployees ? (
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
            height: 500,
            overflow: 'auto',
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 'bold',
            },
          }}
          rows={rows}
          columns={columns}
          pageSizeOptions={[5]}
          checkboxSelection
          disableRowSelectionOnClick
          slots={{ toolbar: CustomToolbar }}
          onRowSelectionModelChange={handleRowSelection}
          selectionModel={selectedIds}
          rowHeight={getRowHeight()}
          hideFooter
        />
      )}
    </>
  );
}

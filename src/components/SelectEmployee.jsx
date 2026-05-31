import * as React from 'react';
import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
import { Skeleton } from '@mui/material';
import CustomToolbar from './CustomeToolbar';
import { fetchAllEmployees } from '../api';

export default function DataGridDemo({ onSelect }) {
  const [rows, setRows] = React.useState([]);

  const [originalRows, setOriginalRows] = React.useState([]);
  const [rowSelectionModel, setRowSelectionModel] = React.useState({
    type: 'include',
    ids: new Set(),
  });
  const [loadingEmployees, setLoadingEmployees] = React.useState(true);

  React.useEffect(() => {
    setLoadingEmployees(true);
    fetchAllEmployees()
      .then((data) => {
        const empMap = {};
        data.forEach((emp) => {
          empMap[emp.id] = emp.full_name;
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
      .catch((err) => console.error('Error fetching data:', err))
      .finally(() => setLoadingEmployees(false));
  }, []);

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

    const selectedEmployees = originalRows.filter((row) => isSelected(row.id));
    const unselectedEmployees = originalRows.filter(
      (row) => !isSelected(row.id)
    );
    const newOrderedRows = [...selectedEmployees, ...unselectedEmployees];

    setRows(newOrderedRows);

    if (onSelect) {
      onSelect(selectedEmployees);
    }
  };

  const columns = [
    { field: 'id', headerName: 'Employee ID', width: 120 },
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
                bgcolor: 'action.hover',
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
    </>
  );
}

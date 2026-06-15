import Box from '@mui/material/Box';
import {
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarQuickFilter,
} from '@mui/x-data-grid';

const getSelectedRowIdsForExport = ({ apiRef }) => {
  if (!apiRef?.current) return [];
  return Array.from(apiRef.current.getSelectedRows().keys());
};

function CustomToolbar({ exportSelectedOnly = false } = {}) {
  const exportOptions = exportSelectedOnly
    ? { getRowsToExport: getSelectedRowIdsForExport }
    : undefined;

  return (
    <GridToolbarContainer
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1,
        p: 1,
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarExport
          csvOptions={exportOptions}
          printOptions={exportOptions}
        />
      </Box>

      <Box
        sx={{
          minWidth: { xs: '100%', sm: 260 },
          flexGrow: { xs: 1, sm: 0 },
        }}
      >
        <GridToolbarQuickFilter />
      </Box>
    </GridToolbarContainer>
  );
}

export default CustomToolbar;

import React from 'react';
import { TableRow, TableCell, Stack, Box } from '@mui/material';
import { Badge } from '@mui/icons-material';

const SpecializationGroupHeader = ({ specializationName, employeesCount }) => {
  return (
    <TableRow>
      <TableCell 
        colSpan={6}
        sx={{
          backgroundColor: '#f0f4ff',
          borderLeft: '4px solid #1976d2',
          py: 1.5,
          fontWeight: 600,
          color: '#1976d2',
          fontSize: '0.95rem'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Badge sx={{ fontSize: 20 }} />
          <span>{specializationName}</span>
          <Box 
            sx={{
              backgroundColor: '#1976d2',
              color: 'white',
              borderRadius: '12px',
              px: 1.5,
              py: 0.5,
              fontSize: '0.75rem',
              fontWeight: 500
            }}
          >
            {employeesCount} сотр.
          </Box>
        </Stack>
      </TableCell>
    </TableRow>
  );
};

export default SpecializationGroupHeader;
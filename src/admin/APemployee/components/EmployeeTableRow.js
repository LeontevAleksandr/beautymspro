import React from 'react';
import { TableRow, TableCell, Typography, Box, IconButton, Stack } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { NO_SPECIALIZATION_KEY } from '../utils/constants';

const EmployeeTableRow = ({ 
  employee, 
  employeeIndex, 
  specializationName,
  onEdit, 
  onDelete 
}) => {
  const cellStyle = {
    py: 2,
    borderBottom: '1px solid #f0f0f0'
  };

  return (
    <TableRow 
      hover
      sx={{
        backgroundColor: employeeIndex % 2 === 0 ? '#ffffff' : '#fafbfc',
        borderLeft: '4px solid transparent',
        '&:hover': {
          backgroundColor: '#f5f7fa',
          borderLeft: '4px solid #e3f2fd'
        }
      }}
    >
      <TableCell 
        sx={{ 
          ...cellStyle,
          pl: 3
        }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 500,
            color: '#1a1a1a'
          }}
        >
          {employee.full_name}
        </Typography>
      </TableCell>

      <TableCell sx={cellStyle}>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#424242',
            fontStyle: specializationName === NO_SPECIALIZATION_KEY ? 'italic' : 'normal',
            opacity: specializationName === NO_SPECIALIZATION_KEY ? 0.7 : 1
          }}
        >
          {employee.specialization ? employee.specialization.name : 'Не указана'}
        </Typography>
      </TableCell>

      <TableCell sx={cellStyle}>
        {employee.qualification ? (
          <Box 
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#e8f5e8',
              color: '#2e7d32',
              borderRadius: '8px',
              px: 1.5,
              py: 0.5,
              fontSize: '0.75rem',
              fontWeight: 500
            }}
          >
            {employee.qualification.name}
          </Box>
        ) : (
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#999',
              fontStyle: 'italic'
            }}
          >
            Не указана
          </Typography>
        )}
      </TableCell>

      <TableCell sx={cellStyle}>
        <Typography 
          variant="body2" 
          sx={{ color: '#424242' }}
        >
          {employee.phone || '-'}
        </Typography>
      </TableCell>

      <TableCell sx={cellStyle}>
        <Typography 
          variant="body2" 
          sx={{ color: '#424242' }}
        >
          {employee.email || '-'}
        </Typography>
      </TableCell>

      <TableCell 
        align="center"
        sx={cellStyle}
      >
        <Stack direction="row" spacing={0.5} justifyContent="center">
          <IconButton 
            size="small" 
            onClick={() => onEdit(employee)}
            sx={{
              color: '#1976d2',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)'
              }
            }}
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => onDelete(employee.id)}
            sx={{
              color: '#d32f2f',
              '&:hover': {
                backgroundColor: 'rgba(211, 47, 47, 0.08)'
              }
            }}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
};

export default EmployeeTableRow;
import React from 'react';
import { TableHead, TableRow, TableCell, Stack } from '@mui/material';
import { Person, Badge, Phone, Email } from '@mui/icons-material';

const EmployeeTableHeader = () => {
  const headerCellStyle = {
    fontWeight: 600, 
    color: '#424242',
    borderBottom: '1px solid #e0e0e0',
    py: 2
  };

  return (
    <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
      <TableRow>
        <TableCell 
          sx={{ 
            ...headerCellStyle,
            width: '25%'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Person sx={{ fontSize: 18, color: '#666' }} />
            <span>ФИО</span>
          </Stack>
        </TableCell>
        <TableCell 
          sx={{ 
            ...headerCellStyle,
            width: '20%'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Badge sx={{ fontSize: 18, color: '#666' }} />
            <span>Специализация</span>
          </Stack>
        </TableCell>
        <TableCell 
          sx={{ 
            ...headerCellStyle,
            width: '15%'
          }}
        >
          Квалификация
        </TableCell>
        <TableCell 
          sx={{ 
            ...headerCellStyle,
            width: '15%'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Phone sx={{ fontSize: 18, color: '#666' }} />
            <span>Телефон</span>
          </Stack>
        </TableCell>
        <TableCell 
          sx={{ 
            ...headerCellStyle,
            width: '15%'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Email sx={{ fontSize: 18, color: '#666' }} />
            <span>Email</span>
          </Stack>
        </TableCell>
        <TableCell 
          align="center"
          sx={{ 
            ...headerCellStyle,
            width: '10%'
          }}
        >
          Действия
        </TableCell>
      </TableRow>
    </TableHead>
  );
};

export default EmployeeTableHeader;
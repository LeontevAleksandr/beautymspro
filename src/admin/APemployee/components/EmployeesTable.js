import React from 'react';
import { Table, TableContainer, Paper } from '@mui/material';
import EmployeeTableHeader from './EmployeeTableHeader';
import EmployeesTableBody from './EmployeesTableBody';

const EmployeesTable = ({ 
  groupedEmployees, 
  onEdit, 
  onDelete 
}) => {
  return (
    <TableContainer 
      component={Paper} 
      sx={{ 
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', 
        borderRadius: 3,
        border: '1px solid #e0e0e0',
        overflow: 'hidden'
      }}
    >
      <Table size="small">
        <EmployeeTableHeader />
        <EmployeesTableBody 
          groupedEmployees={groupedEmployees}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </Table>
    </TableContainer>
  );
};

export default EmployeesTable;
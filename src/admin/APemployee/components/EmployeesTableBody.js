import React from 'react';
import { TableBody, TableRow, TableCell, Typography } from '@mui/material';
import SpecializationGroupHeader from './SpecializationGroupHeader';
import EmployeeTableRow from './EmployeeTableRow';
import { sortSpecializationGroups } from '../utils/tableUtils';

const EmployeesTableBody = ({ 
  groupedEmployees, 
  onEdit, 
  onDelete 
}) => {
  const hasData = Object.keys(groupedEmployees).length > 0;

  if (!hasData) {
    return (
      <TableBody>
        <TableRow>
          <TableCell 
            colSpan={6} 
            align="center"
            sx={{ 
              py: 6,
              color: '#666'
            }}
          >
            <Typography variant="body2">
              Нет данных
            </Typography>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  const sortedGroupNames = sortSpecializationGroups(Object.keys(groupedEmployees));

  return (
    <TableBody>
      {sortedGroupNames.map((specializationName) => {
        const group = groupedEmployees[specializationName];
        return (
          <React.Fragment key={specializationName}>
            <SpecializationGroupHeader 
              specializationName={specializationName}
              employeesCount={group.employees.length}
            />
            
            {group.employees.map((employee, employeeIndex) => (
              <EmployeeTableRow
                key={employee.id}
                employee={employee}
                employeeIndex={employeeIndex}
                specializationName={specializationName}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </React.Fragment>
        );
      })}
    </TableBody>
  );
};

export default EmployeesTableBody;
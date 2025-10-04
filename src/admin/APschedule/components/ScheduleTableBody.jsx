import React from 'react';
import { TableBody, TableRow, TableCell, Typography } from '@mui/material';
import DayCell from './DayCell';

const ScheduleTableBody = ({ 
    employees, 
    daysInWeek, 
    getSchedule,
    formatTimeRange,
    onOpenTimeDialog, 
    onDeleteDay 
}) => {
    return (
        <TableBody>
            {employees.map((employee, employeeIndex) => (
                <TableRow 
                    key={employee.id}
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
                            py: 2,
                            borderBottom: '1px solid #f0f0f0',
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
                    {daysInWeek.map(day => {
                        const schedule = getSchedule(day, employee.id);
                        const isWorking = !!schedule;
                        
                        return (
                            <DayCell
                                key={day.toISOString()}
                                day={day}
                                schedule={schedule}
                                formatTimeRange={formatTimeRange}
                                onCellClick={() => onOpenTimeDialog(employee.id, day, isWorking)}
                                onDelete={() => onDeleteDay(employee.id, day)}
                            />
                        );
                    })}
                </TableRow>
            ))}
        </TableBody>
    );
};

export default ScheduleTableBody;
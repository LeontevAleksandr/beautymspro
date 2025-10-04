import React from 'react';
import { TableHead, TableRow, TableCell, Typography, Stack } from '@mui/material';
import { Person } from '@mui/icons-material';
import { format, isSameDay, isWeekend } from 'date-fns';
import { ru } from 'date-fns/locale';

const ScheduleTableHead = ({ daysInWeek }) => {
    return (
        <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
            <TableRow>
                <TableCell 
                    sx={{ 
                        fontWeight: 600, 
                        color: '#424242',
                        borderBottom: '1px solid #e0e0e0',
                        py: 2,
                        width: '20%'
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Person sx={{ fontSize: 18, color: '#666' }} />
                        <span>Сотрудник</span>
                    </Stack>
                </TableCell>
                {daysInWeek.map(day => (
                    <TableCell 
                        key={day.toISOString()} 
                        align="center"
                        sx={{ 
                            minWidth: 120,
                            backgroundColor: isWeekend(day) ? '#fff4f4' : '#f8f9fa',
                            fontWeight: 600, 
                            color: '#424242',
                            borderBottom: '1px solid #e0e0e0',
                            py: 2,
                            ...(isSameDay(day, new Date()) && {
                                backgroundColor: '#e3f2fd',
                                borderLeft: '1px solid #bbdefb',
                                borderRight: '1px solid #bbdefb'
                            })
                        }}
                    >
                        <Typography variant="subtitle2">
                            {format(day, 'EEE', { locale: ru })}
                        </Typography>
                        <Typography variant="body2">
                            {format(day, 'dd.MM')}
                        </Typography>
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
};

export default ScheduleTableHead;
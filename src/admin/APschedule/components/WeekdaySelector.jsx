import React from 'react';
import { Box, TableContainer, Table, TableBody, TableRow, TableCell, Paper } from '@mui/material';

const WeekdaySelector = ({ selectedDays, onToggleDay }) => {
    const weekdays = [
        { id: 1, short: 'Пн', full: 'Понедельник' },
        { id: 2, short: 'Вт', full: 'Вторник' },
        { id: 3, short: 'Ср', full: 'Среда' },
        { id: 4, short: 'Чт', full: 'Четверг' },
        { id: 5, short: 'Пт', full: 'Пятница' },
        { id: 6, short: 'Сб', full: 'Суббота' },
        { id: 0, short: 'Вс', full: 'Воскресенье' }
    ];

    return (
        <TableContainer 
            component={Paper}
            sx={{ 
                boxShadow: 'none',
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                overflow: 'hidden'
            }}
        >
            <Table size="small">
                <TableBody>
                    <TableRow>
                        {weekdays.map(day => (
                            <TableCell 
                                key={day.id}
                                align="center"
                                onClick={() => onToggleDay(day.id)}
                                sx={{ 
                                    py: 1.5,
                                    cursor: 'pointer',
                                    backgroundColor: selectedDays.includes(day.id) ? '#e8f5e9' : '#ffffff',
                                    borderBottom: 'none',
                                    transition: 'all 0.2s',
                                    fontWeight: 500,
                                    color: selectedDays.includes(day.id) ? '#2e7d32' : '#666',
                                    '&:hover': {
                                        backgroundColor: selectedDays.includes(day.id) ? '#c8e6c9' : '#f5f5f5',
                                    }
                                }}
                            >
                                <Box>
                                    <Box sx={{ fontSize: '0.875rem' }}>{day.short}</Box>
                                </Box>
                            </TableCell>
                        ))}
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default WeekdaySelector;
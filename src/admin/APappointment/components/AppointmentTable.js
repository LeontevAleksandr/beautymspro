import React from 'react';
import { Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Box } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

// ==================== КОМПОНЕНТ ТАБЛИЦЫ РАСПИСАНИЯ ====================
export const AppointmentTable = ({
    filteredEmployees,
    timeSlots,
    renderAppointmentCell
}) => {
    return (
        <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 220px)' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell 
                                sx={{ 
                                    width: '90px',
                                    backgroundColor: '#f8f9fa',
                                    borderRight: '1px solid #e0e0e0',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    textAlign: 'center'
                                }}
                            >
                                Время
                            </TableCell>
                            {filteredEmployees.map(employee => (
                                <TableCell 
                                    key={employee.id} 
                                    sx={{ 
                                        minWidth: '280px',
                                        backgroundColor: '#f8f9fa',
                                        borderRight: '1px solid #e0e0e0',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        textAlign: 'center'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                        <PersonIcon sx={{ fontSize: '16px', color: 'text.secondary' }} />
                                        {employee.full_name}
                                    </Box>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {timeSlots.map(timeSlot => (
                            <TableRow key={timeSlot}>
                                <TableCell 
                                    sx={{ 
                                        fontWeight: 500,
                                        fontSize: '0.8rem',
                                        textAlign: 'center',
                                        backgroundColor: '#fafafa',
                                        borderRight: '1px solid #e0e0e0',
                                        color: 'text.secondary'
                                    }}
                                >
                                    {timeSlot}
                                </TableCell>
                                {filteredEmployees.map(employee => 
                                    renderAppointmentCell(employee.id, timeSlot)
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};
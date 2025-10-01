import React from 'react';
import { Box, TableCell } from '@mui/material';
import { format } from 'date-fns';
import AddIcon from '@mui/icons-material/Add';
import { TABLE_ROW_HEIGHT } from '../utils/constants';
import { getAppointmentForSlot, isEmployeeWorking } from '../utils/scheduleHelpers.js';
import { AppointmentBlock } from './AppointmentBlock';

// ==================== КОМПОНЕНТ ЯЧЕЙКИ ЗАПИСИ ====================
export const AppointmentCell = ({ 
    employeeId, 
    timeSlot,
    appointments,
    services,
    clients,
    notifications,
    schedules,
    scheduleExceptions,
    selectedDate,
    hoveredCell,
    setHoveredCell,
    onCellClick,
    onAddClick,
    onEditAppointment,
    onDeleteAppointment,
    onResizeStart
}) => {
    const appointment = getAppointmentForSlot(employeeId, timeSlot, appointments, services, selectedDate);
    
    if (!appointment) {
        const isWorking = isEmployeeWorking(employeeId, timeSlot, schedules, scheduleExceptions, selectedDate);
        const isHovered = hoveredCell?.employeeId === employeeId && hoveredCell?.timeSlot === timeSlot;
        
        return (
            <TableCell 
                key={`${employeeId}-${timeSlot}`}
                sx={{ 
                    position: 'relative',
                    height: `${TABLE_ROW_HEIGHT}px`,
                    border: '1px solid #f0f0f0',
                    padding: 0,
                    backgroundColor: isWorking ? '#fafafa' : '#f5f5f5',
                    transition: 'background-color 0.15s ease',
                    '&:hover': {
                        backgroundColor: isWorking ? '#f0f0f0' : '#f5f5f5'
                    }
                }}
                onMouseEnter={() => setHoveredCell({ employeeId, timeSlot })}
                onMouseLeave={() => setHoveredCell(null)}
                onClick={() => onCellClick(employeeId, timeSlot)}
            >
                {isHovered && isWorking && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#1976d2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                transform: 'translate(-50%, -50%) scale(1.1)',
                                backgroundColor: '#1565c0'
                            }
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddClick(employeeId, timeSlot);
                        }}
                    >
                        <AddIcon sx={{ color: 'white', fontSize: '14px' }} />
                    </Box>
                )}
            </TableCell>
        );
    }
    
    const appointmentTime = format(new Date(appointment.datetime), 'HH:mm');
    if (appointmentTime === timeSlot) {
        const client = clients.find(c => c.id === appointment.client_id);
        const service = services.find(s => s.id === appointment.service_id);
        
        return (
            <TableCell 
                key={`${employeeId}-${timeSlot}`}
                sx={{ 
                    position: 'relative',
                    height: `${TABLE_ROW_HEIGHT}px`,
                    border: '1px solid #f0f0f0',
                    padding: 0
                }}
            >
                <AppointmentBlock
                    appointment={appointment}
                    client={client}
                    service={service}
                    notifications={notifications}
                    onEdit={onEditAppointment}
                    onDelete={onDeleteAppointment}
                    onResizeStart={onResizeStart}
                />
            </TableCell>
        );
    }
    
    return (
        <TableCell 
            key={`${employeeId}-${timeSlot}`}
            sx={{ 
                position: 'relative',
                height: `${TABLE_ROW_HEIGHT}px`,
                border: '1px solid #f0f0f0',
                padding: 0
            }}
        />
    );
};
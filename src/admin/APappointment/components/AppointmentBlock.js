import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { format, addMinutes } from 'date-fns';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { 
    STATUS_COLORS, 
    SLOT_DURATION, 
    TABLE_ROW_HEIGHT, 
    RESIZE_HANDLE_HEIGHT 
} from '../utils/constants';
import { getNotificationForAppointment, getNotificationIcon } from '../utils/dataHelpers.js';

// ==================== КОМПОНЕНТ БЛОКА ЗАПИСИ ====================
export const AppointmentBlock = ({ 
    appointment, 
    client, 
    service, 
    notifications,
    onEdit, 
    onDelete, 
    onResizeStart 
}) => {
    if (!client || !service) return null;
    
    const appointmentTime = new Date(appointment.datetime);
    const duration = appointment.custom_duration || service.duration;
    const appointmentEndTime = addMinutes(appointmentTime, duration);
    const appointmentEndTimeStr = format(appointmentEndTime, 'HH:mm');
    
    // Простой расчет слотов
    const slotsCount = Math.ceil(duration / SLOT_DURATION);
    
    const backgroundColor = STATUS_COLORS[appointment.status] || STATUS_COLORS.created;
    
    return (
        <Box
            data-appointment-id={appointment.id}
            sx={{
                position: 'absolute',
                width: '100%',
                height: `${slotsCount * TABLE_ROW_HEIGHT}px`,
                backgroundColor,
                border: '1px solid #e0e0e0',
                borderLeft: '3px solid #1976d2',
                borderRadius: '4px',
                padding: 0,
                margin: 0,
                top: 0,
                left: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 1,
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
                '&:hover': {
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    zIndex: 2,
                    borderLeftColor: '#1565c0',
                    '& .resize-handle': {
                        backgroundColor: '#1976d2',
                        opacity: 0.8
                    },
                    '& .delete-button': {
                        opacity: 1
                    },
                    '& .edit-hint': {
                        opacity: 1
                    }
                }
            }}
            ref={(element) => {
                if (element) {
                    setTimeout(() => {
                        const tableRow = element.closest('tr');
                        if (tableRow) {
                            const realRowHeight = tableRow.getBoundingClientRect().height;
                            if (realRowHeight > 0) {
                                const correctHeight = slotsCount * realRowHeight;
                                element.style.height = `${correctHeight}px`;
                            }
                        }
                    }, 0);
                }
            }}
        >
            {/* Основная область записи */}
            <Box 
                sx={{ 
                    flex: 1,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    paddingBottom: `${RESIZE_HANDLE_HEIGHT + 4}px`,
                    position: 'relative'
                }}
                onClick={() => onEdit(appointment)}
            >
                {/* Иконка редактирования */}
                <EditIcon 
                    className="edit-hint"
                    sx={{
                        position: 'absolute',
                        top: 6,
                        right: 28,
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        fontSize: '14px',
                        color: 'text.secondary'
                    }}
                />

                {/* Кнопка удаления */}
                <IconButton
                    className="delete-button"
                    size="small"
                    sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        opacity: 0,
                        transition: 'all 0.2s',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        '&:hover': {
                            backgroundColor: '#ffebee',
                            color: 'error.main'
                        },
                        width: '20px',
                        height: '20px'
                    }}
                    onClick={(e) => onDelete(appointment, e)}
                >
                    <DeleteIcon sx={{ fontSize: '12px' }} />
                </IconButton>

                {/* Контент записи */}
                <Box sx={{ pr: '50px' }}>
                    <Typography 
                        variant="subtitle2" 
                        noWrap 
                        sx={{ 
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            lineHeight: 1.2,
                            mb: 0.5
                        }}
                    >
                        {client.full_name}
                    </Typography>
                    
                    <Typography 
                        variant="caption" 
                        noWrap 
                        sx={{ 
                            fontSize: '0.75rem',
                            color: 'text.secondary',
                            display: 'block',
                            lineHeight: 1.1,
                            mb: 0.5
                        }}
                    >
                        {service.name}
                    </Typography>
                    
                    <Typography 
                        variant="caption" 
                        noWrap 
                        sx={{ 
                            fontSize: '0.7rem',
                            color: 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            lineHeight: 1
                        }}
                    >
                        <AccessTimeIcon sx={{ fontSize: '10px', mr: 0.5 }} />
                        {format(appointmentTime, 'HH:mm')} - {appointmentEndTimeStr}
                    </Typography>
                    
                    {/* Информация о напоминании */}
                    {(() => {
                        const notification = getNotificationForAppointment(appointment.id, notifications);
                        if (!notification) return null;
                        
                        return (
                            <Typography 
                                variant="caption" 
                                noWrap 
                                sx={{ 
                                    fontSize: '0.65rem',
                                    color: 'text.secondary',
                                    display: 'flex',
                                    alignItems: 'center',
                                    lineHeight: 1,
                                    mt: 0.3
                                }}
                            >
                                {getNotificationIcon(notification.status)}
                                <Box component="span" sx={{ ml: 0.5 }}>
                                    {notification.status === 'scheduled' && `Напомнить ${format(new Date(notification.scheduled_at), 'dd.MM HH:mm')}`}
                                    {notification.status === 'sent' && `Отправлено ${format(new Date(notification.sent_at), 'dd.MM HH:mm')}`}
                                    {notification.status === 'failed' && `Ошибка отправки${notification.attempts > 1 ? ` (${notification.attempts} попыток)` : ''}`}
                                </Box>
                            </Typography>
                        );
                    })()}
                    
                    {appointment.final_price && slotsCount > 2 && (
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                fontSize: '0.7rem',
                                color: 'success.main',
                                fontWeight: 600,
                                display: 'block',
                                mt: 0.5
                            }}
                        >
                            {appointment.final_price} ₽
                        </Typography>
                    )}
                </Box>
            </Box>
            
            {/* Ручка для изменения размера */}
            <Box
                className="resize-handle"
                sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: `${RESIZE_HANDLE_HEIGHT}px`,
                    cursor: 'ns-resize',
                    backgroundColor: '#e0e0e0',
                    opacity: 0.6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        backgroundColor: '#1976d2',
                        opacity: 1,
                        height: '14px'
                    },
                    '&::after': {
                        content: '"···"',
                        fontSize: '8px',
                        color: 'white',
                        letterSpacing: '1px'
                    }
                }}
                onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onResizeStart(appointment, e);
                }}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
            />
        </Box>
    );
};
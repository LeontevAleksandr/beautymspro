import React from 'react';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import ErrorIcon from '@mui/icons-material/Error';

// ==================== ГЕТТЕРЫ ДАННЫХ ====================
export const getClientName = (clientId, clientsArray) => {
    const client = clientsArray.find(c => c.id === clientId);
    return client ? client.full_name : 'Неизвестный клиент';
};

export const getServiceName = (serviceId, services) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Неизвестная услуга';
};

export const getNotificationForAppointment = (appointmentId, notifications) => {
    return notifications.find(n => n.appointment_id === appointmentId);
};

export const getNotificationIcon = (status) => {
    switch (status) {
        case 'scheduled':
            return <NotificationsIcon sx={{ fontSize: 10, color: '#ff9800' }} />;
        case 'sent':
            return <NotificationsActiveIcon sx={{ fontSize: 10, color: '#4caf50' }} />;
        case 'failed':
            return <ErrorIcon sx={{ fontSize: 10, color: '#f44336' }} />;
        default:
            return <NotificationsOffIcon sx={{ fontSize: 10, color: '#9e9e9e' }} />;
    }
};
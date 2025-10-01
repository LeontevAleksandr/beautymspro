import { format } from 'date-fns';

const API_BASE_URL = 'http://localhost:5000/api';

// ==================== API ФУНКЦИИ ====================

export const fetchScheduleExceptions = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/schedule_exceptions`);
        if (response.ok) {
            return await response.json();
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
        console.error('Ошибка при загрузке исключений:', error);
        throw error;
    }
};

export const fetchSchedulesForDate = async (date) => {
    try {
        const response = await fetch(`${API_BASE_URL}/schedules`);
        if (response.ok) {
            const data = await response.json();
            const formattedDate = format(date, 'yyyy-MM-dd');
            return data.filter(schedule => schedule.date === formattedDate);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
        console.error('Ошибка при загрузке расписаний:', error);
        throw error;
    }
};

export const fetchAppointmentsForDate = async (date) => {
    try {
        const response = await fetch(`${API_BASE_URL}/appointments`);
        if (response.ok) {
            const data = await response.json();
            const formattedDate = format(date, 'yyyy-MM-dd');
            return data.filter(appointment => 
                appointment.datetime && appointment.datetime.startsWith(formattedDate)
            );
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
        console.error('Ошибка при загрузке записей:', error);
        throw error;
    }
};

export const fetchNotifications = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications`);
        if (response.ok) {
            return await response.json();
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
        console.error('Ошибка при загрузке уведомлений:', error);
        throw error;
    }
};

export const fetchServiceQualifications = async (serviceId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/service_qualifications`);
        if (response.ok) {
            const data = await response.json();
            return data.filter(item => item.service_id === serviceId);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
        console.error('Ошибка при получении квалификаций услуги:', error);
        throw error;
    }
};
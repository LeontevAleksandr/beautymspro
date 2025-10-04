import { API_ENDPOINTS } from '../utils/constants';

// Обработка ошибок API
const handleApiError = (error, customMessage) => {
    console.error(customMessage, error);
    throw new Error(customMessage);
};

// Employees API
export const fetchEmployees = async () => {
    try {
        const response = await fetch(API_ENDPOINTS.EMPLOYEES);
        if (!response.ok) {
            throw new Error('Ошибка при загрузке сотрудников');
        }
        return await response.json();
    } catch (error) {
        handleApiError(error, 'Ошибка сети при загрузке сотрудников');
    }
};

// Schedules API
export const fetchSchedules = async () => {
    try {
        const response = await fetch(API_ENDPOINTS.SCHEDULES);
        if (!response.ok) {
            throw new Error('Ошибка при загрузке графиков');
        }
        return await response.json();
    } catch (error) {
        handleApiError(error, 'Ошибка при загрузке графиков');
    }
};

export const deleteSchedule = async (scheduleId) => {
    try {
        const response = await fetch(`${API_ENDPOINTS.SCHEDULES}/${scheduleId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Ошибка при удалении рабочего дня');
        }
        return true;
    } catch (error) {
        handleApiError(error, 'Ошибка сети при удалении рабочего дня');
    }
};

// Schedule Exceptions API
export const fetchScheduleExceptions = async () => {
    try {
        const response = await fetch(API_ENDPOINTS.SCHEDULE_EXCEPTIONS);
        if (!response.ok) {
            throw new Error('Ошибка при загрузке исключений');
        }
        return await response.json();
    } catch (error) {
        handleApiError(error, 'Ошибка при загрузке исключений');
    }
};

export const fetchExceptionsByScheduleId = async (scheduleId) => {
    try {
        const allExceptions = await fetchScheduleExceptions();
        return allExceptions.filter(exc => exc.schedule_id === scheduleId);
    } catch (error) {
        handleApiError(error, 'Ошибка при загрузке исключений для расписания');
    }
};

// Create or update schedule
export const saveSchedule = async (scheduleData, scheduleId = null) => {
    try {
        const url = scheduleId 
            ? `${API_ENDPOINTS.SCHEDULES}/${scheduleId}`
            : API_ENDPOINTS.SCHEDULES;
        
        const method = scheduleId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scheduleData)
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при сохранении расписания');
        }
        
        return await response.json();
    } catch (error) {
        handleApiError(error, 'Ошибка сети при сохранении расписания');
    }
};

// Create exception
export const createException = async (exceptionData) => {
    try {
        const response = await fetch(API_ENDPOINTS.SCHEDULE_EXCEPTIONS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(exceptionData)
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при создании исключения');
        }
        
        return await response.json();
    } catch (error) {
        handleApiError(error, 'Ошибка при создании исключения');
    }
};

// Update exception
export const updateException = async (exceptionId, exceptionData) => {
    try {
        const response = await fetch(`${API_ENDPOINTS.SCHEDULE_EXCEPTIONS}/${exceptionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(exceptionData)
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при обновлении исключения');
        }
        
        return await response.json();
    } catch (error) {
        handleApiError(error, 'Ошибка при обновлении исключения');
    }
};

// Delete exception
export const deleteException = async (exceptionId) => {
    try {
        const response = await fetch(`${API_ENDPOINTS.SCHEDULE_EXCEPTIONS}/${exceptionId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при удалении исключения');
        }
        
        return true;
    } catch (error) {
        handleApiError(error, 'Ошибка при удалении исключения');
    }
};

// Bulk create schedules
export const bulkCreateSchedules = async (schedulesData) => {
    try {
        const promises = schedulesData.map(scheduleData => 
            fetch(API_ENDPOINTS.SCHEDULES, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(scheduleData)
            })
        );
        
        await Promise.all(promises);
        return true;
    } catch (error) {
        handleApiError(error, 'Ошибка при массовом создании расписаний');
    }
};
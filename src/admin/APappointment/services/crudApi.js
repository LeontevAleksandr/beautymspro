const API_BASE_URL = 'http://localhost:5000/api';

// ==================== CRUD API ФУНКЦИИ ====================

// Создание записи
export const createAppointment = async (appointmentData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appointmentData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw { status: response.status, data: errorData };
        }
        
        return await response.json();
    } catch (error) {
        console.error('Ошибка при создании записи:', error);
        throw error;
    }
};

// Обновление записи
export const updateAppointment = async (appointmentId, appointmentData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appointmentData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw { status: response.status, data: errorData };
        }
        
        return await response.json();
    } catch (error) {
        console.error('Ошибка при обновлении записи:', error);
        throw error;
    }
};

// Удаление записи
export const deleteAppointment = async (appointmentId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw { status: response.status, data: errorData };
        }
        
        return true;
    } catch (error) {
        console.error('Ошибка при удалении записи:', error);
        throw error;
    }
};

// Получение информации о конфликтной записи
export const getConflictAppointment = async (appointmentId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Ошибка при загрузке данных о конфликтной записи:', error);
        throw error;
    }
};

// Создание клиента
export const createClient = async (clientData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clientData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw { status: response.status, data: errorData };
        }
        
        return await response.json();
    } catch (error) {
        console.error('Ошибка при создании клиента:', error);
        throw error;
    }
};
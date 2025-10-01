// Константы и конфигурация для APclients

export const API_BASE_URL = 'http://localhost:5000/api';

export const API_ENDPOINTS = {
    clients: `${API_BASE_URL}/clients`,
    clientStatuses: `${API_BASE_URL}/client_statuses`,
    clientPreferences: `${API_BASE_URL}/client_preferences`
};

export const INITIAL_CLIENT_FORM = {
    full_name: '',
    phone: '',
    email: ''
};

export const INITIAL_PREFERENCES_FORM = {
    client_id: '',
    client_status_id: '',
    preferences: ''
};

export const INITIAL_STATUS_FORM = {
    status: ''
};

export const INITIAL_FORM_ERRORS = {
    full_name: false,
    phone: false,
    email: false
};

export const INITIAL_SNACKBAR = {
    open: false,
    message: '',
    severity: 'success'
};
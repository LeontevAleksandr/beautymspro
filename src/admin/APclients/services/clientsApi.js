// API методы для работы с клиентами

import { API_ENDPOINTS } from '../utils/constants';

// Функция для обработки ответов API
const handleResponse = async (response) => {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
};

// Функции для работы с клиентами
export const fetchClients = async () => {
    const response = await fetch(API_ENDPOINTS.clients);
    return handleResponse(response);
};

export const createClient = async (clientData) => {
    const response = await fetch(API_ENDPOINTS.clients, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(clientData)
    });
    return handleResponse(response);
};

export const updateClient = async (clientId, clientData) => {
    const response = await fetch(`${API_ENDPOINTS.clients}/${clientId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(clientData)
    });
    return handleResponse(response);
};

export const deleteClient = async (clientId) => {
    const response = await fetch(`${API_ENDPOINTS.clients}/${clientId}`, {
        method: 'DELETE'
    });
    return handleResponse(response);
};

// Функции для работы со статусами клиентов
export const fetchClientStatuses = async () => {
    const response = await fetch(API_ENDPOINTS.clientStatuses);
    return handleResponse(response);
};

export const createClientStatus = async (statusData) => {
    const response = await fetch(API_ENDPOINTS.clientStatuses, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(statusData)
    });
    return handleResponse(response);
};

export const updateClientStatus = async (statusId, statusData) => {
    const response = await fetch(`${API_ENDPOINTS.clientStatuses}/${statusId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(statusData)
    });
    return handleResponse(response);
};

export const deleteClientStatus = async (statusId) => {
    const response = await fetch(`${API_ENDPOINTS.clientStatuses}/${statusId}`, {
        method: 'DELETE'
    });
    return handleResponse(response);
};

// Функции для работы с предпочтениями клиентов
export const fetchClientPreferences = async () => {
    const response = await fetch(API_ENDPOINTS.clientPreferences);
    return handleResponse(response);
};

export const createClientPreferences = async (preferencesData) => {
    const response = await fetch(API_ENDPOINTS.clientPreferences, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferencesData)
    });
    return handleResponse(response);
};

export const updateClientPreferences = async (preferencesId, preferencesData) => {
    const response = await fetch(`${API_ENDPOINTS.clientPreferences}/${preferencesId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferencesData)
    });
    return handleResponse(response);
};

export const deleteClientPreferences = async (preferencesId) => {
    const response = await fetch(`${API_ENDPOINTS.clientPreferences}/${preferencesId}`, {
        method: 'DELETE'
    });
    return handleResponse(response);
};
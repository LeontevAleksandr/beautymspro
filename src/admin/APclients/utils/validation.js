// Функции валидации данных

import { validatePhone } from './phoneUtils';

// Функция валидации email
export const validateEmail = (email) => {
    if (!email) return true; // email не обязателен
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Функция валидации полного имени
export const validateFullName = (fullName) => {
    return fullName && fullName.trim().length > 0;
};

// Функция валидации формы клиента
export const validateClientForm = (clientForm) => {
    const errors = {
        full_name: !validateFullName(clientForm.full_name),
        phone: !clientForm.phone.trim() || !validatePhone(clientForm.phone),
        email: clientForm.email && !validateEmail(clientForm.email)
    };
    
    return {
        errors,
        isValid: !Object.values(errors).some(error => error)
    };
};
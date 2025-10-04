import { API_ENDPOINTS } from '../utils/constants';

// Обработка ошибок API
const handleApiError = async (response, defaultMessage) => {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || defaultMessage);
  }
  return response.json();
};

// Загрузка всех сотрудников
export const fetchEmployees = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.EMPLOYEES);
    return await handleApiError(response, 'Неизвестная ошибка при загрузке сотрудников');
  } catch (error) {
    throw new Error(`Ошибка при загрузке сотрудников: ${error.message}`);
  }
};

// Загрузка специализаций
export const fetchSpecializations = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.SPECIALIZATIONS);
    return await handleApiError(response, 'Неизвестная ошибка при загрузке специализаций');
  } catch (error) {
    throw new Error(`Ошибка при загрузке специализаций: ${error.message}`);
  }
};

// Загрузка квалификаций
export const fetchQualifications = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.QUALIFICATIONS);
    return await handleApiError(response, 'Неизвестная ошибка при загрузке квалификаций');
  } catch (error) {
    throw new Error(`Ошибка при загрузке квалификаций: ${error.message}`);
  }
};

// Загрузка связей специализаций и квалификаций
export const fetchSpecializationQualifications = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.SPECIALIZATION_QUALIFICATIONS);
    return await handleApiError(response, 'Неизвестная ошибка при загрузке квалификаций для специализации');
  } catch (error) {
    throw new Error(`Ошибка при загрузке квалификаций для специализации: ${error.message}`);
  }
};

// Создание сотрудника
export const createEmployee = async (employeeData) => {
  try {
    const response = await fetch(API_ENDPOINTS.EMPLOYEES, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employeeData),
    });
    return await handleApiError(response, 'Неизвестная ошибка при создании сотрудника');
  } catch (error) {
    throw new Error(`Ошибка при создании сотрудника: ${error.message}`);
  }
};

// Обновление сотрудника
export const updateEmployee = async (employeeId, employeeData) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.EMPLOYEES}/${employeeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employeeData),
    });
    return await handleApiError(response, 'Неизвестная ошибка при обновлении сотрудника');
  } catch (error) {
    throw new Error(`Ошибка при обновлении сотрудника: ${error.message}`);
  }
};

// Удаление сотрудника
export const deleteEmployee = async (employeeId) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.EMPLOYEES}/${employeeId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Неизвестная ошибка при удалении сотрудника');
    }
    return true;
  } catch (error) {
    throw new Error(`Ошибка при удалении сотрудника: ${error.message}`);
  }
};
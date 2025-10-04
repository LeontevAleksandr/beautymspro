import { API_ENDPOINTS } from '../utils/constants';

// Универсальная функция для обработки ошибок
const handleResponse = async (response) => {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

// Получение всех услуг
export const fetchServices = async () => {
  const response = await fetch(API_ENDPOINTS.SERVICES);
  return handleResponse(response);
};

// Получение всех специализаций
export const fetchSpecializations = async () => {
  const response = await fetch(API_ENDPOINTS.SPECIALIZATIONS);
  return handleResponse(response);
};

// Получение всех квалификаций
export const fetchQualifications = async () => {
  const response = await fetch(API_ENDPOINTS.QUALIFICATIONS);
  return handleResponse(response);
};

// Получение квалификаций для специализации
export const fetchSpecializationQualifications = async (specializationId) => {
  const response = await fetch(API_ENDPOINTS.SPECIALIZATION_QUALIFICATIONS);
  const data = await handleResponse(response);
  return data.filter(item => item.specialization_id === parseInt(specializationId));
};

// Получение квалификаций для услуги
export const fetchServiceQualifications = async (serviceId) => {
  const response = await fetch(API_ENDPOINTS.SERVICE_QUALIFICATIONS);
  const data = await handleResponse(response);
  return data.filter(item => item.service_id === serviceId);
};

// Создание новой услуги
export const createService = async (serviceData) => {
  const response = await fetch(API_ENDPOINTS.SERVICES, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(serviceData)
  });
  return handleResponse(response);
};

// Обновление услуги
export const updateService = async (serviceId, serviceData) => {
  const response = await fetch(`${API_ENDPOINTS.SERVICES}/${serviceId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(serviceData)
  });
  return handleResponse(response);
};

// Удаление услуги
export const deleteService = async (serviceId) => {
  const response = await fetch(`${API_ENDPOINTS.SERVICES}/${serviceId}`, {
    method: 'DELETE'
  });
  return handleResponse(response);
};

// Удаление всех квалификаций услуги
export const deleteServiceQualifications = async (serviceId) => {
  const response = await fetch(`${API_ENDPOINTS.SERVICE_QUALIFICATIONS}/${serviceId}`, {
    method: 'DELETE'
  });
  return response.ok;
};

// Создание связи услуги с квалификацией
export const createServiceQualification = async (serviceId, qualificationId, priceModified) => {
  const response = await fetch(API_ENDPOINTS.SERVICE_QUALIFICATIONS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      service_id: serviceId,
      qualification_id: qualificationId,
      price_modified: priceModified
    })
  });
  return handleResponse(response);
};
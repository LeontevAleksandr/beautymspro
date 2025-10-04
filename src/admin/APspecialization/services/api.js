import { API_ENDPOINTS } from '../utils/constants';

// Обработка ответов API
const handleResponse = async (response) => {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Специализации
export const fetchSpecializations = async () => {
  const response = await fetch(API_ENDPOINTS.SPECIALIZATIONS);
  return handleResponse(response);
};

export const createSpecialization = async (data) => {
  const response = await fetch(API_ENDPOINTS.SPECIALIZATIONS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.ok;
};

export const updateSpecialization = async (id, data) => {
  const response = await fetch(`${API_ENDPOINTS.SPECIALIZATIONS}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.ok;
};

export const deleteSpecialization = async (id) => {
  const response = await fetch(`${API_ENDPOINTS.SPECIALIZATIONS}/${id}`, {
    method: 'DELETE'
  });
  return response.ok;
};

// Квалификации
export const fetchQualifications = async () => {
  const response = await fetch(API_ENDPOINTS.QUALIFICATIONS);
  const data = await handleResponse(response);
  // Сортируем по приоритету
  return data.sort((a, b) => a.priority - b.priority);
};

export const createQualification = async (data) => {
  const response = await fetch(API_ENDPOINTS.QUALIFICATIONS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.ok;
};

export const updateQualification = async (id, data) => {
  const response = await fetch(`${API_ENDPOINTS.QUALIFICATIONS}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.ok;
};

export const deleteQualification = async (id) => {
  const response = await fetch(`${API_ENDPOINTS.QUALIFICATIONS}/${id}`, {
    method: 'DELETE'
  });
  return response.ok;
};

// Квалификации специализаций
export const fetchSpecializationQualifications = async (specializationId) => {
  const response = await fetch(API_ENDPOINTS.SPECIALIZATION_QUALIFICATIONS);
  const data = await handleResponse(response);
  // Фильтруем по специализации
  return data.filter(item => item.specialization_id === specializationId);
};

export const addQualificationToSpecialization = async (specializationId, qualificationId) => {
  const response = await fetch(API_ENDPOINTS.SPECIALIZATION_QUALIFICATIONS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      specialization_id: specializationId,
      qualification_id: qualificationId,
      description: ''
    })
  });
  return response.ok;
};
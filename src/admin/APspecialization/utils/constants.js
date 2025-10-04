// API endpoints
export const API_BASE_URL = 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  SPECIALIZATIONS: `${API_BASE_URL}/specializations`,
  QUALIFICATIONS: `${API_BASE_URL}/qualifications`,
  SPECIALIZATION_QUALIFICATIONS: `${API_BASE_URL}/specialization_qualifications`
};

// Начальные состояния
export const INITIAL_SPECIALIZATION = {
  name: ''
};

export const INITIAL_QUALIFICATION = {
  name: '',
  priority: 1
};

// Сообщения подтверждения
export const CONFIRM_MESSAGES = {
  DELETE_SPECIALIZATION: 'Вы уверены, что хотите удалить эту специализацию?',
  DELETE_QUALIFICATION: 'Вы уверены, что хотите удалить эту квалификацию?'
};

// Направления перемещения приоритета
export const PRIORITY_DIRECTION = {
  UP: 'up',
  DOWN: 'down'
};
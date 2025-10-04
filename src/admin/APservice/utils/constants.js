// API endpoints
export const API_BASE_URL = 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  SERVICES: `${API_BASE_URL}/services`,
  SPECIALIZATIONS: `${API_BASE_URL}/specializations`,
  QUALIFICATIONS: `${API_BASE_URL}/qualifications`,
  SPECIALIZATION_QUALIFICATIONS: `${API_BASE_URL}/specialization_qualifications`,
  SERVICE_QUALIFICATIONS: `${API_BASE_URL}/service_qualifications`
};

// Начальное состояние формы
export const INITIAL_FORM_STATE = {
  name: '',
  specialization_id: '',
  base_price: '',
  duration: '',
  qualification_prices: []
};

// Сообщения для пользователя
export const MESSAGES = {
  DELETE_CONFIRM: 'Вы уверены, что хотите удалить эту услугу?',
  ERROR_FETCH_SERVICES: 'Ошибка при получении услуг',
  ERROR_FETCH_SPECIALIZATIONS: 'Ошибка при получении специализаций',
  ERROR_FETCH_QUALIFICATIONS: 'Ошибка при получении квалификаций',
  ERROR_FETCH_SPEC_QUALS: 'Ошибка при получении квалификаций для специализации',
  ERROR_FETCH_SERVICE_QUALS: 'Ошибка при получении квалификаций услуги',
  ERROR_SAVE_SERVICE: 'Ошибка при сохранении услуги',
  ERROR_DELETE_SERVICE: 'Ошибка при удалении услуги',
  WARN_FETCH_SPEC_QUALS: 'Ошибка при получении квалификаций для специализации'
};
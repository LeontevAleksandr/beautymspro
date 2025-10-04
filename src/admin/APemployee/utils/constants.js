// API endpoints
export const API_BASE_URL = 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  EMPLOYEES: `${API_BASE_URL}/employees`,
  SPECIALIZATIONS: `${API_BASE_URL}/specializations`,
  QUALIFICATIONS: `${API_BASE_URL}/qualifications`,
  SPECIALIZATION_QUALIFICATIONS: `${API_BASE_URL}/specialization_qualifications`
};

// Начальные состояния форм
export const INITIAL_EMPLOYEE_FORM = {
  full_name: '',
  passport_number: '',
  phone: '',
  email: '',
  password: '',
  specialization_id: '',
  qualification_level_id: ''
};

export const INITIAL_FORM_ERRORS = {
  full_name: false,
  passport_number: false,
  phone: false,
  email: false,
  password: false
};

// Константы для группировки
export const NO_SPECIALIZATION_KEY = 'Без специализации';
export const NO_SPECIALIZATION_ID = 'no_spec';
export const DEFAULT_PRIORITY = 999;
import { format, subMonths } from 'date-fns';

/**
 * Константы для компонента аналитики загруженности сотрудников
 */

// API endpoints
export const API_BASE_URL = 'http://localhost:5000/api';
export const ENDPOINTS = {
    EMPLOYEES: `${API_BASE_URL}/employees`,
    EMPLOYEE_WORKLOAD: `${API_BASE_URL}/analytics/employee_workload`
};

// Начальные значения фильтров
export const INITIAL_FILTERS = {
    START_DATE: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    END_DATE: format(new Date(), 'yyyy-MM-dd'),
    GROUP_BY: 'day'
};

// Опции группировки данных
export const GROUP_BY_OPTIONS = [
    { value: 'day', label: 'По дням' },
    { value: 'week', label: 'По неделям' },
    { value: 'month', label: 'По месяцам' }
];

// Количество сотрудников для отображения по умолчанию
export const DEFAULT_TOP_EMPLOYEES_COUNT = 5;

// Пороговые значения загруженности для цветового кодирования
export const WORKLOAD_THRESHOLDS = {
    CRITICAL: 80,
    HIGH: 60,
    MEDIUM: 40,
    LOW: 0
};
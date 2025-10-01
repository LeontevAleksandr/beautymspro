// ==================== КОНСТАНТЫ ====================
export const STATUS_COLORS = {
    created: '#f8f9fa',
    confirmed: '#e8f5e9', 
    cancelled: '#ffebee',
    completed: '#e3f2fd'
};

export const STATUS_LABELS = {
    created: 'Создана',
    confirmed: 'Подтверждена', 
    completed: 'Завершена',
    cancelled: 'Отменена'
};

export const TIME_PREFERENCES = {
    morning: { label: 'Утро (8:00-12:00)', start: '08:00', end: '12:00' },
    afternoon: { label: 'День (12:00-16:00)', start: '12:00', end: '16:00' },
    evening: { label: 'Вечер (16:00-20:00)', start: '16:00', end: '20:00' },
    any: { label: 'Любое время', start: '00:00', end: '23:59' }
};

export const REMINDER_OPTIONS = {
    '': 'Не напоминать',
    '30': 'За 30 минут',
    '60': 'За 1 час',
    '120': 'За 2 часа',
    '1440': 'За 1 день'
};

export const SLOT_DURATION = 15; // минут
export const RESIZE_HANDLE_HEIGHT = 12; // пикселей
export const TABLE_ROW_HEIGHT = 40; // высота строки таблицы в пикселях

export const INITIAL_RECORD_STATE = {
    client_id: '',
    service_id: '',
    employee_id: '',
    date: '',
    time: '',
    status: 'created',
    is_completed: false,
    is_paid: false,
    notes: '',
    custom_duration: '',
    final_price: '',
    reminder_time: ''
};

export const INITIAL_SMART_SEARCH = {
    startDate: new Date(),
    endDate: addDays(new Date(), 7),
    serviceId: '',
    preferredEmployeeId: '',
    timePreference: 'any',
    maxResults: 10
};

// Необходимо импортировать addDays из date-fns
import { addDays } from 'date-fns';
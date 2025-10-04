// API endpoints
export const API_BASE_URL = 'http://localhost:5000/api';

export const API_ENDPOINTS = {
    EMPLOYEES: `${API_BASE_URL}/employees`,
    SCHEDULES: `${API_BASE_URL}/schedules`,
    SCHEDULE_EXCEPTIONS: `${API_BASE_URL}/schedule_exceptions`
};

// Начальные значения
export const INITIAL_WORK_HOURS = {
    start_time: new Date(new Date().setHours(9, 0, 0)),
    end_time: new Date(new Date().setHours(18, 0, 0))
};

export const INITIAL_EXCEPTION = {
    startTime: new Date(new Date().setHours(13, 0, 0)),
    endTime: new Date(new Date().setHours(14, 0, 0)),
    reason: 'Обеденный перерыв'
};

// Начальное состояние диалога времени
export const INITIAL_TIME_DIALOG = {
    open: false,
    employeeId: null,
    date: null,
    startTime: null,
    endTime: null,
    isEdit: false,
    exceptions: []
};

// Начальное состояние диалога автозаполнения
export const INITIAL_AUTO_FILL_DIALOG = {
    open: false,
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
    formula: '1/1',
    employees: [],
    selectedRange: false,
    workHours: INITIAL_WORK_HOURS
};

// Начальное состояние snackbar
export const INITIAL_SNACKBAR = {
    open: false,
    message: '',
    severity: 'success'
};
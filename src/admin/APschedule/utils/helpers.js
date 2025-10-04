import { isSameDay } from 'date-fns';

// Получение рабочего графика для сотрудника на конкретную дату
export const getScheduleForDay = (schedules, date, employeeId) => {
    return schedules.find(schedule => 
        schedule.employee_id === employeeId && 
        isSameDay(new Date(schedule.date), date)
    );
};

// Форматирование времени из строки в объект Date
export const parseTimeToDate = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return new Date(new Date().setHours(hours, minutes, 0));
};

// Форматирование исключений из API в формат для UI
export const formatExceptionsForUI = (exceptions) => {
    return exceptions.map(exc => ({
        id: exc.id,
        startTime: parseTimeToDate(exc.start_time),
        endTime: parseTimeToDate(exc.end_time),
        reason: exc.reason
    }));
};

// Валидация времени исключения
export const validateException = (newException, workDayStart, workDayEnd, existingExceptions) => {
    // Проверка что время в пределах рабочего дня
    if (newException.startTime < workDayStart || 
        newException.endTime > workDayEnd ||
        newException.startTime >= newException.endTime) {
        return {
            valid: false,
            message: 'Время исключения должно быть в пределах рабочего дня'
        };
    }
    
    // Проверка пересечений с другими исключениями
    const hasOverlap = existingExceptions.some(exc => 
        (newException.startTime < exc.endTime && newException.endTime > exc.startTime)
    );
    
    if (hasOverlap) {
        return {
            valid: false,
            message: 'Исключение пересекается с другими исключениями'
        };
    }
    
    return { valid: true };
};

// Парсинг времени работы из объекта расписания
export const parseScheduleTimes = (schedule) => {
    if (!schedule) return null;
    
    const [startHours, startMinutes] = schedule.start_time.split(':').map(Number);
    const [endHours, endMinutes] = schedule.end_time.split(':').map(Number);
    
    return {
        startTime: new Date(new Date().setHours(startHours, startMinutes, 0)),
        endTime: new Date(new Date().setHours(endHours, endMinutes, 0))
    };
};

// Получение имени сотрудника по ID
export const getEmployeeName = (employees, employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.full_name : 'Неизвестный сотрудник';
};

// Форматирование времени для отображения
export const formatTimeRange = (startTime, endTime) => {
    if (!startTime || !endTime) return '';
    return `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`;
};
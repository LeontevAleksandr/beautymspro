import { format, addDays, isSameDay, getDay } from 'date-fns';

// Генерация графика по формуле работы/отдыха
export const generateScheduleByFormula = (
    formula, 
    startDate, 
    endDate, 
    employeeIds, 
    customWorkHours,
    existingSchedules
) => {
    const [workDays, restDays] = formula.split('/').map(Number);
    const totalCycleDays = workDays + restDays;
    const generatedSchedules = [];
    
    for (const employeeId of employeeIds) {
        let currentDate = new Date(startDate);
        let dayCounter = 0;
        
        while (currentDate <= endDate) {
            const cyclePosition = dayCounter % totalCycleDays;
            const isWorkDay = cyclePosition < workDays;
            
            if (isWorkDay) {
                const existingSchedule = existingSchedules.find(s => 
                    s.employee_id === employeeId && 
                    isSameDay(new Date(s.date), currentDate)
                );
                
                if (!existingSchedule) {
                    generatedSchedules.push({
                        employee_id: employeeId,
                        date: format(currentDate, 'yyyy-MM-dd'),
                        start_time: format(customWorkHours.start_time, 'HH:mm:ss'),
                        end_time: format(customWorkHours.end_time, 'HH:mm:ss')
                    });
                }
            }
            
            currentDate = addDays(currentDate, 1);
            dayCounter++;
        }
    }
    
    return generatedSchedules;
};

// Генерация графика по выбранным дням недели
export const generateScheduleByWeekdays = (
    startDate,
    endDate,
    employeeIds,
    customWorkHours,
    selectedDays,
    existingSchedules
) => {
    const generatedSchedules = [];
    
    for (const employeeId of employeeIds) {
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            const dayOfWeek = getDay(currentDate);
            
            if (selectedDays.includes(dayOfWeek)) {
                const existingSchedule = existingSchedules.find(s => 
                    s.employee_id === employeeId && 
                    isSameDay(new Date(s.date), currentDate)
                );
                
                if (!existingSchedule) {
                    generatedSchedules.push({
                        employee_id: employeeId,
                        date: format(currentDate, 'yyyy-MM-dd'),
                        start_time: format(customWorkHours.start_time, 'HH:mm:ss'),
                        end_time: format(customWorkHours.end_time, 'HH:mm:ss')
                    });
                }
            }
            
            currentDate = addDays(currentDate, 1);
        }
    }
    
    return generatedSchedules;
};

// Валидация формулы графика
export const validateScheduleFormula = (formula) => {
    const parts = formula.split('/');
    if (parts.length !== 2) {
        return { valid: false, message: 'Формула должна быть в формате X/Y' };
    }
    
    const [workDays, restDays] = parts.map(Number);
    if (isNaN(workDays) || isNaN(restDays) || workDays < 0 || restDays < 0) {
        return { valid: false, message: 'Формула должна содержать только числа' };
    }
    
    return { valid: true };
};
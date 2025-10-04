import { format, addDays, isSameDay } from 'date-fns';

// Генерация графика по формуле работы/отдыха
export const generateScheduleByFormula = (
    formula, 
    startDate, 
    endDate, 
    employeeIds, 
    customWorkHours,
    existingSchedules
) => {
    // Разбираем формулу на рабочие и выходные дни
    const [workDays, restDays] = formula.split('/').map(Number);
    const totalCycleDays = workDays + restDays;
    
    // Создаем массив для хранения сгенерированных дат
    const generatedSchedules = [];
    
    // Для каждого сотрудника генерируем график
    for (const employeeId of employeeIds) {
        let currentDate = new Date(startDate);
        let dayCounter = 0;
        
        // Генерируем график в пределах выбранного диапазона дат
        while (currentDate <= endDate) {
            // Определяем, является ли текущий день рабочим по формуле
            const cyclePosition = dayCounter % totalCycleDays;
            const isWorkDay = cyclePosition < workDays;
            
            if (isWorkDay) {
                // Проверяем, существует ли уже запись для этого сотрудника и даты
                const existingSchedule = existingSchedules.find(s => 
                    s.employee_id === employeeId && 
                    isSameDay(new Date(s.date), currentDate)
                );
                
                if (!existingSchedule) {
                    // Если записи нет, создаем новую
                    generatedSchedules.push({
                        employee_id: employeeId,
                        date: format(currentDate, 'yyyy-MM-dd'),
                        start_time: format(customWorkHours.start_time, 'HH:mm:ss'),
                        end_time: format(customWorkHours.end_time, 'HH:mm:ss')
                    });
                }
            }
            
            // Переходим к следующему дню
            currentDate = addDays(currentDate, 1);
            dayCounter++;
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
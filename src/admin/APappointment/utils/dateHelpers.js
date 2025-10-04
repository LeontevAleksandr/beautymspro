import { format, differenceInDays } from 'date-fns';
import { TIME_PREFERENCES, SLOT_DURATION } from './constants.js';

// ==================== УТИЛИТАРНЫЕ ФУНКЦИИ ====================
export const formatTimeSlot = (date, timeString) => 
    new Date(`${format(date, 'yyyy-MM-dd')}T${timeString}:00`);

export const calculateDuration = (startTime, endTime) => 
    Math.ceil((endTime - startTime) / (1000 * 60));

export const calculateSlotsCount = (duration) => 
    Math.ceil(duration / SLOT_DURATION);

// Функция для расчета оптимальности слота
export const calculateSlotOptimality = (slot, preferences, employeeWorkload) => {
    let score = 100; // Максимальный балл
    
    // 1. Штраф за удаленность от предпочитаемого времени
    if (preferences.timePreference !== 'any') {
        const timePrefs = TIME_PREFERENCES[preferences.timePreference];
        const slotTime = slot.start_time;
        
        if (slotTime < timePrefs.start || slotTime > timePrefs.end) {
            const distance = Math.min(
                Math.abs(parseInt(slotTime.replace(':', '')) - parseInt(timePrefs.start.replace(':', ''))),
                Math.abs(parseInt(slotTime.replace(':', '')) - parseInt(timePrefs.end.replace(':', '')))
            );
            score -= distance / 100 * 20; // Максимальный штраф 20 баллов
        }
    }
    
    // 2. Штраф за удаленность от текущей даты
    const daysDiff = differenceInDays(new Date(slot.date), new Date());
    score -= daysDiff * 2; // 2 балла за каждый день в будущем
    
    // 3. Бонус/штраф за загруженность мастера
    const employeeWorkloadData = employeeWorkload.find(w => 
        w.employee_id === slot.employee_id && w.period === slot.date
    );
    const workload = employeeWorkloadData ? employeeWorkloadData.workload_percent : 50;
    
    if (workload < 30) score += 15; // Бонус за низкую загрузку
    else if (workload > 80) score -= 15; // Штраф за высокую загрузку
    
    // 4. Бонус за предпочитаемого мастера
    if (preferences.preferredEmployeeId && slot.employee_id === preferences.preferredEmployeeId) {
        score += 25;
    }
    
    return Math.max(0, Math.min(100, score));
};

// Функция для расчета изменения загруженности
export const calculateWorkloadChange = (currentWorkload, serviceDuration) => {
    // Предполагаем 8-часовой рабочий день (480 минут)
    const dailyWorkMinutes = 480;
    const additionalPercent = (serviceDuration / dailyWorkMinutes) * 100;
    return currentWorkload + additionalPercent;
};
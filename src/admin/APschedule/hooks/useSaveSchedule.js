import { format, isSameDay } from 'date-fns';
import { 
    saveSchedule, 
    createException, 
    updateException, 
    deleteException,
    fetchScheduleExceptions 
} from '../services/api';

export const useSaveSchedule = (schedules, showSnackbar) => {
    
    const saveTimeDialog = async (timeDialog, onSuccess) => {
        const { employeeId, date, startTime, endTime, isEdit, exceptions } = timeDialog;
        
        if (!employeeId || !date || !startTime || !endTime) {
            showSnackbar('Не все поля заполнены', 'error');
            return;
        }
        
        const scheduleData = {
            employee_id: employeeId,
            date: format(date, 'yyyy-MM-dd'),
            start_time: format(startTime, 'HH:mm:ss'),
            end_time: format(endTime, 'HH:mm:ss')
        };
        
        try {
            let scheduleId;
            
            if (isEdit) {
                // Если редактируем, находим ID записи
                const scheduleToEdit = schedules.find(s => 
                    s.employee_id === employeeId && 
                    isSameDay(new Date(s.date), date)
                );
                
                if (!scheduleToEdit) {
                    showSnackbar('Запись не найдена', 'error');
                    return;
                }
                
                await saveSchedule(scheduleData, scheduleToEdit.id);
                scheduleId = scheduleToEdit.id;
            } else {
                // Если добавляем новую запись
                const newSchedule = await saveSchedule(scheduleData);
                scheduleId = newSchedule.id;
            }
            
            // Обрабатываем исключения
            await processExceptions(scheduleId, exceptions);
            
            showSnackbar(
                isEdit ? 'Рабочее время обновлено' : 'Рабочий день добавлен', 
                'success'
            );
            
            if (onSuccess) onSuccess();
            
        } catch (error) {
            showSnackbar(error.message || 'Ошибка при сохранении', 'error');
        }
    };
    
    const processExceptions = async (scheduleId, newExceptions) => {
        try {
            // Получаем текущие исключения для этого расписания
            const allExceptions = await fetchScheduleExceptions();
            const currentExceptions = allExceptions.filter(exc => exc.schedule_id === scheduleId);
            
            // Удаляем исключения, которых нет в новом списке
            for (const exc of currentExceptions) {
                const stillExists = newExceptions.some(e => e.id === exc.id);
                if (!stillExists) {
                    await deleteException(exc.id);
                }
            }
            
            // Добавляем или обновляем исключения
            for (const exception of newExceptions) {
                const exceptionData = {
                    schedule_id: scheduleId,
                    start_time: format(exception.startTime, 'HH:mm:ss'),
                    end_time: format(exception.endTime, 'HH:mm:ss'),
                    reason: exception.reason
                };
                
                if (exception.id) {
                    // Обновляем существующее исключение
                    await updateException(exception.id, exceptionData);
                } else {
                    // Создаем новое исключение
                    await createException(exceptionData);
                }
            }
        } catch (error) {
            throw new Error('Ошибка при обработке исключений');
        }
    };
    
    return {
        saveTimeDialog
    };
};
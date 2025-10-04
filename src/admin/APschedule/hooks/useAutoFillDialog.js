import { useState } from 'react';
import { INITIAL_AUTO_FILL_DIALOG } from '../utils/constants';
import { generateScheduleByFormula } from '../utils/scheduleGenerator';
import { bulkCreateSchedules } from '../services/api';

export const useAutoFillDialog = (
    schedules, 
    selectedEmployees, 
    workHours, 
    showSnackbar
) => {
    const [autoFillDialog, setAutoFillDialog] = useState(INITIAL_AUTO_FILL_DIALOG);

    // Открытие диалога
    const openDialog = () => {
        setAutoFillDialog({
            open: true,
            startDate: new Date(),
            endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            formula: '1/1',
            employees: selectedEmployees.length > 0 ? selectedEmployees : [],
            selectedRange: false,
            workHours: {
                start_time: workHours.start_time,
                end_time: workHours.end_time
            }
        });
    };

    // Закрытие диалога
    const closeDialog = () => {
        setAutoFillDialog(INITIAL_AUTO_FILL_DIALOG);
    };

    // Обработка изменений полей
    const handleChange = (name, value) => {
        setAutoFillDialog(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Обработка выбора диапазона дат
    const handleDateRangeSelect = (date) => {
        if (!autoFillDialog.selectedRange) {
            // Устанавливаем начальную дату
            setAutoFillDialog(prev => ({
                ...prev,
                startDate: date,
                endDate: date,
                selectedRange: true
            }));
        } else {
            // Устанавливаем конечную дату
            const endDate = date < autoFillDialog.startDate ? autoFillDialog.startDate : date;
            setAutoFillDialog(prev => ({
                ...prev,
                endDate: endDate,
                selectedRange: false
            }));
        }
    };

    // Сохранение автозаполненного графика
    const saveAutoFill = async (onSuccess) => {
        const { formula, startDate, endDate, employees, workHours: customWorkHours } = autoFillDialog;

        if (employees.length === 0) {
            showSnackbar('Выберите хотя бы одного сотрудника', 'warning');
            return;
        }

        // Генерируем график по формуле
        const generatedSchedules = generateScheduleByFormula(
            formula, 
            startDate, 
            endDate, 
            employees, 
            customWorkHours,
            schedules
        );

        if (generatedSchedules.length === 0) {
            showSnackbar('Нет новых дат для добавления в график', 'info');
            closeDialog();
            return;
        }

        try {
            await bulkCreateSchedules(generatedSchedules);
            showSnackbar(
                `Успешно добавлено ${generatedSchedules.length} рабочих дней`, 
                'success'
            );
            closeDialog();
            if (onSuccess) onSuccess();
        } catch (error) {
            showSnackbar(error.message || 'Ошибка при сохранении графика', 'error');
        }
    };

    return {
        autoFillDialog,
        openDialog,
        closeDialog,
        handleChange,
        handleDateRangeSelect,
        saveAutoFill
    };
};
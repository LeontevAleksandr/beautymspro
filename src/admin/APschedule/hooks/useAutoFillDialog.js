import { useState } from 'react';
import { INITIAL_AUTO_FILL_DIALOG } from '../utils/constants';
import { generateScheduleByFormula, generateScheduleByWeekdays } from '../utils/scheduleGenerator';
import { bulkCreateSchedules } from '../services/api';

export const useAutoFillDialog = (
    schedules, 
    selectedEmployees, 
    workHours, 
    showSnackbar
) => {
    const [autoFillDialog, setAutoFillDialog] = useState({
        ...INITIAL_AUTO_FILL_DIALOG,
        useCustom: false,
        selectedDays: [1, 2, 3, 4, 5]
    });

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
            },
            useCustom: false,
            selectedDays: [1, 2, 3, 4, 5]
        });
    };

    const closeDialog = () => {
        setAutoFillDialog({
            ...INITIAL_AUTO_FILL_DIALOG,
            useCustom: false,
            selectedDays: [1, 2, 3, 4, 5]
        });
    };

    const handleChange = (name, value) => {
        setAutoFillDialog(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleToggleMode = (useCustom) => {
        setAutoFillDialog(prev => ({
            ...prev,
            useCustom
        }));
    };

    const handleToggleDays = (dayId) => {
        setAutoFillDialog(prev => ({
            ...prev,
            selectedDays: prev.selectedDays.includes(dayId)
                ? prev.selectedDays.filter(id => id !== dayId)
                : [...prev.selectedDays, dayId]
        }));
    };

    const handleDateRangeSelect = (date) => {
        if (!autoFillDialog.selectedRange) {
            setAutoFillDialog(prev => ({
                ...prev,
                startDate: date,
                endDate: date,
                selectedRange: true
            }));
        } else {
            const endDate = date < autoFillDialog.startDate ? autoFillDialog.startDate : date;
            setAutoFillDialog(prev => ({
                ...prev,
                endDate: endDate,
                selectedRange: false
            }));
        }
    };

    const saveAutoFill = async (onSuccess) => {
        const { formula, startDate, endDate, employees, workHours: customWorkHours, useCustom, selectedDays } = autoFillDialog;

        if (employees.length === 0) {
            showSnackbar('Выберите хотя бы одного сотрудника', 'warning');
            return;
        }

        if (useCustom && selectedDays.length === 0) {
            showSnackbar('Выберите хотя бы один день недели', 'warning');
            return;
        }

        const generatedSchedules = useCustom
            ? generateScheduleByWeekdays(startDate, endDate, employees, customWorkHours, selectedDays, schedules)
            : generateScheduleByFormula(formula, startDate, endDate, employees, customWorkHours, schedules);

        if (generatedSchedules.length === 0) {
            showSnackbar('Нет новых дат для добавления в график', 'info');
            closeDialog();
            return;
        }

        try {
            await bulkCreateSchedules(generatedSchedules);
            showSnackbar(`Успешно добавлено ${generatedSchedules.length} рабочих дней`, 'success');
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
        handleToggleMode,
        handleToggleDays,
        handleDateRangeSelect,
        saveAutoFill
    };
};
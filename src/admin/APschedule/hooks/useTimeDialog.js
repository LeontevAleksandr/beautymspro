import { useState } from 'react';
import { INITIAL_TIME_DIALOG } from '../utils/constants';
import { parseScheduleTimes } from '../utils/helpers';

export const useTimeDialog = (getSchedule, loadExceptionsBySchedule) => {
    const [timeDialog, setTimeDialog] = useState(INITIAL_TIME_DIALOG);

    const openDialog = async (employeeId, date, isEdit = false) => {
        const schedule = getSchedule(date, employeeId);
        
        let startTime = new Date(new Date().setHours(9, 0, 0));
        let endTime = new Date(new Date().setHours(18, 0, 0));
        let exceptions = [];
        
        if (isEdit && schedule) {
            const times = parseScheduleTimes(schedule);
            startTime = times.startTime;
            endTime = times.endTime;
            
            // Загружаем исключения для данного расписания
            exceptions = await loadExceptionsBySchedule(schedule.id);
        }
        
        setTimeDialog({
            open: true,
            employeeId,
            date,
            startTime,
            endTime,
            isEdit,
            exceptions
        });
    };

    const closeDialog = () => {
        setTimeDialog(INITIAL_TIME_DIALOG);
    };

    const addException = (exception) => {
        setTimeDialog(prev => ({
            ...prev,
            exceptions: [...prev.exceptions, { ...exception, id: null }]
        }));
    };

    const deleteException = (index) => {
        setTimeDialog(prev => ({
            ...prev,
            exceptions: prev.exceptions.filter((_, i) => i !== index)
        }));
    };

    const updateDialogField = (field, value) => {
        setTimeDialog(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return {
        timeDialog,
        openDialog,
        closeDialog,
        addException,
        deleteException,
        updateDialogField
    };
};
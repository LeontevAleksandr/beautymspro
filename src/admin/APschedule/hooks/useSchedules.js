import { useState, useEffect } from 'react';
import { isSameDay } from 'date-fns';
import { 
    fetchSchedules as apiFetchSchedules, 
    deleteSchedule as apiDeleteSchedule 
} from '../services/api';
import { getScheduleForDay } from '../utils/helpers';

export const useSchedules = (showSnackbar) => {
    const [schedules, setSchedules] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSchedules();
    }, []);

    const loadSchedules = async () => {
        setLoading(true);
        try {
            const data = await apiFetchSchedules();
            setSchedules(data);
        } catch (error) {
            showSnackbar(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const deleteWorkingDay = async (employeeId, date, onSuccess) => {
        const scheduleToDelete = getScheduleForDay(schedules, date, employeeId);

        if (!scheduleToDelete) {
            showSnackbar('Запись не найдена', 'error');
            return;
        }

        try {
            await apiDeleteSchedule(scheduleToDelete.id);
            showSnackbar('Рабочий день успешно удален', 'success');
            await loadSchedules();
            if (onSuccess) onSuccess();
        } catch (error) {
            showSnackbar(error.message, 'error');
        }
    };

    const getSchedule = (date, employeeId) => {
        return getScheduleForDay(schedules, date, employeeId);
    };

    return {
        schedules,
        currentDate,
        setCurrentDate,
        loading,
        loadSchedules,
        deleteWorkingDay,
        getSchedule
    };
};
import { useState, useEffect } from 'react';
import { 
    fetchScheduleExceptions as apiFetchExceptions,
    fetchExceptionsByScheduleId 
} from '../services/api';
import { formatExceptionsForUI, validateException } from '../utils/helpers';
import { INITIAL_EXCEPTION } from '../utils/constants';

export const useScheduleExceptions = (showSnackbar) => {
    const [scheduleExceptions, setScheduleExceptions] = useState([]);
    const [newException, setNewException] = useState(INITIAL_EXCEPTION);

    useEffect(() => {
        loadAllExceptions();
    }, []);

    const loadAllExceptions = async () => {
        try {
            const data = await apiFetchExceptions();
            setScheduleExceptions(data);
        } catch (error) {
            showSnackbar(error.message, 'error');
        }
    };

    const loadExceptionsBySchedule = async (scheduleId) => {
        try {
            const data = await fetchExceptionsByScheduleId(scheduleId);
            return formatExceptionsForUI(data);
        } catch (error) {
            showSnackbar(error.message, 'error');
            return [];
        }
    };

    const handleExceptionChange = (field, value) => {
        setNewException(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const resetNewException = () => {
        setNewException(INITIAL_EXCEPTION);
    };

    const validateNewException = (workDayStart, workDayEnd, existingExceptions) => {
        return validateException(newException, workDayStart, workDayEnd, existingExceptions);
    };

    return {
        scheduleExceptions,
        newException,
        loadAllExceptions,
        loadExceptionsBySchedule,
        handleExceptionChange,
        resetNewException,
        validateNewException
    };
};
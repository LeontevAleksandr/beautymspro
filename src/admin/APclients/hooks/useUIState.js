// Хук для управления состоянием UI

import { useState } from 'react';
import { INITIAL_SNACKBAR } from '../utils/constants';

export const useUIState = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [snackbar, setSnackbar] = useState(INITIAL_SNACKBAR);

    // Функция показа уведомления
    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };

    // Функция закрытия уведомления
    const handleCloseSnackbar = () => {
        setSnackbar({
            ...snackbar,
            open: false
        });
    };

    // Обработчик смены вкладки
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    return {
        activeTab,
        snackbar,
        setActiveTab,
        showSnackbar,
        handleCloseSnackbar,
        handleTabChange
    };
};
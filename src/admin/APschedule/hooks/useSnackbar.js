import { useState } from 'react';
import { INITIAL_SNACKBAR } from '../utils/constants';

export const useSnackbar = () => {
    const [snackbar, setSnackbar] = useState(INITIAL_SNACKBAR);

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };

    const handleClose = () => {
        setSnackbar({
            ...snackbar,
            open: false
        });
    };

    return {
        snackbar,
        showSnackbar,
        handleClose
    };
};
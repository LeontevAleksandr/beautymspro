import { INITIAL_RECORD_STATE } from './constants.js';

// ==================== UI УТИЛИТЫ ====================
export const createShowSnackbar = (setSnackbar) => {
    return (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };
};

export const createResetForm = ({
    setNewRecord,
    setServerError,
    setConflictDetails,
    setEditMode,
    setCurrentAppointment,
    setAvailableEmployees,
    setServicePrice,
    setAddNewClient,
    setNewClient
}) => {
    return () => {
        setNewRecord(INITIAL_RECORD_STATE);
        setServerError(null);
        setConflictDetails(null);
        setEditMode(false);
        setCurrentAppointment(null);
        setAvailableEmployees([]);
        setServicePrice(null);
        setAddNewClient(false);
        setNewClient({ full_name: '', phone: '', email: '' });
    };
};
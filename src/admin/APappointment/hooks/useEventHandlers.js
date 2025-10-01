import { useCallback } from 'react';
import { getAppointmentForSlot, isEmployeeWorking } from '../utils/scheduleHelpers';

// ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================
export const useEventHandlers = ({
    setAppointmentToDelete,
    setOpenDeleteDialog,
    handleEditAppointment,
    handleAddClick,
    schedules,
    scheduleExceptions,
    selectedDate,
    appointments,
    services
}) => {
    const handleDeleteAppointment = useCallback((appointment, e) => {
        e.preventDefault();
        e.stopPropagation();
        setAppointmentToDelete(appointment);
        setOpenDeleteDialog(true);
    }, [setAppointmentToDelete, setOpenDeleteDialog]);

    const handleCellClick = useCallback((employeeId, timeSlot) => {
        const isWorking = isEmployeeWorking(employeeId, timeSlot, schedules, scheduleExceptions, selectedDate);
        if (!isWorking) return;
        
        const existingAppointment = getAppointmentForSlot(employeeId, timeSlot, appointments, services, selectedDate);
        if (existingAppointment) {
            handleEditAppointment(existingAppointment);
            return;
        }
        
        handleAddClick(employeeId, timeSlot);
    }, [schedules, scheduleExceptions, selectedDate, appointments, services, handleEditAppointment, handleAddClick]);

    return {
        handleDeleteAppointment,
        handleCellClick
    };
};
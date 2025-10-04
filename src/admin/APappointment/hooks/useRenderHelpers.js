import { useCallback } from 'react';
import { AppointmentCell } from '../components/AppointmentCell.js';

// ==================== ХУКИ ДЛЯ РЕНДЕРИНГА ====================
export const useRenderHelpers = ({
    appointments,
    services,
    clients,
    notifications,
    schedules,
    scheduleExceptions,
    selectedDate,
    hoveredCell,
    setHoveredCell,
    handleCellClick,
    handleAddClick,
    handleEditAppointment,
    handleDeleteAppointment,
    handleResizeStart
}) => {
    const renderAppointmentCell = useCallback((employeeId, timeSlot) => {
        return (
            <AppointmentCell
                key={`${employeeId}-${timeSlot}`}
                employeeId={employeeId}
                timeSlot={timeSlot}
                appointments={appointments}
                services={services}
                clients={clients}
                notifications={notifications}
                schedules={schedules}
                scheduleExceptions={scheduleExceptions}
                selectedDate={selectedDate}
                hoveredCell={hoveredCell}
                setHoveredCell={setHoveredCell}
                onCellClick={handleCellClick}
                onAddClick={handleAddClick}
                onEditAppointment={handleEditAppointment}
                onDeleteAppointment={handleDeleteAppointment}
                onResizeStart={handleResizeStart}
            />
        );
    }, [
        appointments,
        services,
        clients,
        notifications,
        schedules,
        scheduleExceptions,
        selectedDate,
        hoveredCell,
        setHoveredCell,
        handleCellClick,
        handleAddClick,
        handleEditAppointment,
        handleDeleteAppointment,
        handleResizeStart
    ]);

    return {
        renderAppointmentCell
    };
};
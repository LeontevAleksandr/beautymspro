import { useCallback } from 'react';
import { format } from 'date-fns';
import { createNotification } from '../services/notificationApi.js';
import { formatTimeSlot } from '../utils/dateHelpers.js';
import { INITIAL_RECORD_STATE } from '../utils/constants.js';

// ==================== CRUD ОБРАБОТЧИКИ ====================
export const useCrudHandlers = ({
    selectedDate,
    newRecord,
    editMode,
    currentAppointment,
    appointmentToDelete,
    newClient,
    employees,
    services,
    appointments,
    setNewRecord,
    setEditMode,
    setCurrentAppointment,
    setOpenDialog,
    setAvailableEmployees,
    setServicePrice,
    setServerError,
    setConflictDetails,
    setAppointments,
    setOpenDeleteDialog,
    setAppointmentToDelete,
    setAddNewClient,
    setNewClient,
    setClients,
    fetchAppointmentsForDate,
    fetchNotifications,
    showSnackbar,
    resetForm
}) => {
    // ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================
    const handleAddClick = useCallback((employeeId, timeSlot) => {
        const newAppointmentDateTime = formatTimeSlot(selectedDate, timeSlot);
        
        // Находим выбранного мастера
        const selectedEmployee = employees.find(emp => emp.id === employeeId);
        
        setNewRecord({
            ...INITIAL_RECORD_STATE,
            employee_id: employeeId,
            date: format(newAppointmentDateTime, 'yyyy-MM-dd'),
            time: format(newAppointmentDateTime, 'HH:mm'),
        });
        
        // Устанавливаем выбранного мастера в доступные
        if (selectedEmployee) {
            setAvailableEmployees([selectedEmployee]);
        }
        
        setEditMode(false);
        setOpenDialog(true);
    }, [selectedDate, employees, setNewRecord, setAvailableEmployees, setEditMode, setOpenDialog]);

    const handleEditAppointment = useCallback((appointment) => {
        setEditMode(true);
        setCurrentAppointment(appointment);
        
        const appointmentDate = new Date(appointment.datetime);
        
        setNewRecord({
            id: appointment.id,
            client_id: appointment.client_id,
            service_id: appointment.service_id,
            employee_id: appointment.employee_id,
            date: format(appointmentDate, 'yyyy-MM-dd'),
            time: format(appointmentDate, 'HH:mm'),
            status: appointment.status,
            is_completed: appointment.is_completed,
            is_paid: appointment.is_paid,
            notes: appointment.notes || '',
            custom_duration: appointment.custom_duration || '',
            final_price: appointment.final_price || '',
            reminder_time: '' // Не показываем напоминания при редактировании
        });
        
        const selectedEmployee = employees.find(emp => emp.id === appointment.employee_id);
        if (selectedEmployee) {
            setAvailableEmployees([selectedEmployee]);
        }
        
        const service = services.find(s => s.id === appointment.service_id);
        if (service) {
            setServicePrice(appointment.final_price || service.base_price);
        }
        
        setOpenDialog(true);
    }, [employees, services, setEditMode, setCurrentAppointment, setNewRecord, setAvailableEmployees, setServicePrice, setOpenDialog]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        
        // Очищаем предыдущие ошибки
        setServerError(null);
        setConflictDetails(null);
        
        if (!newRecord.client_id || !newRecord.service_id || !newRecord.employee_id || !newRecord.date || !newRecord.time) {
            setServerError('Пожалуйста, заполните все обязательные поля');
            return;
        }
        
        const appointmentData = {
            client_id: newRecord.client_id,
            service_id: newRecord.service_id,
            employee_id: newRecord.employee_id,
            datetime: `${newRecord.date}T${newRecord.time}:00`,
            status: newRecord.status,
            is_completed: newRecord.is_completed,
            is_paid: newRecord.is_paid,
            notes: newRecord.notes || '',
            custom_duration: newRecord.custom_duration ? parseInt(newRecord.custom_duration) : null,
            final_price: newRecord.final_price ? parseFloat(newRecord.final_price) : null
        };
        
        const url = editMode 
            ? `http://localhost:5000/api/appointments/${currentAppointment.id}` 
            : 'http://localhost:5000/api/appointments';
        const method = editMode ? 'PUT' : 'POST';
        
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appointmentData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                // Улучшенная обработка различных типов ошибок от бэкенда
                setServerError(data.error || `Ошибка ${response.status}: ${response.statusText}`);
                
                // Если бэкенд вернул информацию о конфликтной записи, отображаем её
                if (response.status === 409 && data.conflict_appointment_id) {
                    try {
                        const conflictResponse = await fetch(`http://localhost:5000/api/appointments/${data.conflict_appointment_id}`);
                        if (conflictResponse.ok) {
                            const conflictData = await conflictResponse.json();
                            setConflictDetails(conflictData);
                        }
                    } catch (conflictError) {
                        console.error('Ошибка при загрузке данных о конфликтной записи:', conflictError);
                    }
                }
                return;
            }
            
            // Успешное создание/обновление
            const createdAppointment = data;
            
            // Создаем напоминание, если выбрано
            if (!editMode && newRecord.reminder_time && createdAppointment.id) {
                await createNotification(
                    createdAppointment.id, 
                    appointmentData.datetime, 
                    parseInt(newRecord.reminder_time)
                );
            }
            
            setOpenDialog(false);
            fetchAppointmentsForDate(selectedDate);
            fetchNotifications(); // Перезагружаем уведомления
            showSnackbar(editMode ? 'Запись успешно обновлена' : 'Запись успешно создана', 'success');
            resetForm();
        } catch (error) {
            console.error('Ошибка при создании/обновлении записи:', error);
            setServerError('Произошла ошибка при взаимодействии с сервером');
        }
    }, [newRecord, editMode, currentAppointment, selectedDate, setServerError, setConflictDetails, setOpenDialog, fetchAppointmentsForDate, fetchNotifications, showSnackbar, resetForm]);

    const handleAddClient = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:5000/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newClient)
            });
            
            if (response.ok) {
                const created = await response.json();
                setClients(prev => [...prev, created]);
                setNewRecord(prev => ({ ...prev, client_id: created.id }));
                setAddNewClient(false);
                setNewClient({ full_name: '', phone: '', email: '' });
                showSnackbar('Клиент успешно добавлен', 'success');
            } else {
                showSnackbar('Ошибка при создании клиента', 'error');
            }
        } catch (error) {
            console.error('Ошибка при создании клиента:', error);
            showSnackbar('Ошибка при создании клиента', 'error');
        }
    }, [newClient, setClients, setNewRecord, setAddNewClient, setNewClient, showSnackbar]);

    const confirmDeleteAppointment = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/appointments/${appointmentToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                setAppointments(appointments.filter(app => app.id !== appointmentToDelete.id));
                setOpenDeleteDialog(false);
                setAppointmentToDelete(null);
                fetchNotifications(); // Перезагружаем уведомления
                showSnackbar('Запись успешно удалена', 'success');
            } else {
                showSnackbar('Ошибка при удалении записи', 'error');
            }
        } catch (error) {
            console.error('Ошибка при удалении записи:', error);
            showSnackbar('Ошибка при удалении записи', 'error');
        }
    }, [appointmentToDelete, appointments, setAppointments, setOpenDeleteDialog, setAppointmentToDelete, fetchNotifications, showSnackbar]);

    return {
        handleAddClick,
        handleEditAppointment,
        handleSubmit,
        handleAddClient,
        confirmDeleteAppointment
    };
};
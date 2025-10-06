import React from 'react';
import { Box, Snackbar, Alert } from '@mui/material';

// Хуки
import { useAppointmentData } from './hooks/useAppointmentData.js';
import { useSmartSearch } from './hooks/useSmartSearch.js';
import { useEventHandlers } from './hooks/useEventHandlers.js';
import { useResizeHandler } from './hooks/useResizeHandler.js';
import { useFormHandlers } from './hooks/useFormHandlers.js';
import { useCrudHandlers } from './hooks/useCrudHandlers.js';
import { useRenderHelpers } from './hooks/useRenderHelpers.js';
import { useServiceFilter } from './hooks/useServiceFilter.js';

// Компоненты
import { AppointmentHeader } from './components/AppointmentHeader.js';
import { AppointmentTable } from './components/AppointmentTable.js';
import { AppointmentDialog } from './components/AppointmentDialog.js';
import { SmartSearchDialog } from './components/SmartSearchDialog.js';
import { SearchResults } from './components/SearchResults.js';
import { DeleteDialog } from './components/DeleteDialog.js';

// Утилиты
import { INITIAL_SMART_SEARCH } from './utils/constants.js';

// ==================== ГЛАВНЫЙ КОМПОНЕНТ ====================
function APappointment({ records, clients, setClients, employees, services }) {
    
    // ==================== ОСНОВНЫЕ ДАННЫЕ ====================
    const {
        // Основные данные
        selectedDate,
        setSelectedDate,
        schedules,
        timeSlots,
        appointments,
        notifications,
        filteredEmployees,
        scheduleExceptions,
        clientsArray,
        servicesArray,

        // Состояния диалогов
        openDialog,
        setOpenDialog,
        openDeleteDialog,
        setOpenDeleteDialog,
        openSmartDialog,
        setOpenSmartDialog,
        editMode,
        setEditMode,

        // Состояния записей
        newRecord,
        setNewRecord,
        currentAppointment,
        setCurrentAppointment,
        appointmentToDelete,
        setAppointmentToDelete,

        // Состояния формы
        addNewClient,
        setAddNewClient,
        newClient,
        setNewClient,
        availableEmployees,
        setAvailableEmployees,
        serviceQualifications,
        qualificationsCache,
        servicePrice,
        setServicePrice,

        // Состояния умного поиска
        smartSearch,
        setSmartSearch,
        smartResults,
        setSmartResults,
        employeeWorkload,
        setEmployeeWorkload,
        isSearching,
        setIsSearching,
        selectedSlot,
        setSelectedSlot,

        // Состояния UI
        hoveredCell,
        setHoveredCell,
        snackbar,
        setSnackbar,
        serverError,
        setServerError,
        conflictDetails,
        setConflictDetails,

        // Функции загрузки
        loadAppointmentsForDate,
        loadNotifications,
        loadServiceQualifications,
        showSnackbar,
        resetForm
    } = useAppointmentData(employees, clients, services);

    // ==================== ХУКИ УМНОГО ПОИСКА ====================
    const { performSmartSearch, handleSlotSelect } = useSmartSearch({
        smartSearch,
        services,
        employees,
        setEmployeeWorkload,
        setServerError,
        setIsSearching,
        setSmartResults,
        setSelectedSlot,
        setNewRecord,
        setAvailableEmployees,
        setServicePrice,
        setOpenSmartDialog,
        showSnackbar
    });

    const resetSmartSearch = () => {
        setSmartSearch(INITIAL_SMART_SEARCH);
        setSmartResults([]);
        setEmployeeWorkload([]);
        setSelectedSlot(null);
        setServerError(null);
    };

    // ==================== CRUD ХУКИ ====================
    const {
        handleAddClick,
        handleEditAppointment,
        handleSubmit,
        handleAddClient,
        confirmDeleteAppointment
    } = useCrudHandlers({
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
        setAppointments: () => {}, // Обновляется через loadAppointmentsForDate
        setOpenDeleteDialog,
        setAppointmentToDelete,
        setAddNewClient,
        setNewClient,
        setClients,
        fetchAppointmentsForDate: loadAppointmentsForDate,
        fetchNotifications: loadNotifications,
        showSnackbar,
        resetForm
    });

    // ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================
    const { handleDeleteAppointment, handleCellClick } = useEventHandlers({
        setAppointmentToDelete,
        setOpenDeleteDialog,
        handleEditAppointment,
        handleAddClick,
        schedules,
        scheduleExceptions,
        selectedDate,
        appointments,
        services
    });

    // ==================== ОБРАБОТЧИКИ ИЗМЕНЕНИЯ РАЗМЕРА ====================
    const { handleResizeStart } = useResizeHandler({
        services,
        fetchAppointmentsForDate: loadAppointmentsForDate,
        selectedDate,
        showSnackbar
    });

    // ==================== ОБРАБОТЧИКИ ФОРМ ====================
    const { updateAvailableEmployees, updateServicePrice } = useFormHandlers({
        services,
        employees,
        serviceQualifications,
        qualificationsCache,
        newRecord,
        setAvailableEmployees,
        setServicePrice,
        setNewRecord,
        showSnackbar,
        loadServiceQualifications // ИСПРАВЛЕНО: передаем функцию
    });

    // ==================== ФИЛЬТРАЦИЯ УСЛУГ ПО МАСТЕРУ ====================
    const filteredServices = useServiceFilter(services, employees, newRecord, serviceQualifications);

    // ==================== РЕНДЕР ХЕЛПЕРЫ ====================
    const { renderAppointmentCell } = useRenderHelpers({
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
    });

    // ==================== ОСНОВНОЙ РЕНДЕР ====================
    return (
        <Box sx={{ p: 2, backgroundColor: '#fafafa', minHeight: '100vh' }}>
            {/* Заголовок и панель управления */}
            <AppointmentHeader
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                setOpenDialog={setOpenDialog}
                setNewRecord={setNewRecord}
            />
            
            {/* Таблица расписания */}
            <AppointmentTable
                filteredEmployees={filteredEmployees}
                timeSlots={timeSlots}
                renderAppointmentCell={renderAppointmentCell}
            />
            
            {/* Диалог создания/редактирования записи */}
            <AppointmentDialog
                // Состояния диалога
                openDialog={openDialog}
                setOpenDialog={setOpenDialog}
                editMode={editMode}
                resetForm={resetForm}
                resetSmartSearch={resetSmartSearch}
                setOpenSmartDialog={setOpenSmartDialog}
                handleSubmit={handleSubmit}
                handleAddClient={handleAddClient}
                
                // Данные
                clientsArray={clientsArray}
                servicesArray={servicesArray}
                filteredServices={filteredServices}
                availableEmployees={availableEmployees}
                appointments={appointments}
                newRecord={newRecord}
                setNewRecord={setNewRecord}
                addNewClient={addNewClient}
                setAddNewClient={setAddNewClient}
                newClient={newClient}
                setNewClient={setNewClient}
                servicePrice={servicePrice}
                
                // Обработчики
                updateAvailableEmployees={updateAvailableEmployees}
                updateServicePrice={updateServicePrice}
                
                // Ошибки
                serverError={serverError}
                conflictDetails={conflictDetails}
            />

            {/* Диалог умного поиска */}
            <SmartSearchDialog
                // Состояния диалога
                openSmartDialog={openSmartDialog}
                setOpenSmartDialog={setOpenSmartDialog}
                resetSmartSearch={resetSmartSearch}
                
                // Данные поиска
                smartSearch={smartSearch}
                setSmartSearch={setSmartSearch}
                smartResults={smartResults}
                isSearching={isSearching}
                serverError={serverError}
                
                // Данные для селектов
                servicesArray={servicesArray}
                employees={employees}
                
                // Обработчики
                performSmartSearch={performSmartSearch}
                handleSlotSelect={handleSlotSelect}
            >
                {/* Результаты поиска */}
                <SearchResults
                    smartResults={smartResults}
                    isSearching={isSearching}
                    smartSearch={smartSearch}
                    employeeWorkload={employeeWorkload}
                    handleSlotSelect={handleSlotSelect}
                />
            </SmartSearchDialog>

            {/* Диалог удаления */}
            <DeleteDialog
                openDeleteDialog={openDeleteDialog}
                setOpenDeleteDialog={setOpenDeleteDialog}
                appointmentToDelete={appointmentToDelete}
                confirmDeleteAppointment={confirmDeleteAppointment}
                clientsArray={clientsArray}
                servicesArray={servicesArray}
            />

            {/* Snackbar уведомления */}
            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={4000} 
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert 
                    onClose={() => setSnackbar({ ...snackbar, open: false })} 
                    severity={snackbar.severity}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default APappointment;
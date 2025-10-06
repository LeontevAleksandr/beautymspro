import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import {
    fetchScheduleExceptions,
    fetchSchedulesForDate,
    fetchAppointmentsForDate,
    fetchNotifications,
    fetchServiceQualifications
} from '../services/api.js';
import { generateTimeSlots } from '../utils/scheduleHelpers.js';
import { createShowSnackbar, createResetForm } from '../utils/uiHelpers.js';
import { INITIAL_RECORD_STATE, INITIAL_SMART_SEARCH, TABLE_ROW_HEIGHT } from '../utils/constants.js';

export const useAppointmentData = (employees, clients, services) => {
    // ==================== СОСТОЯНИЯ ====================
    // Основные состояния
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [schedules, setSchedules] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [scheduleExceptions, setScheduleExceptions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Состояния диалогов
    const [openDialog, setOpenDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openSmartDialog, setOpenSmartDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    
    // Состояния записей
    const [newRecord, setNewRecord] = useState(INITIAL_RECORD_STATE);
    const [currentAppointment, setCurrentAppointment] = useState(null);
    const [appointmentToDelete, setAppointmentToDelete] = useState(null);
    
    // Состояния формы
    const [addNewClient, setAddNewClient] = useState(false);
    const [newClient, setNewClient] = useState({ full_name: '', phone: '', email: '' });
    const [availableEmployees, setAvailableEmployees] = useState(employees); // ИСПРАВЛЕНО: инициализация всеми
    const [serviceQualifications, setServiceQualifications] = useState([]);
    const [qualificationsCache, setQualificationsCache] = useState({});
    const [servicePrice, setServicePrice] = useState(null);
    
    // Состояния умного поиска
    const [smartSearch, setSmartSearch] = useState(INITIAL_SMART_SEARCH);
    const [smartResults, setSmartResults] = useState([]);
    const [employeeWorkload, setEmployeeWorkload] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    
    // Состояния UI и ошибок
    const [hoveredCell, setHoveredCell] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [serverError, setServerError] = useState(null);
    const [conflictDetails, setConflictDetails] = useState(null);

    // ==================== МЕМОИЗИРОВАННЫЕ ЗНАЧЕНИЯ ====================
    const clientsArray = useMemo(() => Array.isArray(clients) ? clients : [], [clients]);
    const servicesArray = useMemo(() => Array.isArray(services) ? services : [], [services]);

    // Создаем утилитарные функции
    const showSnackbar = useCallback(createShowSnackbar(setSnackbar), []);
    
    const resetForm = useCallback(createResetForm({
        setNewRecord,
        setServerError,
        setConflictDetails,
        setEditMode,
        setCurrentAppointment,
        setAvailableEmployees,
        setServicePrice,
        setAddNewClient,
        setNewClient
    }), []);

    // ==================== ФУНКЦИИ ЗАГРУЗКИ ДАННЫХ ====================
    const loadScheduleExceptions = useCallback(async () => {
        try {
            const data = await fetchScheduleExceptions();
            setScheduleExceptions(data);
        } catch (error) {
            console.error('Ошибка при загрузке исключений:', error);
        }
    }, []);

    const loadSchedulesForDate = useCallback(async (date) => {
        try {
            const data = await fetchSchedulesForDate(date);
            setSchedules(data);
            
            const workingEmployeeIds = data.map(s => s.employee_id);
            const workingEmployees = employees.filter(emp => 
                workingEmployeeIds.includes(emp.id)
            );
            setFilteredEmployees(workingEmployees);
            
            // Генерируем временные слоты
            const slots = generateTimeSlots(data, selectedDate);
            setTimeSlots(slots);
        } catch (error) {
            console.error('Ошибка при загрузке расписаний:', error);
        }
    }, [employees]);

    const loadAppointmentsForDate = useCallback(async (date) => {
        try {
            const data = await fetchAppointmentsForDate(date);
            setAppointments(data);
            
            if (data.length > 0) {
                loadNotifications();
            }
        } catch (error) {
            console.error('Ошибка при загрузке записей:', error);
        }
    }, []);

    const loadNotifications = useCallback(async () => {
        try {
            const data = await fetchNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Ошибка при загрузке уведомлений:', error);
        }
    }, []);

    const loadServiceQualifications = useCallback(async (serviceId) => {
        // ДОБАВЛЕНО: Проверяем кэш
        if (qualificationsCache[serviceId]) {
            setServiceQualifications(qualificationsCache[serviceId]);
            return qualificationsCache[serviceId];
        }

        try {
            const data = await fetchServiceQualifications(serviceId);
            setServiceQualifications(data);
            // ДОБАВЛЕНО: Сохраняем в кэш
            setQualificationsCache(prev => ({ ...prev, [serviceId]: data }));
            return data;
        } catch (error) {
            console.error('Ошибка при получении квалификаций услуги:', error);
            return [];
        }
    }, [qualificationsCache]);

    // Добавляем функцию генерации временных слотов
    const generateTimeSlotsForDate = useCallback((schedules) => {
        const slots = generateTimeSlots(schedules, selectedDate);
        setTimeSlots(slots);
    }, [selectedDate]);

    // ==================== ЭФФЕКТЫ ====================
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    loadSchedulesForDate(selectedDate),
                    loadAppointmentsForDate(selectedDate),
                    loadScheduleExceptions(),
                    loadNotifications()
                ]);
            } finally {
                setLoading(false);
            }
        };
        
        loadInitialData();
    }, [selectedDate, loadSchedulesForDate, loadAppointmentsForDate, loadScheduleExceptions, loadNotifications]);

    // Пересчитываем размеры блоков после загрузки записей
    useEffect(() => {
        if (appointments.length > 0) {
            setTimeout(() => {
                const appointmentBlocks = document.querySelectorAll('[data-appointment-id]');
                appointmentBlocks.forEach(block => {
                    const tableRow = block.closest('tr');
                    if (tableRow) {
                        const realRowHeight = tableRow.getBoundingClientRect().height;
                        if (realRowHeight > 0) {
                            const currentHeight = parseInt(block.style.height || block.offsetHeight);
                            const currentSlots = Math.round(currentHeight / TABLE_ROW_HEIGHT);
                            const correctHeight = currentSlots * realRowHeight;
                            block.style.height = `${correctHeight}px`;
                        }
                    }
                });
            }, 50);
        }
    }, [appointments]);

    return {
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
        loading, // ДОБАВЛЕНО

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
        qualificationsCache, // ДОБАВЛЕНО: экспортируем кэш
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
        loadScheduleExceptions,
        loadSchedulesForDate,
        loadAppointmentsForDate,
        loadNotifications,
        loadServiceQualifications,
        generateTimeSlotsForDate,
        
        // Утилитарные функции
        showSnackbar,
        resetForm
    };
};
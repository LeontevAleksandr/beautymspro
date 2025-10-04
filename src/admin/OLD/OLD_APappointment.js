import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Box, Button, TextField, TableContainer, 
    Paper, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, 
    FormControl, InputLabel, Dialog, DialogActions, DialogContent, DialogTitle, 
    FormControlLabel, Checkbox, IconButton, Snackbar, Alert, Divider, Stack, 
    Chip, LinearProgress, Tooltip, Card, CardContent} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { format, addMinutes, isWithinInterval, addDays, differenceInDays } from 'date-fns';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import TodayIcon from '@mui/icons-material/Today';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import StarIcon from '@mui/icons-material/Star';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import ErrorIcon from '@mui/icons-material/Error';

// ==================== КОНСТАНТЫ ====================
const STATUS_COLORS = {
    created: '#f8f9fa',
    confirmed: '#e8f5e9', 
    cancelled: '#ffebee',
    completed: '#e3f2fd'
};

const STATUS_LABELS = {
    created: 'Создана',
    confirmed: 'Подтверждена', 
    completed: 'Завершена',
    cancelled: 'Отменена'
};

const TIME_PREFERENCES = {
    morning: { label: 'Утро (8:00-12:00)', start: '08:00', end: '12:00' },
    afternoon: { label: 'День (12:00-16:00)', start: '12:00', end: '16:00' },
    evening: { label: 'Вечер (16:00-20:00)', start: '16:00', end: '20:00' },
    any: { label: 'Любое время', start: '00:00', end: '23:59' }
};

const REMINDER_OPTIONS = {
    '': 'Не напоминать',
    '30': 'За 30 минут',
    '60': 'За 1 час',
    '120': 'За 2 часа',
    '1440': 'За 1 день'
};

const SLOT_DURATION = 15; // минут
const RESIZE_HANDLE_HEIGHT = 12; // пикселей
const TABLE_ROW_HEIGHT = 40; // высота строки таблицы в пикселях

const INITIAL_RECORD_STATE = {
    client_id: '',
    service_id: '',
    employee_id: '',
    date: '',
    time: '',
    status: 'created',
    is_completed: false,
    is_paid: false,
    notes: '',
    custom_duration: '',
    final_price: '',
    reminder_time: ''
};

const INITIAL_SMART_SEARCH = {
    startDate: new Date(),
    endDate: addDays(new Date(), 7),
    serviceId: '',
    preferredEmployeeId: '',
    timePreference: 'any',
    maxResults: 10
};

// ==================== УТИЛИТАРНЫЕ ФУНКЦИИ ====================
const formatTimeSlot = (date, timeString) => 
    new Date(`${format(date, 'yyyy-MM-dd')}T${timeString}:00`);

const calculateDuration = (startTime, endTime) => 
    Math.ceil((endTime - startTime) / (1000 * 60));

const calculateSlotsCount = (duration) => 
    Math.ceil(duration / SLOT_DURATION);

// Функция для расчета оптимальности слота
const calculateSlotOptimality = (slot, preferences, employeeWorkload) => {
    let score = 100; // Максимальный балл
    
    // 1. Штраф за удаленность от предпочитаемого времени
    if (preferences.timePreference !== 'any') {
        const timePrefs = TIME_PREFERENCES[preferences.timePreference];
        const slotTime = slot.start_time;
        
        if (slotTime < timePrefs.start || slotTime > timePrefs.end) {
            const distance = Math.min(
                Math.abs(parseInt(slotTime.replace(':', '')) - parseInt(timePrefs.start.replace(':', ''))),
                Math.abs(parseInt(slotTime.replace(':', '')) - parseInt(timePrefs.end.replace(':', '')))
            );
            score -= distance / 100 * 20; // Максимальный штраф 20 баллов
        }
    }
    
    // 2. Штраф за удаленность от текущей даты
    const daysDiff = differenceInDays(new Date(slot.date), new Date());
    score -= daysDiff * 2; // 2 балла за каждый день в будущем
    
    // 3. Бонус/штраф за загруженность мастера
    const employeeWorkloadData = employeeWorkload.find(w => 
        w.employee_id === slot.employee_id && w.period === slot.date
    );
    const workload = employeeWorkloadData ? employeeWorkloadData.workload_percent : 50;
    
    if (workload < 30) score += 15; // Бонус за низкую загрузку
    else if (workload > 80) score -= 15; // Штраф за высокую загрузку
    
    // 4. Бонус за предпочитаемого мастера
    if (preferences.preferredEmployeeId && slot.employee_id === preferences.preferredEmployeeId) {
        score += 25;
    }
    
    return Math.max(0, Math.min(100, score));
};

// Функция для расчета изменения загруженности
const calculateWorkloadChange = (currentWorkload, serviceDuration) => {
    // Предполагаем 8-часовой рабочий день (480 минут)
    const dailyWorkMinutes = 480;
    const additionalPercent = (serviceDuration / dailyWorkMinutes) * 100;
    return currentWorkload + additionalPercent;
};

function APappointment({ records, clients, setClients, employees, services }) {
    
    // ==================== СОСТОЯНИЯ ====================
    // Основные состояния
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [schedules, setSchedules] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [scheduleExceptions, setScheduleExceptions] = useState([]);

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
    const [availableEmployees, setAvailableEmployees] = useState([]);
    const [serviceQualifications, setServiceQualifications] = useState([]);
    const [servicePrice, setServicePrice] = useState(null);
    
    // Состояния умного поиска
    const [smartSearch, setSmartSearch] = useState(INITIAL_SMART_SEARCH);
    const [smartResults, setSmartResults] = useState([]);
    const [employeeWorkload, setEmployeeWorkload] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    
    // Состояния UI и ошибок (для визуализации ответов от бэкенда)
    const [hoveredCell, setHoveredCell] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [serverError, setServerError] = useState(null);
    const [conflictDetails, setConflictDetails] = useState(null);
    
    // ==================== МЕМОИЗИРОВАННЫЕ ЗНАЧЕНИЯ ====================
    const clientsArray = useMemo(() => Array.isArray(clients) ? clients : [], [clients]);
    const servicesArray = useMemo(() => Array.isArray(services) ? services : [], [services]);

    // ==================== ЭФФЕКТЫ ====================
    useEffect(() => {
        fetchSchedulesForDate(selectedDate);
        fetchAppointmentsForDate(selectedDate);
        fetchScheduleExceptions();
        fetchNotifications();
    }, [selectedDate]);

    // ДОБАВЛЕНО: пересчитываем размеры блоков после загрузки записей
    useEffect(() => {
        if (appointments.length > 0) {
            // Небольшая задержка чтобы дать таблице отрендериться
            setTimeout(() => {
                const appointmentBlocks = document.querySelectorAll('[data-appointment-id]');
                appointmentBlocks.forEach(block => {
                    const tableRow = block.closest('tr');
                    if (tableRow) {
                        const realRowHeight = tableRow.getBoundingClientRect().height;
                        if (realRowHeight > 0) {
                            // Получаем количество слотов из текущей высоты
                            const currentHeight = parseInt(block.style.height || block.offsetHeight);
                            const currentSlots = Math.round(currentHeight / TABLE_ROW_HEIGHT);
                            const correctHeight = currentSlots * realRowHeight;
                            block.style.height = `${correctHeight}px`;
                        }
                    }
                });
            }, 50); // Увеличил задержку для надежности
        }
    }, [appointments]);

    // ==================== API ФУНКЦИИ ====================
    const fetchScheduleExceptions = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:5000/api/schedule_exceptions');
            if (response.ok) {
                const data = await response.json();
                setScheduleExceptions(data);
            }
        } catch (error) {
            console.error('Ошибка при загрузке исключений:', error);
        }
    }, []);

    const fetchSchedulesForDate = useCallback(async (date) => {
        try {
            const formattedDate = format(date, 'yyyy-MM-dd');
            const response = await fetch('http://localhost:5000/api/schedules');
            if (response.ok) {
                const data = await response.json();
                const filteredSchedules = data.filter(schedule => 
                    schedule.date === formattedDate
                );
                setSchedules(filteredSchedules);
                
                const workingEmployeeIds = filteredSchedules.map(s => s.employee_id);
                const workingEmployees = employees.filter(emp => 
                    workingEmployeeIds.includes(emp.id)
                );
                setFilteredEmployees(workingEmployees);
                
                generateTimeSlots(filteredSchedules);
            }
        } catch (error) {
            console.error('Ошибка при загрузке расписаний:', error);
        }
    }, [employees]);

    const fetchAppointmentsForDate = useCallback(async (date) => {
        try {
            const formattedDate = format(date, 'yyyy-MM-dd');
            const response = await fetch('http://localhost:5000/api/appointments');
            if (response.ok) {
                const data = await response.json();
                const filteredAppointments = data.filter(appointment => 
                    appointment.datetime && appointment.datetime.startsWith(formattedDate)
                );
                setAppointments(filteredAppointments);
                
                // Загружаем уведомления для найденных записей
                if (filteredAppointments.length > 0) {
                    fetchNotifications();
                }
            }
        } catch (error) {
            console.error('Ошибка при загрузке записей:', error);
        }
    }, []);

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:5000/api/notifications');
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error('Ошибка при загрузке уведомлений:', error);
        }
    }, []);

    const fetchServiceQualifications = useCallback(async (serviceId) => {
        try {
            const response = await fetch('http://localhost:5000/api/service_qualifications');
            if (response.ok) {
                const data = await response.json();
                const filteredData = data.filter(item => item.service_id === serviceId);
                setServiceQualifications(filteredData);
                return filteredData;
            }
        } catch (error) {
            console.error('Ошибка при получении квалификаций услуги:', error);
        }
        return [];
    }, []);

    // ==================== ФУНКЦИИ НАПОМИНАНИЙ ====================
    const createNotification = useCallback(async (appointmentId, appointmentDateTime, reminderMinutes) => {
        try {
            const appointmentDate = new Date(appointmentDateTime);
            const scheduledAt = new Date(appointmentDate.getTime() - (reminderMinutes * 60 * 1000));
            
            const notificationData = {
                appointment_id: appointmentId,
                scheduled_at: scheduledAt.toISOString(),
                status: 'scheduled',
                attempts: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const response = await fetch('http://localhost:5000/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(notificationData)
            });

            if (!response.ok) {
                console.error('Ошибка при создании напоминания:', await response.text());
            }
        } catch (error) {
            console.error('Ошибка при создании напоминания:', error);
        }
    }, []);

    // ==================== ФУНКЦИИ УМНОГО ПОИСКА ====================
    const fetchEmployeeWorkload = useCallback(async (startDate, endDate) => {
        try {
            const response = await fetch(
                `http://localhost:5000/api/analytics/employee_workload?start_date=${format(startDate, 'yyyy-MM-dd')}&end_date=${format(endDate, 'yyyy-MM-dd')}&group_by=day`
            );
            if (response.ok) {
                const data = await response.json();
                // Преобразуем в плоский массив для удобства
                const flatWorkload = [];
                data.employees.forEach(emp => {
                    emp.workload.forEach(w => {
                        flatWorkload.push({
                            employee_id: emp.employee_id,
                            employee_name: emp.employee_name,
                            period: w.period,
                            workload_percent: w.workload_percent,
                            booked_hours: w.booked_hours,
                            total_hours: w.total_hours
                        });
                    });
                });
                return flatWorkload;
            }
        } catch (error) {
            console.error('Ошибка при загрузке данных загруженности:', error);
        }
        return [];
    }, []);

    const fetchAvailableSlots = useCallback(async (employeeId, date, serviceId) => {
        try {
            const response = await fetch(
                `http://localhost:5000/api/available_slots?employee_id=${employeeId}&date=${format(date, 'yyyy-MM-dd')}&service_id=${serviceId}`
            );
            if (response.ok) {
                const data = await response.json();
                // Возвращаем массив слотов в правильном формате
                return data.available_slots || [];
            }
        } catch (error) {
            console.error('Ошибка при загрузке доступных слотов:', error);
        }
        return [];
    }, []);

    const performSmartSearch = useCallback(async () => {
        if (!smartSearch.serviceId) {
            setServerError('Выберите услугу для поиска');
            return;
        }

        setIsSearching(true);
        setServerError(null);

        try {
            console.log('Начинаем умный поиск...', smartSearch);

            // Получаем данные о загруженности
            const workload = await fetchEmployeeWorkload(smartSearch.startDate, smartSearch.endDate);
            setEmployeeWorkload(workload);
            console.log('Загруженность сотрудников:', workload);

            // Определяем мастеров для поиска
            const service = services.find(s => s.id === parseInt(smartSearch.serviceId));
            if (!service) {
                setServerError('Услуга не найдена');
                return;
            }

            console.log('Выбранная услуга:', service);

            const qualifications = await fetchServiceQualifications(smartSearch.serviceId);
            const suitableEmployees = employees.filter(emp => {
                if (emp.specialization_id !== service.specialization_id) return false;
                return qualifications.some(q => 
                    q.qualification_id === emp.qualification_level_id && q.is_allowed
                );
            });

            console.log('Подходящие мастера:', suitableEmployees);

            if (suitableEmployees.length === 0) {
                setServerError('Не найдены мастера для выбранной услуги');
                return;
            }

            // Фильтруем мастеров по предпочтениям
            const employeesToSearch = smartSearch.preferredEmployeeId 
                ? suitableEmployees.filter(emp => emp.id === parseInt(smartSearch.preferredEmployeeId))
                : suitableEmployees;

            console.log('Мастера для поиска:', employeesToSearch);

            // Собираем все доступные слоты
            const allSlots = [];
            const currentDate = new Date(smartSearch.startDate);
            const endDate = new Date(smartSearch.endDate);

            while (currentDate <= endDate) {
                const dateString = format(currentDate, 'yyyy-MM-dd');
                
                for (const employee of employeesToSearch) {
                    try {
                        const slots = await fetchAvailableSlots(employee.id, currentDate, smartSearch.serviceId);
                        console.log(`Слоты для ${employee.full_name} на ${dateString}:`, slots);
                        
                        slots.forEach(slot => {
                            allSlots.push({
                                date: dateString,
                                start_time: slot.start,
                                end_time: slot.end,
                                duration: slot.duration,
                                employee_id: employee.id,
                                employee_name: employee.full_name,
                                service_id: smartSearch.serviceId,
                                service_name: service.name,
                                price: service.base_price
                            });
                        });
                    } catch (error) {
                        console.error(`Ошибка при загрузке слотов для ${employee.full_name}:`, error);
                    }
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }

            console.log('Все найденные слоты:', allSlots);

            if (allSlots.length === 0) {
                setServerError('Не найдено доступных временных слотов в указанный период');
                setSmartResults([]);
                return;
            }

            // Рассчитываем оптимальность и сортируем
            const slotsWithScore = allSlots.map(slot => ({
                ...slot,
                optimality: calculateSlotOptimality(slot, smartSearch, workload)
            }));

            slotsWithScore.sort((a, b) => b.optimality - a.optimality);

            const limitedResults = slotsWithScore.slice(0, smartSearch.maxResults);
            setSmartResults(limitedResults);
            console.log('Результаты с оценками:', limitedResults);

            if (limitedResults.length === 0) {
                setServerError('Не найдено подходящих слотов с учетом ваших предпочтений');
            }

        } catch (error) {
            console.error('Ошибка при выполнении поиска:', error);
            setServerError('Ошибка при поиске времени: ' + error.message);
        } finally {
            setIsSearching(false);
        }
    }, [smartSearch, services, employees, fetchEmployeeWorkload, fetchServiceQualifications, fetchAvailableSlots]);

    const handleSlotSelect = useCallback((slot) => {
        setSelectedSlot(slot);
        
        // Автозаполнение формы записи
        setNewRecord({
            ...INITIAL_RECORD_STATE,
            service_id: slot.service_id,
            employee_id: slot.employee_id,
            date: slot.date,
            time: slot.start_time,
            final_price: slot.price,
            reminder_time: '' // Сбрасываем напоминание при автоподборе
        });

        // Устанавливаем доступных мастеров (только выбранного)
        const selectedEmployee = employees.find(emp => emp.id === slot.employee_id);
        if (selectedEmployee) {
            setAvailableEmployees([selectedEmployee]);
        }

        setServicePrice(slot.price);
        setOpenSmartDialog(false);
        
        showSnackbar('Слот выбран! Заполните данные клиента для завершения записи.', 'success');
    }, [employees]);

    const resetSmartSearch = useCallback(() => {
        setSmartSearch(INITIAL_SMART_SEARCH);
        setSmartResults([]);
        setEmployeeWorkload([]);
        setSelectedSlot(null);
        setServerError(null);
    }, []);

    // ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
    const generateTimeSlots = useCallback((schedules) => {
        if (!schedules || schedules.length === 0) {
            setTimeSlots([]);
            return;
        }
        
        let earliestStart = '23:59:59';
        let latestEnd = '00:00:00';
        
        schedules.forEach(schedule => {
            if (schedule.start_time < earliestStart) {
                earliestStart = schedule.start_time;
            }
            if (schedule.end_time > latestEnd) {
                latestEnd = schedule.end_time;
            }
        });
        
        const slots = [];
        const startDate = formatTimeSlot(selectedDate, earliestStart.slice(0, 5));
        const endDate = formatTimeSlot(selectedDate, latestEnd.slice(0, 5));
        
        let currentSlot = startDate;
        while (currentSlot < endDate) {
            slots.push(format(currentSlot, 'HH:mm'));
            currentSlot = addMinutes(currentSlot, SLOT_DURATION);
        }
        
        setTimeSlots(slots);
    }, [selectedDate]);

    const getAppointmentForSlot = useCallback((employeeId, timeSlot) => {
        const slotStartTime = formatTimeSlot(selectedDate, timeSlot);
        const slotEndTime = addMinutes(slotStartTime, SLOT_DURATION);
        
        return appointments.find(appointment => {
            if (appointment.employee_id !== employeeId) return false;
            
            const appointmentDateTime = appointment.datetime ? new Date(appointment.datetime) : null;
            if (!appointmentDateTime) return false;
            
            const service = services.find(s => s.id === appointment.service_id);
            if (!service) return false;
            
            const duration = appointment.custom_duration || service.duration;
            const appointmentEndTime = addMinutes(appointmentDateTime, duration);
            
            return (
                (slotStartTime >= appointmentDateTime && slotStartTime < appointmentEndTime) ||
                (slotEndTime > appointmentDateTime && slotEndTime <= appointmentEndTime) ||
                (slotStartTime <= appointmentDateTime && slotEndTime >= appointmentEndTime)
            );
        });
    }, [appointments, services, selectedDate]);

    const isEmployeeWorking = useCallback((employeeId, timeSlot) => {
        const schedule = schedules.find(s => s.employee_id === employeeId);
        if (!schedule) return false;
        
        const slotTime = formatTimeSlot(selectedDate, timeSlot);
        const startTime = formatTimeSlot(selectedDate, schedule.start_time.slice(0, 5));
        const endTime = formatTimeSlot(selectedDate, schedule.end_time.slice(0, 5));
        
        if (isInException(schedule.id, timeSlot)) {
            return false;
        }
        
        return isWithinInterval(slotTime, { start: startTime, end: endTime });
    }, [schedules, selectedDate, scheduleExceptions]);

    const isInException = useCallback((scheduleId, timeSlot) => {
        const numericScheduleId = parseInt(scheduleId, 10);
        const exceptions = scheduleExceptions.filter(exc => 
            parseInt(exc.schedule_id, 10) === numericScheduleId
        );
        
        if (exceptions.length === 0) return false;
        
        const slotTime = formatTimeSlot(selectedDate, timeSlot);
        
        return exceptions.some(exc => {
            const exceptionStart = formatTimeSlot(selectedDate, exc.start_time.slice(0, 5));
            const exceptionEnd = formatTimeSlot(selectedDate, exc.end_time.slice(0, 5));
            
            return isWithinInterval(slotTime, { start: exceptionStart, end: exceptionEnd });
        });
    }, [scheduleExceptions, selectedDate]);

    const getClientName = useCallback((clientId) => {
        const client = clientsArray.find(c => c.id === clientId);
        return client ? client.full_name : 'Неизвестный клиент';
    }, [clientsArray]);
    
    const getServiceName = useCallback((serviceId) => {
        const service = services.find(s => s.id === serviceId);
        return service ? service.name : 'Неизвестная услуга';
    }, [services]);

    const getNotificationForAppointment = useCallback((appointmentId) => {
        return notifications.find(n => n.appointment_id === appointmentId);
    }, [notifications]);

    const getNotificationIcon = useCallback((status) => {
        switch (status) {
            case 'scheduled':
                return <NotificationsIcon sx={{ fontSize: 10, color: '#ff9800' }} />;
            case 'sent':
                return <NotificationsActiveIcon sx={{ fontSize: 10, color: '#4caf50' }} />;
            case 'failed':
                return <ErrorIcon sx={{ fontSize: 10, color: '#f44336' }} />;
            default:
                return <NotificationsOffIcon sx={{ fontSize: 10, color: '#9e9e9e' }} />;
        }
    }, []);

    const showSnackbar = useCallback((message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    }, []);

    const resetForm = useCallback(() => {
        setNewRecord(INITIAL_RECORD_STATE);
        setServerError(null);
        setConflictDetails(null);
        setEditMode(false);
        setCurrentAppointment(null);
        setAvailableEmployees([]);
        setServicePrice(null);
        setAddNewClient(false);
        setNewClient({ full_name: '', phone: '', email: '' });
    }, []);

    // ==================== КОМПОНЕНТЫ ВИЗУАЛИЗАЦИИ ====================
    const renderWorkloadBar = useCallback((workloadBefore, workloadAfter, employeeName) => {
        const hasChange = workloadAfter !== undefined && workloadAfter !== workloadBefore;
        
        return (
            <Box sx={{ width: '100%', minWidth: 120 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ mr: 1, minWidth: '45px' }}>
                        {hasChange ? 'До:' : 'Загрузка:'}
                    </Typography>
                    <Box sx={{ flex: 1, mr: 1 }}>
                        <LinearProgress 
                            variant="determinate" 
                            value={Math.min(workloadBefore, 100)} 
                            sx={{ 
                                height: 6, 
                                borderRadius: 3,
                                backgroundColor: '#f0f0f0',
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: workloadBefore > 80 ? '#f44336' : 
                                                   workloadBefore > 60 ? '#ff9800' : '#4caf50'
                                }
                            }}
                        />
                    </Box>
                    <Typography variant="caption" sx={{ minWidth: '30px', fontWeight: 500 }}>
                        {Math.round(workloadBefore)}%
                    </Typography>
                </Box>
                
                {hasChange && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ mr: 1, minWidth: '45px' }}>
                            После:
                        </Typography>
                        <Box sx={{ flex: 1, mr: 1 }}>
                            <LinearProgress 
                                variant="determinate" 
                                value={Math.min(workloadAfter, 100)} 
                                sx={{ 
                                    height: 6, 
                                    borderRadius: 3,
                                    backgroundColor: '#f0f0f0',
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: workloadAfter > 80 ? '#f44336' : 
                                                       workloadAfter > 60 ? '#ff9800' : '#4caf50'
                                    }
                                }}
                            />
                        </Box>
                        <Typography variant="caption" sx={{ minWidth: '30px', fontWeight: 500 }}>
                            {Math.round(workloadAfter)}%
                        </Typography>
                        {workloadAfter > workloadBefore ? (
                            <TrendingUpIcon sx={{ fontSize: 14, color: 'error.main', ml: 0.5 }} />
                        ) : (
                            <TrendingDownIcon sx={{ fontSize: 14, color: 'success.main', ml: 0.5 }} />
                        )}
                    </Box>
                )}
            </Box>
        );
    }, []);

    const renderOptimalityChip = useCallback((optimality) => {
        const getColor = (score) => {
            if (score >= 80) return 'success';
            if (score >= 60) return 'warning';
            return 'error';
        };

        const getLabel = (score) => {
            if (score >= 80) return 'Отлично';
            if (score >= 60) return 'Хорошо';
            return 'Удовлетворительно';
        };

        return (
            <Chip
                size="small"
                label={`${Math.round(optimality)}% • ${getLabel(optimality)}`}
                color={getColor(optimality)}
                variant="outlined"
                icon={optimality >= 80 ? <StarIcon /> : undefined}
                sx={{ fontWeight: 500 }}
            />
        );
    }, []);

    // ==================== ОБРАБОТЧИКИ УДАЛЕНИЯ ====================
    const handleDeleteAppointment = useCallback((appointment, e) => {
        e.preventDefault();
        e.stopPropagation();
        setAppointmentToDelete(appointment);
        setOpenDeleteDialog(true);
    }, []);

    // ==================== ОБРАБОТЧИКИ ИЗМЕНЕНИЯ РАЗМЕРА ====================
    const handleResizeStart = useCallback((appointment, e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const service = services.find(s => s.id === appointment.service_id);
        if (!service) return;
        
        const appointmentElement = e.currentTarget.closest('[data-appointment-id]');
        if (!appointmentElement) return;
        
        const timeTable = appointmentElement.closest('table');
        if (!timeTable) return;
        
        // ИСПРАВЛЕНО: Отключаем transitions во время drag
        appointmentElement.style.transition = 'none';
        
        // Находим начальную строку записи
        const appointmentTime = format(new Date(appointment.datetime), 'HH:mm');
        const rows = Array.from(timeTable.querySelectorAll('tbody tr'));
        const startRowIndex = rows.findIndex(row => {
            const timeCell = row.querySelector('td:first-child');
            return timeCell && timeCell.textContent.trim() === appointmentTime;
        });
        
        if (startRowIndex === -1) {
            // Восстанавливаем transition если что-то пошло не так
            appointmentElement.style.transition = '';
            return;
        }
        
        const initialDuration = appointment.custom_duration || service.duration;
        let currentDuration = initialDuration;
        let isDragging = true;
        
        // Получаем изначальную позицию и размеры
        const tableRect = timeTable.getBoundingClientRect();
        const realRowHeight = rows[0]?.getBoundingClientRect().height || TABLE_ROW_HEIGHT;
        
        const handleMouseMove = (moveEvent) => {
            if (!isDragging) return;
            
            // Вычисляем позицию курсора относительно таблицы
            const relativeY = moveEvent.clientY - tableRect.top;
            
            // Определяем строку на основе позиции курсора
            let targetRowIndex = -1;
            let cumulativeHeight = 0;
            
            // Учитываем заголовок таблицы
            const headerRow = timeTable.querySelector('thead tr');
            if (headerRow) {
                cumulativeHeight += headerRow.getBoundingClientRect().height;
            }
            
            // Ищем целевую строку
            for (let i = 0; i < rows.length; i++) {
                const rowHeight = rows[i].getBoundingClientRect().height;
                if (relativeY >= cumulativeHeight && relativeY < cumulativeHeight + rowHeight) {
                    targetRowIndex = i;
                    break;
                }
                cumulativeHeight += rowHeight;
            }
            
            // Если курсор ниже всех строк, берем последнюю строку
            if (targetRowIndex === -1 && relativeY >= cumulativeHeight) {
                targetRowIndex = rows.length - 1;
            }
            
            // Проверяем, что мы не выше начальной строки
            if (targetRowIndex < startRowIndex) return;
            
            // Правильный расчет новой длительности
            const rowsSpanned = targetRowIndex - startRowIndex + 1;
            const newDuration = rowsSpanned * SLOT_DURATION;
            
            if (newDuration !== currentDuration && newDuration >= SLOT_DURATION) {
                currentDuration = newDuration;
                
                // ИСПРАВЛЕНО: Плавное обновление высоты без transition
                const newHeight = rowsSpanned * realRowHeight;
                appointmentElement.style.height = `${newHeight}px`;
                
                // ДОБАВЛЕНО: Обновляем также handle для лучшего UX
                const resizeHandle = appointmentElement.querySelector('.resize-handle');
                if (resizeHandle) {
                    resizeHandle.style.backgroundColor = '#1976d2';
                    resizeHandle.style.opacity = '1';
                }
            }
        };
        
        const handleMouseUp = async () => {
            isDragging = false;
            
            // ИСПРАВЛЕНО: Восстанавливаем transitions
            appointmentElement.style.transition = 'all 0.2s ease';
            
            // Восстанавливаем стиль handle
            const resizeHandle = appointmentElement.querySelector('.resize-handle');
            if (resizeHandle) {
                resizeHandle.style.backgroundColor = '';
                resizeHandle.style.opacity = '';
            }
            
            // Очищаем обработчики событий
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            // Восстанавливаем стили курсора
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            
            // Сохраняем изменения, если длительность изменилась
            if (currentDuration !== initialDuration) {
                try {
                    const response = await fetch(`http://localhost:5000/api/appointments/${appointment.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ custom_duration: currentDuration }),
                    });
                    
                    if (response.ok) {
                        // ИСПРАВЛЕНО: Обновляем данные и позволяем useEffect пересчитать размеры
                        await fetchAppointmentsForDate(selectedDate);
                        showSnackbar('Продолжительность записи успешно обновлена', 'success');
                    } else {
                        // Возвращаем исходную высоту при ошибке
                        const originalSlotsCount = Math.ceil(initialDuration / SLOT_DURATION);
                        const originalHeight = originalSlotsCount * realRowHeight;
                        appointmentElement.style.height = `${originalHeight}px`;
                        showSnackbar('Ошибка при обновлении продолжительности записи', 'error');
                    }
                } catch (error) {
                    console.error('Ошибка при обновлении продолжительности:', error);
                    // Возвращаем исходную высоту при ошибке
                    const originalSlotsCount = Math.ceil(initialDuration / SLOT_DURATION);
                    const originalHeight = originalSlotsCount * realRowHeight;
                    appointmentElement.style.height = `${originalHeight}px`;
                    showSnackbar('Ошибка при обновлении продолжительности записи', 'error');
                }
            } else {
                // ДОБАВЛЕНО: Если длительность не изменилась, просто восстанавливаем transition
                setTimeout(() => {
                    appointmentElement.style.transition = '';
                }, 100);
            }
        };
        
        // Устанавливаем стили курсора
        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';
        
        // Добавляем обработчики событий
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
    }, [services, fetchAppointmentsForDate, selectedDate, showSnackbar]);

    // ==================== ОБРАБОТЧИКИ ФОРМ ====================
    const updateAvailableEmployees = useCallback(async (serviceId) => {
        if (!serviceId) {
            setAvailableEmployees([]);
            setServicePrice(null);
            return;
        }

        try {
            const selectedService = services.find(s => s.id === serviceId);
            if (!selectedService) return;

            const qualifications = await fetchServiceQualifications(serviceId);
            
            const filtered = employees.filter(emp => {
                if (emp.specialization_id !== selectedService.specialization_id) return false;
                
                return qualifications.some(q => 
                    q.qualification_id === emp.qualification_level_id && q.is_allowed
                );
            });
            
            setAvailableEmployees(filtered);
            
            if (newRecord.employee_id && !filtered.some(emp => emp.id === newRecord.employee_id)) {
                setNewRecord(prev => ({ ...prev, employee_id: '' }));
                setServicePrice(null);
            }
        } catch (error) {
            console.error('Ошибка при обновлении списка мастеров:', error);
            setAvailableEmployees([]);
        }
    }, [services, employees, fetchServiceQualifications, newRecord.employee_id]);

    const updateServicePrice = useCallback((serviceId, employeeId) => {
        if (!serviceId || !employeeId) {
            setServicePrice(null);
            return;
        }

        try {
            const selectedService = services.find(s => s.id === serviceId);
            const selectedEmployee = employees.find(e => e.id === employeeId);
            
            if (!selectedService || !selectedEmployee) return;

            const qualification = serviceQualifications.find(q => 
                q.qualification_id === selectedEmployee.qualification_level_id
            );

            const calculatedPrice = qualification?.price_modified || selectedService.base_price;
            setServicePrice(calculatedPrice);
            
            setNewRecord(prev => ({ ...prev, final_price: calculatedPrice }));
        } catch (error) {
            console.error('Ошибка при обновлении цены услуги:', error);
            setServicePrice(null);
        }
    }, [services, employees, serviceQualifications]);

    // ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================
    const handleCellClick = useCallback((employeeId, timeSlot) => {
        if (!isEmployeeWorking(employeeId, timeSlot)) return;
        
        const existingAppointment = getAppointmentForSlot(employeeId, timeSlot);
        if (existingAppointment) {
            handleEditAppointment(existingAppointment);
            return;
        }
        
        handleAddClick(employeeId, timeSlot);
    }, [isEmployeeWorking, getAppointmentForSlot]);

    const handleAddClick = useCallback((employeeId, timeSlot) => {
        const newAppointmentDateTime = formatTimeSlot(selectedDate, timeSlot);
        
        setNewRecord({
            ...INITIAL_RECORD_STATE,
            employee_id: employeeId,
            date: format(newAppointmentDateTime, 'yyyy-MM-dd'),
            time: format(newAppointmentDateTime, 'HH:mm'),
        });
        
        setEditMode(false);
        setOpenDialog(true);
    }, [selectedDate]);

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
    }, [employees, services]);

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
    }, [newRecord, editMode, currentAppointment, fetchAppointmentsForDate, selectedDate, showSnackbar, resetForm]);

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
    }, [newClient, setClients, showSnackbar]);

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
    }, [appointmentToDelete, appointments, showSnackbar]);

    // ==================== РЕНДЕР ФУНКЦИИ ====================
    const renderAppointmentBlock = useCallback((appointment) => {
        const client = clientsArray.find(c => c.id === appointment.client_id);
        const service = services.find(s => s.id === appointment.service_id);
        
        if (!client || !service) return null;
        
        const appointmentTime = new Date(appointment.datetime);
        const duration = appointment.custom_duration || service.duration;
        const appointmentEndTime = addMinutes(appointmentTime, duration);
        const appointmentEndTimeStr = format(appointmentEndTime, 'HH:mm');
        
        // Простой расчет слотов
        const slotsCount = Math.ceil(duration / SLOT_DURATION);
        
        const backgroundColor = STATUS_COLORS[appointment.status] || STATUS_COLORS.created;
        
        return (
            <Box
                data-appointment-id={appointment.id}
                sx={{
                    position: 'absolute',
                    width: '100%',
                    height: `${slotsCount * TABLE_ROW_HEIGHT}px`,
                    backgroundColor,
                    border: '1px solid #e0e0e0',
                    borderLeft: '3px solid #1976d2',
                    borderRadius: '4px',
                    padding: 0,
                    margin: 0,
                    top: 0,
                    left: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 1,
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        zIndex: 2,
                        borderLeftColor: '#1565c0',
                        '& .resize-handle': {
                            backgroundColor: '#1976d2',
                            opacity: 0.8
                        },
                        '& .delete-button': {
                            opacity: 1
                        },
                        '& .edit-hint': {
                            opacity: 1
                        }
                    }
                }}
                ref={(element) => {
                    if (element) {
                        setTimeout(() => {
                            const tableRow = element.closest('tr');
                            if (tableRow) {
                                const realRowHeight = tableRow.getBoundingClientRect().height;
                                if (realRowHeight > 0) {
                                    const correctHeight = slotsCount * realRowHeight;
                                    element.style.height = `${correctHeight}px`;
                                }
                            }
                        }, 0);
                    }
                }}
            >
                {/* Основная область записи */}
                <Box 
                    sx={{ 
                        flex: 1,
                        padding: '8px 12px',
                        cursor: 'pointer',
                        paddingBottom: `${RESIZE_HANDLE_HEIGHT + 4}px`,
                        position: 'relative'
                    }}
                    onClick={() => handleEditAppointment(appointment)}
                >
                    {/* Иконка редактирования */}
                    <EditIcon 
                        className="edit-hint"
                        sx={{
                            position: 'absolute',
                            top: 6,
                            right: 28,
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            fontSize: '14px',
                            color: 'text.secondary'
                        }}
                    />

                    {/* Кнопка удаления */}
                    <IconButton
                        className="delete-button"
                        size="small"
                        sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            opacity: 0,
                            transition: 'all 0.2s',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            '&:hover': {
                                backgroundColor: '#ffebee',
                                color: 'error.main'
                            },
                            width: '20px',
                            height: '20px'
                        }}
                        onClick={(e) => handleDeleteAppointment(appointment, e)}
                    >
                        <DeleteIcon sx={{ fontSize: '12px' }} />
                    </IconButton>

                    {/* Контент записи */}
                    <Box sx={{ pr: '50px' }}>
                        <Typography 
                            variant="subtitle2" 
                            noWrap 
                            sx={{ 
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                lineHeight: 1.2,
                                mb: 0.5
                            }}
                        >
                            {client.full_name}
                        </Typography>
                        
                        <Typography 
                            variant="caption" 
                            noWrap 
                            sx={{ 
                                fontSize: '0.75rem',
                                color: 'text.secondary',
                                display: 'block',
                                lineHeight: 1.1,
                                mb: 0.5
                            }}
                        >
                            {service.name}
                        </Typography>
                        
                        <Typography 
                            variant="caption" 
                            noWrap 
                            sx={{ 
                                fontSize: '0.7rem',
                                color: 'text.secondary',
                                display: 'flex',
                                alignItems: 'center',
                                lineHeight: 1
                            }}
                        >
                            <AccessTimeIcon sx={{ fontSize: '10px', mr: 0.5 }} />
                            {format(appointmentTime, 'HH:mm')} - {appointmentEndTimeStr}
                        </Typography>
                        
                        {/* Информация о напоминании */}
                        {(() => {
                            const notification = getNotificationForAppointment(appointment.id);
                            if (!notification) return null;
                            
                            return (
                                <Typography 
                                    variant="caption" 
                                    noWrap 
                                    sx={{ 
                                        fontSize: '0.65rem',
                                        color: 'text.secondary',
                                        display: 'flex',
                                        alignItems: 'center',
                                        lineHeight: 1,
                                        mt: 0.3
                                    }}
                                >
                                    {getNotificationIcon(notification.status)}
                                    <Box component="span" sx={{ ml: 0.5 }}>
                                        {notification.status === 'scheduled' && `Напомнить ${format(new Date(notification.scheduled_at), 'dd.MM HH:mm')}`}
                                        {notification.status === 'sent' && `Отправлено ${format(new Date(notification.sent_at), 'dd.MM HH:mm')}`}
                                        {notification.status === 'failed' && `Ошибка отправки${notification.attempts > 1 ? ` (${notification.attempts} попыток)` : ''}`}
                                    </Box>
                                </Typography>
                            );
                        })()}
                        
                        {appointment.final_price && slotsCount > 2 && (
                            <Typography 
                                variant="caption" 
                                sx={{ 
                                    fontSize: '0.7rem',
                                    color: 'success.main',
                                    fontWeight: 600,
                                    display: 'block',
                                    mt: 0.5
                                }}
                            >
                                {appointment.final_price} ₽
                            </Typography>
                        )}
                    </Box>
                </Box>
                
                {/* Ручка для изменения размера */}
                <Box
                    className="resize-handle"
                    sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: `${RESIZE_HANDLE_HEIGHT}px`,
                        cursor: 'ns-resize',
                        backgroundColor: '#e0e0e0',
                        opacity: 0.6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            backgroundColor: '#1976d2',
                            opacity: 1,
                            height: '14px'
                        },
                        '&::after': {
                            content: '"···"',
                            fontSize: '8px',
                            color: 'white',
                            letterSpacing: '1px'
                        }
                    }}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleResizeStart(appointment, e);
                    }}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                />
            </Box>
        );
    }, [clientsArray, services, handleEditAppointment, handleResizeStart, handleDeleteAppointment]);

    const renderAppointmentCell = useCallback((employeeId, timeSlot) => {
        const appointment = getAppointmentForSlot(employeeId, timeSlot);
        
        if (!appointment) {
            const isWorking = isEmployeeWorking(employeeId, timeSlot);
            const isHovered = hoveredCell?.employeeId === employeeId && hoveredCell?.timeSlot === timeSlot;
            
            return (
                <TableCell 
                    key={`${employeeId}-${timeSlot}`}
                    sx={{ 
                        position: 'relative',
                        height: `${TABLE_ROW_HEIGHT}px`,
                        border: '1px solid #f0f0f0',
                        padding: 0,
                        backgroundColor: isWorking ? '#fafafa' : '#f5f5f5',
                        transition: 'background-color 0.15s ease',
                        '&:hover': {
                            backgroundColor: isWorking ? '#f0f0f0' : '#f5f5f5'
                        }
                    }}
                    onMouseEnter={() => setHoveredCell({ employeeId, timeSlot })}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => handleCellClick(employeeId, timeSlot)}
                >
                    {isHovered && isWorking && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: '#1976d2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    transform: 'translate(-50%, -50%) scale(1.1)',
                                    backgroundColor: '#1565c0'
                                }
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAddClick(employeeId, timeSlot);
                            }}
                        >
                            <AddIcon sx={{ color: 'white', fontSize: '14px' }} />
                        </Box>
                    )}
                </TableCell>
            );
        }
        
        const appointmentTime = format(new Date(appointment.datetime), 'HH:mm');
        if (appointmentTime === timeSlot) {
            return (
                <TableCell 
                    key={`${employeeId}-${timeSlot}`}
                    sx={{ 
                        position: 'relative',
                        height: `${TABLE_ROW_HEIGHT}px`,
                        border: '1px solid #f0f0f0',
                        padding: 0
                    }}
                >
                    {renderAppointmentBlock(appointment)}
                </TableCell>
            );
        }
        
        return (
            <TableCell 
                key={`${employeeId}-${timeSlot}`}
                sx={{ 
                    position: 'relative',
                    height: `${TABLE_ROW_HEIGHT}px`,
                    border: '1px solid #f0f0f0',
                    padding: 0
                }}
            />
        );
    }, [getAppointmentForSlot, isEmployeeWorking, hoveredCell, handleCellClick, handleAddClick, renderAppointmentBlock]);

    // ==================== ОСНОВНОЙ РЕНДЕР ====================
    return (
        <Box sx={{ p: 2, backgroundColor: '#fafafa', minHeight: '100vh' }}>
            {/* Заголовок */}
            <Typography 
                variant="h5" 
                sx={{ 
                    fontWeight: 500,
                    color: 'text.primary',
                    mb: 3,
                    textAlign: 'center'
                }}
            >
                Расписание записей
            </Typography>
            
            {/* Панель управления */}
            <Paper 
                elevation={0}
                sx={{ 
                    p: 2, 
                    mb: 2, 
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0'
                }}
            >
                <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    justifyContent="space-between" 
                    alignItems="center" 
                    spacing={2}
                >
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <IconButton 
                            size="small"
                            onClick={() => {
                                const prevDay = new Date(selectedDate);
                                prevDay.setDate(prevDay.getDate() - 1);
                                setSelectedDate(prevDay);
                            }}
                            sx={{ 
                                backgroundColor: '#f5f5f5',
                                '&:hover': { backgroundColor: '#e0e0e0' }
                            }}
                        >
                            <NavigateBeforeIcon fontSize="small" />
                        </IconButton>
                        
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                            <DatePicker
                                value={selectedDate}
                                onChange={setSelectedDate}
                                renderInput={(params) => 
                                    <TextField 
                                        {...params} 
                                        size="small"
                                        sx={{ minWidth: 160 }}
                                    />
                                }
                            />
                        </LocalizationProvider>
                        
                        <IconButton 
                            size="small"
                            onClick={() => {
                                const nextDay = new Date(selectedDate);
                                nextDay.setDate(nextDay.getDate() + 1);
                                setSelectedDate(nextDay);
                            }}
                            sx={{ 
                                backgroundColor: '#f5f5f5',
                                '&:hover': { backgroundColor: '#e0e0e0' }
                            }}
                        >
                            <NavigateNextIcon fontSize="small" />
                        </IconButton>
                        
                        <IconButton 
                            size="small"
                            onClick={() => setSelectedDate(new Date())}
                            sx={{ 
                                backgroundColor: '#1976d2',
                                color: 'white',
                                ml: 1,
                                '&:hover': { backgroundColor: '#1565c0' }
                            }}
                        >
                            <TodayIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                    
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />} 
                        onClick={() => {
                            setOpenDialog(true);
                            setNewRecord({
                                ...INITIAL_RECORD_STATE,
                                date: format(selectedDate, 'yyyy-MM-dd')
                            });
                        }}
                        sx={{ 
                            textTransform: 'none',
                            fontWeight: 500,
                            boxShadow: 'none',
                            '&:hover': { boxShadow: 1 }
                        }}
                    >
                        Новая запись
                    </Button>
                </Stack>
            </Paper>
            
            {/* Таблица */}
            <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: 'calc(100vh - 220px)' }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell 
                                    sx={{ 
                                        width: '90px',
                                        backgroundColor: '#f8f9fa',
                                        borderRight: '1px solid #e0e0e0',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        textAlign: 'center'
                                    }}
                                >
                                    Время
                                </TableCell>
                                {filteredEmployees.map(employee => (
                                    <TableCell 
                                        key={employee.id} 
                                        sx={{ 
                                            minWidth: '280px',
                                            backgroundColor: '#f8f9fa',
                                            borderRight: '1px solid #e0e0e0',
                                            fontWeight: 600,
                                            fontSize: '0.85rem',
                                            textAlign: 'center'
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                            <PersonIcon sx={{ fontSize: '16px', color: 'text.secondary' }} />
                                            {employee.full_name}
                                        </Box>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {timeSlots.map(timeSlot => (
                                <TableRow key={timeSlot}>
                                    <TableCell 
                                        sx={{ 
                                            fontWeight: 500,
                                            fontSize: '0.8rem',
                                            textAlign: 'center',
                                            backgroundColor: '#fafafa',
                                            borderRight: '1px solid #e0e0e0',
                                            color: 'text.secondary'
                                        }}
                                    >
                                        {timeSlot}
                                    </TableCell>
                                    {filteredEmployees.map(employee => 
                                        renderAppointmentCell(employee.id, timeSlot)
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
            
            {/* Диалог создания/редактирования */}
            <Dialog 
                open={openDialog} 
                onClose={() => { setOpenDialog(false); resetForm(); }} 
                maxWidth="sm" 
                fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" fontWeight={500}>
                            {editMode ? 'Редактировать запись' : 'Новая запись'}
                        </Typography>
                        {!editMode && (
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<AutoFixHighIcon />}
                                onClick={() => {
                                    setOpenSmartDialog(true);
                                    resetSmartSearch();
                                }}
                                sx={{ 
                                    textTransform: 'none',
                                    borderColor: '#1976d2',
                                    color: '#1976d2',
                                    '&:hover': {
                                        backgroundColor: '#e3f2fd',
                                        borderColor: '#1565c0'
                                    }
                                }}
                            >
                                Автоподбор времени
                            </Button>
                        )}
                    </Stack>
                </DialogTitle>
                
                <Divider />
                
                <form onSubmit={handleSubmit}>
                    <DialogContent sx={{ pt: 3 }}>
                        <Stack spacing={3}>
                            {/* Клиент */}
                            <Box>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Клиент</InputLabel>
                                    <Select
                                        value={addNewClient ? 'new' : (newRecord.client_id || '')}
                                        onChange={(e) => {
                                            if (e.target.value === 'new') {
                                                setAddNewClient(true);
                                                setNewRecord(prev => ({ ...prev, client_id: '' }));
                                            } else {
                                                setAddNewClient(false);
                                                setNewRecord(prev => ({ ...prev, client_id: e.target.value }));
                                            }
                                        }}
                                    >
                                        {clientsArray.map(client => (
                                            <MenuItem key={client.id} value={client.id}>
                                                {client.full_name}
                                            </MenuItem>
                                        ))}
                                        <MenuItem value="new">+ Добавить нового клиента</MenuItem>
                                    </Select>
                                </FormControl>
                                
                                {addNewClient && (
                                    <Paper sx={{ p: 2, mt: 2, backgroundColor: '#f8f9fa' }}>
                                        <Stack spacing={2}>
                                            <TextField
                                                label="ФИО"
                                                fullWidth
                                                size="small"
                                                value={newClient.full_name}
                                                onChange={e => setNewClient({ ...newClient, full_name: e.target.value })}
                                            />
                                            <Stack direction="row" spacing={2}>
                                                <TextField
                                                    label="Телефон"
                                                    fullWidth
                                                    size="small"
                                                    value={newClient.phone}
                                                    onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                                                />
                                                <TextField
                                                    label="Email"
                                                    fullWidth
                                                    size="small"
                                                    value={newClient.email}
                                                    onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                                                />
                                            </Stack>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Button 
                                                    size="small"
                                                    variant="contained" 
                                                    onClick={handleAddClient}
                                                >
                                                    Добавить
                                                </Button>
                                            </Box>
                                        </Stack>
                                    </Paper>
                                )}
                            </Box>

                            {/* Услуга и мастер */}
                            <Stack direction="row" spacing={2}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Услуга</InputLabel>
                                    <Select
                                        value={newRecord.service_id || ''}
                                        onChange={(e) => {
                                            const serviceId = e.target.value;
                                            setNewRecord(prev => ({ ...prev, service_id: serviceId }));
                                            updateAvailableEmployees(serviceId);
                                        }}
                                    >
                                        {servicesArray.map(service => (
                                            <MenuItem key={service.id} value={service.id}>
                                                {service.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                
                                <FormControl fullWidth size="small">
                                    <InputLabel>Мастер</InputLabel>
                                    <Select
                                        value={newRecord.employee_id || ''}
                                        onChange={(e) => {
                                            const employeeId = e.target.value;
                                            setNewRecord(prev => ({ ...prev, employee_id: employeeId }));
                                            updateServicePrice(newRecord.service_id, employeeId);
                                        }}
                                        disabled={!newRecord.service_id}
                                    >
                                        {availableEmployees.map(emp => (
                                            <MenuItem key={emp.id} value={emp.id}>
                                                {emp.full_name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                            
                            {servicePrice !== null && (
                                <Alert severity="info" sx={{ py: 1 }}>
                                    Стоимость услуги: <strong>{servicePrice} ₽</strong>
                                </Alert>
                            )}

                            {/* Дата и время */}
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Дата"
                                    type="date"
                                    fullWidth
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                    value={newRecord.date}
                                    onChange={e => setNewRecord({ ...newRecord, date: e.target.value })}
                                />
                                <TextField
                                    label="Время"
                                    type="time"
                                    fullWidth
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                    value={newRecord.time}
                                    onChange={e => setNewRecord({ ...newRecord, time: e.target.value })}
                                />
                            </Stack>

                            {/* Дополнительные параметры */}
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Продолжительность (мин)"
                                    type="number"
                                    fullWidth
                                    size="small"
                                    value={newRecord.custom_duration}
                                    onChange={e => setNewRecord({ ...newRecord, custom_duration: e.target.value })}
                                    helperText="По умолчанию из услуги"
                                />
                                <TextField
                                    label="Итоговая цена (₽)"
                                    type="number"
                                    fullWidth
                                    size="small"
                                    value={newRecord.final_price}
                                    onChange={e => setNewRecord({ ...newRecord, final_price: e.target.value })}
                                    helperText="С учетом скидок"
                                />
                            </Stack>

                            {/* Статус */}
                            <FormControl fullWidth size="small">
                                <InputLabel>Статус</InputLabel>
                                <Select
                                    value={newRecord.status || 'created'}
                                    onChange={e => setNewRecord({ ...newRecord, status: e.target.value })}
                                >
                                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                        <MenuItem key={value} value={value}>{label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Чекбоксы */}
                            <Stack direction="row" spacing={3}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={!!newRecord.is_completed}
                                            onChange={e => setNewRecord({ ...newRecord, is_completed: e.target.checked })}
                                        />
                                    }
                                    label="Завершено"
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={!!newRecord.is_paid}
                                            onChange={e => setNewRecord({ ...newRecord, is_paid: e.target.checked })}
                                        />
                                    }
                                    label="Оплачено"
                                />
                            </Stack>

                            {/* Напоминание */}
                            {!editMode && (
                                <FormControl fullWidth size="small">
                                    <InputLabel>Напомнить за</InputLabel>
                                    <Select
                                        value={newRecord.reminder_time || ''}
                                        onChange={e => setNewRecord({ ...newRecord, reminder_time: e.target.value })}
                                    >
                                        {Object.entries(REMINDER_OPTIONS).map(([value, label]) => (
                                            <MenuItem key={value} value={value}>{label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )} 

                            {/* Заметки */}
                            <TextField
                                label="Заметки"
                                fullWidth
                                multiline
                                rows={2}
                                size="small"
                                value={newRecord.notes || ''}
                                onChange={e => setNewRecord({ ...newRecord, notes: e.target.value })}
                                placeholder="Дополнительная информация..."
                            />
                        </Stack>
                        
                        {/* Ошибки */}
                        {serverError && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {serverError}
                                {conflictDetails && (
                                    <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(211, 47, 47, 0.2)' }}>
                                        <Typography variant="body2" fontWeight={500} gutterBottom>
                                            Конфликт с записью:
                                        </Typography>
                                        <Typography variant="body2">
                                            {getClientName(conflictDetails.client_id)} — {getServiceName(conflictDetails.service_id)}
                                        </Typography>
                                        <Typography variant="body2">
                                            {conflictDetails.datetime 
                                                ? format(new Date(conflictDetails.datetime), 'dd.MM.yyyy HH:mm') 
                                                : 'Время не указано'}
                                        </Typography>
                                    </Box>
                                )}
                            </Alert>
                        )}
                    </DialogContent>
                    
                    <Divider />
                    
                    <DialogActions sx={{ p: 2 }}>
                        <Button 
                            onClick={() => { setOpenDialog(false); resetForm(); }}
                            sx={{ textTransform: 'none' }}
                        >
                            Отмена
                        </Button>
                        <Button 
                            type="submit" 
                            variant="contained"
                            sx={{ 
                                textTransform: 'none',
                                fontWeight: 500,
                                minWidth: 100
                            }}
                        >
                            {editMode ? 'Сохранить' : 'Создать'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Диалог умного поиска */}
            <Dialog 
                open={openSmartDialog} 
                onClose={() => { setOpenSmartDialog(false); resetSmartSearch(); }} 
                maxWidth="lg" 
                fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AutoFixHighIcon sx={{ color: '#1976d2' }} />
                        <Typography variant="h6" fontWeight={500}>
                            Система подбора временного слота
                        </Typography>
                    </Box>
                </DialogTitle>
                
                <Divider />
                
                <DialogContent sx={{ pt: 3 }}>
                    <Stack spacing={3}>
                        {/* Параметры поиска */}
                        <Card sx={{ border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                            <CardContent sx={{ p: 2 }}>
                                <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                                    Параметры поиска
                                </Typography>
                                
                                <Stack spacing={2}>
                                    {/* Период дат */}
                                    <Stack direction="row" spacing={2}>
                                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                                            <DatePicker
                                                label="Дата от"
                                                value={smartSearch.startDate}
                                                onChange={(date) => setSmartSearch(prev => ({ ...prev, startDate: date }))}
                                                renderInput={(params) => 
                                                    <TextField {...params} size="small" fullWidth />
                                                }
                                            />
                                            <DatePicker
                                                label="Дата до"
                                                value={smartSearch.endDate}
                                                onChange={(date) => setSmartSearch(prev => ({ ...prev, endDate: date }))}
                                                renderInput={(params) => 
                                                    <TextField {...params} size="small" fullWidth />
                                                }
                                            />
                                        </LocalizationProvider>
                                    </Stack>
                                    
                                    {/* Услуга и мастер */}
                                    <Stack direction="row" spacing={2}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Услуга *</InputLabel>
                                            <Select
                                                value={smartSearch.serviceId || ''}
                                                onChange={(e) => setSmartSearch(prev => ({ ...prev, serviceId: e.target.value }))}
                                            >
                                                {servicesArray.map(service => (
                                                    <MenuItem key={service.id} value={service.id}>
                                                        {service.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Предпочитаемый мастер</InputLabel>
                                            <Select
                                                value={smartSearch.preferredEmployeeId || ''}
                                                onChange={(e) => setSmartSearch(prev => ({ ...prev, preferredEmployeeId: e.target.value }))}
                                            >
                                                <MenuItem value="">Любой подходящий</MenuItem>
                                                {employees.map(emp => (
                                                    <MenuItem key={emp.id} value={emp.id}>
                                                        {emp.full_name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Stack>
                                    
                                    {/* Время и количество результатов */}
                                    <Stack direction="row" spacing={2}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Предпочитаемое время</InputLabel>
                                            <Select
                                                value={smartSearch.timePreference}
                                                onChange={(e) => setSmartSearch(prev => ({ ...prev, timePreference: e.target.value }))}
                                            >
                                                {Object.entries(TIME_PREFERENCES).map(([value, pref]) => (
                                                    <MenuItem key={value} value={value}>{pref.label}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        
                                        <TextField
                                            label="Макс. результатов"
                                            type="number"
                                            size="small"
                                            fullWidth
                                            value={smartSearch.maxResults}
                                            onChange={(e) => setSmartSearch(prev => ({ ...prev, maxResults: parseInt(e.target.value) || 10 }))}
                                            inputProps={{ min: 1, max: 50 }}
                                        />
                                    </Stack>
                                </Stack>
                                
                                <Box sx={{ mt: 2, textAlign: 'center' }}>
                                    <Button
                                        variant="contained"
                                        onClick={performSmartSearch}
                                        disabled={isSearching || !smartSearch.serviceId}
                                        startIcon={isSearching ? <ScheduleIcon /> : <AutoFixHighIcon />}
                                        sx={{ 
                                            textTransform: 'none',
                                            minWidth: 160
                                        }}
                                    >
                                        {isSearching ? 'Поиск...' : 'Найти подходящий слот'}
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                        
                        {/* Результаты поиска */}
                        {smartResults.length > 0 && (
                            <Card sx={{ border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                                <CardContent sx={{ p: 0 }}>
                                    <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            Найдено {smartResults.length} вариантов
                                        </Typography>
                                    </Box>
                                    
                                    <TableContainer sx={{ maxHeight: 500 }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600 }}>Дата и время</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>Мастер</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Загруженность</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>Оптимальность</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>Действие</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {smartResults.map((slot, index) => {
                                                    const workloadData = employeeWorkload.find(w => 
                                                        w.employee_id === slot.employee_id && w.period === slot.date
                                                    );
                                                    const currentWorkload = workloadData ? workloadData.workload_percent : 0;
                                                    const estimatedNewWorkload = calculateWorkloadChange(currentWorkload, slot.duration);
                                                    
                                                    return (
                                                        <TableRow 
                                                            key={index}
                                                            sx={{ 
                                                                '&:hover': { 
                                                                    backgroundColor: '#f5f7fa',
                                                                    cursor: 'pointer' 
                                                                }
                                                            }}
                                                            onClick={() => handleSlotSelect(slot)}
                                                        >
                                                            <TableCell>
                                                                <Box>
                                                                    <Typography variant="body2" fontWeight={500}>
                                                                        {format(new Date(slot.date), 'dd.MM.yyyy', { locale: ru })}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {slot.start_time} - {slot.end_time}
                                                                    </Typography>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2">
                                                                    {slot.employee_name}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                {renderWorkloadBar(currentWorkload, estimatedNewWorkload, slot.employee_name)}
                                                            </TableCell>
                                                            <TableCell>
                                                                {renderOptimalityChip(slot.optimality)}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    startIcon={<CheckCircleIcon />}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleSlotSelect(slot);
                                                                    }}
                                                                    sx={{ textTransform: 'none' }}
                                                                >
                                                                    Выбрать
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        )}
                        
                        {/* Сообщение об отсутствии результатов */}
                        {!isSearching && smartResults.length === 0 && smartSearch.serviceId && (
                            <Alert severity="info">
                                Не найдено подходящих временных слотов в указанный период. 
                                Попробуйте расширить диапазон дат или изменить предпочтения.
                            </Alert>
                        )}
                        
                        {/* Ошибки */}
                        {serverError && (
                            <Alert severity="error">
                                {serverError}
                            </Alert>
                        )}
                    </Stack>
                </DialogContent>
                
                <Divider />
                
                <DialogActions sx={{ p: 2 }}>
                    <Button 
                        onClick={() => { setOpenSmartDialog(false); resetSmartSearch(); }}
                        sx={{ textTransform: 'none' }}
                    >
                        Закрыть
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Диалог удаления */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>Удаление записи</DialogTitle>
                <DialogContent>
                    {appointmentToDelete && (
                        <Typography>
                            Удалить запись <strong>{getClientName(appointmentToDelete.client_id)}</strong> на услугу <strong>{getServiceName(appointmentToDelete.service_id)}</strong>?
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>Отмена</Button>
                    <Button onClick={confirmDeleteAppointment} color="error" variant="contained">
                        Удалить
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Уведомления */}
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
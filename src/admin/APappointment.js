import React, { useState, useEffect } from 'react';
import { Typography, Box, Button, TextField, TableContainer, 
    Paper, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, 
    FormControl, InputLabel, Dialog, DialogActions, DialogContent, DialogTitle, 
    FormControlLabel, Checkbox, Grid, Tooltip, IconButton, Divider, Snackbar, Alert} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { format, addMinutes, parseISO, isWithinInterval, addDays } from 'date-fns';
import AddIcon from '@mui/icons-material/Add';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import TodayIcon from '@mui/icons-material/Today';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

function APappointment({ records, clients, setClients, employees, services }) {
    
    const [openDialog, setOpenDialog] = useState(false);
    const [filter, setFilter] = useState('');
    const [serviceFilter, setServiceFilter] = useState('');
    const [masterFilter, setMasterFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [newRecord, setNewRecord] = useState({
        client_id: '',
        service_id: '',
        employee_id: '',
        date: '',
        time: '',
        status: 'created',
        is_completed: false,
        is_paid: false,
        notes: ''
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info'
    });
    const [addNewClient, setAddNewClient] = useState(false);
    const [newClient, setNewClient] = useState({
        full_name: '',
        phone: '',
        email: ''
    });
    const [availableEmployees, setAvailableEmployees] = useState([]);
    const [serviceQualifications, setServiceQualifications] = useState([]);
    const [servicePrice, setServicePrice] = useState(null);
    
    // Новые состояния для табличного представления
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [schedules, setSchedules] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    
    // Добавляем состояние для исключений (перерывов)
    const [scheduleExceptions, setScheduleExceptions] = useState([]);
    
    // Проверяем, что clients является массивом
    const clientsArray = Array.isArray(clients) ? clients : [];
    
    // Функция для проверки доступности временного слота
    const isTimeSlotAvailable = (employeeId, timeSlot, excludeAppointmentId = null) => {
        // Проверяем, работает ли сотрудник в это время
        if (!isEmployeeWorking(employeeId, timeSlot)) return false;
        
        // Проверяем, есть ли уже запись на это время
        const existingAppointment = getAppointmentForSlot(employeeId, timeSlot);
        
        // Если запись есть, но это та же запись, которую мы редактируем, считаем слот доступным
        if (existingAppointment && excludeAppointmentId && existingAppointment.id === excludeAppointmentId) {
            return true;
        }
        
        // Слот доступен, если на него нет записи
        return !existingAppointment;
    };
    
    // Функция для проверки доступности временного диапазона для записи
    const checkTimeRangeAvailability = (employeeId, startTime, duration, excludeAppointmentId = null) => {
        if (!startTime || !duration) return false;
        
        // Преобразуем время начала в объект Date
        const startDateTime = new Date(`${newRecord.date}T${startTime}:00`);
        
        // Проверяем каждый 15-минутный слот в диапазоне продолжительности услуги
        let currentSlot = startDateTime;
        const endDateTime = addMinutes(startDateTime, duration);
        
        while (currentSlot < endDateTime) {
            const timeSlot = format(currentSlot, 'HH:mm');
            if (!isTimeSlotAvailable(employeeId, timeSlot, excludeAppointmentId)) {
                return false;
            }
            currentSlot = addMinutes(currentSlot, 15);
        }
        
        return true;
    };

    // Новые состояния для редактирования и удаления
    const [editMode, setEditMode] = useState(false);
    const [currentAppointment, setCurrentAppointment] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [appointmentToDelete, setAppointmentToDelete] = useState(null);
    const [hoveredCell, setHoveredCell] = useState(null);
    
    // Загрузка расписаний и записей при изменении даты
    useEffect(() => {
        fetchSchedulesForDate(selectedDate);
        fetchAppointmentsForDate(selectedDate);
        fetchScheduleExceptions();
    }, [selectedDate]);
    
    // Функция для загрузки исключений (перерывов)
    const fetchScheduleExceptions = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/schedule_exceptions');
            if (response.ok) {
                const data = await response.json();
                setScheduleExceptions(data);
            }
        } catch (error) {
            console.error('Ошибка при загрузке исключений:', error);
        }
    };
    
    // Загрузка расписаний для выбранной даты
    const fetchSchedulesForDate = async (date) => {
        try {
            const formattedDate = format(date, 'yyyy-MM-dd');
            const response = await fetch(`http://localhost:5000/api/schedules`);
            if (response.ok) {
                const data = await response.json();
                // Фильтруем расписания для выбранной даты
                const filteredSchedules = data.filter(schedule => 
                    schedule.date === formattedDate
                );
                setSchedules(filteredSchedules);
                
                // Фильтруем сотрудников, которые работают в этот день
                const workingEmployeeIds = filteredSchedules.map(s => s.employee_id);
                const workingEmployees = employees.filter(emp => 
                    workingEmployeeIds.includes(emp.id)
                );
                setFilteredEmployees(workingEmployees);
                
                // Генерируем временные слоты
                generateTimeSlots(filteredSchedules);
            }
        } catch (error) {
            console.error('Ошибка при загрузке расписаний:', error);
        }
    };
    
    // Загрузка записей для выбранной даты
    const fetchAppointmentsForDate = async (date) => {
        try {
            const formattedDate = format(date, 'yyyy-MM-dd');
            const response = await fetch(`http://localhost:5000/api/appointments`);
            if (response.ok) {
                const data = await response.json();
                // Фильтруем записи для выбранной даты
                const filteredAppointments = data.filter(appointment => 
                    appointment.datetime && appointment.datetime.startsWith(formattedDate)
                );
                setAppointments(filteredAppointments);
            }
        } catch (error) {
            console.error('Ошибка при загрузке записей:', error);
        }
    };
    
    // Генерация временных слотов на основе расписаний
    const generateTimeSlots = (schedules) => {
        if (!schedules || schedules.length === 0) {
            setTimeSlots([]);
            return;
        }
        
        // Находим самое раннее начало и самое позднее окончание рабочего дня
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
        
        // Создаем временные слоты с интервалом 15 минут
        const slots = [];
        const startDate = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${earliestStart}`);
        const endDate = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${latestEnd}`);
        
        let currentSlot = startDate;
        while (currentSlot < endDate) {
            slots.push(format(currentSlot, 'HH:mm'));
            currentSlot = addMinutes(currentSlot, 15);
        }
        
        setTimeSlots(slots);
    };
    
    // Проверка, работает ли сотрудник в определенное время
    const isEmployeeWorking = (employeeId, timeSlot) => {
        const schedule = schedules.find(s => s.employee_id === employeeId);
        if (!schedule) return false;
        
        const slotTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${timeSlot}:00`);
        const startTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${schedule.start_time}`);
        const endTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${schedule.end_time}`);
        
        // Проверяем, не попадает ли временной слот в перерыв
        if (isInException(schedule.id, timeSlot)) {
            return false;
        }
        
        return isWithinInterval(slotTime, { start: startTime, end: endTime });
    };
    
    // Проверка, попадает ли временной слот в перерыв
    const isInException = (scheduleId, timeSlot) => {
        // Преобразуем ID в числовой тип для корректного сравнения
        const numericScheduleId = parseInt(scheduleId, 10);
        
        // Фильтруем исключения для данного расписания
        const exceptions = scheduleExceptions.filter(exc => 
            parseInt(exc.schedule_id, 10) === numericScheduleId
        );
        
        if (exceptions.length === 0) return false;
        
        // Проверяем, попадает ли временной слот в какое-либо исключение
        const slotTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${timeSlot}:00`);
        
        return exceptions.some(exc => {
            const exceptionStart = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${exc.start_time}`);
            const exceptionEnd = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${exc.end_time}`);
            
            return isWithinInterval(slotTime, { start: exceptionStart, end: exceptionEnd });
        });
    };
    
    // Получение информации о перерывах для тултипа
    const getExceptionsInfo = (employeeId) => {
        const schedule = schedules.find(s => s.employee_id === employeeId);
        if (!schedule) return '';
        
        // Преобразуем ID в числовой тип для корректного сравнения
        const scheduleId = parseInt(schedule.id, 10);
        
        // Фильтруем исключения для данного расписания
        const exceptions = scheduleExceptions.filter(exc => 
            parseInt(exc.schedule_id, 10) === scheduleId
        );
        
        if (exceptions.length === 0) return '';
        
        // Формируем текст для тултипа
        return exceptions.map(exc => 
            `${exc.start_time.slice(0, 5)} - ${exc.end_time.slice(0, 5)}: ${exc.reason}`
        ).join('\n');
    };
    
    // Получение записей для определенного временного слота и сотрудника
    const getAppointmentForSlot = (employeeId, timeSlot) => {
        // Получаем начало и конец текущего временного слота
        const slotStartTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${timeSlot}:00`);
        const slotEndTime = addMinutes(slotStartTime, 15);
        
        // Проверяем, попадает ли слот в какую-либо запись с учетом продолжительности услуги
        return appointments.find(appointment => {
            if (appointment.employee_id !== employeeId) return false;
            
            // Получаем время записи
            const appointmentDateTime = appointment.datetime ? new Date(appointment.datetime) : null;
            if (!appointmentDateTime) return false;
            
            // Находим услугу для определения продолжительности
            const service = services.find(s => s.id === appointment.service_id);
            if (!service) return false;
            
            // Вычисляем время окончания записи с учетом продолжительности услуги
            const appointmentEndTime = addMinutes(appointmentDateTime, service.duration);
            
            // Проверяем, перекрывается ли текущий слот с записью
            return (
                // Слот начинается во время записи
                (slotStartTime >= appointmentDateTime && slotStartTime < appointmentEndTime) ||
                // Слот заканчивается во время записи
                (slotEndTime > appointmentDateTime && slotEndTime <= appointmentEndTime) ||
                // Запись полностью содержит слот
                (slotStartTime <= appointmentDateTime && slotEndTime >= appointmentEndTime)
            );
        });
    };

    // Получение подробной информации о записи для тултипа
const getAppointmentDetailsForTooltip = (appointment) => {
    if (!appointment) return '';
    
    // Находим информацию о клиенте
    const client = clientsArray.find(c => c.id === appointment.client_id);
    // Находим информацию о услуге
    const service = services.find(s => s.id === appointment.service_id);
    
    // Форматируем время
    const appointmentTime = appointment.datetime ? 
        format(new Date(appointment.datetime), 'HH:mm') : 'Не указано';
    
    // Форматируем статус
    const statusLabels = {
        'created': 'Создана',
        'confirmed': 'Подтверждена',
        'completed': 'Завершена',
        'cancelled': 'Отменена'
    };
    
    // Собираем информацию
    const details = [
        `Клиент: ${client ? client.full_name : 'Не указан'}`,
        `Телефон: ${client && client.phone ? client.phone : 'Не указан'}`,
        `Услуга: ${service ? service.name : 'Не указана'}`,
        `Время: ${appointmentTime}`,
        `Длительность: ${service ? service.duration + ' мин.' : 'Не указана'}`,
        `Статус: ${statusLabels[appointment.status] || appointment.status}`,
        `Оплачено: ${appointment.is_paid ? 'Да' : 'Нет'}`,
        `Завершено: ${appointment.is_completed ? 'Да' : 'Нет'}`
    ];
    
    // Добавляем цену, если она указана
    if (service && service.price) {
        details.push(`Цена: ${service.price} ₽`);
    } else if (appointment.final_price) {
        details.push(`Цена: ${appointment.final_price} ₽`);
    }
    
    // Добавляем примечания, если они есть
    if (appointment.notes && appointment.notes.trim()) {
        details.push(`Примечания: ${appointment.notes}`);
    }
    
    return details.join('\n');
};
    
    // Получение информации о клиенте по ID
    const getClientName = (clientId) => {
        const client = clientsArray.find(c => c.id === clientId);
        return client ? client.full_name : 'Неизвестный клиент';
    };
    
    // Получение информации об услуге по ID
    const getServiceName = (serviceId) => {
        const service = services.find(s => s.id === serviceId);
        return service ? service.name : 'Неизвестная услуга';
    };
    
    // Получение цвета ячейки в зависимости от статуса записи
    const getAppointmentColor = (status) => {
        switch (status) {
            case 'created': return 'rgba(33, 150, 243, 0.2)'; // Синий
            case 'confirmed': return 'rgba(76, 175, 80, 0.2)'; // Зеленый
            case 'completed': return 'rgba(76, 175, 80, 0.5)'; // Темно-зеленый
            case 'cancelled': return 'rgba(244, 67, 54, 0.2)'; // Красный
            default: return 'rgba(33, 150, 243, 0.2)';
        }
    };

    // Обработчик изменения даты
    const handleDateChange = (newDate) => {
        setSelectedDate(newDate);
        // При изменении даты перезагружаем расписания и записи
        fetchSchedulesForDate(newDate);
        fetchAppointmentsForDate(newDate);
    };
    
    // Обработчик клика по ячейке для создания новой записи
const handleCellClick = (employeeId, timeSlot) => {
    // Проверяем, работает ли сотрудник в это время
    if (!isEmployeeWorking(employeeId, timeSlot)) return;
    
    // Проверяем, есть ли уже запись на это время
    const existingAppointment = getAppointmentForSlot(employeeId, timeSlot);
    if (existingAppointment) {
        // Открываем диалог для редактирования существующей записи
        handleEditAppointment(existingAppointment);
        return;
    }
    
    // Открываем диалог для создания новой записи
    setOpenDialog(true);
    setEditMode(false);
    setNewRecord({
        client_id: '',
        service_id: '',
        employee_id: employeeId,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: timeSlot,
        status: 'created',
        is_completed: false,
        is_paid: false,
        notes: ''
    });
    setAvailableEmployees([employees.find(emp => emp.id === employeeId)].filter(Boolean));
    setServicePrice(null);
};
    
    // Обработчик редактирования записи
    const handleEditAppointment = (appointment) => {
        setEditMode(true);
        setCurrentAppointment(appointment);
        
        // Получаем дату и время из datetime
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
            notes: appointment.notes || ''
        });
        
        // Устанавливаем выбранного мастера в список доступных мастеров
        const selectedEmployee = employees.find(emp => emp.id === appointment.employee_id);
        if (selectedEmployee) {
            setAvailableEmployees([selectedEmployee]);
        }
        
        // Если есть связанная услуга, устанавливаем её цену
        const service = services.find(s => s.id === appointment.service_id);
        if (service) {
            setServicePrice(service.base_price);
        }
        
        setOpenDialog(true);
    };
    
    // Обработчик удаления записи
    const handleDeleteAppointment = (appointment) => {
        setAppointmentToDelete(appointment);
        setOpenDeleteDialog(true);
    };
    
    // Подтверждение удаления записи
    const confirmDeleteAppointment = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/appointments/${appointmentToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                // Обновляем список записей
                setAppointments(appointments.filter(app => app.id !== appointmentToDelete.id));
                setOpenDeleteDialog(false);
                setAppointmentToDelete(null);
            } else {
                alert('Ошибка при удалении записи');
            }
        } catch (error) {
            console.error('Ошибка при удалении записи:', error);
            alert('Ошибка при удалении записи');
        }
    };
    
    // Обработчик наведения мыши на ячейку
    const handleCellMouseEnter = (employeeId, timeSlot) => {
        const appointment = getAppointmentForSlot(employeeId, timeSlot);
        if (appointment) {
            setHoveredCell(`${employeeId}-${timeSlot}`);
        }
    };
    
    // Обработчик ухода мыши с ячейки
    const handleCellMouseLeave = () => {
        setHoveredCell(null);
    };
    
    // Обработчик сохранения записи (создание или редактирование)
    const handleSaveAppointment = async () => {
        try {
            // Формируем данные для отправки
            const appointmentData = {
                client_id: newRecord.client_id,
                service_id: newRecord.service_id,
                employee_id: newRecord.employee_id,
                datetime: `${newRecord.date}T${newRecord.time}:00`,
                status: newRecord.status,
                is_completed: newRecord.is_completed,
                is_paid: newRecord.is_paid,
                notes: newRecord.notes
            };
            
            let response;
            
            if (editMode) {
                // Редактирование существующей записи
                response = await fetch(`http://localhost:5000/api/appointments/${newRecord.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(appointmentData)
                });
            } else {
                // Создание новой записи
                response = await fetch('http://localhost:5000/api/appointments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(appointmentData)
                });
            }
            
            if (response.ok) {
                const data = await response.json();
                
                if (editMode) {
                    // Обновляем запись в списке
                    setAppointments(appointments.map(app => 
                        app.id === data.id ? data : app
                    ));
                } else {
                    // Добавляем новую запись в список
                    setAppointments([...appointments, data]);
                }
                
                setOpenDialog(false);
                setEditMode(false);
                setCurrentAppointment(null);
            } else {
                alert(`Ошибка при ${editMode ? 'обновлении' : 'создании'} записи`);
            }
        } catch (error) {
            console.error(`Ошибка при ${editMode ? 'обновлении' : 'создании'} записи:`, error);
            alert(`Ошибка при ${editMode ? 'обновлении' : 'создании'} записи`);
        }
    };

    const [appointmentError, setAppointmentError] = useState(null);
const [conflictAppointment, setConflictAppointment] = useState(null);

// Функция для обработки создания новой записи
const handleCreateAppointment = async () => {
    try {
        // Сбрасываем предыдущие ошибки
        setAppointmentError(null);
        setConflictAppointment(null);
        
        // Проверяем, что выбраны все необходимые поля
        if (!newRecord.client_id || !newRecord.service_id || !newRecord.employee_id || !newRecord.date || !newRecord.time) {
            setAppointmentError('Пожалуйста, заполните все обязательные поля');
            return;
        }
        
        // Формируем объект для отправки на сервер
        const appointmentData = {
            client_id: newRecord.client_id,
            service_id: newRecord.service_id,
            employee_id: newRecord.employee_id,
            datetime: `${newRecord.date}T${newRecord.time}:00`,
            status: newRecord.status,
            is_completed: newRecord.is_completed,
            is_paid: newRecord.is_paid,
            notes: newRecord.notes || ''
        };
        
        // Определяем URL и метод запроса в зависимости от режима (создание или редактирование)
        const url = editMode ? `http://localhost:5000/api/appointments/${currentAppointment.id}` : 'http://localhost:5000/api/appointments';
        const method = editMode ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appointmentData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            // Обрабатываем разные типы ошибок конфликтов
            if (response.status === 409) {
                setAppointmentError(data.error);
                
                // Если конфликт с другой записью, сохраняем ID конфликтующей записи
                if (data.conflict_appointment_id) {
                    // Загружаем подробную информацию о конфликтующей записи
                    const conflictResponse = await fetch(`http://localhost:5000/api/appointments/${data.conflict_appointment_id}`);
                    if (conflictResponse.ok) {
                        const conflictData = await conflictResponse.json();
                        setConflictAppointment(conflictData);
                    }
                }
            } else {
                setAppointmentError(data.error || 'Произошла ошибка при создании записи');
            }
            return;
        }
        
        // Закрываем диалог и обновляем данные при успешном создании/редактировании
        setOpenDialog(false);
        fetchAppointmentsForDate(selectedDate);
        
        // Показываем уведомление об успешном выполнении
        showSnackbar(
            editMode ? 'Запись успешно обновлена' : 'Запись успешно создана', 
            'success'
        );
        
        // Сбрасываем значения формы
        resetForm();
    } catch (error) {
        console.error('Ошибка при создании/обновлении записи:', error);
        setAppointmentError('Произошла ошибка при взаимодействии с сервером');
    }
};

// Функция для показа уведомления (если ее еще нет, добавляем)
const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
        open: true,
        message,
        severity
    });
};

// Функция для закрытия уведомления
const handleCloseSnackbar = () => {
    setSnackbar({
        ...snackbar,
        open: false
    });
};

// Функция для сброса формы
const resetForm = () => {
    setNewRecord({
        client_id: '',
        service_id: '',
        employee_id: '',
        date: '',
        time: '',
        status: 'created',
        is_completed: false,
        is_paid: false,
        notes: ''
    });
    setAppointmentError(null);
    setConflictAppointment(null);
    setEditMode(false);
    setCurrentAppointment(null);
};

    // Функция для отображения содержимого ячейки
const renderTableCell = (employeeId, timeSlot) => {
    // Получаем запись для данного временного слота и сотрудника
    const appointment = getAppointmentForSlot(employeeId, timeSlot);
    
    // Если нет записи, просто отображаем пустую ячейку
    if (!appointment) {
        return (
            <TableCell 
                key={`${employeeId}-${timeSlot}`}
                sx={{
                    backgroundColor: isEmployeeWorking(employeeId, timeSlot) 
                        ? 'white' 
                        : 'rgba(0, 0, 0, 0.05)',
                    cursor: isEmployeeWorking(employeeId, timeSlot) ? 'pointer' : 'default',
                    padding: '4px 8px',
                    height: '40px',
                    borderBottom: '1px solid rgba(224, 224, 224, 1)'
                }}
                onClick={() => handleCellClick(employeeId, timeSlot)}
            />
        );
    }
    
    // Определяем, является ли эта ячейка началом записи
    const isAppointmentStart = appointment.datetime && 
        format(new Date(appointment.datetime), 'HH:mm') === timeSlot;
    
    // Если это не начало записи, возвращаем null - эта ячейка будет перекрыта rowSpan
    if (!isAppointmentStart) {
        return null;
    }
    
    // Для начала записи определяем длительность услуги и сколько слотов она занимает
    const service = services.find(s => s.id === appointment.service_id);
    if (!service) {
        return (
            <TableCell 
                key={`${employeeId}-${timeSlot}`}
                sx={{
                    backgroundColor: getAppointmentColor(appointment.status),
                    cursor: 'pointer',
                    padding: '4px 8px',
                    height: '40px',
                    borderBottom: '1px solid rgba(224, 224, 224, 1)'
                }}
                onClick={() => handleCellClick(employeeId, timeSlot)}
            >
                <Typography variant="caption">Ошибка: услуга не найдена</Typography>
            </TableCell>
        );
    }
    
    // Вычисляем количество 15-минутных слотов, которые займет услуга
    const rowSpan = Math.ceil(service.duration / 15);
    
    // Находим информацию о клиенте
    const client = clientsArray.find(c => c.id === appointment.client_id);
    
    return (
        <TableCell 
            key={`${employeeId}-${timeSlot}`}
            rowSpan={rowSpan}
            sx={{
                backgroundColor: getAppointmentColor(appointment.status),
                cursor: 'pointer',
                position: 'relative',
                border: '2px solid rgba(0, 0, 0, 0.2)',
                padding: '4px 8px',
                verticalAlign: 'top'
            }}
            onClick={() => handleCellClick(employeeId, timeSlot)}
            onMouseEnter={() => setHoveredCell(`${employeeId}-${timeSlot}`)}
            onMouseLeave={() => setHoveredCell(null)}
        >
            <Tooltip 
                title={getAppointmentDetailsForTooltip(appointment)} 
                arrow
                placement="top"
                componentsProps={{
                    tooltip: {
                        sx: {
                            bgcolor: 'rgba(97, 97, 97, 0.9)',
                            whiteSpace: 'pre-line'
                        },
                    },
                }}
            >
                <Box>
                    <Typography variant="caption" component="div" sx={{ fontWeight: 'bold' }}>
                        {client ? client.full_name : 'Нет клиента'}
                    </Typography>
                    <Typography variant="caption" component="div" noWrap>
                        {service.name}
                    </Typography>
                    <Typography variant="caption" component="div" sx={{ color: 'text.secondary' }}>
                        {format(new Date(appointment.datetime), 'HH:mm')} 
                        - 
                        {format(addMinutes(new Date(appointment.datetime), service.duration), 'HH:mm')}
                    </Typography>
                </Box>
            </Tooltip>
            {hoveredCell === `${employeeId}-${timeSlot}` && (
                <Box 
                    sx={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        display: 'flex',
                        gap: '2px'
                    }}
                >
                    <IconButton 
                        size="small" 
                        sx={{ 
                            bgcolor: 'rgba(255, 255, 255, 0.7)', 
                            width: 20, 
                            height: 20,
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' }
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditAppointment(appointment);
                        }}
                    >
                        <EditIcon fontSize="small" sx={{ fontSize: 14 }} />
                    </IconButton>
                    <IconButton 
                        size="small" 
                        sx={{ 
                            bgcolor: 'rgba(255, 255, 255, 0.7)', 
                            width: 20, 
                            height: 20,
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' }
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setAppointmentToDelete(appointment);
                            setOpenDeleteDialog(true);
                        }}
                    >
                        <DeleteIcon fontSize="small" sx={{ fontSize: 14 }} />
                    </IconButton>
                </Box>
            )}
        </TableCell>
    );
};
    
    // Переключение на предыдущий день
    const handlePreviousDay = () => {
        const prevDay = new Date(selectedDate);
        prevDay.setDate(prevDay.getDate() - 1);
        setSelectedDate(prevDay);
    };
    
    // Переключение на следующий день
    const handleNextDay = () => {
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        setSelectedDate(nextDay);
    };
    
    // Переключение на текущий день
    const handleToday = () => {
        setSelectedDate(new Date());
    };
    
    // Получение квалификаций для выбранной услуги
    const fetchServiceQualifications = async (serviceId) => {
        try {
            const response = await fetch('http://localhost:5000/api/service_qualifications');
            if (response.ok) {
                const data = await response.json();
                // Фильтруем только те записи, которые относятся к выбранной услуге
                const filteredData = data.filter(item => item.service_id === serviceId);
                setServiceQualifications(filteredData);
                return filteredData;
            }
        } catch (error) {
            console.error('Ошибка при получении квалификаций услуги:', error);
        }
        return [];
    };

    // Обновление списка доступных мастеров при выборе услуги
const updateAvailableEmployees = async (serviceId) => {
    if (!serviceId) {
        setAvailableEmployees([]);
        setServicePrice(null);
        return;
    }

    try {
        // Получаем выбранную услугу
        const selectedService = services.find(s => s.id === serviceId);
        if (!selectedService) return;

        // Получаем квалификации для услуги
        const qualifications = await fetchServiceQualifications(serviceId);
        
        // Фильтруем сотрудников по специализации и квалификации
        const filtered = employees.filter(emp => {
            // Проверяем, что специализация сотрудника соответствует специализации услуги
            if (emp.specialization_id !== selectedService.specialization_id) return false;
            
            // Проверяем, что квалификация сотрудника позволяет выполнять услугу
            return qualifications.some(q => 
                q.qualification_id === emp.qualification_level_id && q.is_allowed
            );
        });
        
        // Дополнительно проверяем доступность временного диапазона для каждого сотрудника
        const availableEmps = filtered.filter(emp => {
            return checkTimeRangeAvailability(
                emp.id, 
                newRecord.time, 
                selectedService.duration,
                editMode ? newRecord.id : null
            );
        });
        
        setAvailableEmployees(availableEmps);
        
        // Сбрасываем выбранного мастера, если он не доступен для новой услуги
        if (newRecord.employee_id && !availableEmps.some(emp => emp.id === newRecord.employee_id)) {
            setNewRecord(prev => ({ ...prev, employee_id: '' }));
            setServicePrice(null);
        }
    } catch (error) {
        console.error('Ошибка при обновлении списка мастеров:', error);
        setAvailableEmployees([]);
    }
};

    // Обновление цены услуги при выборе мастера
    const updateServicePrice = (serviceId, employeeId) => {
        if (!serviceId || !employeeId) {
            setServicePrice(null);
            return;
        }

        try {
            // Получаем выбранную услугу
            const selectedService = services.find(s => s.id === serviceId);
            if (!selectedService) return;

            // Получаем выбранного мастера
            const selectedEmployee = employees.find(e => e.id === employeeId);
            if (!selectedEmployee) return;

            // Находим модификатор цены для квалификации мастера
            const qualification = serviceQualifications.find(q => 
                q.qualification_id === selectedEmployee.qualification_level_id
            );

            if (qualification) {
                // Если есть модификатор цены, используем его
                setServicePrice(qualification.price_modified || selectedService.base_price);
            } else {
                // Иначе используем базовую цену
                setServicePrice(selectedService.base_price);
            }
        } catch (error) {
            console.error('Ошибка при обновлении цены услуги:', error);
            setServicePrice(null);
        }
    };

    const handleClientChange = (e) => {
        if (e.target.value === 'new') {
            setAddNewClient(true);
            setNewRecord(prev => ({ ...prev, client_id: '' }));
        } else {
            setAddNewClient(false);
            setNewRecord(prev => ({ ...prev, client_id: e.target.value }));
        }
    };

    const handleServiceChange = (e) => {
        const serviceId = e.target.value;
        setNewRecord(prev => ({ ...prev, service_id: serviceId }));
        updateAvailableEmployees(serviceId);
    };

    const handleEmployeeChange = (e) => {
        const employeeId = e.target.value;
        setNewRecord(prev => ({ ...prev, employee_id: employeeId }));
        updateServicePrice(newRecord.service_id, employeeId);
    };

    const handleAddClient = async () => {
        const resp = await fetch('http://localhost:5000/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newClient)
        });
        if (resp.ok) {
            const created = await resp.json();
            setClients(prev => [...prev, created]);
            setNewRecord(prev => ({ ...prev, client_id: created.id }));
            setAddNewClient(false);
            setNewClient({ full_name: '', phone: '', email: '' });
        } else {
            alert('Ошибка при создании клиента');
        }
    };

    // Проверяем, что records является массивом
    const recordsArray = Array.isArray(records) ? records : [];

    const filteredRecords = recordsArray.filter(record =>
        (record.name.toLowerCase().includes(filter.toLowerCase()) ||
            record.service.toLowerCase().includes(filter.toLowerCase()) ||
            record.master.toLowerCase().includes(filter.toLowerCase())) &&
        (serviceFilter === '' || record.service === serviceFilter) &&
        (masterFilter === '' || record.master === masterFilter) &&
        (statusFilter === '' || record.status === statusFilter)
    );

    const handleOpenDialog = () => {
        setOpenDialog(true);
        setNewRecord({
            client_id: '',
            service_id: '',
            employee_id: '',
            date: format(selectedDate, 'yyyy-MM-dd'),
            time: '',
            status: 'created',
            is_completed: false,
            is_paid: false,
            notes: ''
        });
        setAvailableEmployees([]);
        setServicePrice(null);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditMode(false);
        setCurrentAppointment(null);
        setNewRecord({
            client_id: '',
            service_id: '',
            employee_id: '',
            date: '',
            time: '',
            status: 'created',
            is_completed: false,
            is_paid: false,
            notes: ''
        });
        resetForm();
    };

    // Обновляем функцию отправки формы
const handleSubmit = (e) => {
    e.preventDefault();
    handleCreateAppointment();
};

    const handleAddRecord = async () => {
        let clientId = newRecord.client_id;
        if (addNewClient) {
            const resp = await fetch('http://localhost:5000/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newClient)
            });
            if (resp.ok) {
                const created = await resp.json();
                clientId = created.id;
            } else {
                alert('Ошибка при создании клиента');
                return;
            }
        }
        const datetime = newRecord.date && newRecord.time
            ? `${newRecord.date}T${newRecord.time}:00`
            : null;
        const appointmentData = {
            client_id: clientId,
            service_id: newRecord.service_id,
            employee_id: newRecord.employee_id,
            status: newRecord.status || 'created',
            datetime,
            is_completed: !!newRecord.is_completed,
            is_paid: !!newRecord.is_paid,
            notes: newRecord.notes || '',
            final_price: servicePrice
        };
        const resp = await fetch('http://localhost:5000/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appointmentData)
        });
        if (resp.ok) {
            handleCloseDialog();
            // Обновляем список записей
            fetchAppointmentsForDate(selectedDate);
        } else {
            alert('Ошибка при создании записи');
        }
    };

    // Проверяем, что services и employees являются массивами
    const servicesArray = Array.isArray(services) ? services : [];

    return (
        <Box>
            <Typography variant="h6" align="center" gutterBottom>Управление записями</Typography>
            
            {/* Панель управления датой */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={handlePreviousDay}>
                        <NavigateBeforeIcon />
                    </IconButton>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                        <DatePicker
                            value={selectedDate}
                            onChange={setSelectedDate}
                            renderInput={(params) => <TextField {...params} />}
                        />
                    </LocalizationProvider>
                    <IconButton onClick={handleNextDay}>
                        <NavigateNextIcon />
                    </IconButton>
                    <IconButton onClick={handleToday}>
                        <TodayIcon />
                    </IconButton>
                </Box>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    onClick={handleOpenDialog}
                >
                    Добавить запись
                </Button>
            </Box>
            
            {/* Таблица с записями */}
            <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ minWidth: 80, fontWeight: 'bold' }}>Время</TableCell>
                            {filteredEmployees.map(employee => (
                                <TableCell 
                                    key={employee.id} 
                                    align="center"
                                    sx={{ minWidth: 150, fontWeight: 'bold' }}
                                >
                                    <Tooltip 
                                        title={getExceptionsInfo(employee.id)} 
                                        arrow
                                        placement="top"
                                        componentsProps={{
                                            tooltip: {
                                                sx: {
                                                    bgcolor: 'rgba(97, 97, 97, 0.9)',
                                                    whiteSpace: 'pre-line',
                                                    display: getExceptionsInfo(employee.id) ? 'block' : 'none'
                                                },
                                            },
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {employee.full_name}
                                        </Box>
                                    </Tooltip>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                    {timeSlots.map(timeSlot => (
                        <TableRow key={timeSlot}>
                            <TableCell sx={{ fontWeight: 'bold', width: '80px' }}>
                                {timeSlot}
                            </TableCell>
                            {filteredEmployees.map(employee => {
                                const cellContent = renderTableCell(employee.id, timeSlot);
                                // Если renderTableCell вернул null, значит эта ячейка должна быть пропущена
                                // (является продолжением предыдущей записи)
                                return cellContent !== null ? cellContent : <React.Fragment key={`${employee.id}-${timeSlot}-empty`} />;
                            })}
                        </TableRow>
                    ))}
                </TableBody>
                </Table>
            </TableContainer>
            
            {/* Диалог добавления/редактирования записи */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editMode ? 'Редактировать запись' : 'Создать новую запись'}
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Клиент</InputLabel>
                        <Select
                            value={addNewClient ? 'new' : (newRecord.client_id || '')}
                            onChange={handleClientChange}
                        >
                            {clientsArray.map(client => (
                                <MenuItem key={client.id} value={client.id}>{client.full_name}</MenuItem>
                            ))}
                            <MenuItem value="new">Добавить нового клиента</MenuItem>
                        </Select>
                    </FormControl>
                    {addNewClient && (
                        <Box>
                            <TextField
                                label="ФИО"
                                fullWidth
                                margin="normal"
                                value={newClient.full_name}
                                onChange={e => setNewClient({ ...newClient, full_name: e.target.value })}
                            />
                            <TextField
                                label="Телефон"
                                fullWidth
                                margin="normal"
                                value={newClient.phone}
                                onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                            />
                            <TextField
                                label="Email"
                                fullWidth
                                margin="normal"
                                value={newClient.email}
                                onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                <Button
                                    onClick={handleAddClient}
                                    variant="contained"
                                    color="primary"
                                >
                                    Добавить клиента
                                </Button>
                            </Box>
                        </Box>
                    )}
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Услуга</InputLabel>
                        <Select
                            value={newRecord.service_id || ''}
                            onChange={handleServiceChange}
                        >
                            {servicesArray.map(service => (
                                <MenuItem key={service.id} value={service.id}>{service.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Мастер</InputLabel>
                        <Select
                            value={newRecord.employee_id || ''}
                            onChange={handleEmployeeChange}
                            disabled={!newRecord.service_id}
                        >
                            {availableEmployees.map(emp => (
                                <MenuItem key={emp.id} value={emp.id}>{emp.full_name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {servicePrice !== null && (
                        <Typography variant="subtitle1" sx={{ mt: 1, color: 'primary.main' }}>
                            Стоимость услуги: {servicePrice} руб.
                        </Typography>
                    )}
                    <TextField
                        label="Дата"
                        type="date"
                        fullWidth
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                        value={newRecord.date}
                        onChange={e => setNewRecord({ ...newRecord, date: e.target.value })}
                    />
                    <TextField
                        label="Время"
                        type="time"
                        fullWidth
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                        value={newRecord.time}
                        onChange={e => setNewRecord({ ...newRecord, time: e.target.value })}
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Статус</InputLabel>
                        <Select
                            value={newRecord.status || 'created'}
                            onChange={e => setNewRecord({ ...newRecord, status: e.target.value })}
                        >
                            <MenuItem value="created">Создана</MenuItem>
                            <MenuItem value="confirmed">Подтверждена</MenuItem>
                            <MenuItem value="completed">Завершена</MenuItem>
                            <MenuItem value="cancelled">Отменена</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={!!newRecord.is_completed}
                                onChange={e => setNewRecord({ ...newRecord, is_completed: e.target.checked })}
                            />
                        }
                        label="Завершено"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={!!newRecord.is_paid}
                                onChange={e => setNewRecord({ ...newRecord, is_paid: e.target.checked })}
                            />
                        }
                        label="Оплачено"
                    />
                    <TextField
                        label="Заметки"
                        fullWidth
                        margin="normal"
                        value={newRecord.notes || ''}
                        onChange={e => setNewRecord({ ...newRecord, notes: e.target.value })}
                    />
                    {/* Отображение ошибок */}
                    {appointmentError && (
                    <Box sx={{ mt: 2, mb: 1, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                        <Typography color="error" variant="subtitle2">
                            {appointmentError}
                        </Typography>
                        
                        {/* Отображение информации о конфликтующей записи */}
                        {conflictAppointment && (
                            <Box sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                                <Typography variant="subtitle2">
                                    Конфликт с записью:
                                </Typography>
                                <Typography variant="body2">
                                    Клиент: {getClientName(conflictAppointment.client_id)}
                                </Typography>
                                <Typography variant="body2">
                                    Услуга: {getServiceName(conflictAppointment.service_id)}
                                </Typography>
                                <Typography variant="body2">
                                    Время: {conflictAppointment.datetime 
                                        ? format(new Date(conflictAppointment.datetime), 'dd.MM.yyyy HH:mm') 
                                        : 'Не указано'}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseDialog}>Отмена</Button>
                <Button type="submit" variant="contained" color="primary">
                    {editMode ? 'Сохранить' : 'Создать'}
                </Button>
            </DialogActions>
        </form>
    </Dialog>

                {/* Добавляем компонент Snackbar для уведомлений */}
                <Snackbar 
                    open={snackbar.open} 
                    autoHideDuration={6000} 
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            
            {/* Диалог подтверждения удаления */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>Подтверждение удаления</DialogTitle>
                <DialogContent>
                    {appointmentToDelete && (
                        <Typography>
                            Вы действительно хотите удалить запись клиента {getClientName(appointmentToDelete.client_id)} 
                            на услугу {getServiceName(appointmentToDelete.service_id)}?
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>Отмена</Button>
                    <Button onClick={confirmDeleteAppointment} color="error">Удалить</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default APappointment;
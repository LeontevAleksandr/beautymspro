import React, { useState, useEffect } from 'react';
import { Typography, Box, Button, TextField, TableContainer, 
    Paper, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, 
    FormControl, InputLabel, Dialog, DialogActions, DialogContent, DialogTitle, 
    FormControlLabel, Checkbox, Grid, Tooltip, IconButton, Divider } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { format, addMinutes, parseISO, isWithinInterval } from 'date-fns';
import AddIcon from '@mui/icons-material/Add';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import TodayIcon from '@mui/icons-material/Today';

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
        return appointments.find(appointment => {
            if (appointment.employee_id !== employeeId) return false;
            
            const appointmentTime = appointment.datetime ? 
                format(new Date(appointment.datetime), 'HH:mm') : '';
            
            return appointmentTime === timeSlot;
        });
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
    
    // Обработчик клика по ячейке для создания новой записи
    const handleCellClick = (employeeId, timeSlot) => {
        // Проверяем, работает ли сотрудник в это время
        if (!isEmployeeWorking(employeeId, timeSlot)) return;
        
        // Проверяем, есть ли уже запись на это время
        const existingAppointment = getAppointmentForSlot(employeeId, timeSlot);
        if (existingAppointment) {
            // Здесь можно добавить логику для редактирования существующей записи
            return;
        }
        
        // Открываем диалог для создания новой записи
        setOpenDialog(true);
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
            
            setAvailableEmployees(filtered);
            
            // Сбрасываем выбранного мастера, если он не доступен для новой услуги
            if (newRecord.employee_id && !filtered.some(emp => emp.id === newRecord.employee_id)) {
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
            
            <TableContainer component={Paper} sx={{ mb: 4, overflow: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ minWidth: 60, maxWidth: 70, width: 65 }}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Время
                                </Typography>
                            </TableCell>
                            {filteredEmployees.map(employee => (
                                <TableCell key={employee.id} align="center" sx={{ minWidth: 150 }}>
                                    {employee.full_name}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {timeSlots.map(slot => (
                            <TableRow key={slot}>
                                <TableCell component="th" scope="row" sx={{ fontSize: '1.1rem', fontWeight: 'medium' }}>
                                    {slot}
                                </TableCell>
                                {filteredEmployees.map(employee => {
                                    const appointment = getAppointmentForSlot(employee.id, slot);
                                    const isWorking = isEmployeeWorking(employee.id, slot);
                                    const schedule = schedules.find(s => s.employee_id === employee.id);
                                    const hasExceptions = schedule ? getExceptionsInfo(employee.id) : '';
                                    
                                    let tooltipText = '';
                                    if (appointment) {
                                        tooltipText = `Клиент: ${getClientName(appointment.client_id)}\nУслуга: ${getServiceName(appointment.service_id)}\nСтатус: ${appointment.status}`;
                                    } else if (!isWorking && hasExceptions && isInException(schedule?.id, slot)) {
                                        tooltipText = `Перерыв:\n${hasExceptions}`;
                                    }
                                    
                                    return (
                                        <TableCell 
                                            key={employee.id} 
                                            align="center" 
                                            onClick={() => handleCellClick(employee.id, slot)}
                                            sx={{ 
                                                bgcolor: appointment 
                                                    ? getAppointmentColor(appointment.status)
                                                    : (isWorking ? 'rgba(255, 255, 255, 0.9)' : 
                                                        (hasExceptions && isInException(schedule?.id, slot) 
                                                            ? 'rgba(156, 39, 176, 0.15)' 
                                                            : 'rgba(0, 0, 0, 0.04)')),
                                                cursor: isWorking && !appointment ? 'pointer' : 'default',
                                                '&:hover': {
                                                    bgcolor: isWorking && !appointment 
                                                        ? 'rgba(0, 0, 0, 0.08)' 
                                                        : appointment 
                                                            ? getAppointmentColor(appointment.status) 
                                                            : (hasExceptions && isInException(schedule?.id, slot) 
                                                                ? 'rgba(156, 39, 176, 0.25)' 
                                                                : 'rgba(0, 0, 0, 0.04)')
                                                }
                                            }}
                                        >
                                            {appointment ? (
                                                <Tooltip title={tooltipText} arrow placement="top">
                                                    <Box>
                                                        <Typography variant="caption" display="block">
                                                            {getClientName(appointment.client_id)}
                                                        </Typography>
                                                        <Typography variant="caption" display="block">
                                                            {getServiceName(appointment.service_id)}
                                                        </Typography>
                                                    </Box>
                                                </Tooltip>
                                            ) : (
                                                hasExceptions && isInException(schedule?.id, slot) ? (
                                                    <Tooltip title={tooltipText} arrow placement="top">
                                                        <Box sx={{ 
                                                            width: '80%', 
                                                            height: '3px', 
                                                            bgcolor: 'rgba(156, 39, 176, 0.6)',
                                                            margin: '0 auto',
                                                            borderRadius: '2px'
                                                        }} />
                                                    </Tooltip>
                                                ) : null
                                            )}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            
            {/* Диалог добавления/редактирования записи */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md">
                <DialogTitle>Добавить новую запись</DialogTitle>
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
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="secondary">Отмена</Button>
                    <Button onClick={handleAddRecord} color="primary">Добавить</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default APappointment;
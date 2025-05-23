import React, { useState, useEffect } from 'react';
import { 
    Typography, Box, Button, Paper, Grid, TextField, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogActions, DialogContent, DialogTitle,
    FormControl, InputLabel, Select, MenuItem, IconButton,
    Snackbar, Alert, Checkbox, FormControlLabel, FormGroup,
    Tooltip, Divider, Stack
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, TimePicker, StaticDatePicker } from '@mui/x-date-pickers';
import { ru } from 'date-fns/locale';
import { 
    Delete, Add, Schedule, 
    ArrowBackIos, ArrowForwardIos, Today, Person, Info
} from '@mui/icons-material';
import { 
    format, addDays, isSameDay, isWeekend, 
    startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks
} from 'date-fns';

function APschedule() {
    // Состояния для сотрудников
    const [employees, setEmployees] = useState([]);
    const [selectedEmployees] = useState([]);
    
    // Состояния для графика
    const [schedules, setSchedules] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [workHours] = useState({
        start_time: new Date(new Date().setHours(9, 0, 0)),
        end_time: new Date(new Date().setHours(18, 0, 0))
    });

    // Состояние для исключений (перерывов)
    const [scheduleExceptions, setScheduleExceptions] = useState([]);
    
    // Загрузка данных при монтировании компонента
    useEffect(() => {
        fetchEmployees();
        fetchSchedules();
        fetchAllExceptions();
    }, []);
    
    // Функция для загрузки всех исключений
    const fetchAllExceptions = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/schedule_exceptions');
            if (response.ok) {
                const data = await response.json();
                setScheduleExceptions(data);
            }
        } catch (error) {
            showSnackbar('Ошибка при загрузке исключений', 'error');
        }
    };
    
    // Состояние для диалога добавления/редактирования рабочего времени
    const [timeDialog, setTimeDialog] = useState({
        open: false,
        employeeId: null,
        date: null,
        startTime: null,
        endTime: null,
        isEdit: false,
        exceptions: [] // Добавляем массив для хранения исключений
    });
    
    // Добавляем состояние для нового исключения
    const [newException, setNewException] = useState({
        startTime: new Date(new Date().setHours(13, 0, 0)),
        endTime: new Date(new Date().setHours(14, 0, 0)),
        reason: 'Обеденный перерыв'
    });
    
    // Состояние для уведомлений
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    
    // Добавляем состояние для диалога автоматического заполнения
    const [autoFillDialog, setAutoFillDialog] = useState({
        open: false,
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
        formula: '1/1',
        employees: [],
        selectedRange: false,
        workHours: {
            start_time: new Date(new Date().setHours(9, 0, 0)),
            end_time: new Date(new Date().setHours(18, 0, 0))
        }
    });

    // Функции для работы с сотрудниками
    const fetchEmployees = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/employees');
            if (response.ok) {
                const data = await response.json();
                setEmployees(data);
            } else {
                showSnackbar('Ошибка при загрузке сотрудников', 'error');
            }
        } catch (error) {
            showSnackbar('Ошибка сети при загрузке сотрудников', 'error');
        }
    };

    // Функции для работы с графиком
    const fetchSchedules = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/schedules');
            if (response.ok) {
                const data = await response.json();
                setSchedules(data);
            }
        } catch (error) {
            showSnackbar('Ошибка при загрузке графиков', 'error');
        }
    };

    // Получение рабочего графика для сотрудника на конкретную дату
    const getScheduleForDay = (date, employeeId) => {
        return schedules.find(schedule => 
            schedule.employee_id === employeeId && 
            isSameDay(new Date(schedule.date), date)
        );
    };

    // Удаление рабочего дня
    const deleteWorkingDay = async (employeeId, date) => {
        // Находим ID записи в графике для удаления
        const scheduleToDelete = schedules.find(s => 
            s.employee_id === employeeId && 
            isSameDay(new Date(s.date), date)
        );

        if (!scheduleToDelete) {
            showSnackbar('Запись не найдена', 'error');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/schedules/${scheduleToDelete.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showSnackbar('Рабочий день успешно удален', 'success');
                fetchSchedules(); // Обновляем список графиков
                fetchAllExceptions(); // Обновляем список исключений
            } else {
                showSnackbar('Ошибка при удалении рабочего дня', 'error');
            }
        } catch (error) {
            showSnackbar('Ошибка сети при удалении рабочего дня', 'error');
        }
    };

    // Открытие диалога добавления/редактирования рабочего времени
    const openTimeDialog = (employeeId, date, isEdit = false) => {
        const schedule = getScheduleForDay(date, employeeId);
        
        let startTime = new Date(new Date().setHours(9, 0, 0));
        let endTime = new Date(new Date().setHours(18, 0, 0));
        let exceptions = [];
        
        if (isEdit && schedule) {
            // Если редактируем существующую запись, берем время из нее
            const [startHours, startMinutes] = schedule.start_time.split(':').map(Number);
            const [endHours, endMinutes] = schedule.end_time.split(':').map(Number);
            
            startTime = new Date(new Date().setHours(startHours, startMinutes, 0));
            endTime = new Date(new Date().setHours(endHours, endMinutes, 0));
            
            // Загружаем исключения для данного расписания
            fetchExceptions(schedule.id);
        }
        
        setTimeDialog({
            open: true,
            employeeId,
            date,
            startTime,
            endTime,
            isEdit,
            exceptions: []
        });
    };

    // Функция для загрузки исключений для конкретного расписания
    const fetchExceptions = async (scheduleId) => {
        try {
            const response = await fetch('http://localhost:5000/api/schedule_exceptions');
            if (response.ok) {
                const data = await response.json();
                // Фильтруем исключения для данного расписания
                const scheduleExceptions = data.filter(exc => exc.schedule_id === scheduleId);
                
                // Преобразуем время в объекты Date для удобства работы
                const formattedExceptions = scheduleExceptions.map(exc => {
                    const [startHours, startMinutes] = exc.start_time.split(':').map(Number);
                    const [endHours, endMinutes] = exc.end_time.split(':').map(Number);
                    
                    return {
                        id: exc.id,
                        startTime: new Date(new Date().setHours(startHours, startMinutes, 0)),
                        endTime: new Date(new Date().setHours(endHours, endMinutes, 0)),
                        reason: exc.reason
                    };
                });
                
                setTimeDialog(prev => ({
                    ...prev,
                    exceptions: formattedExceptions
                }));
            }
        } catch (error) {
            showSnackbar('Ошибка при загрузке исключений', 'error');
        }
    };

    // Обработчик добавления нового исключения
    const handleAddException = () => {
        // Проверяем, что время исключения находится в пределах рабочего дня
        if (newException.startTime < timeDialog.startTime || 
            newException.endTime > timeDialog.endTime ||
            newException.startTime >= newException.endTime) {
            showSnackbar('Время исключения должно быть в пределах рабочего дня', 'error');
            return;
        }
        
        // Проверяем, что исключение не пересекается с другими исключениями
        const hasOverlap = timeDialog.exceptions.some(exc => 
            (newException.startTime < exc.endTime && newException.endTime > exc.startTime)
        );
        
        if (hasOverlap) {
            showSnackbar('Исключение пересекается с другими исключениями', 'error');
            return;
        }
        
        setTimeDialog(prev => ({
            ...prev,
            exceptions: [...prev.exceptions, { ...newException, id: null }]
        }));
        
        // Сбрасываем форму нового исключения
        setNewException({
            startTime: new Date(new Date().setHours(13, 0, 0)),
            endTime: new Date(new Date().setHours(14, 0, 0)),
            reason: 'Обеденный перерыв'
        });
    };

    // Обработчик удаления исключения
    const handleDeleteException = (index) => {
        setTimeDialog(prev => ({
            ...prev,
            exceptions: prev.exceptions.filter((_, i) => i !== index)
        }));
    };

    // Обработчик изменения полей нового исключения
    const handleExceptionChange = (field, value) => {
        setNewException(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Закрытие диалога добавления/редактирования рабочего времени
    const closeTimeDialog = () => {
        setTimeDialog({
            ...timeDialog,
            open: false
        });
    };

    // Сохранение рабочего времени из диалога
    const saveTimeDialog = async () => {
        const { employeeId, date, startTime, endTime, isEdit, exceptions } = timeDialog;
        
        if (!employeeId || !date || !startTime || !endTime) {
            showSnackbar('Не все поля заполнены', 'error');
            return;
        }
        
        const scheduleData = {
            employee_id: employeeId,
            date: format(date, 'yyyy-MM-dd'),
            start_time: format(startTime, 'HH:mm:ss'),
            end_time: format(endTime, 'HH:mm:ss')
        };
        
        try {
            let scheduleResponse;
            let scheduleId;
            
            if (isEdit) {
                // Если редактируем, находим ID записи
                const scheduleToEdit = schedules.find(s => 
                    s.employee_id === employeeId && 
                    isSameDay(new Date(s.date), date)
                );
                
                if (scheduleToEdit) {
                    scheduleResponse = await fetch(`http://localhost:5000/api/schedules/${scheduleToEdit.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(scheduleData)
                    });
                    scheduleId = scheduleToEdit.id;
                } else {
                    showSnackbar('Запись не найдена', 'error');
                    return;
                }
            } else {
                // Если добавляем новую запись
                scheduleResponse = await fetch('http://localhost:5000/api/schedules', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(scheduleData)
                });
                
                if (scheduleResponse.ok) {
                    const newSchedule = await scheduleResponse.json();
                    scheduleId = newSchedule.id;
                }
            }
            
            if (scheduleResponse.ok && scheduleId) {
                // Если расписание успешно сохранено, обрабатываем исключения
                
                // Получаем текущие исключения для этого расписания
                const exceptionsResponse = await fetch('http://localhost:5000/api/schedule_exceptions');
                const currentExceptions = await exceptionsResponse.json();
                const scheduleExceptions = currentExceptions.filter(exc => exc.schedule_id === scheduleId);
                
                // Удаляем исключения, которых нет в новом списке
                for (const exc of scheduleExceptions) {
                    const stillExists = exceptions.some(e => e.id === exc.id);
                    if (!stillExists) {
                        await fetch(`http://localhost:5000/api/schedule_exceptions/${exc.id}`, {
                            method: 'DELETE'
                        });
                    }
                }
                
                // Добавляем или обновляем исключения
                for (const exception of exceptions) {
                    const exceptionData = {
                        schedule_id: scheduleId,
                        start_time: format(exception.startTime, 'HH:mm:ss'),
                        end_time: format(exception.endTime, 'HH:mm:ss'),
                        reason: exception.reason
                    };
                    
                    if (exception.id) {
                        // Обновляем существующее исключение
                        await fetch(`http://localhost:5000/api/schedule_exceptions/${exception.id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(exceptionData)
                        });
                    } else {
                        // Создаем новое исключение
                        await fetch('http://localhost:5000/api/schedule_exceptions', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(exceptionData)
                        });
                    }
                }
                
                fetchAllExceptions();

                showSnackbar(isEdit ? 'Рабочее время обновлено' : 'Рабочий день добавлен', 'success');
                fetchSchedules(); // Обновляем список графиков
                closeTimeDialog();
            } else {
                showSnackbar('Ошибка при сохранении', 'error');
            }
        } catch (error) {
            showSnackbar('Ошибка сети', 'error');
        }
    };

    // Получение дней текущей недели
    const getDaysInWeek = () => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Неделя начинается с понедельника
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    };

    // Переход к предыдущей неделе
    const goToPreviousWeek = () => {
        setCurrentDate(prevDate => subWeeks(prevDate, 1));
    };

    // Переход к следующей неделе
    const goToNextWeek = () => {
        setCurrentDate(prevDate => addWeeks(prevDate, 1));
    };

    // Переход к текущей неделе
    const goToCurrentWeek = () => {
        setCurrentDate(new Date());
    };

    // Вспомогательные функции
    const showSnackbar = (message, severity) => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({
            ...snackbar,
            open: false
        });
    };

    // Получение имени сотрудника по ID
    const getEmployeeName = (id) => {
        const employee = employees.find(e => e.id === id);
        return employee ? employee.full_name : 'Неизвестный сотрудник';
    };

    // Форматирование времени для отображения
    const formatTimeRange = (startTime, endTime) => {
        if (!startTime || !endTime) return '';
        return `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`;
    };

    // Функция для открытия диалога автоматического заполнения
    const openAutoFillDialog = () => {
        setAutoFillDialog({
            open: true,
            startDate: new Date(),
            endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            formula: '1/1',
            employees: selectedEmployees.length > 0 ? selectedEmployees : [],
            selectedRange: false,
            workHours: {
                start_time: workHours.start_time,
                end_time: workHours.end_time
            }
        });
    };
    
    // Функция для закрытия диалога автоматического заполнения
    const closeAutoFillDialog = () => {
        setAutoFillDialog({
            ...autoFillDialog,
            open: false
        });
    };
    
    // Функция для обработки изменений в диалоге автоматического заполнения
    const handleAutoFillChange = (name, value) => {
        setAutoFillDialog(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    // Функция для обработки выбора даты в календаре
    const handleDateRangeSelect = (date) => {
        if (!autoFillDialog.selectedRange) {
            // Если диапазон еще не выбран, устанавливаем начальную дату
            setAutoFillDialog(prev => ({
                ...prev,
                startDate: date,
                endDate: date,
                selectedRange: true
            }));
        } else {
            // Если начальная дата уже выбрана, устанавливаем конечную дату
            // Убеждаемся, что конечная дата не раньше начальной
            const endDate = date < autoFillDialog.startDate ? autoFillDialog.startDate : date;
            setAutoFillDialog(prev => ({
                ...prev,
                endDate: endDate,
                selectedRange: false
            }));
        }
    };
    
    // Функция для генерации графика по формуле
    const generateScheduleByFormula = (formula, startDate, endDate, employeeIds, customWorkHours) => {
        // Разбираем формулу на рабочие и выходные дни
        const [workDays, restDays] = formula.split('/').map(Number);
        const totalCycleDays = workDays + restDays;
        
        // Создаем массив для хранения сгенерированных дат
        const generatedSchedules = [];
        
        // Для каждого сотрудника генерируем график
        for (const employeeId of employeeIds) {
            let currentDate = new Date(startDate);
            let dayCounter = 0;
            
            // Генерируем график в пределах выбранного диапазона дат
            while (currentDate <= endDate) {
                // Определяем, является ли текущий день рабочим по формуле
                const cyclePosition = dayCounter % totalCycleDays;
                const isWorkDay = cyclePosition < workDays;
                
                if (isWorkDay) {
                    // Проверяем, существует ли уже запись для этого сотрудника и даты
                    const existingSchedule = schedules.find(s => 
                        s.employee_id === employeeId && 
                        isSameDay(new Date(s.date), currentDate)
                    );
                    
                    if (!existingSchedule) {
                        // Если записи нет, создаем новую
                        generatedSchedules.push({
                            employee_id: employeeId,
                            date: format(currentDate, 'yyyy-MM-dd'),
                            start_time: format(customWorkHours.start_time, 'HH:mm:ss'),
                            end_time: format(customWorkHours.end_time, 'HH:mm:ss')
                        });
                    }
                }
                
                // Переходим к следующему дню
                currentDate = addDays(currentDate, 1);
                dayCounter++;
            }
        }
        
        return generatedSchedules;
    };
    
    // Функция для сохранения автоматически сгенерированного графика
    const saveAutoFillSchedule = async () => {
        const { formula, startDate, endDate, employees, workHours: customWorkHours } = autoFillDialog;
        
        if (employees.length === 0) {
            showSnackbar('Выберите хотя бы одного сотрудника', 'warning');
            return;
        }
        
        // Генерируем график по формуле
        const generatedSchedules = generateScheduleByFormula(formula, startDate, endDate, employees, customWorkHours);
        
        if (generatedSchedules.length === 0) {
            showSnackbar('Нет новых дат для добавления в график', 'info');
            closeAutoFillDialog();
            return;
        }
        
        // Сохраняем сгенерированный график
        const promises = generatedSchedules.map(scheduleData => 
            fetch('http://localhost:5000/api/schedules', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(scheduleData)
            })
        );
        
        try {
            await Promise.all(promises);
            showSnackbar(`Успешно добавлено ${generatedSchedules.length} рабочих дней`, 'success');
            fetchSchedules(); // Обновляем список графиков
            closeAutoFillDialog();
        } catch (error) {
            showSnackbar('Ошибка при сохранении графика', 'error');
        }
    };

    return (
        <Box sx={{ 
            p: 3, 
            backgroundColor: '#fafafa',
            minHeight: '100vh'
        }}>
            {/* ============ ЗАГОЛОВОК И КНОПКА АВТОЗАПОЛНЕНИЯ ============ */}
            <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                justifyContent="space-between" 
                alignItems={{ xs: 'stretch', sm: 'center' }}
                spacing={2}
                sx={{ mb: 3 }}
            >
                <Box>
                    <Typography 
                        variant="h5" 
                        sx={{ 
                            fontWeight: 500,
                            color: '#1a1a1a',
                            mb: 0.5
                        }}
                    >
                        Управление рабочим графиком
                    </Typography>
                    <Typography 
                        variant="body2" 
                        sx={{ color: '#666' }}
                    >
                        Планирование и редактирование рабочего времени сотрудников
                        {employees.length > 0 && (
                            <Box component="span" sx={{ ml: 2 }}>
                                • Всего сотрудников: {employees.length}
                            </Box>
                        )}
                    </Typography>
                </Box>
                
                <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<Schedule />}
                    onClick={openAutoFillDialog}
                    size="medium"
                    sx={{ 
                        borderRadius: 2, 
                        textTransform: 'none',
                        backgroundColor: '#1976d2',
                        boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)',
                        minWidth: 240,
                        '&:hover': {
                            backgroundColor: '#1565c0',
                            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.35)'
                        }
                    }}
                >
                    Автоматическое заполнение графика
                </Button>
            </Stack>

            {/* Панель навигации по неделям */}
            <Stack 
                direction="row" 
                justifyContent="space-between" 
                alignItems="center" 
                sx={{ 
                    mb: 3,
                    p: 2,
                    backgroundColor: '#fff',
                    borderRadius: 3,
                    border: '1px solid #e0e0e0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
            >
                <Button 
                    variant="outlined" 
                    startIcon={<ArrowBackIos />} 
                    onClick={goToPreviousWeek}
                    size="small"
                    sx={{ 
                        borderRadius: 2,
                        textTransform: 'none'
                    }}
                >
                    Предыдущая неделя
                </Button>
                
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'dd.MM.yyyy')} - {format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'dd.MM.yyyy')}
                    </Typography>
                    <Tooltip title="Текущая неделя">
                        <IconButton 
                            onClick={goToCurrentWeek}
                            size="small"
                            sx={{ 
                                color: '#1976d2',
                                '&:hover': {
                                    backgroundColor: 'rgba(25, 118, 210, 0.08)'
                                }
                            }}
                        >
                            <Today fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
                
                <Button 
                    variant="outlined" 
                    endIcon={<ArrowForwardIos />} 
                    onClick={goToNextWeek}
                    size="small"
                    sx={{ 
                        borderRadius: 2,
                        textTransform: 'none'
                    }}
                >
                    Следующая неделя
                </Button>
            </Stack>

            {/* Таблица с графиком работы */}
            <TableContainer 
                component={Paper} 
                sx={{ 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)', 
                    borderRadius: 3,
                    border: '1px solid #e0e0e0',
                    overflow: 'hidden',
                    mb: 3
                }}
            >
                <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                        <TableRow>
                            <TableCell 
                                sx={{ 
                                    fontWeight: 600, 
                                    color: '#424242',
                                    borderBottom: '1px solid #e0e0e0',
                                    py: 2,
                                    width: '20%'
                                }}
                            >
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Person sx={{ fontSize: 18, color: '#666' }} />
                                    <span>Сотрудник</span>
                                </Stack>
                            </TableCell>
                            {getDaysInWeek().map(day => (
                                <TableCell 
                                    key={day.toISOString()} 
                                    align="center"
                                    sx={{ 
                                        minWidth: 120,
                                        backgroundColor: isWeekend(day) ? '#fff4f4' : '#f8f9fa',
                                        fontWeight: 600, 
                                        color: '#424242',
                                        borderBottom: '1px solid #e0e0e0',
                                        py: 2,
                                        ...(isSameDay(day, new Date()) && {
                                            backgroundColor: '#e3f2fd',
                                            borderLeft: '1px solid #bbdefb',
                                            borderRight: '1px solid #bbdefb'
                                        })
                                    }}
                                >
                                    <Typography variant="subtitle2">
                                        {format(day, 'EEE', { locale: ru })}
                                    </Typography>
                                    <Typography variant="body2">
                                        {format(day, 'dd.MM')}
                                    </Typography>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {employees.map((employee, employeeIndex) => (
                            <TableRow 
                                key={employee.id}
                                sx={{
                                    '&:hover': {
                                        backgroundColor: '#f5f7fa'
                                    },
                                    backgroundColor: employeeIndex % 2 === 0 ? '#ffffff' : '#fafbfc',
                                    borderLeft: '4px solid transparent',
                                    '&:hover': {
                                        backgroundColor: '#f5f7fa',
                                        borderLeft: '4px solid #e3f2fd'
                                    }
                                }}
                            >
                                <TableCell
                                    sx={{ 
                                        py: 2,
                                        borderBottom: '1px solid #f0f0f0',
                                        pl: 3
                                    }}
                                >
                                    <Typography 
                                        variant="body2" 
                                        sx={{ 
                                            fontWeight: 500,
                                            color: '#1a1a1a'
                                        }}
                                    >
                                        {employee.full_name}
                                    </Typography>
                                </TableCell>
                                {getDaysInWeek().map(day => {
                                    const schedule = getScheduleForDay(day, employee.id);
                                    const isWorking = !!schedule;
                                    
                                    return (
                                        <TableCell 
                                            key={day.toISOString()} 
                                            align="center"
                                            sx={{ 
                                                py: 1.5,
                                                borderBottom: '1px solid #f0f0f0',
                                                backgroundColor: isWorking 
                                                    ? '#e8f5e9' 
                                                    : (isWeekend(day) ? '#fff4f4' : 'inherit'),
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                ...(isSameDay(day, new Date()) && {
                                                    backgroundColor: isWorking ? '#e8f5e9' : '#f5f5f5',
                                                    borderLeft: '1px solid #e0e0e0',
                                                    borderRight: '1px solid #e0e0e0'
                                                }),
                                                '&:hover': {
                                                    backgroundColor: isWorking ? '#c8e6c9' : '#f5f5f5',
                                                    boxShadow: 'inset 0 0 0 1px #e0e0e0'
                                                }
                                            }}
                                            onClick={() => openTimeDialog(employee.id, day, isWorking)}
                                        >
                                            {isWorking ? (
                                                <Box>
                                                    <Typography 
                                                        variant="body2"
                                                        sx={{ fontWeight: 500 }}
                                                    >
                                                        {formatTimeRange(schedule.start_time, schedule.end_time)}
                                                    </Typography>
                                                    <IconButton 
                                                        size="small" 
                                                        color="error"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteWorkingDay(employee.id, day);
                                                        }}
                                                        sx={{
                                                            mt: 0.5,
                                                            '&:hover': {
                                                                backgroundColor: 'rgba(211, 47, 47, 0.08)'
                                                            }
                                                        }}
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            ) : (
                                                <IconButton 
                                                    size="small" 
                                                    color="primary"
                                                    sx={{
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(25, 118, 210, 0.08)'
                                                        }
                                                    }}
                                                >
                                                    <Add fontSize="small" />
                                                </IconButton>
                                            )}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Диалог добавления/редактирования рабочего времени */}
            <Dialog 
                open={timeDialog.open} 
                onClose={closeTimeDialog} 
                maxWidth="md" 
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                    }
                }}
            >
                <DialogTitle 
                    sx={{ 
                        borderBottom: '1px solid #e0e0e0', 
                        pb: 2,
                        fontWeight: 500
                    }}
                >
                    {timeDialog.isEdit ? 'Редактировать рабочее время' : 'Добавить рабочий день'}
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Stack spacing={2.5}>
                        {/* Основная информация */}
                        <Stack spacing={2}>
                            <Typography 
                                variant="subtitle2" 
                                sx={{ 
                                    color: '#424242',
                                    fontWeight: 500,
                                    mb: 1
                                }}
                            >
                                Информация о рабочем дне
                            </Typography>
                            
                            <Box sx={{ 
                                p: 2, 
                                backgroundColor: '#f8f9fa', 
                                borderRadius: 2,
                                border: '1px solid #e0e0e0'
                            }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="textSecondary">
                                            Сотрудник:
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {timeDialog.employeeId ? getEmployeeName(timeDialog.employeeId) : ''}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="textSecondary">
                                            Дата:
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {timeDialog.date ? format(timeDialog.date, 'dd.MM.yyyy, EEEE', { locale: ru }) : ''}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                            
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                                        <TimePicker
                                            label="Начало рабочего дня"
                                            value={timeDialog.startTime}
                                            onChange={(newValue) => setTimeDialog(prev => ({ ...prev, startTime: newValue }))}
                                            renderInput={(params) => 
                                                <TextField 
                                                    {...params} 
                                                    fullWidth 
                                                    size="small"
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: 2
                                                        }
                                                    }}
                                                />
                                            }
                                        />
                                    </LocalizationProvider>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                                        <TimePicker
                                            label="Конец рабочего дня"
                                            value={timeDialog.endTime}
                                            onChange={(newValue) => setTimeDialog(prev => ({ ...prev, endTime: newValue }))}
                                            renderInput={(params) => 
                                                <TextField 
                                                    {...params} 
                                                    fullWidth 
                                                    size="small"
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: 2
                                                        }
                                                    }}
                                                />
                                            }
                                        />
                                    </LocalizationProvider>
                                </Grid>
                            </Grid>
                        </Stack>

                        <Divider sx={{ my: 1 }} />
                        
                        {/* Секция исключений (перерывов) */}
                        <Stack spacing={2}>
                            <Typography 
                                variant="subtitle2" 
                                sx={{ 
                                    color: '#424242',
                                    fontWeight: 500,
                                    mb: 1
                                }}
                            >
                                Перерывы
                            </Typography>
                            
                            {/* Список существующих исключений */}
                            {timeDialog.exceptions.length > 0 ? (
                                <TableContainer 
                                    component={Paper} 
                                    sx={{ 
                                        mb: 2,
                                        boxShadow: 'none',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 2,
                                        overflow: 'hidden'
                                    }}
                                >
                                    <Table size="small">
                                        <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Начало</TableCell>
                                                <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Конец</TableCell>
                                                <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Причина</TableCell>
                                                <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Действия</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {timeDialog.exceptions.map((exception, index) => (
                                                <TableRow 
                                                    key={index}
                                                    sx={{
                                                        '&:hover': {
                                                            backgroundColor: '#f5f7fa'
                                                        }
                                                    }}
                                                >
                                                    <TableCell sx={{ py: 1.5 }}>{format(exception.startTime, 'HH:mm')}</TableCell>
                                                    <TableCell sx={{ py: 1.5 }}>{format(exception.endTime, 'HH:mm')}</TableCell>
                                                    <TableCell sx={{ py: 1.5 }}>{exception.reason}</TableCell>
                                                    <TableCell sx={{ py: 1.5 }}>
                                                        <IconButton 
                                                            size="small" 
                                                            color="error"
                                                            onClick={() => handleDeleteException(index)}
                                                            sx={{
                                                                '&:hover': {
                                                                    backgroundColor: 'rgba(211, 47, 47, 0.08)'
                                                                }
                                                            }}
                                                        >
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                    Нет добавленных перерывов
                                </Typography>
                            )}
                            
                            {/* Форма добавления нового исключения */}
                            <Paper 
                                sx={{ 
                                    p: 2, 
                                    bgcolor: '#f8f9fa',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 2,
                                    boxShadow: 'none'
                                }}
                            >
                                <Typography 
                                    variant="subtitle2" 
                                    sx={{ 
                                        mb: 1.5,
                                        fontWeight: 500
                                    }}
                                >
                                    Добавить перерыв
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={4}>
                                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                                            <TimePicker
                                                label="Начало перерыва"
                                                value={newException.startTime}
                                                onChange={(newValue) => handleExceptionChange('startTime', newValue)}
                                                renderInput={(params) => 
                                                    <TextField 
                                                        {...params} 
                                                        fullWidth 
                                                        size="small"
                                                        sx={{
                                                            '& .MuiOutlinedInput-root': {
                                                                borderRadius: 2
                                                            }
                                                        }}
                                                    />
                                                }
                                            />
                                        </LocalizationProvider>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                                            <TimePicker
                                                label="Конец перерыва"
                                                value={newException.endTime}
                                                onChange={(newValue) => handleExceptionChange('endTime', newValue)}
                                                renderInput={(params) => 
                                                    <TextField 
                                                        {...params} 
                                                        fullWidth 
                                                        size="small"
                                                        sx={{
                                                            '& .MuiOutlinedInput-root': {
                                                                borderRadius: 2
                                                            }
                                                        }}
                                                    />
                                                }
                                            />
                                        </LocalizationProvider>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            label="Причина"
                                            value={newException.reason}
                                            onChange={(e) => handleExceptionChange('reason', e.target.value)}
                                            fullWidth
                                            size="small"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 2
                                                }
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Button 
                                            variant="outlined" 
                                            startIcon={<Add />}
                                            onClick={handleAddException}
                                            fullWidth
                                            sx={{ 
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                mt: 1
                                            }}
                                        >
                                            Добавить перерыв
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions 
                    sx={{ 
                        borderTop: '1px solid #e0e0e0', 
                        p: 2.5,
                        gap: 1
                    }}
                >
                    <Button 
                        onClick={closeTimeDialog}
                        sx={{ 
                            textTransform: 'none',
                            borderRadius: 2,
                            px: 3
                        }}
                    >
                        Отмена
                    </Button>
                    <Button 
                        onClick={saveTimeDialog} 
                        variant="contained" 
                        color="primary"
                        sx={{ 
                            textTransform: 'none',
                            borderRadius: 2,
                            px: 3,
                            backgroundColor: '#1976d2',
                            '&:hover': {
                                backgroundColor: '#1565c0'
                            }
                        }}
                    >
                        Сохранить
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Диалог автоматического заполнения графика */}
            <Dialog 
                open={autoFillDialog.open} 
                onClose={closeAutoFillDialog}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        overflow: 'hidden'
                    }
                }}
            >
                <DialogTitle 
                    sx={{ 
                        borderBottom: '1px solid #e0e0e0', 
                        pb: 2,
                        fontWeight: 500,
                        backgroundColor: '#f8f9fa'
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Schedule sx={{ fontSize: 20, color: '#1976d2' }} />
                        <span>Автоматическое заполнение графика</span>
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ pt: 3, pb: 2, backgroundColor: '#fafafa' }}>
                    <Box sx={{ mt: 1 }}>
                        {/* Формула графика */}
                        <Stack spacing={2.5}>
                            <Box>
                                <Typography 
                                    variant="subtitle2" 
                                    sx={{ 
                                        color: '#424242',
                                        fontWeight: 500,
                                        mb: 1
                                    }}
                                >
                                    Выберите формулу графика:
                                </Typography>
                                <FormControl 
                                    fullWidth 
                                    size="small" 
                                    sx={{ 
                                        mb: 2,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2
                                        }
                                    }}
                                >
                                    <InputLabel>Формула графика</InputLabel>
                                    <Select
                                        value={autoFillDialog.formula}
                                        onChange={(e) => handleAutoFillChange('formula', e.target.value)}
                                        label="Формула графика"
                                    >
                                        <MenuItem value="1/1">1/1 - День через день</MenuItem>
                                        <MenuItem value="1/2">1/2 - 1 рабочий / 2 выходных</MenuItem>
                                        <MenuItem value="2/1">2/1 - 2 рабочих / 1 выходной</MenuItem>
                                        <MenuItem value="2/2">2/2 - 2 рабочих / 2 выходных</MenuItem>
                                        <MenuItem value="3/3">3/3 - 3 рабочих / 3 выходных</MenuItem>
                                        <MenuItem value="5/2">5/2 - Стандартная рабочая неделя</MenuItem>
                                        <MenuItem value="6/1">6/1 - 6 рабочих / 1 выходной</MenuItem>
                                        <MenuItem value="7/0">7/0 - Без выходных</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            
                            <Divider sx={{ my: 1 }} />
                            
                            {/* Рабочие часы */}
                            <Box>
                                <Typography 
                                    variant="subtitle2" 
                                    sx={{ 
                                        color: '#424242',
                                        fontWeight: 500,
                                        mb: 1
                                    }}
                                >
                                    Укажите рабочие часы:
                                </Typography>
                                <Stack 
                                    direction={{ xs: 'column', sm: 'row' }} 
                                    spacing={2} 
                                    sx={{ mb: 2 }}
                                >
                                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                                        <TimePicker
                                            label="Время начала"
                                            value={autoFillDialog.workHours.start_time}
                                            onChange={(newTime) => {
                                                setAutoFillDialog(prev => ({
                                                    ...prev,
                                                    workHours: {
                                                        ...prev.workHours,
                                                        start_time: newTime
                                                    }
                                                }));
                                            }}
                                            renderInput={(params) => 
                                                <TextField 
                                                    {...params} 
                                                    fullWidth 
                                                    size="small"
                                                    sx={{ 
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: 2
                                                        }
                                                    }} 
                                                />
                                            }
                                        />
                                        <TimePicker
                                            label="Время окончания"
                                            value={autoFillDialog.workHours.end_time}
                                            onChange={(newTime) => {
                                                setAutoFillDialog(prev => ({
                                                    ...prev,
                                                    workHours: {
                                                        ...prev.workHours,
                                                        end_time: newTime
                                                    }
                                                }));
                                            }}
                                            renderInput={(params) => 
                                                <TextField 
                                                    {...params} 
                                                    fullWidth 
                                                    size="small"
                                                    sx={{ 
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: 2
                                                        }
                                                    }} 
                                                />
                                            }
                                        />
                                    </LocalizationProvider>
                                </Stack>
                            </Box>
                            
                            <Divider sx={{ my: 1 }} />
                            
                            {/* Диапазон дат */}
                            <Box>
                                <Typography 
                                    variant="subtitle2" 
                                    sx={{ 
                                        color: '#424242',
                                        fontWeight: 500,
                                        mb: 1
                                    }}
                                >
                                    Выберите диапазон дат для заполнения графика:
                                </Typography>
                                <Stack 
                                    direction={{ xs: 'column', sm: 'row' }} 
                                    spacing={2} 
                                    sx={{ mb: 2 }}
                                >
                                    <Paper 
                                        elevation={0} 
                                        sx={{ 
                                            p: 2, 
                                            mb: 1, 
                                            bgcolor: autoFillDialog.selectedRange ? '#e3f2fd' : '#f5f5f5',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 2,
                                            flex: 1
                                        }}
                                    >
                                        <Typography variant="body2" color="textSecondary" gutterBottom>
                                            {autoFillDialog.selectedRange 
                                                ? 'Выбрана начальная дата. Выберите конечную дату.' 
                                                : 'Выберите начальную дату диапазона'}
                                        </Typography>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Box>
                                                <Typography variant="caption" color="textSecondary">Начало:</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {format(autoFillDialog.startDate, 'dd.MM.yyyy')}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ color: '#9e9e9e' }}>—</Box>
                                            <Box>
                                                <Typography variant="caption" color="textSecondary">Конец:</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {format(autoFillDialog.endDate, 'dd.MM.yyyy')}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Paper>
                                    
                                    <Paper 
                                        elevation={0} 
                                        sx={{ 
                                            p: 2, 
                                            mb: 1, 
                                            bgcolor: '#f5f5f5',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 2,
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="caption" color="textSecondary">Количество дней:</Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 500, color: '#1976d2' }}>
                                                {Math.floor((autoFillDialog.endDate - autoFillDialog.startDate) / (1000 * 60 * 60 * 24)) + 1}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Stack>
                                
                                <Paper 
                                    elevation={0} 
                                    sx={{ 
                                        p: 1, 
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 2,
                                        bgcolor: 'white'
                                    }}
                                >
                                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                                        <StaticDatePicker
                                            displayStaticWrapperAs="desktop"
                                            value={autoFillDialog.startDate}
                                            onChange={handleDateRangeSelect}
                                            renderInput={(params) => <TextField {...params} />}
                                            renderDay={(day, _value, DayComponentProps) => {
                                                const isStart = isSameDay(day, autoFillDialog.startDate);
                                                const isEnd = isSameDay(day, autoFillDialog.endDate);
                                                const isInRange = day >= autoFillDialog.startDate && day <= autoFillDialog.endDate;
                                                
                                                let dayStyle = {};
                                                if (isStart || isEnd) {
                                                    dayStyle = {
                                                        backgroundColor: '#1976d2',
                                                        color: 'white',
                                                        borderRadius: isStart && isEnd ? '50%' : isStart ? '50% 0 0 50%' : '0 50% 50% 0'
                                                    };
                                                } else if (isInRange) {
                                                    dayStyle = {
                                                        backgroundColor: '#bbdefb',
                                                        borderRadius: 0
                                                    };
                                                }
                                                
                                                return (
                                                    <Box
                                                        sx={{
                                                            ...dayStyle,
                                                            display: 'flex',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            width: 36,
                                                            height: 36
                                                        }}
                                                    >
                                                        <DayComponentProps.day />
                                                    </Box>
                                                );
                                            }}
                                        />
                                    </LocalizationProvider>
                                </Paper>
                            </Box>
                            
                            <Divider sx={{ my: 1 }} />
                            
                            {/* Выбор сотрудников */}
                            <Box>
                                <Typography 
                                    variant="subtitle2" 
                                    sx={{ 
                                        color: '#424242',
                                        fontWeight: 500,
                                        mb: 1
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Person sx={{ fontSize: 18, color: '#666' }} />
                                        <span>Выберите сотрудников:</span>
                                    </Stack>
                                </Typography>
                                
                                <Paper 
                                    elevation={0} 
                                    sx={{ 
                                        p: 2, 
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 2,
                                        bgcolor: 'white',
                                        maxHeight: '200px',
                                        overflow: 'auto'
                                    }}
                                >
                                    <FormGroup sx={{ mb: 1 }}>
                                        {employees.map(employee => (
                                            <FormControlLabel
                                                key={employee.id}
                                                control={
                                                    <Checkbox
                                                        size="small"
                                                        checked={autoFillDialog.employees.includes(employee.id)}
                                                        onChange={() => {
                                                            const newEmployees = autoFillDialog.employees.includes(employee.id)
                                                                ? autoFillDialog.employees.filter(id => id !== employee.id)
                                                                : [...autoFillDialog.employees, employee.id];
                                                            handleAutoFillChange('employees', newEmployees);
                                                        }}
                                                        sx={{
                                                            '&.Mui-checked': {
                                                                color: '#1976d2'
                                                            }
                                                        }}
                                                    />
                                                }
                                                label={
                                                    <Typography variant="body2">{employee.full_name}</Typography>
                                                }
                                                sx={{ mb: 0.5 }}
                                            />
                                        ))}
                                    </FormGroup>
                                </Paper>
                                
                                <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                                    <Typography variant="body2" color="textSecondary">
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Info sx={{ fontSize: 16, color: '#1976d2' }} />
                                            <span>График будет сгенерирован в выбранном диапазоне дат.
                                            Существующие записи не будут перезаписаны.</span>
                                        </Stack>
                                    </Typography>
                                </Box>
                            </Box>
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions 
                    sx={{ 
                        borderTop: '1px solid #e0e0e0', 
                        p: 2.5,
                        gap: 1,
                        backgroundColor: '#f8f9fa'
                    }}
                >
                    <Button 
                        onClick={closeAutoFillDialog}
                        sx={{ 
                            textTransform: 'none',
                            borderRadius: 2,
                            px: 3
                        }}
                    >
                        Отмена
                    </Button>
                    <Button 
                        onClick={saveAutoFillSchedule} 
                        variant="contained" 
                        color="primary"
                        disabled={autoFillDialog.employees.length === 0}
                        startIcon={<Schedule />}
                        sx={{ 
                            textTransform: 'none',
                            borderRadius: 2,
                            px: 3,
                            backgroundColor: '#1976d2',
                            boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)',
                            '&:hover': {
                                backgroundColor: '#1565c0',
                                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.35)'
                            }
                        }}
                    >
                        Сгенерировать график
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={6000} 
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default APschedule;
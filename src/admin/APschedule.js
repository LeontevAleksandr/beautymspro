import React, { useState, useEffect } from 'react';
import { 
    Typography, Box, Button, Paper, Grid, TextField, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogActions, DialogContent, DialogTitle,
    FormControl, InputLabel, Select, MenuItem, IconButton,
    Snackbar, Alert, Checkbox, FormControlLabel, FormGroup, Chip,
    Tooltip, Divider
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker, StaticDatePicker } from '@mui/x-date-pickers';
import { ru } from 'date-fns/locale';
import { 
    Edit, Delete, Add, Schedule, CalendarMonth, Check, Close, 
    ArrowBackIos, ArrowForwardIos, Today
} from '@mui/icons-material';
import { 
    format, parseISO, addDays, subDays, isSameDay, isWeekend, 
    startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks,
    startOfMonth, endOfMonth, isWithinInterval, isSameMonth
} from 'date-fns';

function APschedule() {
    // Состояния для сотрудников
    const [employees, setEmployees] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    
    // Состояния для графика
    const [schedules, setSchedules] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [workHours, setWorkHours] = useState({
        start_time: new Date(new Date().setHours(9, 0, 0)),
        end_time: new Date(new Date().setHours(18, 0, 0))
    });
    
    // Состояние для выбранных дат
    const [selectedDates, setSelectedDates] = useState([]);
    
    // Состояние для режима выбора нескольких дат
    const [multiSelectMode, setMultiSelectMode] = useState(true);

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

    // Проверка, есть ли у рабочего дня исключения (перерывы)
    const hasExceptions = (date, employeeId) => {
        const schedule = getScheduleForDay(date, employeeId);
        if (!schedule) return false;
        
        // Преобразуем ID в числовой тип для корректного сравнения
        const scheduleId = parseInt(schedule.id, 10);
        
        // Проверяем, есть ли исключения для этого расписания
        return scheduleExceptions.some(exc => parseInt(exc.schedule_id, 10) === scheduleId);
    };
    
    // Получение информации о перерывах для тултипа
    const getExceptionsInfo = (date, employeeId) => {
        const schedule = getScheduleForDay(date, employeeId);
        if (!schedule) return '';
        
        // Преобразуем ID в числовой тип для корректного сравнения
        const scheduleId = parseInt(schedule.id, 10);
        
        // Фильтруем исключения для данного расписания
        const exceptions = scheduleExceptions.filter(exc => parseInt(exc.schedule_id, 10) === scheduleId);
        
        if (exceptions.length === 0) return '';
        
        // Формируем текст для тултипа
        return exceptions.map(exc => 
            `${exc.start_time.slice(0, 5)} - ${exc.end_time.slice(0, 5)}: ${exc.reason}`
        ).join('\n');
    };
    
    // Рендер ячейки календаря
    const renderCalendarCell = (date, employeeId) => {
        const isWorking = isWorkingDay(date, employeeId);
        const hasBreaks = hasExceptions(date, employeeId);
        const schedule = getScheduleForDay(date, employeeId);
        
        // Формируем текст для тултипа
        let tooltipText = '';
        if (isWorking) {
            tooltipText = `Рабочий день: ${schedule.start_time.slice(0, 5)} - ${schedule.end_time.slice(0, 5)}`;
            
            const exceptionsInfo = getExceptionsInfo(date, employeeId);
            if (exceptionsInfo) {
                tooltipText += `\nПерерывы:\n${exceptionsInfo}`;
            }
        }
        
        return (
            <Box 
                sx={{ 
                    width: '100%', 
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    bgcolor: isWorking 
                        ? (hasBreaks ? 'rgba(156, 39, 176, 0.15)' : 'rgba(76, 175, 80, 0.15)') 
                        : 'transparent',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    '&:hover': {
                        bgcolor: isWorking 
                            ? (hasBreaks ? 'rgba(156, 39, 176, 0.25)' : 'rgba(76, 175, 80, 0.25)') 
                            : 'rgba(0, 0, 0, 0.04)'
                    }
                }}
                onClick={() => openTimeDialog(employeeId, date, isWorking)}
            >
                {isWorking ? (
                    <Tooltip 
                        title={tooltipText} 
                        arrow 
                        placement="top"
                        enterDelay={500}
                        leaveDelay={200}
                    >
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            width: '100%',
                            height: '100%',
                            justifyContent: 'center',
                            p: 0.5
                        }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                {schedule.start_time.slice(0, 5)}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                {schedule.end_time.slice(0, 5)}
                            </Typography>
                            {hasBreaks && (
                                <Box 
                                    sx={{ 
                                        width: '80%', 
                                        height: '3px', 
                                        bgcolor: 'rgba(156, 39, 176, 0.6)',
                                        mt: 0.5,
                                        borderRadius: '2px'
                                    }} 
                                />
                            )}
                        </Box>
                    </Tooltip>
                ) : (
                    <Box sx={{ width: '100%', height: '100%' }} />
                )}
            </Box>
        );
    };
    
    // Состояние для уведомлений
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Добавляем состояние для выбора формулы графика
    const [scheduleFormula, setScheduleFormula] = useState('1/1');
    
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

    // Обработчик выбора/отмены выбора сотрудника
    const handleEmployeeToggle = (employeeId) => {
        setSelectedEmployees(prev => {
            if (prev.includes(employeeId)) {
                return prev.filter(id => id !== employeeId);
            } else {
                return [...prev, employeeId];
            }
        });
    };

    // Обработчик изменения рабочих часов
    const handleWorkHoursChange = (name, value) => {
        setWorkHours(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Обработчик выбора/отмены выбора даты
    const handleDateToggle = (date) => {
        setSelectedDates(prev => {
            const isSelected = prev.some(d => isSameDay(d, date));
            if (isSelected) {
                return prev.filter(d => !isSameDay(d, date));
            } else {
                return [...prev, date];
            }
        });
    };

    // Проверка, является ли дата рабочей для сотрудника
    const isWorkingDay = (date, employeeId) => {
        return schedules.some(schedule => 
            schedule.employee_id === employeeId && 
            isSameDay(new Date(schedule.date), date)
        );
    };

    // Получение рабочего графика для сотрудника на конкретную дату
    const getScheduleForDay = (date, employeeId) => {
        return schedules.find(schedule => 
            schedule.employee_id === employeeId && 
            isSameDay(new Date(schedule.date), date)
        );
    };

    // Сохранение рабочего графика для выбранных сотрудников и дат
    const saveSchedules = async () => {
        if (selectedEmployees.length === 0) {
            showSnackbar('Выберите хотя бы одного сотрудника', 'warning');
            return;
        }

        if (selectedDates.length === 0) {
            showSnackbar('Выберите хотя бы один день', 'warning');
            return;
        }

        const promises = [];
        
        // Для каждого выбранного сотрудника и каждой выбранной даты создаем запись в графике
        for (const employeeId of selectedEmployees) {
            for (const date of selectedDates) {
                // Проверяем, существует ли уже запись для этого сотрудника и даты
                const existingSchedule = schedules.find(s => 
                    s.employee_id === employeeId && 
                    isSameDay(new Date(s.date), date)
                );

                if (!existingSchedule) {
                    // Если записи нет, создаем новую
                    const scheduleData = {
                        employee_id: employeeId,
                        date: format(date, 'yyyy-MM-dd'),
                        start_time: format(workHours.start_time, 'HH:mm:ss'),
                        end_time: format(workHours.end_time, 'HH:mm:ss')
                    };

                    const promise = fetch('http://localhost:5000/api/schedules', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(scheduleData)
                    });
                    
                    promises.push(promise);
                }
            }
        }

        if (promises.length === 0) {
            showSnackbar('Все выбранные дни уже назначены как рабочие', 'info');
            return;
        }

        try {
            await Promise.all(promises);
            showSnackbar('Рабочий график успешно сохранен', 'success');
            fetchSchedules(); // Обновляем список графиков
            setSelectedDates([]); // Сбрасываем выбранные даты
        } catch (error) {
            showSnackbar('Ошибка при сохранении графика', 'error');
        }
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
    
    // Функция для проверки, входит ли дата в выбранный диапазон
    const isInSelectedRange = (date) => {
        return autoFillDialog.selectedRange && 
               date >= autoFillDialog.startDate && 
               date <= autoFillDialog.endDate;
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
    
    // Функция для получения описания формулы
    const getFormulaDescription = (formula) => {
        const formulaDescriptions = {
            '1/1': 'День через день (1 рабочий / 1 выходной)',
            '1/2': '1 рабочий / 2 выходных',
            '2/1': '2 рабочих / 1 выходной',
            '2/2': '2 рабочих / 2 выходных',
            '3/3': '3 рабочих / 3 выходных',
            '5/2': 'Стандартная рабочая неделя (5 рабочих / 2 выходных)',
            '6/1': '6 рабочих / 1 выходной',
            '7/0': 'Без выходных (7 рабочих / 0 выходных)'
        };
        
        return formulaDescriptions[formula] || formula;
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" align="center" gutterBottom>
                Управление рабочим графиком
            </Typography>

            {/* Панель навигации по неделям */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Button 
                    variant="outlined" 
                    startIcon={<ArrowBackIos />} 
                    onClick={goToPreviousWeek}
                >
                    Предыдущая неделя
                </Button>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ mx: 2 }}>
                        {format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'dd.MM.yyyy')} - {format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'dd.MM.yyyy')}
                    </Typography>
                    <Tooltip title="Текущая неделя">
                        <IconButton onClick={goToCurrentWeek}>
                            <Today />
                        </IconButton>
                    </Tooltip>
                </Box>
                
                <Button 
                    variant="outlined" 
                    endIcon={<ArrowForwardIos />} 
                    onClick={goToNextWeek}
                >
                    Следующая неделя
                </Button>
            </Box>

            {/* Кнопка автоматического заполнения графика */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<Schedule />}
                    onClick={openAutoFillDialog}
                >
                    Автоматическое заполнение графика
                </Button>
            </Box>

            {/* Таблица с графиком работы */}
            <Paper sx={{ p: 2, mb: 2, overflowX: 'auto' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ minWidth: 200 }}>Сотрудник</TableCell>
                                {getDaysInWeek().map(day => (
                                    <TableCell 
                                        key={day.toISOString()} 
                                        align="center"
                                        sx={{ 
                                            minWidth: 120,
                                            backgroundColor: isWeekend(day) ? '#ffebee' : 'inherit',
                                            fontWeight: isSameDay(day, new Date()) ? 'bold' : 'normal',
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
                            {employees.map(employee => (
                                <TableRow key={employee.id}>
                                    <TableCell>{employee.full_name}</TableCell>
                                    {getDaysInWeek().map(day => {
                                        const schedule = getScheduleForDay(day, employee.id);
                                        const isWorking = !!schedule;
                                        
                                        return (
                                            <TableCell 
                                                key={day.toISOString()} 
                                                align="center"
                                                sx={{ 
                                                    backgroundColor: isWorking ? '#e8f5e9' : (isWeekend(day) ? '#ffebee' : 'inherit'),
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        backgroundColor: isWorking ? '#c8e6c9' : '#f5f5f5',
                                                    }
                                                }}
                                                onClick={() => openTimeDialog(employee.id, day, isWorking)}
                                            >
                                                {isWorking ? (
                                                    <Box>
                                                        <Typography variant="body2">
                                                            {formatTimeRange(schedule.start_time, schedule.end_time)}
                                                        </Typography>
                                                        <IconButton 
                                                            size="small" 
                                                            color="error"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteWorkingDay(employee.id, day);
                                                            }}
                                                        >
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                ) : (
                                                    <IconButton size="small" color="primary">
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
            </Paper>

            {/* Диалог добавления/редактирования рабочего времени */}
            <Dialog open={timeDialog.open} onClose={closeTimeDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {timeDialog.isEdit ? 'Редактировать рабочее время' : 'Добавить рабочий день'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <Typography variant="subtitle1">
                                Сотрудник: {timeDialog.employeeId ? getEmployeeName(timeDialog.employeeId) : ''}
                            </Typography>
                            <Typography variant="subtitle1">
                                Дата: {timeDialog.date ? format(timeDialog.date, 'dd.MM.yyyy, EEEE', { locale: ru }) : ''}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                                <TimePicker
                                    label="Начало рабочего дня"
                                    value={timeDialog.startTime}
                                    onChange={(newValue) => setTimeDialog(prev => ({ ...prev, startTime: newValue }))}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                                <TimePicker
                                    label="Конец рабочего дня"
                                    value={timeDialog.endTime}
                                    onChange={(newValue) => setTimeDialog(prev => ({ ...prev, endTime: newValue }))}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                />
                            </LocalizationProvider>
                        </Grid>
                        
                        {/* Секция исключений (перерывов) */}
                        <Grid item xs={12} sx={{ mt: 2 }}>
                            <Typography variant="h6">Перерывы</Typography>
                            <Divider sx={{ mb: 2 }} />
                            
                            {/* Список существующих исключений */}
                            {timeDialog.exceptions.length > 0 ? (
                                <TableContainer component={Paper} sx={{ mb: 2 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Начало</TableCell>
                                                <TableCell>Конец</TableCell>
                                                <TableCell>Причина</TableCell>
                                                <TableCell>Действия</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {timeDialog.exceptions.map((exception, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{format(exception.startTime, 'HH:mm')}</TableCell>
                                                    <TableCell>{format(exception.endTime, 'HH:mm')}</TableCell>
                                                    <TableCell>{exception.reason}</TableCell>
                                                    <TableCell>
                                                        <IconButton 
                                                            size="small" 
                                                            color="error"
                                                            onClick={() => handleDeleteException(index)}
                                                        >
                                                            <Delete />
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
                            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Добавить перерыв</Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={4}>
                                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                                            <TimePicker
                                                label="Начало перерыва"
                                                value={newException.startTime}
                                                onChange={(newValue) => handleExceptionChange('startTime', newValue)}
                                                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                                            />
                                        </LocalizationProvider>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                                            <TimePicker
                                                label="Конец перерыва"
                                                value={newException.endTime}
                                                onChange={(newValue) => handleExceptionChange('endTime', newValue)}
                                                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
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
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Button 
                                            variant="outlined" 
                                            startIcon={<Add />}
                                            onClick={handleAddException}
                                            fullWidth
                                        >
                                            Добавить перерыв
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeTimeDialog}>Отмена</Button>
                    <Button onClick={saveTimeDialog} variant="contained" color="primary">
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
            >
                <DialogTitle>
                    Автоматическое заполнение графика
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Выберите формулу графика:
                        </Typography>
                        <FormControl fullWidth sx={{ mb: 3 }}>
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
                        
                        {/* Добавляем выбор рабочих часов */}
                        <Typography variant="subtitle1" gutterBottom>
                            Укажите рабочие часы:
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
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
                                    renderInput={(params) => <TextField {...params} sx={{ width: '48%' }} />}
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
                                    renderInput={(params) => <TextField {...params} sx={{ width: '48%' }} />}
                                />
                            </LocalizationProvider>
                        </Box>
                        
                        <Typography variant="subtitle1" gutterBottom>
                            Выберите диапазон дат для заполнения графика:
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ width: '48%' }}>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    {autoFillDialog.selectedRange 
                                        ? 'Выбрана начальная дата. Выберите конечную дату.' 
                                        : 'Выберите начальную дату диапазона'}
                                </Typography>
                                <Paper elevation={3} sx={{ p: 1, mb: 2, bgcolor: autoFillDialog.selectedRange ? '#e3f2fd' : 'inherit' }}>
                                    <Typography>
                                        Начало: {format(autoFillDialog.startDate, 'dd.MM.yyyy')}
                                    </Typography>
                                    <Typography>
                                        Конец: {format(autoFillDialog.endDate, 'dd.MM.yyyy')}
                                    </Typography>
                                </Paper>
                            </Box>
                            <Box sx={{ width: '48%' }}>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Количество дней: {
                                        Math.floor((autoFillDialog.endDate - autoFillDialog.startDate) / (1000 * 60 * 60 * 24)) + 1
                                    }
                                </Typography>
                            </Box>
                        </Box>
                        
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
                        
                        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                            Выберите сотрудников:
                        </Typography>
                        <FormGroup sx={{ mb: 2 }}>
                            {employees.map(employee => (
                                <FormControlLabel
                                    key={employee.id}
                                    control={
                                        <Checkbox
                                            checked={autoFillDialog.employees.includes(employee.id)}
                                            onChange={() => {
                                                const newEmployees = autoFillDialog.employees.includes(employee.id)
                                                    ? autoFillDialog.employees.filter(id => id !== employee.id)
                                                    : [...autoFillDialog.employees, employee.id];
                                                handleAutoFillChange('employees', newEmployees);
                                            }}
                                        />
                                    }
                                    label={employee.full_name}
                                />
                            ))}
                        </FormGroup>
                        
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                            График будет сгенерирован в выбранном диапазоне дат.
                            Существующие записи не будут перезаписаны.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeAutoFillDialog}>Отмена</Button>
                    <Button 
                        onClick={saveAutoFillSchedule} 
                        variant="contained" 
                        color="primary"
                        disabled={autoFillDialog.employees.length === 0}
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
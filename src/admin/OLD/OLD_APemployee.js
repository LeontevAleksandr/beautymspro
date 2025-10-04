import React, { useState, useEffect } from 'react';
import { 
    Typography, Box, Button, Paper, Grid, TextField, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogActions, DialogContent, DialogTitle,
    FormControl, InputLabel, Select, MenuItem, IconButton,
    Snackbar, Alert, FormHelperText, Checkbox, FormControlLabel,
    Stack, Divider
} from '@mui/material';
import { Edit, Delete, Add, Person, Badge, Phone, Email } from '@mui/icons-material';

function APemployee() {
    // Состояния для сотрудников
    const [employees, setEmployees] = useState([]);
    const [specializations, setSpecializations] = useState([]);
    const [qualifications, setQualifications] = useState([]);
    const [availableQualifications, setAvailableQualifications] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [openEmployeeDialog, setOpenEmployeeDialog] = useState(false);
    const [employeeForm, setEmployeeForm] = useState({
        full_name: '',
        passport_number: '',
        phone: '',
        email: '',
        password: '',
        specialization_id: '',
        qualification_level_id: ''
    });
    
    // Состояние для изменения пароля при редактировании
    const [changePassword, setChangePassword] = useState(false);
    
    // Состояние для валидации формы
    const [formErrors, setFormErrors] = useState({
        full_name: false,
        passport_number: false,
        phone: false,
        email: false,
        password: false
    });

    // Состояние для уведомлений
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Состояние для группированных сотрудников
    const [groupedEmployees, setGroupedEmployees] = useState({});

    // Загрузка данных при монтировании компонента
    useEffect(() => {
        fetchEmployees();
        fetchSpecializations();
        fetchQualifications();
    }, []);

    // Группировка сотрудников при изменении данных
    useEffect(() => {
        if (employees.length > 0) {
            groupEmployeesBySpecialization();
        }
    }, [employees]);

    // Функции для работы с сотрудниками
    const fetchEmployees = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/employees');
            if (response.ok) {
                const data = await response.json();
                setEmployees(data);
            } else {
                const errorData = await response.json();
                showSnackbar(`Ошибка при загрузке сотрудников: ${errorData.error || 'Неизвестная ошибка'}`, 'error');
            }
        } catch (error) {
            showSnackbar(`Ошибка сети при загрузке сотрудников: ${error.message}`, 'error');
        }
    };

    // Группировка сотрудников по специализациям
    const groupEmployeesBySpecialization = () => {
        const grouped = {};
        
        employees.forEach(employee => {
            const specializationName = employee.specialization ? employee.specialization.name : 'Без специализации';
            const specializationId = employee.specialization ? employee.specialization.id : 'no_spec';
            
            if (!grouped[specializationName]) {
                grouped[specializationName] = {
                    id: specializationId,
                    name: specializationName,
                    employees: []
                };
            }
            
            grouped[specializationName].employees.push(employee);
        });
        
        // Сортируем сотрудников внутри каждой группы по приоритету квалификации (по возрастанию)
        Object.keys(grouped).forEach(specName => {
            grouped[specName].employees.sort((a, b) => {
                const priorityA = a.qualification ? a.qualification.priority : 999;
                const priorityB = b.qualification ? b.qualification.priority : 999;
                return priorityA - priorityB;
            });
        });
        
        setGroupedEmployees(grouped);
    };

    const fetchSpecializations = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/specializations');
            if (response.ok) {
                const data = await response.json();
                setSpecializations(data);
            } else {
                const errorData = await response.json();
                showSnackbar(`Ошибка при загрузке специализаций: ${errorData.error || 'Неизвестная ошибка'}`, 'error');
            }
        } catch (error) {
            showSnackbar(`Ошибка сети при загрузке специализаций: ${error.message}`, 'error');
        }
    };

    const fetchQualifications = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/qualifications');
            if (response.ok) {
                const data = await response.json();
                // Сортируем квалификации по приоритету
                data.sort((a, b) => a.priority - b.priority);
                setQualifications(data);
            } else {
                const errorData = await response.json();
                showSnackbar(`Ошибка при загрузке квалификаций: ${errorData.error || 'Неизвестная ошибка'}`, 'error');
            }
        } catch (error) {
            showSnackbar(`Ошибка сети при загрузке квалификаций: ${error.message}`, 'error');
        }
    };
    
    // Получение доступных квалификаций для выбранной специализации
    const fetchQualificationsBySpecialization = async (specializationId) => {
        if (!specializationId) {
            setAvailableQualifications([]);
            return;
        }
        
        try {
            const response = await fetch(`http://localhost:5000/api/specialization_qualifications`);
            if (response.ok) {
                const data = await response.json();
                // Фильтруем только те записи, которые относятся к выбранной специализации
                const filteredData = data.filter(item => item.specialization_id === parseInt(specializationId));
                
                // Получаем полные данные о квалификациях
                const qualIds = filteredData.map(item => item.qualification_id);
                const availableQuals = qualifications.filter(q => qualIds.includes(q.id));
                
                // Сортируем по приоритету
                availableQuals.sort((a, b) => a.priority - b.priority);
                
                setAvailableQualifications(availableQuals);
                
                // Сбрасываем выбранную квалификацию, если она не доступна для новой специализации
                if (employeeForm.qualification_level_id && 
                    !qualIds.includes(parseInt(employeeForm.qualification_level_id))) {
                    setEmployeeForm({
                        ...employeeForm,
                        qualification_level_id: ''
                    });
                }
            } else {
                const errorData = await response.json();
                showSnackbar(`Ошибка при загрузке квалификаций для специализации: ${errorData.error || 'Неизвестная ошибка'}`, 'error');
                setAvailableQualifications([]);
            }
        } catch (error) {
            showSnackbar(`Ошибка сети при загрузке квалификаций для специализации: ${error.message}`, 'error');
            setAvailableQualifications([]);
        }
    };

    const handleEmployeeFormChange = (e) => {
        const { name, value } = e.target;
        
        // Если изменилась специализация, обновляем доступные квалификации
        if (name === 'specialization_id') {
            fetchQualificationsBySpecialization(value);
        }
        
        setEmployeeForm({
            ...employeeForm,
            [name]: value
        });
        
        // Сбрасываем ошибку для поля, которое изменилось
        if (formErrors[name]) {
            setFormErrors({
                ...formErrors,
                [name]: false
            });
        }
    };

    const validateForm = () => {
        const errors = {
            full_name: !employeeForm.full_name.trim(),
            passport_number: !employeeForm.passport_number.trim(),
            phone: employeeForm.phone && !/^\+?\d{10,15}$/.test(employeeForm.phone),
            email: employeeForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employeeForm.email),
            password: (!selectedEmployee && !employeeForm.password) || (selectedEmployee && changePassword && !employeeForm.password)
        };
        
        setFormErrors(errors);
        
        return !Object.values(errors).some(error => error);
    };

    const handleAddEmployee = () => {
        setSelectedEmployee(null);
        setEmployeeForm({
            full_name: '',
            passport_number: '',
            phone: '',
            email: '',
            password: '',
            specialization_id: '',
            qualification_level_id: ''
        });
        setFormErrors({
            full_name: false,
            passport_number: false,
            phone: false,
            email: false,
            password: false
        });
        setChangePassword(false);
        setAvailableQualifications([]);
        setOpenEmployeeDialog(true);
    };

    const handleEditEmployee = (employee) => {
        setSelectedEmployee(employee);
        setEmployeeForm({
            full_name: employee.full_name,
            passport_number: employee.passport_number,
            phone: employee.phone || '',
            email: employee.email || '',
            password: '',
            specialization_id: employee.specialization_id || '',
            qualification_level_id: employee.qualification_level_id || ''
        });
        setFormErrors({
            full_name: false,
            passport_number: false,
            phone: false,
            email: false,
            password: false
        });
        setChangePassword(false);
        
        // Загружаем доступные квалификации для выбранной специализации
        if (employee.specialization_id) {
            fetchQualificationsBySpecialization(employee.specialization_id);
        } else {
            setAvailableQualifications([]);
        }
        
        setOpenEmployeeDialog(true);
    };

    const handleDeleteEmployee = async (id) => {
        if (window.confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
            try {
                const response = await fetch(`http://localhost:5000/api/employees/${id}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    fetchEmployees(); // Это автоматически вызовет группировку через useEffect
                    showSnackbar('Сотрудник успешно удален', 'success');
                } else {
                    const errorData = await response.json();
                    showSnackbar(`Ошибка при удалении сотрудника: ${errorData.error || errorData.details || 'Неизвестная ошибка'}`, 'error');
                }
            } catch (error) {
                showSnackbar(`Ошибка сети при удалении сотрудника: ${error.message}`, 'error');
            }
        }
    };

    const handleSubmitEmployee = async () => {
        if (!validateForm()) {
            showSnackbar('Пожалуйста, заполните все обязательные поля корректно', 'error');
            return;
        }
        
        try {
            const method = selectedEmployee ? 'PUT' : 'POST';
            const url = selectedEmployee ? `http://localhost:5000/api/employees/${selectedEmployee.id}` : 'http://localhost:5000/api/employees';
            
            // Создаем копию данных формы
            const formData = {...employeeForm};
            
            // Если редактируем сотрудника и не меняем пароль, удаляем поле password
            if (selectedEmployee && !changePassword) {
                delete formData.password;
            }
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                fetchEmployees(); // Это автоматически вызовет группировку через useEffect
                setOpenEmployeeDialog(false);
                showSnackbar(
                    selectedEmployee ? 'Сотрудник успешно обновлен' : 'Сотрудник успешно добавлен', 
                    'success'
                );
            } else {
                const error = await response.json();
                showSnackbar(`Ошибка: ${error.details || error.error || 'Неизвестная ошибка'}`, 'error');
            }
        } catch (error) {
            showSnackbar(`Ошибка сети при сохранении сотрудника: ${error.message}`, 'error');
        }
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

    const handleChangePasswordToggle = (e) => {
        setChangePassword(e.target.checked);
        if (!e.target.checked) {
            // Если отключили изменение пароля, сбрасываем ошибку пароля
            setFormErrors({
                ...formErrors,
                password: false
            });
        }
    };

    return (
        <Box sx={{ 
            p: 3, 
            backgroundColor: '#fafafa',
            minHeight: '100vh'
        }}>
            {/* ============ ЗАГОЛОВОК И КНОПКА ДОБАВЛЕНИЯ ============ */}
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
                        Управление сотрудниками
                    </Typography>
                    <Typography 
                        variant="body2" 
                        sx={{ color: '#666' }}
                    >
                        Добавление и редактирование сотрудников салона
                        {employees.length > 0 && (
                            <Box component="span" sx={{ ml: 2 }}>
                                • Всего сотрудников: {employees.length} 
                                • Специализаций: {Object.keys(groupedEmployees).length}
                            </Box>
                        )}
                    </Typography>
                </Box>
                
                <Button 
                    variant="contained" 
                    startIcon={<Add />} 
                    onClick={handleAddEmployee}
                    size="medium"
                    sx={{ 
                        borderRadius: 2, 
                        textTransform: 'none',
                        backgroundColor: '#1976d2',
                        boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)',
                        minWidth: 160,
                        '&:hover': {
                            backgroundColor: '#1565c0',
                            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.35)'
                        }
                    }}
                >
                    Добавить сотрудника
                </Button>
            </Stack>

            {/* ============ ТАБЛИЦА СОТРУДНИКОВ С ГРУППИРОВКОЙ ============ */}
            <TableContainer 
                component={Paper} 
                sx={{ 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)', 
                    borderRadius: 3,
                    border: '1px solid #e0e0e0',
                    overflow: 'hidden'
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
                                    width: '25%'
                                }}
                            >
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Person sx={{ fontSize: 18, color: '#666' }} />
                                    <span>ФИО</span>
                                </Stack>
                            </TableCell>
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
                                    <Badge sx={{ fontSize: 18, color: '#666' }} />
                                    <span>Специализация</span>
                                </Stack>
                            </TableCell>
                            <TableCell 
                                sx={{ 
                                    fontWeight: 600, 
                                    color: '#424242',
                                    borderBottom: '1px solid #e0e0e0',
                                    py: 2,
                                    width: '15%'
                                }}
                            >
                                Квалификация
                            </TableCell>
                            <TableCell 
                                sx={{ 
                                    fontWeight: 600, 
                                    color: '#424242',
                                    borderBottom: '1px solid #e0e0e0',
                                    py: 2,
                                    width: '15%'
                                }}
                            >
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Phone sx={{ fontSize: 18, color: '#666' }} />
                                    <span>Телефон</span>
                                </Stack>
                            </TableCell>
                            <TableCell 
                                sx={{ 
                                    fontWeight: 600, 
                                    color: '#424242',
                                    borderBottom: '1px solid #e0e0e0',
                                    py: 2,
                                    width: '15%'
                                }}
                            >
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Email sx={{ fontSize: 18, color: '#666' }} />
                                    <span>Email</span>
                                </Stack>
                            </TableCell>
                            <TableCell 
                                align="center"
                                sx={{ 
                                    fontWeight: 600, 
                                    color: '#424242',
                                    borderBottom: '1px solid #e0e0e0',
                                    py: 2,
                                    width: '10%'
                                }}
                            >
                                Действия
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.keys(groupedEmployees).length > 0 ? (
                            Object.keys(groupedEmployees)
                                .sort((a, b) => {
                                    // Сортируем группы: "Без специализации" в конец
                                    if (a === 'Без специализации') return 1;
                                    if (b === 'Без специализации') return -1;
                                    return a.localeCompare(b);
                                })
                                .map((specializationName, groupIndex) => {
                                    const group = groupedEmployees[specializationName];
                                    return (
                                        <React.Fragment key={specializationName}>
                                            {/* Заголовок группы специализации */}
                                            <TableRow>
                                                <TableCell 
                                                    colSpan={6}
                                                    sx={{
                                                        backgroundColor: '#f0f4ff',
                                                        borderLeft: '4px solid #1976d2',
                                                        py: 1.5,
                                                        fontWeight: 600,
                                                        color: '#1976d2',
                                                        fontSize: '0.95rem'
                                                    }}
                                                >
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                        <Badge sx={{ fontSize: 20 }} />
                                                        <span>{specializationName}</span>
                                                        <Box 
                                                            sx={{
                                                                backgroundColor: '#1976d2',
                                                                color: 'white',
                                                                borderRadius: '12px',
                                                                px: 1.5,
                                                                py: 0.5,
                                                                fontSize: '0.75rem',
                                                                fontWeight: 500
                                                            }}
                                                        >
                                                            {group.employees.length} сотр.
                                                        </Box>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                            
                                            {/* Сотрудники в группе */}
                                            {group.employees.map((employee, employeeIndex) => (
                                                <TableRow 
                                                    key={employee.id} 
                                                    hover
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
                                                    <TableCell 
                                                        sx={{ 
                                                            py: 2,
                                                            borderBottom: '1px solid #f0f0f0'
                                                        }}
                                                    >
                                                        <Typography 
                                                            variant="body2" 
                                                            sx={{ 
                                                                color: '#424242',
                                                                fontStyle: specializationName === 'Без специализации' ? 'italic' : 'normal',
                                                                opacity: specializationName === 'Без специализации' ? 0.7 : 1
                                                            }}
                                                        >
                                                            {employee.specialization ? employee.specialization.name : 'Не указана'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell 
                                                        sx={{ 
                                                            py: 2,
                                                            borderBottom: '1px solid #f0f0f0'
                                                        }}
                                                    >
                                                        {employee.qualification ? (
                                                            <Box 
                                                                sx={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    backgroundColor: '#e8f5e8',
                                                                    color: '#2e7d32',
                                                                    borderRadius: '8px',
                                                                    px: 1.5,
                                                                    py: 0.5,
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 500
                                                                }}
                                                            >
                                                                {employee.qualification.name}
                                                            </Box>
                                                        ) : (
                                                            <Typography 
                                                                variant="body2" 
                                                                sx={{ 
                                                                    color: '#999',
                                                                    fontStyle: 'italic'
                                                                }}
                                                            >
                                                                Не указана
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell 
                                                        sx={{ 
                                                            py: 2,
                                                            borderBottom: '1px solid #f0f0f0'
                                                        }}
                                                    >
                                                        <Typography 
                                                            variant="body2" 
                                                            sx={{ color: '#424242' }}
                                                        >
                                                            {employee.phone || '-'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell 
                                                        sx={{ 
                                                            py: 2,
                                                            borderBottom: '1px solid #f0f0f0'
                                                        }}
                                                    >
                                                        <Typography 
                                                            variant="body2" 
                                                            sx={{ color: '#424242' }}
                                                        >
                                                            {employee.email || '-'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell 
                                                        align="center"
                                                        sx={{ 
                                                            py: 2,
                                                            borderBottom: '1px solid #f0f0f0'
                                                        }}
                                                    >
                                                        <Stack direction="row" spacing={0.5} justifyContent="center">
                                                            <IconButton 
                                                                size="small" 
                                                                onClick={() => handleEditEmployee(employee)}
                                                                sx={{
                                                                    color: '#1976d2',
                                                                    '&:hover': {
                                                                        backgroundColor: 'rgba(25, 118, 210, 0.08)'
                                                                    }
                                                                }}
                                                            >
                                                                <Edit fontSize="small" />
                                                            </IconButton>
                                                            <IconButton 
                                                                size="small" 
                                                                onClick={() => handleDeleteEmployee(employee.id)}
                                                                sx={{
                                                                    color: '#d32f2f',
                                                                    '&:hover': {
                                                                        backgroundColor: 'rgba(211, 47, 47, 0.08)'
                                                                    }
                                                                }}
                                                            >
                                                                <Delete fontSize="small" />
                                                            </IconButton>
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </React.Fragment>
                                    );
                                })
                        ) : (
                            <TableRow>
                                <TableCell 
                                    colSpan={6} 
                                    align="center"
                                    sx={{ 
                                        py: 6,
                                        color: '#666'
                                    }}
                                >
                                    <Typography variant="body2">
                                        Нет данных
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* ============ ДИАЛОГ ДОБАВЛЕНИЯ/РЕДАКТИРОВАНИЯ ============ */}
            <Dialog 
                open={openEmployeeDialog} 
                onClose={() => setOpenEmployeeDialog(false)}
                maxWidth="sm"
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
                    {selectedEmployee ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
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
                                Основная информация
                            </Typography>
                            
                            <TextField
                                fullWidth
                                label="ФИО"
                                name="full_name"
                                value={employeeForm.full_name}
                                onChange={handleEmployeeFormChange}
                                error={formErrors.full_name}
                                helperText={formErrors.full_name ? "Обязательное поле" : "Фамилия, имя и отчество"}
                                required
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2
                                    }
                                }}
                            />
                            
                            <TextField
                                fullWidth
                                label="Номер паспорта"
                                name="passport_number"
                                value={employeeForm.passport_number}
                                onChange={handleEmployeeFormChange}
                                error={formErrors.passport_number}
                                helperText={formErrors.passport_number ? "Обязательное поле" : "Серия и номер без пробелов"}
                                required
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2
                                    }
                                }}
                            />
                        </Stack>

                        <Divider sx={{ my: 1 }} />

                        {/* Контактная информация */}
                        <Stack spacing={2}>
                            <Typography 
                                variant="subtitle2" 
                                sx={{ 
                                    color: '#424242',
                                    fontWeight: 500,
                                    mb: 1
                                }}
                            >
                                Контактная информация
                            </Typography>
                            
                            <TextField
                                fullWidth
                                label="Телефон"
                                name="phone"
                                value={employeeForm.phone}
                                onChange={handleEmployeeFormChange}
                                error={formErrors.phone}
                                helperText={formErrors.phone ? "Неверный формат" : "Формат: +79001234567"}
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2
                                    }
                                }}
                            />
                            
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                value={employeeForm.email}
                                onChange={handleEmployeeFormChange}
                                error={formErrors.email}
                                helperText={formErrors.email ? "Неверный формат" : "example@domain.com"}
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2
                                    }
                                }}
                            />
                        </Stack>

                        <Divider sx={{ my: 1 }} />

                        {/* Безопасность */}
                        <Stack spacing={2}>
                            <Typography 
                                variant="subtitle2" 
                                sx={{ 
                                    color: '#424242',
                                    fontWeight: 500,
                                    mb: 1
                                }}
                            >
                                Безопасность
                            </Typography>
                            
                            {selectedEmployee ? (
                                <Box>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={changePassword}
                                                onChange={handleChangePasswordToggle}
                                                size="small"
                                            />
                                        }
                                        label="Изменить пароль"
                                        sx={{ mb: changePassword ? 2 : 0 }}
                                    />
                                    {changePassword && (
                                        <TextField
                                            fullWidth
                                            label="Новый пароль"
                                            name="password"
                                            type="password"
                                            value={employeeForm.password}
                                            onChange={handleEmployeeFormChange}
                                            error={formErrors.password}
                                            helperText={formErrors.password ? "Обязательное поле" : "Новый пароль для входа"}
                                            required
                                            size="small"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 2
                                                }
                                            }}
                                        />
                                    )}
                                </Box>
                            ) : (
                                <TextField
                                    fullWidth
                                    label="Пароль"
                                    name="password"
                                    type="password"
                                    value={employeeForm.password}
                                    onChange={handleEmployeeFormChange}
                                    error={formErrors.password}
                                    helperText={formErrors.password ? "Обязательное поле" : "Пароль для входа в систему"}
                                    required
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2
                                        }
                                    }}
                                />
                            )}
                        </Stack>

                        <Divider sx={{ my: 1 }} />

                        {/* Профессиональная информация */}
                        <Stack spacing={2}>
                            <Typography 
                                variant="subtitle2" 
                                sx={{ 
                                    color: '#424242',
                                    fontWeight: 500,
                                    mb: 1
                                }}
                            >
                                Профессиональная информация
                            </Typography>
                            
                            <FormControl 
                                fullWidth 
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2
                                    }
                                }}
                            >
                                <InputLabel>Специализация</InputLabel>
                                <Select
                                    name="specialization_id"
                                    value={employeeForm.specialization_id}
                                    onChange={handleEmployeeFormChange}
                                    label="Специализация"
                                >
                                    <MenuItem value="">Не выбрано</MenuItem>
                                    {specializations.map(spec => (
                                        <MenuItem key={spec.id} value={spec.id}>{spec.name}</MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>Выберите специализацию из списка</FormHelperText>
                            </FormControl>
                            
                            <FormControl 
                                fullWidth 
                                size="small"
                                disabled={!employeeForm.specialization_id}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2
                                    }
                                }}
                            >
                                <InputLabel>Квалификация</InputLabel>
                                <Select
                                    name="qualification_level_id"
                                    value={employeeForm.qualification_level_id}
                                    onChange={handleEmployeeFormChange}
                                    label="Квалификация"
                                >
                                    <MenuItem value="">Не выбрано</MenuItem>
                                    {availableQualifications.map(qual => (
                                        <MenuItem key={qual.id} value={qual.id}>{qual.name}</MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>
                                    {!employeeForm.specialization_id 
                                        ? "Сначала выберите специализацию" 
                                        : "Выберите уровень квалификации"}
                                </FormHelperText>
                            </FormControl>
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
                        onClick={() => setOpenEmployeeDialog(false)}
                        sx={{ 
                            textTransform: 'none',
                            borderRadius: 2,
                            px: 3
                        }}
                    >
                        Отмена
                    </Button>
                    <Button 
                        onClick={handleSubmitEmployee} 
                        variant="contained"
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
                        {selectedEmployee ? 'Сохранить' : 'Добавить'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ============ УВЕДОМЛЕНИЯ ============ */}
            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={4000} 
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity={snackbar.severity} 
                    sx={{ 
                        width: '100%',
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default APemployee;
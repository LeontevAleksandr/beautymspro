import React, { useState, useEffect } from 'react';
import { 
    Typography, Box, Button, Paper, Grid, TextField, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogActions, DialogContent, DialogTitle,
    FormControl, InputLabel, Select, MenuItem, IconButton,
    Snackbar, Alert, FormHelperText, Checkbox, FormControlLabel
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';

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

    // Загрузка данных при монтировании компонента
    useEffect(() => {
        fetchEmployees();
        fetchSpecializations();
        fetchQualifications();
    }, []);

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
                    fetchEmployees();
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
                fetchEmployees();
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
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" align="center" gutterBottom>
                Управление сотрудниками
            </Typography>

            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button 
                        variant="contained" 
                        startIcon={<Add />} 
                        onClick={handleAddEmployee}
                        sx={{ borderRadius: '4px', textTransform: 'none' }}
                    >
                        Добавить сотрудника
                    </Button>
                </Box>

                <TableContainer component={Paper} sx={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                    <Table>
                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell>ФИО</TableCell>
                                <TableCell>Специализация</TableCell>
                                <TableCell>Квалификация</TableCell>
                                <TableCell>Телефон</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Действия</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {employees.map((employee) => (
                                <TableRow key={employee.id} hover>
                                    <TableCell>{employee.full_name}</TableCell>
                                    <TableCell>
                                        {employee.specialization ? employee.specialization.name : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {employee.qualification ? employee.qualification.name : '-'}
                                    </TableCell>
                                    <TableCell>{employee.phone || '-'}</TableCell>
                                    <TableCell>{employee.email || '-'}</TableCell>
                                    <TableCell>
                                        <IconButton 
                                            size="small" 
                                            onClick={() => handleEditEmployee(employee)}
                                            color="primary"
                                        >
                                            <Edit />
                                        </IconButton>
                                        <IconButton 
                                            size="small" 
                                            onClick={() => handleDeleteEmployee(employee.id)}
                                            color="error"
                                        >
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {employees.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        Нет данных
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Диалог добавления/редактирования сотрудника */}
            <Dialog 
                open={openEmployeeDialog} 
                onClose={() => setOpenEmployeeDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ borderBottom: '1px solid #eee', pb: 2 }}>
                    {selectedEmployee ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    // В компоненте Dialog, заменяем текстовые поля на следующие с улучшенными подсказками:
                    <TextField
                        fullWidth
                        margin="normal"
                        label="ФИО"
                        name="full_name"
                        value={employeeForm.full_name}
                        onChange={handleEmployeeFormChange}
                        error={formErrors.full_name}
                        helperText={formErrors.full_name ? "Обязательное поле. Введите полное имя сотрудника." : "Введите фамилию, имя и отчество сотрудника"}
                        required
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Номер паспорта"
                        name="passport_number"
                        value={employeeForm.passport_number}
                        onChange={handleEmployeeFormChange}
                        error={formErrors.passport_number}
                        helperText={formErrors.passport_number ? "Обязательное поле. Введите серию и номер паспорта." : "Введите серию и номер паспорта без пробелов"}
                        required
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Телефон"
                        name="phone"
                        value={employeeForm.phone}
                        onChange={handleEmployeeFormChange}
                        error={formErrors.phone}
                        helperText={formErrors.phone ? "Неверный формат телефона. Используйте формат +XXXXXXXXXXX (от 10 до 15 цифр)" : "Формат: +XXXXXXXXXXX (например, +79001234567)"}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Email"
                        name="email"
                        value={employeeForm.email}
                        onChange={handleEmployeeFormChange}
                        error={formErrors.email}
                        helperText={formErrors.email ? "Неверный формат email. Используйте формат example@domain.com" : "Формат: example@domain.com"}
                    />
                    
                    {selectedEmployee ? (
                        <Box sx={{ mt: 2 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={changePassword}
                                        onChange={handleChangePasswordToggle}
                                    />
                                }
                                label="Изменить пароль"
                            />
                            {changePassword && (
                                <TextField
                                    fullWidth
                                    margin="normal"
                                    label="Новый пароль"
                                    name="password"
                                    type="password"
                                    value={employeeForm.password}
                                    onChange={handleEmployeeFormChange}
                                    error={formErrors.password}
                                    helperText={formErrors.password ? "Обязательное поле. Введите новый пароль." : "Введите новый пароль для сотрудника"}
                                    required
                                />
                            )}
                        </Box>
                    ) : (
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Пароль"
                            name="password"
                            type="password"
                            value={employeeForm.password}
                            onChange={handleEmployeeFormChange}
                            error={formErrors.password}
                            helperText={formErrors.password ? "Обязательное поле. Введите пароль для нового сотрудника." : "Введите пароль для нового сотрудника"}
                            required
                        />
                    )}
                    
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Специализация</InputLabel>
                        <Select
                            name="specialization_id"
                            value={employeeForm.specialization_id}
                            onChange={handleEmployeeFormChange}
                        >
                            <MenuItem value="">Не выбрано</MenuItem>
                            {specializations.map(spec => (
                                <MenuItem key={spec.id} value={spec.id}>{spec.name}</MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>Выберите специализацию сотрудника из списка доступных</FormHelperText>
                    </FormControl>
                    
                    <FormControl fullWidth margin="normal" disabled={!employeeForm.specialization_id}>
                        <InputLabel>Квалификация</InputLabel>
                        <Select
                            name="qualification_level_id"
                            value={employeeForm.qualification_level_id}
                            onChange={handleEmployeeFormChange}
                        >
                            <MenuItem value="">Не выбрано</MenuItem>
                            {availableQualifications.map(qual => (
                                <MenuItem key={qual.id} value={qual.id}>{qual.name}</MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>
                            {!employeeForm.specialization_id 
                                ? "Сначала выберите специализацию" 
                                : "Выберите квалификацию сотрудника"}
                        </FormHelperText>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ borderTop: '1px solid #eee', p: 2 }}>
                    <Button 
                        onClick={() => setOpenEmployeeDialog(false)}
                        sx={{ textTransform: 'none' }}
                    >
                        Отмена
                    </Button>
                    <Button 
                        onClick={handleSubmitEmployee} 
                        variant="contained"
                        sx={{ textTransform: 'none' }}
                    >
                        {selectedEmployee ? 'Сохранить' : 'Добавить'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Уведомления */}
            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={6000} 
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity={snackbar.severity} 
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default APemployee;
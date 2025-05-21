import React, { useState, useEffect } from 'react';
import { 
    Typography, Box, Button, Paper, Grid, TextField, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogActions, DialogContent, DialogTitle,
    FormControl, InputLabel, Select, MenuItem, IconButton,
    Snackbar, Alert, Tooltip, Divider, Tabs, Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SettingsIcon from '@mui/icons-material/Settings';

function APclients() {
    // Состояния для клиентов
    const [clients, setClients] = useState([]);
    const [clientStatuses, setClientStatuses] = useState([]);
    const [clientPreferences, setClientPreferences] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [openClientDialog, setOpenClientDialog] = useState(false);
    const [openStatusDialog, setOpenStatusDialog] = useState(false);
    const [openPreferencesDialog, setOpenPreferencesDialog] = useState(false);
    const [newStatus, setNewStatus] = useState({ status: '' });
    const [editingStatus, setEditingStatus] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState(0);
    
    // Состояние для формы клиента
    const [clientForm, setClientForm] = useState({
        full_name: '',
        phone: '',
        email: '',
        telegram_chat_id: ''
    });
    
    // Состояние для формы предпочтений
    const [preferencesForm, setPreferencesForm] = useState({
        client_id: '',
        client_status_id: '',
        preferences: ''
    });
    
    // Состояние для валидации формы
    const [formErrors, setFormErrors] = useState({
        full_name: false,
        phone: false,
        email: false
    });
    
    // Состояние для уведомлений
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    
    // Загрузка данных при монтировании компонента
    useEffect(() => {
        fetchClients();
        fetchClientStatuses();
        fetchClientPreferences();
    }, []);
    
    // Функции для работы с клиентами
    const fetchClients = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/clients');
            if (response.ok) {
                const data = await response.json();
                setClients(data);
            } else {
                showSnackbar('Ошибка при загрузке клиентов', 'error');
            }
        } catch (error) {
            showSnackbar(`Ошибка сети: ${error.message}`, 'error');
        }
    };
    
    const fetchClientStatuses = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/client_statuses');
            if (response.ok) {
                const data = await response.json();
                setClientStatuses(data);
            } else {
                showSnackbar('Ошибка при загрузке статусов клиентов', 'error');
            }
        } catch (error) {
            showSnackbar(`Ошибка сети: ${error.message}`, 'error');
        }
    };
    
    const fetchClientPreferences = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/client_preferences');
            if (response.ok) {
                const data = await response.json();
                setClientPreferences(data);
            } else {
                showSnackbar('Ошибка при загрузке предпочтений клиентов', 'error');
            }
        } catch (error) {
            showSnackbar(`Ошибка сети: ${error.message}`, 'error');
        }
    };
    
    const handleClientFormChange = (e) => {
        const { name, value } = e.target;
        setClientForm({
            ...clientForm,
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
    
    const handlePreferencesFormChange = (e) => {
        const { name, value } = e.target;
        setPreferencesForm({
            ...preferencesForm,
            [name]: value
        });
    };
    
    const validateClientForm = () => {
        const errors = {
            full_name: !clientForm.full_name.trim(),
            phone: !clientForm.phone.trim() || !/^\+?\d{10,15}$/.test(clientForm.phone),
            email: clientForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientForm.email)
        };
        
        setFormErrors(errors);
        
        return !Object.values(errors).some(error => error);
    };
    
    const handleAddClient = () => {
        setSelectedClient(null);
        setClientForm({
            full_name: '',
            phone: '',
            email: '',
            telegram_chat_id: ''
        });
        setFormErrors({
            full_name: false,
            phone: false,
            email: false
        });
        setOpenClientDialog(true);
    };
    
    const handleEditClient = (client) => {
        setSelectedClient(client);
        setClientForm({
            full_name: client.full_name,
            phone: client.phone || '',
            email: client.email || '',
            telegram_chat_id: client.telegram_chat_id || ''
        });
        setFormErrors({
            full_name: false,
            phone: false,
            email: false
        });
        setOpenClientDialog(true);
    };
    
    const handleSaveClient = async () => {
        if (!validateClientForm()) return;
        
        try {
            let response;
            
            if (selectedClient) {
                // Обновление существующего клиента
                response = await fetch(`http://localhost:5000/api/clients/${selectedClient.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(clientForm)
                });
            } else {
                // Создание нового клиента
                response = await fetch('http://localhost:5000/api/clients', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(clientForm)
                });
            }
            
            if (response.ok) {
                setOpenClientDialog(false);
                fetchClients();
                showSnackbar(
                    selectedClient 
                        ? 'Клиент успешно обновлен' 
                        : 'Клиент успешно добавлен', 
                    'success'
                );
            } else {
                const errorData = await response.json();
                showSnackbar(`Ошибка: ${errorData.error || 'Неизвестная ошибка'}`, 'error');
            }
        } catch (error) {
            showSnackbar(`Ошибка сети: ${error.message}`, 'error');
        }
    };
    
    const handleDeleteClient = async (client) => {
        if (!window.confirm(`Вы уверены, что хотите удалить клиента ${client.full_name}?`)) {
            return;
        }
        
        try {
            const response = await fetch(`http://localhost:5000/api/clients/${client.id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                fetchClients();
                showSnackbar('Клиент успешно удален', 'success');
            } else {
                const errorData = await response.json();
                showSnackbar(`Ошибка при удалении: ${errorData.error || 'Неизвестная ошибка'}`, 'error');
            }
        } catch (error) {
            showSnackbar(`Ошибка сети: ${error.message}`, 'error');
        }
    };
    
    // Функции для работы со статусами клиентов
    const handleAddStatus = () => {
        setEditingStatus(null);
        setNewStatus({ status: '' });
        setOpenStatusDialog(true);
    };
    
    const handleEditStatus = (status) => {
        setEditingStatus(status);
        setNewStatus({ status: status.status });
        setOpenStatusDialog(true);
    };
    
    const handleSaveStatus = async () => {
        if (!newStatus.status.trim()) {
            showSnackbar('Название статуса не может быть пустым', 'error');
            return;
        }
        
        try {
            let response;
            
            if (editingStatus) {
                // Обновление существующего статуса
                response = await fetch(`http://localhost:5000/api/client_statuses/${editingStatus.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newStatus)
                });
            } else {
                // Создание нового статуса
                response = await fetch('http://localhost:5000/api/client_statuses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newStatus)
                });
            }
            
            if (response.ok) {
                setOpenStatusDialog(false);
                fetchClientStatuses();
                showSnackbar(
                    editingStatus 
                        ? 'Статус успешно обновлен' 
                        : 'Статус успешно добавлен', 
                    'success'
                );
            } else {
                const errorData = await response.json();
                showSnackbar(`Ошибка: ${errorData.error || 'Неизвестная ошибка'}`, 'error');
            }
        } catch (error) {
            showSnackbar(`Ошибка сети: ${error.message}`, 'error');
        }
    };
    
    const handleDeleteStatus = async (status) => {
        if (!window.confirm(`Вы уверены, что хотите удалить статус "${status.status}"?`)) {
            return;
        }
        
        try {
            const response = await fetch(`http://localhost:5000/api/client_statuses/${status.id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                fetchClientStatuses();
                showSnackbar('Статус успешно удален', 'success');
            } else {
                const errorData = await response.json();
                showSnackbar(`Ошибка при удалении: ${errorData.error || 'Неизвестная ошибка'}`, 'error');
            }
        } catch (error) {
            showSnackbar(`Ошибка сети: ${error.message}`, 'error');
        }
    };
    
    // Функции для работы с предпочтениями клиентов
    const handleAddPreferences = (client) => {
        // Проверяем, есть ли уже предпочтения для этого клиента
        const existingPreferences = clientPreferences.find(p => p.client_id === client.id);
        
        if (existingPreferences) {
            setPreferencesForm({
                client_id: existingPreferences.client_id,
                client_status_id: existingPreferences.client_status_id || '',
                preferences: existingPreferences.preferences || ''
            });
            setSelectedClient({...client, preferences_id: existingPreferences.id});
        } else {
            setPreferencesForm({
                client_id: client.id,
                client_status_id: '',
                preferences: ''
            });
            setSelectedClient(client);
        }
        
        setOpenPreferencesDialog(true);
    };
    
    const handleSavePreferences = async () => {
        if (!preferencesForm.client_id || !preferencesForm.client_status_id) {
            showSnackbar('Выберите статус клиента', 'error');
            return;
        }
        
        try {
            let response;
            const existingPreferences = clientPreferences.find(p => p.client_id === preferencesForm.client_id);
            
            if (existingPreferences) {
                // Обновление существующих предпочтений
                response = await fetch(`http://localhost:5000/api/client_preferences/${existingPreferences.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(preferencesForm)
                });
            } else {
                // Создание новых предпочтений
                response = await fetch('http://localhost:5000/api/client_preferences', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(preferencesForm)
                });
            }
            
            if (response.ok) {
                setOpenPreferencesDialog(false);
                fetchClientPreferences();
                showSnackbar('Предпочтения клиента сохранены', 'success');
            } else {
                const errorData = await response.json();
                showSnackbar(`Ошибка: ${errorData.error || 'Неизвестная ошибка'}`, 'error');
            }
        } catch (error) {
            showSnackbar(`Ошибка сети: ${error.message}`, 'error');
        }
    };
    
    // Вспомогательные функции
    const showSnackbar = (message, severity = 'info') => {
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
    
    const getClientStatus = (clientId) => {
        const preference = clientPreferences.find(p => p.client_id === clientId);
        if (!preference) return 'Не установлен';
        
        const status = clientStatuses.find(s => s.id === preference.client_status_id);
        return status ? status.status : 'Не установлен';
    };
    
    const getFilteredClients = () => {
        if (!searchTerm) return clients;
        
        return clients.filter(client => 
            client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.phone && client.phone.includes(searchTerm)) ||
            (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    };
    
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };
    
    // Рендеринг компонента
    return (
        <Box>
            <Typography variant="h6" align="center" gutterBottom>
                Управление клиентами
            </Typography>
            
            <Paper sx={{ p: 2, mb: 3 }}>
                <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange} 
                    centered
                    sx={{ mb: 2 }}
                >
                    <Tab label="Клиенты" />
                    <Tab label="Статусы клиентов" />
                </Tabs>
                
                {activeTab === 0 && (
                    <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <TextField
                                label="Поиск клиентов"
                                variant="outlined"
                                size="small"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                sx={{ width: '300px' }}
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<PersonAddIcon />}
                                onClick={handleAddClient}
                            >
                                Добавить клиента
                            </Button>
                        </Box>
                        
                        <TableContainer component={Paper} sx={{ mt: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>ФИО</TableCell>
                                        <TableCell>Телефон</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell>Статус</TableCell>
                                        <TableCell align="center">Действия</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {getFilteredClients().map((client) => (
                                        <TableRow key={client.id}>
                                            <TableCell>{client.full_name}</TableCell>
                                            <TableCell>{client.phone}</TableCell>
                                            <TableCell>{client.email || '-'}</TableCell>
                                            <TableCell>{getClientStatus(client.id)}</TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="Редактировать">
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => handleEditClient(client)}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Настройки и предпочтения">
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => handleAddPreferences(client)}
                                                    >
                                                        <SettingsIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Удалить">
                                                    <IconButton 
                                                        size="small" 
                                                        color="error"
                                                        onClick={() => handleDeleteClient(client)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {getFilteredClients().length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center">
                                                Клиенты не найдены
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}
                
                {activeTab === 1 && (
                    <>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={handleAddStatus}
                            >
                                Добавить статус
                            </Button>
                        </Box>
                        
                        <TableContainer component={Paper} sx={{ mt: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Название статуса</TableCell>
                                        <TableCell align="center">Действия</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {clientStatuses.map((status) => (
                                        <TableRow key={status.id}>
                                            <TableCell>{status.status}</TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="Редактировать">
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => handleEditStatus(status)}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Удалить">
                                                    <IconButton 
                                                        size="small" 
                                                        color="error"
                                                        onClick={() => handleDeleteStatus(status)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {clientStatuses.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={2} align="center">
                                                Статусы не найдены
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}
            </Paper>
            
            {/* Диалог добавления/редактирования клиента */}
            <Dialog 
                open={openClientDialog} 
                onClose={() => setOpenClientDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {selectedClient ? 'Редактирование клиента' : 'Добавление нового клиента'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                name="full_name"
                                label="ФИО клиента"
                                fullWidth
                                value={clientForm.full_name}
                                onChange={handleClientFormChange}
                                error={formErrors.full_name}
                                helperText={formErrors.full_name ? 'Введите ФИО клиента' : ''}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="phone"
                                label="Телефон"
                                fullWidth
                                value={clientForm.phone}
                                onChange={handleClientFormChange}
                                error={formErrors.phone}
                                helperText={formErrors.phone ? 'Введите корректный номер телефона' : ''}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="email"
                                label="Email"
                                fullWidth
                                value={clientForm.email}
                                onChange={handleClientFormChange}
                                error={formErrors.email}
                                helperText={formErrors.email ? 'Введите корректный email' : ''}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="telegram_chat_id"
                                label="Telegram ID"
                                fullWidth
                                value={clientForm.telegram_chat_id || ''}
                                onChange={handleClientFormChange}
                                type="number"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenClientDialog(false)}>Отмена</Button>
                    <Button onClick={handleSaveClient} variant="contained" color="primary">
                        Сохранить
                    </Button>
                </DialogActions>
            </Dialog>
            
            {/* Диалог добавления/редактирования статуса */}
            <Dialog 
                open={openStatusDialog} 
                onClose={() => setOpenStatusDialog(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>
                    {editingStatus ? 'Редактирование статуса' : 'Добавление нового статуса'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        name="status"
                        label="Название статуса"
                        fullWidth
                        value={newStatus.status}
                        onChange={(e) => setNewStatus({ status: e.target.value })}
                        sx={{ mt: 1 }}
                        required
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenStatusDialog(false)}>Отмена</Button>
                    <Button onClick={handleSaveStatus} variant="contained" color="primary">
                        Сохранить
                    </Button>
                </DialogActions>
            </Dialog>
            
            {/* Диалог настройки предпочтений клиента */}
            <Dialog 
                open={openPreferencesDialog} 
                onClose={() => setOpenPreferencesDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Настройка предпочтений клиента
                </DialogTitle>
                <DialogContent>
                    {selectedClient && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="subtitle1">
                                Клиент: {selectedClient.full_name}
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Статус клиента</InputLabel>
                                <Select
                                    name="client_status_id"
                                    value={preferencesForm.client_status_id}
                                    onChange={handlePreferencesFormChange}
                                    label="Статус клиента"
                                >
                                    {clientStatuses.map((status) => (
                                        <MenuItem key={status.id} value={status.id}>
                                            {status.status}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            
                            <TextField
                                name="preferences"
                                label="Предпочтения клиента"
                                fullWidth
                                multiline
                                rows={4}
                                value={preferencesForm.preferences || ''}
                                onChange={handlePreferencesFormChange}
                                placeholder="Введите информацию о предпочтениях клиента (аллергии, особые пожелания и т.д.)"
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPreferencesDialog(false)}>Отмена</Button>
                    <Button onClick={handleSavePreferences} variant="contained" color="primary">
                        Сохранить
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

export default APclients;
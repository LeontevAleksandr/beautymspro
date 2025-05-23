import React, { useState, useEffect } from 'react';
import { 
    Typography, Box, Button, Paper, Grid, TextField, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogActions, DialogContent, DialogTitle,
    FormControl, InputLabel, Select, MenuItem, IconButton,
    Snackbar, Alert, Tooltip, Divider, Tabs, Tab, Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import ViewListIcon from '@mui/icons-material/ViewList';
import StatusIcon from '@mui/icons-material/Label';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';

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
    const [groupByStatus, setGroupByStatus] = useState(true);
    const [statusFilter, setStatusFilter] = useState(''); // Новый фильтр по статусу
    
    // Состояние для формы клиента
    const [clientForm, setClientForm] = useState({
        full_name: '',
        phone: '',
        email: ''
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
    
    // Тема дизайна
    const theme = {
        colors: {
            background: '#fafafa',
            primaryText: '#1a1a1a',
            secondaryText: '#666',
            accent: '#1976d2',
            accentDark: '#1565c0',
            border: '#e0e0e0',
            tableHeader: '#f8f9fa',
            tableRowEven: '#ffffff',
            tableRowOdd: '#fafbfc',
            hover: '#f5f7fa'
        },
        shadows: {
            card: '0 1px 3px rgba(0,0,0,0.08)',
            button: '0 2px 4px rgba(25, 118, 210, 0.2)'
        }
    };
    
    // Загрузка данных при монтировании компонента
    useEffect(() => {
        fetchClients();
        fetchClientStatuses();
        fetchClientPreferences();
    }, []);
    
    // Функция форматирования номера телефона для отображения
    const formatPhoneForDisplay = (phone) => {
        if (!phone) return '';
        
        // Убираем все символы кроме цифр
        const cleaned = phone.replace(/\D/g, '');
        
        // Если номер начинается с 8, заменяем на +7
        let formatted = cleaned;
        if (cleaned.startsWith('8') && cleaned.length === 11) {
            formatted = '7' + cleaned.substring(1);
        }
        
        // Форматируем как +7 (XXX) XXX-XX-XX
        if (formatted.length >= 10) {
            const match = formatted.match(/^7?(\d{3})(\d{3})(\d{2})(\d{2})/);
            if (match) {
                return `+7 (${match[1]}) ${match[2]}-${match[3]}-${match[4]}`;
            }
        }
        
        return phone;
    };
    
    // Функция форматирования номера телефона для базы данных
    const formatPhoneForDB = (phone) => {
        if (!phone) return '';
        
        // Убираем все символы кроме цифр
        const cleaned = phone.replace(/\D/g, '');
        
        // Преобразуем в формат 89XXXXXXXXX
        if (cleaned.startsWith('7') && cleaned.length === 11) {
            return '8' + cleaned.substring(1);
        } else if (cleaned.startsWith('8') && cleaned.length === 11) {
            return cleaned;
        }
        
        return cleaned;
    };
    
    // Функция валидации номера телефона
    const validatePhone = (phone) => {
        if (!phone) return false;
        const cleaned = phone.replace(/\D/g, '');
        return (cleaned.startsWith('7') || cleaned.startsWith('8')) && cleaned.length === 11;
    };
    
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
        let formattedValue = value;
        
        // Форматирование телефона при вводе
        if (name === 'phone') {
            // Убираем все кроме цифр и +
            const cleaned = value.replace(/[^\d+]/g, '');
            
            // Если начинается с +7 или просто цифры
            if (cleaned.startsWith('+7') || cleaned.startsWith('7') || cleaned.startsWith('8')) {
                const digits = cleaned.replace(/\D/g, '');
                let phoneDigits = digits;
                
                // Нормализуем номер
                if (phoneDigits.startsWith('7') && phoneDigits.length <= 11) {
                    phoneDigits = phoneDigits;
                } else if (phoneDigits.startsWith('8') && phoneDigits.length <= 11) {
                    phoneDigits = '7' + phoneDigits.substring(1);
                } else if (phoneDigits.length <= 10) {
                    phoneDigits = '7' + phoneDigits;
                }
                
                // Форматируем для отображения
                if (phoneDigits.length >= 4) {
                    const match = phoneDigits.match(/^7(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
                    if (match) {
                        formattedValue = '+7';
                        if (match[1]) formattedValue += ` (${match[1]}`;
                        if (match[1] && match[1].length === 3) formattedValue += ')';
                        if (match[2]) formattedValue += ` ${match[2]}`;
                        if (match[3]) formattedValue += `-${match[3]}`;
                        if (match[4]) formattedValue += `-${match[4]}`;
                    }
                } else {
                    formattedValue = cleaned;
                }
            } else {
                formattedValue = cleaned;
            }
        }
        
        setClientForm({
            ...clientForm,
            [name]: formattedValue
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
            phone: !clientForm.phone.trim() || !validatePhone(clientForm.phone),
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
            email: ''
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
            full_name: client.full_name || '',
            phone: formatPhoneForDisplay(client.phone) || '',
            email: client.email || ''
        });
        setFormErrors({
            full_name: false,
            phone: false,
            email: false
        });
        setOpenClientDialog(true);
    };
    
    // ИСПРАВЛЕНА ФУНКЦИЯ handleSaveClient
    const handleSaveClient = async () => {
        if (!validateClientForm()) return;
        
        try {
            // ИСПРАВЛЕНИЕ: Явно создаем объект, а не используем spread
            const dataToSend = {
                full_name: clientForm.full_name.trim(),
                phone: formatPhoneForDB(clientForm.phone),
                email: clientForm.email?.trim() || null,
                telegram_chat_id: null
            };
            
            console.log('Отправляемые данные:', dataToSend); // Для отладки
            
            let response;
            
            if (selectedClient) {
                // Обновление существующего клиента
                response = await fetch(`http://localhost:5000/api/clients/${selectedClient.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dataToSend)
                });
            } else {
                // Создание нового клиента
                response = await fetch('http://localhost:5000/api/clients', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dataToSend)
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
    
    // Улучшенная функция фильтрации клиентов
    const getFilteredClients = () => {
        let filtered = clients;
        
        // Фильтрация по поисковому запросу
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(client => {
                // Поиск по ФИО
                const nameMatch = client.full_name.toLowerCase().includes(searchLower);
                
                // Поиск по телефону (и по оригинальному, и по отформатированному номеру)
                const phoneMatch = client.phone && (
                    client.phone.includes(searchTerm) ||
                    formatPhoneForDisplay(client.phone).includes(searchTerm)
                );
                
                // Поиск по email
                const emailMatch = client.email && 
                    client.email.toLowerCase().includes(searchLower);
                
                return nameMatch || phoneMatch || emailMatch;
            });
        }
        
        // Фильтрация по статусу
        if (statusFilter) {
            filtered = filtered.filter(client => {
                const preference = clientPreferences.find(p => p.client_id === client.id);
                
                if (statusFilter === 'no_status') {
                    // Показать клиентов без статуса
                    return !preference || !preference.client_status_id;
                } else {
                    // Показать клиентов с определенным статусом
                    return preference && preference.client_status_id === parseInt(statusFilter);
                }
            });
        }
        
        return filtered;
    };
    
    // Функция группировки клиентов по статусам
    const getGroupedClients = () => {
        const filteredClients = getFilteredClients();
        const grouped = {};
        
        filteredClients.forEach(client => {
            const preference = clientPreferences.find(p => p.client_id === client.id);
            let statusName = 'Без статуса';
            let statusId = 'no_status';
            
            if (preference) {
                const status = clientStatuses.find(s => s.id === preference.client_status_id);
                if (status) {
                    statusName = status.status;
                    statusId = status.id;
                }
            }
            
            if (!grouped[statusId]) {
                grouped[statusId] = {
                    statusName: statusName,
                    clients: []
                };
            }
            
            grouped[statusId].clients.push(client);
        });
        
        // Сортируем группы: сначала "Без статуса", потом остальные по алфавиту
        const sortedGroups = Object.entries(grouped).sort(([keyA, groupA], [keyB, groupB]) => {
            if (keyA === 'no_status') return 1; // "Без статуса" в конец
            if (keyB === 'no_status') return -1;
            return groupA.statusName.localeCompare(groupB.statusName);
        });
        
        return sortedGroups;
    };
    
    // Функция очистки всех фильтров
    const clearAllFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
    };
    
    // Проверка наличия активных фильтров
    const hasActiveFilters = searchTerm || statusFilter;
    
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };
    
    // Рендеринг компонента
    return (
        <Box sx={{ 
            backgroundColor: theme.colors.background, 
            minHeight: '100vh',
            p: 3
        }}>
            <Typography 
                variant="h6" 
                align="center" 
                gutterBottom
                sx={{ 
                    color: theme.colors.primaryText,
                    fontWeight: 600,
                    mb: 3
                }}
            >
                Управление клиентами
            </Typography>
            
            <Paper sx={{ 
                p: 3, 
                mb: 3,
                boxShadow: theme.shadows.card,
                borderRadius: 3,
                border: `1px solid ${theme.colors.border}`
            }}>
                <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange} 
                    centered
                    sx={{ 
                        mb: 3,
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            minWidth: 160,
                            fontSize: '0.9rem'
                        },
                        '& .MuiTabs-indicator': {
                            backgroundColor: theme.colors.accent
                        }
                    }}
                >
                    <Tab 
                        label="Клиенты" 
                        icon={<PersonIcon sx={{ fontSize: 18 }} />}
                        iconPosition="start"
                    />
                    <Tab 
                        label="Статусы клиентов" 
                        icon={<StatusIcon sx={{ fontSize: 18 }} />}
                        iconPosition="start"
                    />
                </Tabs>
                
                {activeTab === 0 && (
                    <>
                        <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1 }}>
                                <TextField
                                    label="Поиск клиентов"
                                    placeholder="ФИО, телефон или email"
                                    variant="outlined"
                                    size="small"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    sx={{ 
                                        width: '300px',
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2
                                        }
                                    }}
                                    InputProps={{
                                        startAdornment: <SearchIcon sx={{ fontSize: 18, mr: 1, color: theme.colors.secondaryText }} />
                                    }}
                                />
                                
                                <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <InputLabel>Фильтр по статусу</InputLabel>
                                    <Select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        label="Фильтр по статусу"
                                        sx={{
                                            borderRadius: 2
                                        }}
                                        startAdornment={<FilterListIcon sx={{ fontSize: 18, mr: 1, color: theme.colors.secondaryText }} />}
                                    >
                                        <MenuItem value="">
                                            <em>Все статусы</em>
                                        </MenuItem>
                                        {clientStatuses.map((status) => (
                                            <MenuItem key={status.id} value={status.id}>
                                                {status.status}
                                            </MenuItem>
                                        ))}
                                        <MenuItem value="no_status">
                                            <em>Без статуса</em>
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                                
                                {hasActiveFilters && (
                                    <Tooltip title="Очистить фильтры">
                                        <IconButton 
                                            onClick={clearAllFilters}
                                            size="small"
                                            sx={{
                                                backgroundColor: theme.colors.secondaryText + '10',
                                                '&:hover': {
                                                    backgroundColor: theme.colors.secondaryText + '20'
                                                }
                                            }}
                                        >
                                            <ClearIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Stack>
                            
                            <Stack direction="row" spacing={1}>
                                <Tooltip title={groupByStatus ? "Обычный список" : "Группировка по статусам"}>
                                    <Button
                                        variant={groupByStatus ? "contained" : "outlined"}
                                        size="small"
                                        onClick={() => setGroupByStatus(!groupByStatus)}
                                        sx={{
                                            textTransform: 'none',
                                            borderRadius: 2,
                                            minWidth: 'auto',
                                            px: 2
                                        }}
                                    >
                                        {groupByStatus ? <GroupIcon sx={{ fontSize: 18 }} /> : <ViewListIcon sx={{ fontSize: 18 }} />}
                                    </Button>
                                </Tooltip>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<PersonAddIcon sx={{ fontSize: 18 }} />}
                                    onClick={handleAddClient}
                                    sx={{
                                        textTransform: 'none',
                                        borderRadius: 2,
                                        minWidth: 160,
                                        boxShadow: theme.shadows.button,
                                        '&:hover': {
                                            backgroundColor: theme.colors.accentDark
                                        }
                                    }}
                                >
                                    Добавить клиента
                                </Button>
                            </Stack>
                        </Stack>
                        
                        <TableContainer 
                            component={Paper} 
                            sx={{ 
                                boxShadow: theme.shadows.card,
                                borderRadius: 2,
                                border: `1px solid ${theme.colors.border}`
                            }}
                        >
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: theme.colors.tableHeader }}>
                                        <TableCell sx={{ width: '25%', fontWeight: 600, color: theme.colors.primaryText }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <PersonIcon sx={{ fontSize: 18, mr: 1 }} />
                                                ФИО
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ width: '20%', fontWeight: 600, color: theme.colors.primaryText }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <PhoneIcon sx={{ fontSize: 18, mr: 1 }} />
                                                Телефон
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ width: '20%', fontWeight: 600, color: theme.colors.primaryText }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <EmailIcon sx={{ fontSize: 18, mr: 1 }} />
                                                Email
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ width: '15%', fontWeight: 600, color: theme.colors.primaryText }}>Telegram ID</TableCell>
                                        <TableCell sx={{ width: '15%', fontWeight: 600, color: theme.colors.primaryText }}>Статус</TableCell>
                                        <TableCell align="center" sx={{ width: '15%', fontWeight: 600, color: theme.colors.primaryText }}>Действия</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {groupByStatus ? (
                                        // Группированный вид
                                        getGroupedClients().length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ color: theme.colors.secondaryText, py: 4 }}>
                                                    Клиенты не найдены
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            getGroupedClients().map(([statusId, group]) => (
                                                <React.Fragment key={statusId}>
                                                    {/* Заголовок группы */}
                                                    <TableRow>
                                                        <TableCell 
                                                            colSpan={6} 
                                                            sx={{
                                                                backgroundColor: theme.colors.accent + '10',
                                                                borderTop: `2px solid ${theme.colors.accent}`,
                                                                borderBottom: `1px solid ${theme.colors.accent}30`,
                                                                py: 1.5,
                                                                fontWeight: 600,
                                                                color: theme.colors.accent,
                                                                fontSize: '0.95rem'
                                                            }}
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <StatusIcon sx={{ fontSize: 20, mr: 1 }} />
                                                                {group.statusName} ({group.clients.length})
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                    
                                                    {/* Клиенты в группе */}
                                                    {group.clients.map((client, clientIndex) => (
                                                        <TableRow 
                                                            key={client.id}
                                                            sx={{
                                                                backgroundColor: clientIndex % 2 === 0 ? theme.colors.tableRowEven : theme.colors.tableRowOdd,
                                                                '&:hover': {
                                                                    backgroundColor: theme.colors.hover
                                                                },
                                                                '&:last-child td': {
                                                                    borderBottom: `2px solid ${theme.colors.border}`
                                                                }
                                                            }}
                                                        >
                                                            <TableCell sx={{ 
                                                                color: theme.colors.primaryText,
                                                                pl: 4 // Отступ для визуального вложения
                                                            }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                    <PersonIcon sx={{ fontSize: 16, mr: 1, color: theme.colors.secondaryText }} />
                                                                    {client.full_name}
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell sx={{ color: theme.colors.primaryText }}>
                                                                {formatPhoneForDisplay(client.phone)}
                                                            </TableCell>
                                                            <TableCell sx={{ color: theme.colors.secondaryText }}>
                                                                {client.email || '-'}
                                                            </TableCell>
                                                            <TableCell sx={{ color: theme.colors.secondaryText }}>
                                                                {client.telegram_chat_id || '-'}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Box sx={{
                                                                    display: 'inline-block',
                                                                    px: 2,
                                                                    py: 0.5,
                                                                    borderRadius: 2,
                                                                    backgroundColor: statusId === 'no_status' 
                                                                        ? theme.colors.secondaryText + '20' 
                                                                        : theme.colors.accent + '20',
                                                                    color: statusId === 'no_status' 
                                                                        ? theme.colors.secondaryText 
                                                                        : theme.colors.accent,
                                                                    fontSize: '0.75rem'
                                                                }}>
                                                                    {group.statusName}
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Tooltip title="Редактировать">
                                                                    <IconButton 
                                                                        size="small" 
                                                                        onClick={() => handleEditClient(client)}
                                                                        sx={{ mr: 0.5 }}
                                                                    >
                                                                        <EditIcon sx={{ fontSize: 18 }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Настройки и предпочтения">
                                                                    <IconButton 
                                                                        size="small" 
                                                                        onClick={() => handleAddPreferences(client)}
                                                                        sx={{ mr: 0.5 }}
                                                                    >
                                                                        <SettingsIcon sx={{ fontSize: 18 }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Удалить">
                                                                    <IconButton 
                                                                        size="small" 
                                                                        color="error"
                                                                        onClick={() => handleDeleteClient(client)}
                                                                    >
                                                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </React.Fragment>
                                            ))
                                        )
                                    ) : (
                                        // Обычный список
                                        getFilteredClients().length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ color: theme.colors.secondaryText, py: 4 }}>
                                                    Клиенты не найдены
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            getFilteredClients().map((client, index) => (
                                                <TableRow 
                                                    key={client.id}
                                                    sx={{
                                                        backgroundColor: index % 2 === 0 ? theme.colors.tableRowEven : theme.colors.tableRowOdd,
                                                        '&:hover': {
                                                            backgroundColor: theme.colors.hover
                                                        }
                                                    }}
                                                >
                                                    <TableCell sx={{ color: theme.colors.primaryText }}>{client.full_name}</TableCell>
                                                    <TableCell sx={{ color: theme.colors.primaryText }}>
                                                        {formatPhoneForDisplay(client.phone)}
                                                    </TableCell>
                                                    <TableCell sx={{ color: theme.colors.secondaryText }}>
                                                        {client.email || '-'}
                                                    </TableCell>
                                                    <TableCell sx={{ color: theme.colors.secondaryText }}>
                                                        {client.telegram_chat_id || '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{
                                                            display: 'inline-block',
                                                            px: 2,
                                                            py: 0.5,
                                                            borderRadius: 2,
                                                            backgroundColor: theme.colors.accent + '20',
                                                            color: theme.colors.accent,
                                                            fontSize: '0.8rem'
                                                        }}>
                                                            {getClientStatus(client.id)}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Tooltip title="Редактировать">
                                                            <IconButton 
                                                                size="small" 
                                                                onClick={() => handleEditClient(client)}
                                                                sx={{ mr: 0.5 }}
                                                            >
                                                                <EditIcon sx={{ fontSize: 18 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Настройки и предпочтения">
                                                            <IconButton 
                                                                size="small" 
                                                                onClick={() => handleAddPreferences(client)}
                                                                sx={{ mr: 0.5 }}
                                                            >
                                                                <SettingsIcon sx={{ fontSize: 18 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Удалить">
                                                            <IconButton 
                                                                size="small" 
                                                                color="error"
                                                                onClick={() => handleDeleteClient(client)}
                                                            >
                                                                <DeleteIcon sx={{ fontSize: 18 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}
                
                {activeTab === 1 && (
                    <>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AddIcon sx={{ fontSize: 18 }} />}
                                onClick={handleAddStatus}
                                sx={{
                                    textTransform: 'none',
                                    borderRadius: 2,
                                    minWidth: 160,
                                    boxShadow: theme.shadows.button
                                }}
                            >
                                Добавить статус
                            </Button>
                        </Box>
                        
                        <TableContainer 
                            component={Paper} 
                            sx={{ 
                                boxShadow: theme.shadows.card,
                                borderRadius: 2,
                                border: `1px solid ${theme.colors.border}`
                            }}
                        >
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: theme.colors.tableHeader }}>
                                        <TableCell sx={{ fontWeight: 600, color: theme.colors.primaryText }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <StatusIcon sx={{ fontSize: 18, mr: 1 }} />
                                                Название статуса
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, color: theme.colors.primaryText, width: '20%' }}>
                                            Действия
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {clientStatuses.map((status, index) => (
                                        <TableRow 
                                            key={status.id}
                                            sx={{
                                                backgroundColor: index % 2 === 0 ? theme.colors.tableRowEven : theme.colors.tableRowOdd,
                                                '&:hover': {
                                                    backgroundColor: theme.colors.hover
                                                }
                                            }}
                                        >
                                            <TableCell sx={{ color: theme.colors.primaryText }}>{status.status}</TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="Редактировать">
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => handleEditStatus(status)}
                                                        sx={{ mr: 1 }}
                                                    >
                                                        <EditIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Удалить">
                                                    <IconButton 
                                                        size="small" 
                                                        color="error"
                                                        onClick={() => handleDeleteStatus(status)}
                                                    >
                                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {clientStatuses.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={2} align="center" sx={{ color: theme.colors.secondaryText, py: 4 }}>
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
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: theme.shadows.card
                    }
                }}
            >
                <DialogTitle sx={{ color: theme.colors.primaryText, fontWeight: 600 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ fontSize: 24, mr: 1, color: theme.colors.accent }} />
                        {selectedClient ? 'Редактирование клиента' : 'Добавление нового клиента'}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                name="full_name"
                                label="ФИО клиента"
                                fullWidth
                                size="small"
                                value={clientForm.full_name}
                                onChange={handleClientFormChange}
                                error={formErrors.full_name}
                                helperText={formErrors.full_name ? 'Введите ФИО клиента' : ''}
                                required
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="phone"
                                label="Телефон"
                                placeholder="+7 (XXX) XXX-XX-XX"
                                fullWidth
                                size="small"
                                value={clientForm.phone}
                                onChange={handleClientFormChange}
                                error={formErrors.phone}
                                helperText={formErrors.phone ? 'Введите корректный номер телефона в формате +7 (XXX) XXX-XX-XX' : 'Номер будет автоматически отформатирован'}
                                required
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="email"
                                label="Email"
                                fullWidth
                                size="small"
                                value={clientForm.email}
                                onChange={handleClientFormChange}
                                error={formErrors.email}
                                helperText={formErrors.email ? 'Введите корректный email' : ''}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2
                                    }
                                }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button 
                        onClick={() => setOpenClientDialog(false)}
                        sx={{ 
                            textTransform: 'none',
                            borderRadius: 2,
                            minWidth: 100
                        }}
                    >
                        Отмена
                    </Button>
                    <Button 
                        onClick={handleSaveClient} 
                        variant="contained" 
                        color="primary"
                        sx={{ 
                            textTransform: 'none',
                            borderRadius: 2,
                            minWidth: 100,
                            boxShadow: theme.shadows.button
                        }}
                    >
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
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: theme.shadows.card
                    }
                }}
            >
                <DialogTitle sx={{ color: theme.colors.primaryText, fontWeight: 600 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <StatusIcon sx={{ fontSize: 24, mr: 1, color: theme.colors.accent }} />
                        {editingStatus ? 'Редактирование статуса' : 'Добавление нового статуса'}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <TextField
                        name="status"
                        label="Название статуса"
                        fullWidth
                        size="small"
                        value={newStatus.status}
                        onChange={(e) => setNewStatus({ status: e.target.value })}
                        sx={{ 
                            mt: 1,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2
                            }
                        }}
                        required
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button 
                        onClick={() => setOpenStatusDialog(false)}
                        sx={{ 
                            textTransform: 'none',
                            borderRadius: 2,
                            minWidth: 100
                        }}
                    >
                        Отмена
                    </Button>
                    <Button 
                        onClick={handleSaveStatus} 
                        variant="contained" 
                        color="primary"
                        sx={{ 
                            textTransform: 'none',
                            borderRadius: 2,
                            minWidth: 100,
                            boxShadow: theme.shadows.button
                        }}
                    >
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
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: theme.shadows.card
                    }
                }}
            >
                <DialogTitle sx={{ color: theme.colors.primaryText, fontWeight: 600 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SettingsIcon sx={{ fontSize: 24, mr: 1, color: theme.colors.accent }} />
                        Настройка предпочтений клиента
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedClient && (
                        <Box sx={{ mt: 1 }}>
                            <Box sx={{
                                p: 2,
                                mb: 3,
                                backgroundColor: theme.colors.tableHeader,
                                borderRadius: 2,
                                border: `1px solid ${theme.colors.border}`
                            }}>
                                <Typography variant="subtitle1" sx={{ color: theme.colors.primaryText, fontWeight: 500 }}>
                                    Клиент: {selectedClient.full_name}
                                </Typography>
                            </Box>
                            
                            <FormControl fullWidth sx={{ mb: 3 }}>
                                <InputLabel size="small">Статус клиента</InputLabel>
                                <Select
                                    name="client_status_id"
                                    value={preferencesForm.client_status_id}
                                    onChange={handlePreferencesFormChange}
                                    label="Статус клиента"
                                    size="small"
                                    sx={{
                                        borderRadius: 2
                                    }}
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
                                size="small"
                                value={preferencesForm.preferences || ''}
                                onChange={handlePreferencesFormChange}
                                placeholder="Введите информацию о предпочтениях клиента (аллергии, особые пожелания и т.д.)"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2
                                    }
                                }}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button 
                        onClick={() => setOpenPreferencesDialog(false)}
                        sx={{ 
                            textTransform: 'none',
                            borderRadius: 2,
                            minWidth: 100
                        }}
                    >
                        Отмена
                    </Button>
                    <Button 
                        onClick={handleSavePreferences} 
                        variant="contained" 
                        color="primary"
                        sx={{ 
                            textTransform: 'none',
                            borderRadius: 2,
                            minWidth: 100,
                            boxShadow: theme.shadows.button
                        }}
                    >
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
                    sx={{ 
                        width: '100%',
                        borderRadius: 2
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default APclients;
import React from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, Divider, 
    Stack, Typography, Button, FormControl, InputLabel, 
    Select, MenuItem, Paper, TextField, Box, Alert,
    Checkbox, FormControlLabel
} from '@mui/material';
import { format } from 'date-fns';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { STATUS_LABELS, REMINDER_OPTIONS } from '../utils/constants';
import { getClientName, getServiceName } from '../utils/dataHelpers';

// ==================== ПОЛНЫЙ КОМПОНЕНТ ДИАЛОГА ЗАПИСИ ====================
export const AppointmentDialog = ({
    // Состояния диалога
    openDialog,
    setOpenDialog,
    editMode,
    resetForm,
    resetSmartSearch,
    setOpenSmartDialog,
    handleSubmit,
    handleAddClient,
    
    // Данные
    clientsArray,
    servicesArray,
    availableEmployees,
    newRecord,
    setNewRecord,
    addNewClient,
    setAddNewClient,
    newClient,
    setNewClient,
    servicePrice,
    
    // Обработчики
    updateAvailableEmployees,
    updateServicePrice,
    
    // Ошибки
    serverError,
    conflictDetails
}) => {
    return (
        <Dialog 
            open={openDialog} 
            onClose={() => { 
                setOpenDialog(false); 
                resetForm(); 
            }} 
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
                                            onChange={e => setNewClient({ 
                                                ...newClient, 
                                                full_name: e.target.value 
                                            })}
                                        />
                                        <Stack direction="row" spacing={2}>
                                            <TextField
                                                label="Телефон"
                                                fullWidth
                                                size="small"
                                                value={newClient.phone}
                                                onChange={e => setNewClient({ 
                                                    ...newClient, 
                                                    phone: e.target.value 
                                                })}
                                            />
                                            <TextField
                                                label="Email"
                                                fullWidth
                                                size="small"
                                                value={newClient.email}
                                                onChange={e => setNewClient({ 
                                                    ...newClient, 
                                                    email: e.target.value 
                                                })}
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
                                        {getClientName(conflictDetails.client_id, clientsArray)} — {getServiceName(conflictDetails.service_id, servicesArray)}
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
    );
};
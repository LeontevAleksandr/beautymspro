import React from 'react';
import { 
    Dialog, DialogTitle, DialogContent, Divider, 
    Stack, Typography, Button, FormControl, InputLabel, 
    Select, MenuItem, TextField, Box, Card, CardContent, Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { TIME_PREFERENCES } from '../utils/constants.js';

// ==================== КОМПОНЕНТ ДИАЛОГА УМНОГО ПОИСКА ====================
export const SmartSearchDialog = ({
    // Состояния диалога
    openSmartDialog,
    setOpenSmartDialog,
    resetSmartSearch,
    
    // Данные поиска
    smartSearch,
    setSmartSearch,
    smartResults,
    isSearching,
    serverError,
    
    // Данные для селектов
    servicesArray,
    employees,
    
    // Обработчики
    performSmartSearch,
    handleSlotSelect,
    
    // Дополнительный контент (результаты поиска)
    children
}) => {
    return (
        <Dialog 
            open={openSmartDialog} 
            onClose={() => { 
                setOpenSmartDialog(false); 
                resetSmartSearch(); 
            }} 
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
                    
                    {/* Ошибки поиска */}
                    {serverError && (
                        <Alert severity="error">
                            {serverError}
                        </Alert>
                    )}
                    
                    {/* Результаты поиска (передаются через children) */}
                    {children}
                </Stack>
            </DialogContent>
        </Dialog>
    );
};
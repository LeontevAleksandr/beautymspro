import React from 'react';
import { Typography, Paper, Stack, IconButton, TextField, Button } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { format } from 'date-fns';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import TodayIcon from '@mui/icons-material/Today';
import AddIcon from '@mui/icons-material/Add';
import { INITIAL_RECORD_STATE } from '../utils/constants';

// ==================== КОМПОНЕНТ ЗАГОЛОВКА ====================
export const AppointmentHeader = ({
    selectedDate,
    setSelectedDate,
    setOpenDialog,
    setNewRecord
}) => {
    const handlePrevDay = () => {
        const prevDay = new Date(selectedDate);
        prevDay.setDate(prevDay.getDate() - 1);
        setSelectedDate(prevDay);
    };

    const handleNextDay = () => {
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        setSelectedDate(nextDay);
    };

    const handleToday = () => {
        setSelectedDate(new Date());
    };

    const handleNewAppointment = () => {
        setOpenDialog(true);
        setNewRecord({
            ...INITIAL_RECORD_STATE,
            date: format(selectedDate, 'yyyy-MM-dd')
        });
    };

    return (
        <>
            {/* Заголовок */}
            <Typography 
                variant="h5" 
                sx={{ 
                    fontWeight: 500,
                    color: 'text.primary',
                    mb: 3,
                    textAlign: 'center'
                }}
            >
                Расписание записей
            </Typography>
            
            {/* Панель управления */}
            <Paper 
                elevation={0}
                sx={{ 
                    p: 2, 
                    mb: 2, 
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0'
                }}
            >
                <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    justifyContent="space-between" 
                    alignItems="center" 
                    spacing={2}
                >
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <IconButton 
                            size="small"
                            onClick={handlePrevDay}
                            sx={{ 
                                backgroundColor: '#f5f5f5',
                                '&:hover': { backgroundColor: '#e0e0e0' }
                            }}
                        >
                            <NavigateBeforeIcon fontSize="small" />
                        </IconButton>
                        
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                            <DatePicker
                                value={selectedDate}
                                onChange={setSelectedDate}
                                renderInput={(params) => 
                                    <TextField 
                                        {...params} 
                                        size="small"
                                        sx={{ minWidth: 160 }}
                                    />
                                }
                            />
                        </LocalizationProvider>
                        
                        <IconButton 
                            size="small"
                            onClick={handleNextDay}
                            sx={{ 
                                backgroundColor: '#f5f5f5',
                                '&:hover': { backgroundColor: '#e0e0e0' }
                            }}
                        >
                            <NavigateNextIcon fontSize="small" />
                        </IconButton>
                        
                        <IconButton 
                            size="small"
                            onClick={handleToday}
                            sx={{ 
                                backgroundColor: '#1976d2',
                                color: 'white',
                                ml: 1,
                                '&:hover': { backgroundColor: '#1565c0' }
                            }}
                        >
                            <TodayIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                    
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />} 
                        onClick={handleNewAppointment}
                        sx={{ 
                            textTransform: 'none',
                            fontWeight: 500,
                            boxShadow: 'none',
                            '&:hover': { boxShadow: 1 }
                        }}
                    >
                        Новая запись
                    </Button>
                </Stack>
            </Paper>
        </>
    );
};
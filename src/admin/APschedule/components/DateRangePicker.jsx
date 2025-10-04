import React from 'react';
import { Box, Paper, TextField, Stack } from '@mui/material';
import { LocalizationProvider, StaticDatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { format, isSameDay, isWithinInterval } from 'date-fns';

const DateRangePicker = ({ startDate, endDate, onChange, selectingEnd, workHours, onWorkHoursChange }) => {
    const renderDay = (day, selectedDate, DayComponentProps) => {
        const isStart = isSameDay(day, startDate);
        const isEnd = isSameDay(day, endDate);
        const isInRange = startDate && endDate && 
            isWithinInterval(day, { start: startDate, end: endDate });
        
        let dayStyle = {
            width: 36,
            height: 36,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            position: 'relative',
            zIndex: 1,
        };

        if (isStart || isEnd) {
            dayStyle = {
                ...dayStyle,
                backgroundColor: '#1976d2',
                color: 'white',
                fontWeight: 600,
                borderRadius: isStart && isEnd ? '4px' : isStart ? '4px 0 0 4px' : '0 4px 4px 0',
            };
        } else if (isInRange) {
            dayStyle = {
                ...dayStyle,
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
            };
        }

        return (
            <Box
                onClick={() => onChange(day)}
                sx={{
                    ...dayStyle,
                    '&:hover': {
                        backgroundColor: isStart || isEnd ? '#1565c0' : '#f5f7fa',
                    },
                }}
            >
                {format(day, 'd')}
            </Box>
        );
    };

    return (
        <Paper 
            elevation={0} 
            sx={{ 
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                bgcolor: 'white',
                overflow: 'hidden'
            }}
        >
            <Box sx={{ p: 2 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                    <StaticDatePicker
                        displayStaticWrapperAs="desktop"
                        value={startDate}
                        onChange={(newDate) => onChange(newDate)}
                        slots={{
                            day: (props) => renderDay(props.day, null, props),
                        }}
                        slotProps={{
                            toolbar: { hidden: true },
                            actionBar: { actions: [] }
                        }}
                        sx={{
                            '& .MuiPickersCalendarHeader-root': {
                                color: '#1a1a1a',
                                fontWeight: 500,
                            },
                            '& .MuiDayCalendar-weekDayLabel': {
                                color: '#666',
                                fontWeight: 500,
                            },
                        }}
                    />
                </LocalizationProvider>
            </Box>
            
            <Box 
                sx={{ 
                    borderTop: '1px solid #e0e0e0',
                    p: 2,
                    bgcolor: '#fafafa'
                }}
            >
                <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                        type="time"
                        value={format(workHours.start_time, 'HH:mm')}
                        onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(':');
                            const newTime = new Date();
                            newTime.setHours(parseInt(hours), parseInt(minutes), 0);
                            onWorkHoursChange('start_time', newTime);
                        }}
                        size="small"
                        fullWidth
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                bgcolor: 'white'
                            },
                            '& input[type="time"]::-webkit-calendar-picker-indicator': {
                                display: 'none'
                            }
                        }}
                    />
                    <Box sx={{ color: '#9e9e9e', px: 1 }}>—</Box>
                    <TextField
                        type="time"
                        value={format(workHours.end_time, 'HH:mm')}
                        onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(':');
                            const newTime = new Date();
                            newTime.setHours(parseInt(hours), parseInt(minutes), 0);
                            onWorkHoursChange('end_time', newTime);
                        }}
                        size="small"
                        fullWidth
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                bgcolor: 'white'
                            },
                            '& input[type="time"]::-webkit-calendar-picker-indicator': {
                                display: 'none'
                            }
                        }}
                    />
                </Stack>
            </Box>
        </Paper>
    );
};

export default DateRangePicker;
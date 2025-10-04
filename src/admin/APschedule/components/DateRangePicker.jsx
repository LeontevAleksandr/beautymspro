import React from 'react';
import { Box, Paper, TextField } from '@mui/material';
import { LocalizationProvider, StaticDatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { isSameDay } from 'date-fns';

const DateRangePicker = ({ startDate, endDate, onChange }) => {
    return (
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
                    value={startDate}
                    onChange={onChange}
                    renderInput={(params) => <TextField {...params} />}
                    renderDay={(day, _value, DayComponentProps) => {
                        const isStart = isSameDay(day, startDate);
                        const isEnd = isSameDay(day, endDate);
                        const isInRange = day >= startDate && day <= endDate;
                        
                        let dayStyle = {};
                        if (isStart || isEnd) {
                            dayStyle = {
                                backgroundColor: '#1976d2',
                                color: 'white',
                                borderRadius: isStart && isEnd 
                                    ? '50%' 
                                    : isStart 
                                        ? '50% 0 0 50%' 
                                        : '0 50% 50% 0'
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
    );
};

export default DateRangePicker;
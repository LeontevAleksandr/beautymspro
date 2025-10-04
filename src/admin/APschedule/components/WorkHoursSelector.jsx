import React from 'react';
import { Box, Typography, Stack, TextField } from '@mui/material';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';

const WorkHoursSelector = ({ startTime, endTime, onStartChange, onEndChange }) => {
    return (
        <Box>
            <Typography 
                variant="subtitle2" 
                sx={{ 
                    color: '#424242',
                    fontWeight: 500,
                    mb: 1
                }}
            >
                Укажите рабочие часы:
            </Typography>
            <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={2} 
                sx={{ mb: 2 }}
            >
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                    <TimePicker
                        label="Время начала"
                        value={startTime}
                        onChange={onStartChange}
                        renderInput={(params) => 
                            <TextField 
                                {...params} 
                                fullWidth 
                                size="small"
                                sx={{ 
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2
                                    }
                                }} 
                            />
                        }
                    />
                    <TimePicker
                        label="Время окончания"
                        value={endTime}
                        onChange={onEndChange}
                        renderInput={(params) => 
                            <TextField 
                                {...params} 
                                fullWidth 
                                size="small"
                                sx={{ 
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2
                                    }
                                }} 
                            />
                        }
                    />
                </LocalizationProvider>
            </Stack>
        </Box>
    );
};

export default WorkHoursSelector;
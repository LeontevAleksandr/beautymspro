import React from 'react';
import { Grid, TextField } from '@mui/material';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';

const WorkTimePickers = ({ startTime, endTime, onStartChange, onEndChange }) => {
    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                    <TimePicker
                        label="Начало рабочего дня"
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
                </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                    <TimePicker
                        label="Конец рабочего дня"
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
            </Grid>
        </Grid>
    );
};

export default WorkTimePickers;
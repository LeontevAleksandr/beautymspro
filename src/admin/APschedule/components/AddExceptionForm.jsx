import React from 'react';
import { Paper, Typography, Grid, TextField, Button } from '@mui/material';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { Add } from '@mui/icons-material';

const AddExceptionForm = ({ 
    startTime, 
    endTime, 
    reason, 
    onChange, 
    onAdd 
}) => {
    return (
        <Paper 
            sx={{ 
                p: 2, 
                bgcolor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                boxShadow: 'none'
            }}
        >
            <Typography 
                variant="subtitle2" 
                sx={{ 
                    mb: 1.5,
                    fontWeight: 500
                }}
            >
                Добавить перерыв
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                        <TimePicker
                            label="Начало перерыва"
                            value={startTime}
                            onChange={(value) => onChange('startTime', value)}
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
                <Grid item xs={12} sm={4}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                        <TimePicker
                            label="Конец перерыва"
                            value={endTime}
                            onChange={(value) => onChange('endTime', value)}
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
                <Grid item xs={12} sm={4}>
                    <TextField
                        label="Причина"
                        value={reason}
                        onChange={(e) => onChange('reason', e.target.value)}
                        fullWidth
                        size="small"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2
                            }
                        }}
                    />
                </Grid>
                <Grid item xs={12}>
                    <Button 
                        variant="outlined" 
                        startIcon={<Add />}
                        onClick={onAdd}
                        fullWidth
                        sx={{ 
                            borderRadius: 2,
                            textTransform: 'none',
                            mt: 1
                        }}
                    >
                        Добавить перерыв
                    </Button>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default AddExceptionForm;
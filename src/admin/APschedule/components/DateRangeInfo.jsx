import React from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { format } from 'date-fns';
import { CalendarToday, EventAvailable } from '@mui/icons-material';

const DateRangeInfo = ({ startDate, endDate, selectingEnd }) => {
    const dayCount = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    return (
        <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            sx={{ mb: 2 }}
        >
            <Paper 
                elevation={0} 
                sx={{ 
                    p: 2.5, 
                    bgcolor: selectingEnd ? '#e3f2fd' : '#f5f5f5',
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    flex: 1,
                    transition: 'all 0.3s',
                }}
            >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <CalendarToday sx={{ fontSize: 18, color: '#1976d2' }} />
                    <Typography variant="body2" color="textSecondary">
                        {selectingEnd ? 'Выберите конечную дату' : 'Выбранный период'}
                    </Typography>
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Box>
                        <Typography variant="caption" color="textSecondary">Начало:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: '#1a1a1a' }}>
                            {format(startDate, 'dd.MM.yyyy')}
                        </Typography>
                    </Box>
                    <Box sx={{ color: '#9e9e9e', fontSize: 20 }}>—</Box>
                    <Box>
                        <Typography variant="caption" color="textSecondary">Конец:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: '#1a1a1a' }}>
                            {format(endDate, 'dd.MM.yyyy')}
                        </Typography>
                    </Box>
                </Stack>
            </Paper>
            
            <Paper 
                elevation={0} 
                sx={{ 
                    p: 2.5, 
                    bgcolor: '#fafafa',
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    minWidth: 180,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Stack alignItems="center" spacing={0.5}>
                    <EventAvailable sx={{ fontSize: 24, color: '#1976d2' }} />
                    <Typography variant="caption" color="textSecondary">Количество дней</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2' }}>
                        {dayCount}
                    </Typography>
                </Stack>
            </Paper>
        </Stack>
    );
};

export default DateRangeInfo;
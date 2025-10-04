import React from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { format } from 'date-fns';

const DateRangeInfo = ({ startDate, endDate, selectedRange }) => {
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
                    p: 2, 
                    mb: 1, 
                    bgcolor: selectedRange ? '#e3f2fd' : '#f5f5f5',
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    flex: 1
                }}
            >
                <Typography variant="body2" color="textSecondary" gutterBottom>
                    {selectedRange 
                        ? 'Выбрана начальная дата. Выберите конечную дату.' 
                        : 'Выберите начальную дату диапазона'}
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Box>
                        <Typography variant="caption" color="textSecondary">Начало:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {format(startDate, 'dd.MM.yyyy')}
                        </Typography>
                    </Box>
                    <Box sx={{ color: '#9e9e9e' }}>—</Box>
                    <Box>
                        <Typography variant="caption" color="textSecondary">Конец:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {format(endDate, 'dd.MM.yyyy')}
                        </Typography>
                    </Box>
                </Stack>
            </Paper>
            
            <Paper 
                elevation={0} 
                sx={{ 
                    p: 2, 
                    mb: 1, 
                    bgcolor: '#f5f5f5',
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="textSecondary">Количество дней:</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 500, color: '#1976d2' }}>
                        {dayCount}
                    </Typography>
                </Box>
            </Paper>
        </Stack>
    );
};

export default DateRangeInfo;
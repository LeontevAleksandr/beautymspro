import React from 'react';
import { Typography, Box, Button, Stack } from '@mui/material';
import { Schedule } from '@mui/icons-material';

const ScheduleHeader = ({ employeeCount, onAutoFillClick }) => {
    return (
        <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            justifyContent="space-between" 
            alignItems={{ xs: 'stretch', sm: 'center' }}
            spacing={2}
            sx={{ mb: 3 }}
        >
            <Box>
                <Typography 
                    variant="h5" 
                    sx={{ 
                        fontWeight: 500,
                        color: '#1a1a1a',
                        mb: 0.5
                    }}
                >
                    Управление рабочим графиком
                </Typography>
                <Typography 
                    variant="body2" 
                    sx={{ color: '#666' }}
                >
                    Планирование и редактирование рабочего времени сотрудников
                    {employeeCount > 0 && (
                        <Box component="span" sx={{ ml: 2 }}>
                            • Всего сотрудников: {employeeCount}
                        </Box>
                    )}
                </Typography>
            </Box>
            
            <Button 
                variant="contained" 
                color="primary" 
                startIcon={<Schedule />}
                onClick={onAutoFillClick}
                size="medium"
                sx={{ 
                    borderRadius: 2, 
                    textTransform: 'none',
                    backgroundColor: '#1976d2',
                    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)',
                    minWidth: 240,
                    '&:hover': {
                        backgroundColor: '#1565c0',
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.35)'
                    }
                }}
            >
                Автоматическое заполнение графика
            </Button>
        </Stack>
    );
};

export default ScheduleHeader;
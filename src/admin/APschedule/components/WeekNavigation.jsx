import React from 'react';
import { Button, Stack, Typography, IconButton, Tooltip } from '@mui/material';
import { ArrowBackIos, ArrowForwardIos, Today } from '@mui/icons-material';
import { format, startOfWeek, endOfWeek } from 'date-fns';

const WeekNavigation = ({ 
    currentDate, 
    onPreviousWeek, 
    onNextWeek, 
    onCurrentWeek 
}) => {
    return (
        <Stack 
            direction="row" 
            justifyContent="space-between" 
            alignItems="center" 
            sx={{ 
                mb: 3,
                p: 2,
                backgroundColor: '#fff',
                borderRadius: 3,
                border: '1px solid #e0e0e0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
        >
            <Button 
                variant="outlined" 
                startIcon={<ArrowBackIos />} 
                onClick={onPreviousWeek}
                size="small"
                sx={{ 
                    borderRadius: 2,
                    textTransform: 'none'
                }}
            >
                Предыдущая неделя
            </Button>
            
            <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'dd.MM.yyyy')} 
                    {' - '}
                    {format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'dd.MM.yyyy')}
                </Typography>
                <Tooltip title="Текущая неделя">
                    <IconButton 
                        onClick={onCurrentWeek}
                        size="small"
                        sx={{ 
                            color: '#1976d2',
                            '&:hover': {
                                backgroundColor: 'rgba(25, 118, 210, 0.08)'
                            }
                        }}
                    >
                        <Today fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Stack>
            
            <Button 
                variant="outlined" 
                endIcon={<ArrowForwardIos />} 
                onClick={onNextWeek}
                size="small"
                sx={{ 
                    borderRadius: 2,
                    textTransform: 'none'
                }}
            >
                Следующая неделя
            </Button>
        </Stack>
    );
};

export default WeekNavigation;
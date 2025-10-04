import React from 'react';
import { TableCell, Box, Typography, IconButton } from '@mui/material';
import { Delete, Add } from '@mui/icons-material';
import { isSameDay, isWeekend } from 'date-fns';

const DayCell = ({ 
    day, 
    schedule, 
    formatTimeRange,
    onCellClick, 
    onDelete 
}) => {
    const isWorking = !!schedule;
    const isToday = isSameDay(day, new Date());
    const isWeekendDay = isWeekend(day);

    return (
        <TableCell 
            align="center"
            sx={{ 
                py: 1.5,
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: isWorking 
                    ? '#e8f5e9' 
                    : (isWeekendDay ? '#fff4f4' : 'inherit'),
                cursor: 'pointer',
                transition: 'all 0.2s',
                ...(isToday && {
                    backgroundColor: isWorking ? '#e8f5e9' : '#f5f5f5',
                    borderLeft: '1px solid #e0e0e0',
                    borderRight: '1px solid #e0e0e0'
                }),
                '&:hover': {
                    backgroundColor: isWorking ? '#c8e6c9' : '#f5f5f5',
                    boxShadow: 'inset 0 0 0 1px #e0e0e0'
                }
            }}
            onClick={onCellClick}
        >
            {isWorking ? (
                <Box>
                    <Typography 
                        variant="body2"
                        sx={{ fontWeight: 500 }}
                    >
                        {formatTimeRange(schedule.start_time, schedule.end_time)}
                    </Typography>
                    <IconButton 
                        size="small" 
                        color="error"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        sx={{
                            mt: 0.5,
                            '&:hover': {
                                backgroundColor: 'rgba(211, 47, 47, 0.08)'
                            }
                        }}
                    >
                        <Delete fontSize="small" />
                    </IconButton>
                </Box>
            ) : (
                <IconButton 
                    size="small" 
                    color="primary"
                    sx={{
                        '&:hover': {
                            backgroundColor: 'rgba(25, 118, 210, 0.08)'
                        }
                    }}
                >
                    <Add fontSize="small" />
                </IconButton>
            )}
        </TableCell>
    );
};

export default DayCell;
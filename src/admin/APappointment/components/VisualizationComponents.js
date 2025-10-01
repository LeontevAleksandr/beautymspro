import React from 'react';
import { Box, Typography, LinearProgress, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import StarIcon from '@mui/icons-material/Star';

// ==================== КОМПОНЕНТЫ ВИЗУАЛИЗАЦИИ ====================
export const WorkloadBar = ({ workloadBefore, workloadAfter, employeeName }) => {
    const hasChange = workloadAfter !== undefined && workloadAfter !== workloadBefore;
    
    return (
        <Box sx={{ width: '100%', minWidth: 120 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" sx={{ mr: 1, minWidth: '45px' }}>
                    {hasChange ? 'До:' : 'Загрузка:'}
                </Typography>
                <Box sx={{ flex: 1, mr: 1 }}>
                    <LinearProgress 
                        variant="determinate" 
                        value={Math.min(workloadBefore, 100)} 
                        sx={{ 
                            height: 6, 
                            borderRadius: 3,
                            backgroundColor: '#f0f0f0',
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: workloadBefore > 80 ? '#f44336' : 
                                               workloadBefore > 60 ? '#ff9800' : '#4caf50'
                            }
                        }}
                    />
                </Box>
                <Typography variant="caption" sx={{ minWidth: '30px', fontWeight: 500 }}>
                    {Math.round(workloadBefore)}%
                </Typography>
            </Box>
            
            {hasChange && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ mr: 1, minWidth: '45px' }}>
                        После:
                    </Typography>
                    <Box sx={{ flex: 1, mr: 1 }}>
                        <LinearProgress 
                            variant="determinate" 
                            value={Math.min(workloadAfter, 100)} 
                            sx={{ 
                                height: 6, 
                                borderRadius: 3,
                                backgroundColor: '#f0f0f0',
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: workloadAfter > 80 ? '#f44336' : 
                                                   workloadAfter > 60 ? '#ff9800' : '#4caf50'
                                }
                            }}
                        />
                    </Box>
                    <Typography variant="caption" sx={{ minWidth: '30px', fontWeight: 500 }}>
                        {Math.round(workloadAfter)}%
                    </Typography>
                    {workloadAfter > workloadBefore ? (
                        <TrendingUpIcon sx={{ fontSize: 14, color: 'error.main', ml: 0.5 }} />
                    ) : (
                        <TrendingDownIcon sx={{ fontSize: 14, color: 'success.main', ml: 0.5 }} />
                    )}
                </Box>
            )}
        </Box>
    );
};

export const OptimalityChip = ({ optimality }) => {
    const getColor = (score) => {
        if (score >= 80) return 'success';
        if (score >= 60) return 'warning';
        return 'error';
    };

    const getLabel = (score) => {
        if (score >= 80) return 'Отлично';
        if (score >= 60) return 'Хорошо';
        return 'Удовлетворительно';
    };

    return (
        <Chip
            size="small"
            label={`${Math.round(optimality)}% • ${getLabel(optimality)}`}
            color={getColor(optimality)}
            variant="outlined"
            icon={optimality >= 80 ? <StarIcon /> : undefined}
            sx={{ fontWeight: 500 }}
        />
    );
};
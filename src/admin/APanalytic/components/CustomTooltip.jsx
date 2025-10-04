import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { 
    getWorkloadGradientColor, 
    getWorkloadDarkColor, 
    getStatusIcon 
} from '../utils/workloadColors';

/**
 * Кастомный тултип для графика загруженности с улучшенным дизайном
 * @param {boolean} active - Активен ли тултип
 * @param {Array} payload - Данные точки графика
 * @param {string} label - Лейбл периода
 * @param {Object} workloadData - Полные данные загруженности для расчета средних значений
 */
const CustomTooltip = ({ active, payload, label, workloadData }) => {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    // Сортируем сотрудников по загруженности (от большего к меньшему)
    const sortedPayload = payload
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value);

    return (
        <Box sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            p: 2.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            minWidth: '280px',
            maxWidth: '350px'
        }}>
            {/* Заголовок с периодом */}
            <Typography 
                variant="subtitle1" 
                sx={{ 
                    mb: 1.5, 
                    fontWeight: 700, 
                    color: '#1a1a1a', 
                    borderBottom: '1px solid #f0f0f0', 
                    pb: 1 
                }}
            >
                📅 {label}
            </Typography>

            {/* Список сотрудников */}
            {sortedPayload.map((entry, index) => {
                // Вычисляем среднюю загруженность сотрудника для контекста
                const workloadEmployee = workloadData?.employees.find(
                    emp => emp.employee_name === entry.dataKey
                );
                const avgWorkload = workloadEmployee ? 
                    Math.round(
                        workloadEmployee.workload.reduce((sum, p) => sum + p.workload_percent, 0) / 
                        workloadEmployee.workload.length
                    ) : 
                    entry.value;
                
                return (
                    <Box 
                        key={index} 
                        sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            mb: 1,
                            p: 1,
                            borderRadius: 1,
                            backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'transparent'
                        }}
                    >
                        {/* Имя сотрудника с иконкой статуса */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                            {getStatusIcon(entry.value)}
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    fontSize: '0.85rem', 
                                    color: '#1a1a1a', 
                                    fontWeight: 500 
                                }}
                            >
                                {entry.dataKey}
                            </Typography>
                        </Box>

                        {/* Прогресс-бар и процент */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                                variant="determinate"
                                value={entry.value}
                                sx={{
                                    width: 60,
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: '#e0e0e0',
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: getWorkloadGradientColor(entry.value),
                                        borderRadius: 3
                                    }
                                }}
                            />
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    fontWeight: 700, 
                                    color: getWorkloadDarkColor(entry.value),
                                    minWidth: '40px',
                                    textAlign: 'right'
                                }}
                            >
                                {entry.value}%
                            </Typography>
                        </Box>
                    </Box>
                );
            })}

            {/* Подсказка */}
            {sortedPayload.length > 0 && (
                <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px solid #f0f0f0' }}>
                    <Typography 
                        variant="caption" 
                        sx={{ color: '#666', fontStyle: 'italic' }}
                    >
                        💡 Цвет зависит от уровня загруженности
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default CustomTooltip;
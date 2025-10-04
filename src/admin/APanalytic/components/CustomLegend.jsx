import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { 
    getWorkloadGradientColor, 
    getLineStyle, 
    getStatusIcon 
} from '../utils/workloadColors';

/**
 * Кастомная легенда для графика загруженности
 * Отображает сотрудников с их средней загруженностью, отсортированных по убыванию
 * @param {Array} sortedEmployees - Отсортированные сотрудники с avgWorkload
 */
const CustomLegend = ({ sortedEmployees }) => {
    if (!sortedEmployees || sortedEmployees.length === 0) {
        return null;
    }

    return (
        <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 2, 
            justifyContent: 'center',
            mt: 3,
            p: 2,
            backgroundColor: '#f8f9fa',
            borderRadius: 2,
            border: '1px solid #e0e0e0'
        }}>
            {sortedEmployees.map((employee) => {
                const color = getWorkloadGradientColor(employee.avgWorkload);
                const lineStyle = getLineStyle(employee.avgWorkload);
                
                return (
                    <Box 
                        key={employee.employee_id} 
                        sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            p: 1,
                            backgroundColor: '#ffffff',
                            borderRadius: 1,
                            border: '1px solid #e0e0e0'
                        }}
                    >
                        {/* Иконка статуса */}
                        {getStatusIcon(employee.avgWorkload)}
                        
                        {/* Линия-индикатор стиля */}
                        <Box
                            sx={{
                                width: 30,
                                height: 3,
                                backgroundColor: color,
                                borderRadius: 1,
                                ...(lineStyle.strokeDasharray !== "0" && {
                                    background: `repeating-linear-gradient(
                                        to right,
                                        ${color} 0px,
                                        ${color} 3px,
                                        transparent 3px,
                                        transparent 6px
                                    )`
                                })
                            }}
                        />
                        
                        {/* Имя сотрудника */}
                        <Typography 
                            variant="body2" 
                            sx={{ color: '#1a1a1a', fontWeight: 500 }}
                        >
                            {employee.employee_name}
                        </Typography>
                        
                        {/* Чип с процентом */}
                        <Chip
                            label={`${employee.avgWorkload}%`}
                            size="small"
                            sx={{
                                backgroundColor: color,
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                height: 20
                            }}
                        />
                    </Box>
                );
            })}
        </Box>
    );
};

export default CustomLegend;
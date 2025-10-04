import React from 'react';
import { 
    Box, Typography, Grid, FormControl, 
    Checkbox, Chip 
} from '@mui/material';
import { getStatusIcon, getWorkloadGradientColor } from '../utils/workloadColors';
import { calculateAverageWorkload } from '../utils/workloadHelpers';

/**
 * Компонент выбора сотрудников для отображения на графике
 * @param {Object} workloadData - Данные загруженности от API
 * @param {Array<number>} selectedEmployees - ID выбранных сотрудников
 * @param {Function} onSelectionChange - Обработчик изменения выбора
 * @param {Array} sortedEmployees - Отсортированные сотрудники для статистики
 */
const EmployeeSelector = ({ 
    workloadData, 
    selectedEmployees, 
    onSelectionChange,
    sortedEmployees 
}) => {
    if (!workloadData || !workloadData.employees) {
        return null;
    }

    // Обработчик изменения чекбокса
    const handleCheckboxChange = (employeeId) => {
        if (selectedEmployees.includes(employeeId)) {
            onSelectionChange(selectedEmployees.filter(id => id !== employeeId));
        } else {
            onSelectionChange([...selectedEmployees, employeeId]);
        }
    };

    // Подготовка отсортированных сотрудников для отображения
    const displayEmployees = workloadData.employees
        .map(emp => ({
            ...emp,
            avgWorkload: calculateAverageWorkload(emp)
        }))
        .sort((a, b) => b.avgWorkload - a.avgWorkload);

    // Расчет средней загруженности выбранных сотрудников
    const averageSelectedWorkload = sortedEmployees.length > 0
        ? Math.round(
            sortedEmployees.reduce((sum, emp) => sum + emp.avgWorkload, 0) / 
            sortedEmployees.length
        )
        : 0;

    return (
        <Box>
            {/* Краткая статистика */}
            {selectedEmployees.length > 0 && (
                <Box sx={{ 
                    mb: 2, 
                    p: 2, 
                    backgroundColor: '#e3f2fd', 
                    borderRadius: 1, 
                    border: '1px solid #bbdefb' 
                }}>
                    <Typography variant="body2" sx={{ color: '#1565c0', fontWeight: 500 }}>
                        📊 Выбрано сотрудников: <strong>{selectedEmployees.length}</strong> • 
                        Средняя загруженность: <strong>{averageSelectedWorkload}%</strong>
                    </Typography>
                </Box>
            )}

            {/* Подсказка */}
            <Typography variant="subtitle2" sx={{ color: '#666', mb: 1 }}>
                Выберите сотрудников для отображения на графике:
            </Typography>

            {/* Сетка чекбоксов */}
            <Grid container spacing={1}>
                {displayEmployees.map((employee) => (
                    <Grid item xs={12} sm={6} md={4} key={employee.employee_id}>
                        <FormControl component="fieldset" size="small" fullWidth>
                            <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                p: 1,
                                border: '1px solid #e0e0e0',
                                borderRadius: 1,
                                backgroundColor: selectedEmployees.includes(employee.employee_id) 
                                    ? '#f0f4ff' 
                                    : 'transparent',
                                '&:hover': { backgroundColor: '#f5f7fa' },
                                cursor: 'pointer'
                            }}>
                                <Checkbox
                                    checked={selectedEmployees.includes(employee.employee_id)}
                                    onChange={() => handleCheckboxChange(employee.employee_id)}
                                    size="small"
                                />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                    {getStatusIcon(employee.avgWorkload)}
                                    <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
                                        {employee.employee_name}
                                    </Typography>
                                    <Chip
                                        label={`${employee.avgWorkload}%`}
                                        size="small"
                                        sx={{
                                            backgroundColor: getWorkloadGradientColor(employee.avgWorkload),
                                            color: 'white',
                                            fontWeight: 600,
                                            fontSize: '0.65rem',
                                            height: 18,
                                            ml: 'auto'
                                        }}
                                    />
                                </Box>
                            </Box>
                        </FormControl>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default EmployeeSelector;
import React from 'react';
import { 
    Paper, Box, Typography, FormControl, InputLabel,
    Select, MenuItem, OutlinedInput, Checkbox, ListItemText,
    Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Collapse, IconButton, Chip, LinearProgress
} from '@mui/material';
import { 
    getStatusIcon, getWorkloadGradientColor, 
    getWorkloadDarkColor, getWorkloadColor, 
    getWorkloadStatus, ArrowUp, ArrowDown 
} from '../utils/workloadColors';
import { calculateAverageWorkload } from '../utils/workloadHelpers';

/**
 * Компонент таблицы детализации загруженности сотрудников
 * @param {Object} workloadData - Данные загруженности от API
 * @param {Array<number>} tableEmployeeFilter - ID сотрудников для фильтрации
 * @param {Function} onFilterChange - Обработчик изменения фильтра
 * @param {Object} expandedRows - Состояние раскрытых строк
 * @param {Function} onRowToggle - Обработчик раскрытия/сворачивания строки
 */
const WorkloadTable = ({ 
    workloadData, 
    tableEmployeeFilter, 
    onFilterChange, 
    expandedRows, 
    onRowToggle 
}) => {
    if (!workloadData || !workloadData.employees) {
        return null;
    }

    // Фильтрация сотрудников
    const filteredEmployees = workloadData.employees.filter(emp => 
        tableEmployeeFilter.includes(emp.employee_id)
    );

    // Сортировка по средней загруженности
    const sortedEmployees = filteredEmployees
        .map(emp => ({
            ...emp,
            avgWorkload: calculateAverageWorkload(emp)
        }))
        .sort((a, b) => b.avgWorkload - a.avgWorkload);

    return (
        <Paper sx={{ 
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            borderRadius: 2,
            overflow: 'hidden'
        }}>
            {/* Заголовок и фильтр */}
            <Box sx={{ p: 3, pb: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#1a1a1a' }}>
                    Детализация загруженности сотрудников
                </Typography>
                
                {/* Фильтр сотрудников */}
                <FormControl size="small" sx={{ minWidth: 300, mb: 2 }}>
                    <InputLabel>Фильтр сотрудников</InputLabel>
                    <Select
                        multiple
                        value={tableEmployeeFilter}
                        onChange={onFilterChange}
                        input={<OutlinedInput label="Фильтр сотрудников" />}
                        renderValue={(selected) => 
                            `Выбрано: ${selected.length} из ${workloadData.employees.length}`
                        }
                        sx={{ borderRadius: 2 }}
                    >
                        {workloadData.employees.map((employee) => (
                            <MenuItem key={employee.employee_id} value={employee.employee_id}>
                                <Checkbox 
                                    checked={tableEmployeeFilter.indexOf(employee.employee_id) > -1} 
                                    size="small"
                                />
                                <ListItemText primary={employee.employee_name} />
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
            
            {/* Таблица */}
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                            <TableCell sx={{ fontWeight: 600, color: '#424242', width: '40px' }}></TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#424242', width: '25%' }}>
                                Сотрудник
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: '#424242', width: '15%' }}>
                                Средняя загруженность
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600, color: '#424242', width: '15%' }}>
                                Статус
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: '#424242', width: '15%' }}>
                                Всего рабочих часов
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: '#424242', width: '15%' }}>
                                Занято часов
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedEmployees.map((employee, employeeIndex) => {
                            const totalHours = employee.workload.reduce((sum, period) => sum + period.total_hours, 0);
                            const bookedHours = employee.workload.reduce((sum, period) => sum + period.booked_hours, 0);
                            const isExpanded = expandedRows[employee.employee_id];
                            
                            return (
                                <React.Fragment key={employee.employee_id}>
                                    {/* Основная строка сотрудника */}
                                    <TableRow 
                                        sx={{ 
                                            backgroundColor: employeeIndex % 2 === 0 ? '#ffffff' : '#fafbfc',
                                            '&:hover': { backgroundColor: '#f5f7fa' },
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => onRowToggle(employee.employee_id)}
                                    >
                                        <TableCell>
                                            <IconButton size="small">
                                                {isExpanded ? <ArrowUp /> : <ArrowDown />}
                                            </IconButton>
                                        </TableCell>
                                        <TableCell sx={{ color: '#1a1a1a', fontWeight: 500 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {getStatusIcon(employee.avgWorkload)}
                                                {employee.employee_name}
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={employee.avgWorkload}
                                                    sx={{
                                                        width: 80,
                                                        height: 8,
                                                        borderRadius: 4,
                                                        backgroundColor: '#e0e0e0',
                                                        '& .MuiLinearProgress-bar': {
                                                            backgroundColor: getWorkloadGradientColor(employee.avgWorkload),
                                                            borderRadius: 4
                                                        }
                                                    }}
                                                />
                                                <Typography sx={{ 
                                                    color: getWorkloadDarkColor(employee.avgWorkload), 
                                                    fontWeight: 700,
                                                    minWidth: '40px'
                                                }}>
                                                    {employee.avgWorkload}%
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={getWorkloadStatus(employee.avgWorkload)}
                                                size="small"
                                                sx={{
                                                    backgroundColor: getWorkloadColor(employee.avgWorkload),
                                                    color: 'white',
                                                    fontWeight: 500,
                                                    borderRadius: 2
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: '#666' }}>
                                            {totalHours.toFixed(2)} ч.
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: '#666' }}>
                                            {bookedHours.toFixed(2)} ч.
                                        </TableCell>
                                    </TableRow>
                                    
                                    {/* Детальные строки периодов (раскрывающиеся) */}
                                    <TableRow>
                                        <TableCell sx={{ py: 0 }} colSpan={6}>
                                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                <Box sx={{ py: 2 }}>
                                                    <Table size="small">
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell sx={{ pl: 6, fontWeight: 600, color: '#666', fontSize: '0.75rem' }}>
                                                                    Период
                                                                </TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 600, color: '#666', fontSize: '0.75rem' }}>
                                                                    Загруженность
                                                                </TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 600, color: '#666', fontSize: '0.75rem' }}>
                                                                    Часы (занято/всего)
                                                                </TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {employee.workload.map((period, periodIndex) => (
                                                                <TableRow 
                                                                    key={period.period}
                                                                    sx={{ 
                                                                        backgroundColor: periodIndex % 2 === 0 ? '#f9f9f9' : '#ffffff'
                                                                    }}
                                                                >
                                                                    <TableCell sx={{ pl: 6, color: '#1a1a1a', fontSize: '0.8rem' }}>
                                                                        {period.period}
                                                                    </TableCell>
                                                                    <TableCell align="right">
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                                                            <LinearProgress
                                                                                variant="determinate"
                                                                                value={period.workload_percent}
                                                                                sx={{
                                                                                    width: 60,
                                                                                    height: 6,
                                                                                    borderRadius: 3,
                                                                                    backgroundColor: '#e0e0e0',
                                                                                    '& .MuiLinearProgress-bar': {
                                                                                        backgroundColor: getWorkloadGradientColor(period.workload_percent),
                                                                                        borderRadius: 3
                                                                                    }
                                                                                }}
                                                                            />
                                                                            <Typography variant="body2" sx={{ 
                                                                                color: getWorkloadDarkColor(period.workload_percent), 
                                                                                fontWeight: 600, 
                                                                                minWidth: '35px' 
                                                                            }}>
                                                                                {period.workload_percent}%
                                                                            </Typography>
                                                                        </Box>
                                                                    </TableCell>
                                                                    <TableCell align="right" sx={{ color: '#666', fontSize: '0.8rem' }}>
                                                                        {period.booked_hours.toFixed(2)}/{period.total_hours.toFixed(2)} ч.
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </Box>
                                            </Collapse>
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default WorkloadTable;
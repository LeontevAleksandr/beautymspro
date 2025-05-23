import React, { useState, useEffect } from 'react';
import { 
    Typography, Box, Paper, Grid, 
    FormControl, InputLabel, Select, MenuItem, 
    TextField, Button, CircularProgress, Divider,
    Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Card, CardContent,
    OutlinedInput, Checkbox, ListItemText, Stack,
    Alert, Chip, Collapse, IconButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { format, subMonths } from 'date-fns';
import { 
    BarChart, Bar, LineChart, Line, 
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer 
} from 'recharts';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';

// Профессиональная цветовая палитра с высоким контрастом
const colors = [
    '#2563eb', // Яркий синий
    '#dc2626', // Красный
    '#059669', // Зеленый
    '#7c3aed', // Фиолетовый
    '#ea580c', // Оранжевый
    '#0891b2', // Циан
    '#be185d', // Розовый
    '#65a30d', // Лайм
    '#4338ca', // Индиго
    '#c2410c', // Темно-оранжевый
    '#0d9488', // Бирюзовый
    '#7e22ce', // Темно-фиолетовый
    '#1d4ed8', // Темно-синий
    '#b91c1c', // Темно-красный
    '#047857', // Темно-зеленый
    '#a21caf', // Маджента
    '#0369a1', // Голубой
    '#ca8a04', // Желто-коричневый
    '#374151', // Серый
    '#831843', // Темно-розовый
    '#166534', // Темно-зеленый лес
    '#581c87', // Темно-фиолетовый
    '#1e40af', // Королевский синий
    '#92400e'  // Коричневый
];

// Стили линий для разнообразия
const lineStyles = [
    { strokeDasharray: "0", strokeWidth: 3 }, // Сплошная толстая
    { strokeDasharray: "0", strokeWidth: 2.5 }, // Сплошная средняя
    { strokeDasharray: "5 5", strokeWidth: 2.5 }, // Пунктирная
    { strokeDasharray: "0", strokeWidth: 3 }, // Сплошная толстая
    { strokeDasharray: "10 5", strokeWidth: 2.5 }, // Штрихпунктирная
    { strokeDasharray: "0", strokeWidth: 2.5 }, // Сплошная средняя
    { strokeDasharray: "3 3", strokeWidth: 2.5 }, // Мелкий пунктир
    { strokeDasharray: "0", strokeWidth: 3 }, // Сплошная толстая
    { strokeDasharray: "8 4 2 4", strokeWidth: 2.5 }, // Сложный пунктир
    { strokeDasharray: "0", strokeWidth: 2.5 }, // Сплошная средняя
];

function EmployeeWorkloadTab() {
    // Состояние для фильтров
    const [startDate, setStartDate] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [groupBy, setGroupBy] = useState('day');
    
    // Состояние для данных
    const [loading, setLoading] = useState(false);
    const [workloadData, setWorkloadData] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [error, setError] = useState(null);
    
    // Состояние для графика
    const [chartData, setChartData] = useState([]);
    
    // Состояние для раскрытых строк таблицы
    const [expandedRows, setExpandedRows] = useState({});
    
    // Состояние для фильтра сотрудников в таблице
    const [tableEmployeeFilter, setTableEmployeeFilter] = useState([]);

    // Загрузка списка сотрудников
    const fetchEmployees = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/employees');
            if (!response.ok) throw new Error('Ошибка при получении списка сотрудников');
            const data = await response.json();
            setEmployees(data);
        } catch (err) {
            setError(err.message);
        }
    };

    // Загрузка данных загруженности
    const fetchWorkloadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `http://localhost:5000/api/analytics/employee_workload?start_date=${startDate}&end_date=${endDate}&group_by=${groupBy}`
            );
            if (!response.ok) throw new Error('Ошибка при получении данных загруженности');
            const result = await response.json();
            setWorkloadData(result);
            
            // Инициализируем выбранных сотрудников, если еще не выбраны
            if (result && result.employees) {
                if (selectedEmployees.length === 0) {
                    // По умолчанию выбираем первых 3 сотрудников для графика
                    setSelectedEmployees(result.employees.slice(0, 3).map(emp => emp.employee_id));
                }
                if (tableEmployeeFilter.length === 0) {
                    // По умолчанию показываем всех сотрудников в таблице
                    setTableEmployeeFilter(result.employees.map(emp => emp.employee_id));
                }
                prepareChartData(result);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Подготовка данных для графика
    const prepareChartData = (data) => {
        const selectedEmployeesData = data.employees.filter(emp => 
            selectedEmployees.includes(emp.employee_id)
        );

        // Собираем все уникальные периоды
        const allPeriods = new Set();
        selectedEmployeesData.forEach(emp => {
            emp.workload.forEach(period => allPeriods.add(period.period));
        });

        // Создаем данные для графика
        const chartData = Array.from(allPeriods).sort().map(period => {
            const dataPoint = { period };
            selectedEmployeesData.forEach(emp => {
                const periodData = emp.workload.find(w => w.period === period);
                dataPoint[emp.employee_name] = periodData ? periodData.workload_percent : 0;
            });
            return dataPoint;
        });

        setChartData(chartData);
    };

    // Обработчик изменения фильтра сотрудников для таблицы
    const handleTableEmployeeFilterChange = (event) => {
        const value = event.target.value;
        setTableEmployeeFilter(typeof value === 'string' ? value.split(',') : value);
    };

    // Обработчик раскрытия/сворачивания строки
    const handleRowToggle = (employeeId) => {
        setExpandedRows(prev => ({
            ...prev,
            [employeeId]: !prev[employeeId]
        }));
    };

    // Получение цвета для загруженности
    const getWorkloadColor = (percent) => {
        if (percent >= 80) return '#f44336'; // красный
        if (percent >= 60) return '#ff9800'; // оранжевый  
        if (percent >= 40) return '#ffc107'; // желтый
        return '#4caf50'; // зеленый
    };

    // Получение статуса загруженности
    const getWorkloadStatus = (percent) => {
        if (percent >= 80) return 'Высокая';
        if (percent >= 60) return 'Средняя';
        if (percent >= 40) return 'Низкая';
        return 'Очень низкая';
    };

    // Кастомный тултип с сортировкой сотрудников
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
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
                    minWidth: '240px',
                    maxWidth: '300px'
                }}>
                    <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 700, color: '#1a1a1a', borderBottom: '1px solid #f0f0f0', pb: 1 }}>
                        📅 {label}
                    </Typography>
                    {sortedPayload.map((entry, index) => {
                        const empIndex = selectedEmployees.findIndex(empId => {
                            const workloadEmployee = workloadData?.employees.find(emp => emp.employee_id === empId);
                            return workloadEmployee?.employee_name === entry.dataKey;
                        });
                        const lineStyle = lineStyles[empIndex % lineStyles.length];
                        
                        return (
                            <Box key={index} sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                mb: 1,
                                p: 1,
                                borderRadius: 1,
                                backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'transparent'
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                                        <Box
                                            sx={{
                                                width: 14,
                                                height: 14,
                                                backgroundColor: entry.color,
                                                borderRadius: '50%',
                                                border: '2px solid #ffffff',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                            }}
                                        />
                                        <Box
                                            sx={{
                                                width: 20,
                                                height: 1.5,
                                                backgroundColor: entry.color,
                                                borderRadius: 0.5,
                                                ...(lineStyle.strokeDasharray !== "0" && {
                                                    background: `repeating-linear-gradient(
                                                        to right,
                                                        ${entry.color} 0px,
                                                        ${entry.color} 2px,
                                                        transparent 2px,
                                                        transparent 4px
                                                    )`
                                                })
                                            }}
                                        />
                                    </Box>
                                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#1a1a1a', fontWeight: 500 }}>
                                        {entry.dataKey}
                                    </Typography>
                                </Box>
                                <Chip
                                    label={`${entry.value}%`}
                                    size="small"
                                    sx={{
                                        backgroundColor: entry.color,
                                        color: 'white',
                                        fontWeight: 700,
                                        fontSize: '0.75rem',
                                        minWidth: '50px'
                                    }}
                                />
                            </Box>
                        );
                    })}
                    {sortedPayload.length > 0 && (
                        <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px solid #f0f0f0' }}>
                            <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic' }}>
                                💡 Отсортировано по загруженности
                            </Typography>
                        </Box>
                    )}
                </Box>
            );
        }
        return null;
    };

    // Получение отсортированных сотрудников для текущего графика
    const getSortedEmployeesForChart = () => {
        if (!workloadData) return [];
        
        const selectedEmployeesData = workloadData.employees.filter(emp => 
            selectedEmployees.includes(emp.employee_id)
        );

        return selectedEmployeesData
            .map(emp => {
                const avgWorkload = Math.round(
                    emp.workload.reduce((sum, period) => sum + period.workload_percent, 0) / 
                    emp.workload.length
                );
                return {
                    ...emp,
                    avgWorkload
                };
            })
            .sort((a, b) => b.avgWorkload - a.avgWorkload);
    };

    useEffect(() => {
        fetchEmployees();
        fetchWorkloadData();
    }, []);

    useEffect(() => {
        fetchWorkloadData();
    }, [startDate, endDate, groupBy]);

    useEffect(() => {
        if (workloadData) {
            prepareChartData(workloadData);
        }
    }, [selectedEmployees, workloadData]);

    // Фильтрация сотрудников для таблицы
    const filteredEmployees = workloadData ? 
        workloadData.employees.filter(emp => tableEmployeeFilter.includes(emp.employee_id)) : [];

    return (
        <Box sx={{ p: 3, backgroundColor: '#fafafa', minHeight: '100vh' }}>
            <Typography variant="h4" gutterBottom sx={{ color: '#1a1a1a', mb: 3 }}>
                Загруженность сотрудников
            </Typography>
            
            {/* Фильтры */}
            <Paper sx={{ 
                p: 3, 
                mb: 3, 
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                borderRadius: 2
            }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                            <DatePicker
                                label="Начальная дата"
                                value={new Date(startDate)}
                                onChange={(newValue) => setStartDate(format(newValue, 'yyyy-MM-dd'))}
                                slotProps={{
                                    textField: { 
                                        fullWidth: true, 
                                        size: 'small',
                                        sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } }
                                    }
                                }}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                            <DatePicker
                                label="Конечная дата"
                                value={new Date(endDate)}
                                onChange={(newValue) => setEndDate(format(newValue, 'yyyy-MM-dd'))}
                                slotProps={{
                                    textField: { 
                                        fullWidth: true, 
                                        size: 'small',
                                        sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } }
                                    }
                                }}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Группировка</InputLabel>
                            <Select
                                value={groupBy}
                                label="Группировка"
                                onChange={(e) => setGroupBy(e.target.value)}
                                sx={{ borderRadius: 2 }}
                            >
                                <MenuItem value="day">По дням</MenuItem>
                                <MenuItem value="week">По неделям</MenuItem>
                                <MenuItem value="month">По месяцам</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Button 
                            variant="contained" 
                            onClick={fetchWorkloadData}
                            fullWidth
                            size="small"
                            sx={{ 
                                height: '40px',
                                borderRadius: 2,
                                textTransform: 'none',
                                minWidth: '160px',
                                backgroundColor: '#1976d2',
                                '&:hover': { backgroundColor: '#1565c0' }
                            }}
                        >
                            Применить
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Выбор сотрудников для графика */}
            <Paper sx={{ 
                p: 3, 
                mb: 3, 
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                borderRadius: 2
            }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 1 }}>
                    📈 График загруженности
                </Typography>
                
                {/* Краткая статистика */}
                {selectedEmployees.length > 0 && workloadData && (
                    <Box sx={{ 
                        mb: 2, 
                        p: 2, 
                        backgroundColor: '#e3f2fd', 
                        borderRadius: 1, 
                        border: '1px solid #bbdefb' 
                    }}>
                        <Typography variant="body2" sx={{ color: '#1565c0', fontWeight: 500 }}>
                            📊 Выбрано сотрудников: <strong>{selectedEmployees.length}</strong> • 
                            Средняя загруженность: <strong>
                            {Math.round(
                                getSortedEmployeesForChart().reduce((sum, emp) => sum + emp.avgWorkload, 0) / 
                                getSortedEmployeesForChart().length
                            )}%</strong>
                        </Typography>
                    </Box>
                )}
                
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#666', mb: 1 }}>
                        Выберите сотрудников для отображения на графике:
                    </Typography>
                    <Grid container spacing={1}>
                        {workloadData?.employees.map((employee) => (
                            <Grid item xs={12} sm={6} md={4} key={employee.employee_id}>
                                <FormControl component="fieldset" size="small">
                                    <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        p: 1,
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        '&:hover': { backgroundColor: '#f5f7fa' }
                                    }}>
                                        <Checkbox
                                            checked={selectedEmployees.includes(employee.employee_id)}
                                            onChange={() => {
                                                setSelectedEmployees(prev => {
                                                    if (prev.includes(employee.employee_id)) {
                                                        return prev.filter(id => id !== employee.employee_id);
                                                    } else {
                                                        return [...prev, employee.employee_id];
                                                    }
                                                });
                                            }}
                                            size="small"
                                        />
                                        <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
                                            {employee.employee_name}
                                        </Typography>
                                    </Box>
                                </FormControl>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* График */}
                {chartData.length > 0 && (
                    <>
                        <Box sx={{ height: 400, width: '100%' }}>
                            <ResponsiveContainer>
                                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid 
                                        strokeDasharray="2 2" 
                                        stroke="#e0e0e0" 
                                        strokeOpacity={0.5}
                                    />
                                    <XAxis 
                                        dataKey="period" 
                                        tick={{ fontSize: 12, fill: "#666" }}
                                        stroke="#666"
                                        strokeWidth={1}
                                    />
                                    <YAxis 
                                        tick={{ fontSize: 12, fill: "#666" }}
                                        stroke="#666"
                                        strokeWidth={1}
                                        domain={[0, 100]}
                                        label={{ value: 'Загруженность (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#666' } }}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend 
                                        wrapperStyle={{ paddingTop: '20px' }}
                                        iconType="line"
                                    />
                                    {selectedEmployees.slice(0, colors.length).map((empId, index) => {
                                        const workloadEmployee = workloadData?.employees.find(emp => emp.employee_id === empId);
                                        const employeeName = workloadEmployee?.employee_name || empId;
                                        const lineStyle = lineStyles[index % lineStyles.length];
                                        
                                        return (
                                            <Line
                                                key={empId}
                                                type="monotone"
                                                dataKey={employeeName}
                                                stroke={colors[index % colors.length]}
                                                strokeWidth={lineStyle.strokeWidth}
                                                strokeDasharray={lineStyle.strokeDasharray}
                                                dot={{ 
                                                    r: 5, 
                                                    fill: colors[index % colors.length],
                                                    strokeWidth: 2,
                                                    stroke: '#ffffff'
                                                }}
                                                activeDot={{ 
                                                    r: 8, 
                                                    fill: colors[index % colors.length],
                                                    strokeWidth: 3,
                                                    stroke: '#ffffff',
                                                    filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.2))'
                                                }}
                                                connectNulls={false}
                                            />
                                        );
                                    })}
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                        
                        {/* Блок с отсортированными сотрудниками под графиком */}
                        {selectedEmployees.length > 0 && (
                            <Box sx={{ mt: 3, p: 3, backgroundColor: '#f8f9fa', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                                <Typography variant="subtitle1" sx={{ color: '#1a1a1a', mb: 2, fontWeight: 600 }}>
                                    Сотрудники по загруженности (от высокой к низкой):
                                </Typography>
                                <Grid container spacing={2}>
                                    {getSortedEmployeesForChart().map((employee, sortIndex) => {
                                        const originalIndex = selectedEmployees.indexOf(employee.employee_id);
                                        const lineStyle = lineStyles[originalIndex % lineStyles.length];
                                        
                                        return (
                                            <Grid item xs={12} sm={6} md={4} key={employee.employee_id}>
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: 2,
                                                    p: 2,
                                                    backgroundColor: '#ffffff',
                                                    borderRadius: 2,
                                                    border: '1px solid #e0e0e0',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': { 
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                        transform: 'translateY(-1px)'
                                                    }
                                                }}>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                                        <Box
                                                            sx={{
                                                                width: 20,
                                                                height: 20,
                                                                backgroundColor: colors[originalIndex % colors.length],
                                                                borderRadius: '50%',
                                                                flexShrink: 0,
                                                                border: '2px solid #ffffff',
                                                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                                            }}
                                                        />
                                                        <Box
                                                            sx={{
                                                                width: 30,
                                                                height: 2,
                                                                backgroundColor: colors[originalIndex % colors.length],
                                                                borderRadius: 1,
                                                                ...(lineStyle.strokeDasharray !== "0" && {
                                                                    background: `repeating-linear-gradient(
                                                                        to right,
                                                                        ${colors[originalIndex % colors.length]} 0px,
                                                                        ${colors[originalIndex % colors.length]} 3px,
                                                                        transparent 3px,
                                                                        transparent 6px
                                                                    )`
                                                                })
                                                            }}
                                                        />
                                                    </Box>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 600, mb: 0.5 }}>
                                                            {employee.employee_name}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#666' }}>
                                                            Средняя загруженность: <strong>{employee.avgWorkload}%</strong>
                                                        </Typography>
                                                    </Box>
                                                    <Chip
                                                        label={getWorkloadStatus(employee.avgWorkload)}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: getWorkloadColor(employee.avgWorkload),
                                                            color: 'white',
                                                            fontWeight: 600,
                                                            fontSize: '0.7rem',
                                                            borderRadius: 1
                                                        }}
                                                    />
                                                </Box>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </Box>
                        )}
                    </>
                )}
            </Paper>

            {/* Индикаторы загрузки и ошибок */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            )}
            
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}
            
            {/* Объединенная таблица с группировкой */}
            {workloadData && !loading && (
                <Paper sx={{ 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    borderRadius: 2,
                    overflow: 'hidden'
                }}>
                    <Box sx={{ p: 3, pb: 2 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: '#1a1a1a' }}>
                            Детализация загруженности сотрудников
                        </Typography>
                        
                        {/* Фильтр сотрудников для таблицы */}
                        <FormControl size="small" sx={{ minWidth: 300, mb: 2 }}>
                            <InputLabel>Фильтр сотрудников</InputLabel>
                            <Select
                                multiple
                                value={tableEmployeeFilter}
                                onChange={handleTableEmployeeFilterChange}
                                input={<OutlinedInput label="Фильтр сотрудников" />}
                                renderValue={(selected) => 
                                    `Выбрано: ${selected.length} из ${workloadData?.employees?.length || 0}`
                                }
                                sx={{ borderRadius: 2 }}
                            >
                                {workloadData?.employees.map((employee) => (
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
                                        Всего слотов
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, color: '#424242', width: '15%' }}>
                                        Занято слотов
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredEmployees.map((employee, employeeIndex) => {
                                    const avgWorkload = Math.round(
                                        employee.workload.reduce((sum, period) => sum + period.workload_percent, 0) / 
                                        employee.workload.length
                                    );
                                    const totalSlots = employee.workload.reduce((sum, period) => sum + period.total_slots, 0);
                                    const bookedSlots = employee.workload.reduce((sum, period) => sum + period.booked_slots, 0);
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
                                                onClick={() => handleRowToggle(employee.employee_id)}
                                            >
                                                <TableCell>
                                                    <IconButton size="small">
                                                        {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                                                    </IconButton>
                                                </TableCell>
                                                <TableCell sx={{ color: '#1a1a1a', fontWeight: 500 }}>
                                                    {employee.employee_name}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: '#1a1a1a', fontWeight: 600 }}>
                                                    {avgWorkload}%
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={getWorkloadStatus(avgWorkload)}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: getWorkloadColor(avgWorkload),
                                                            color: 'white',
                                                            fontWeight: 500,
                                                            borderRadius: 2
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: '#666' }}>
                                                    {totalSlots}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: '#666' }}>
                                                    {bookedSlots}
                                                </TableCell>
                                            </TableRow>
                                            
                                            {/* Детальные строки периодов */}
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
                                                                            Занято/Всего
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
                                                                                    <Box
                                                                                        sx={{
                                                                                            width: 60,
                                                                                            height: 6,
                                                                                            backgroundColor: '#e0e0e0',
                                                                                            borderRadius: 3,
                                                                                            overflow: 'hidden'
                                                                                        }}
                                                                                    >
                                                                                        <Box
                                                                                            sx={{
                                                                                                width: `${period.workload_percent}%`,
                                                                                                height: '100%',
                                                                                                backgroundColor: getWorkloadColor(period.workload_percent),
                                                                                                borderRadius: 3
                                                                                            }}
                                                                                        />
                                                                                    </Box>
                                                                                    <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 600, minWidth: '35px' }}>
                                                                                        {period.workload_percent}%
                                                                                    </Typography>
                                                                                </Box>
                                                                            </TableCell>
                                                                            <TableCell align="right" sx={{ color: '#666', fontSize: '0.8rem' }}>
                                                                                {period.booked_slots}/{period.total_slots}
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
            )}
        </Box>
    );
}

export default EmployeeWorkloadTab;
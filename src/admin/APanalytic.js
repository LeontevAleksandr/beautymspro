import React, { useState, useEffect } from 'react';
import { 
    Typography, Box, Paper, Grid, 
    FormControl, InputLabel, Select, MenuItem, 
    TextField, Button, CircularProgress, Divider,
    Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Card, CardContent,
    OutlinedInput, Checkbox, ListItemText, Stack,
    Alert, Chip, Collapse, IconButton, LinearProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { format, subMonths } from 'date-fns';
import { 
    BarChart, Bar, LineChart, Line, 
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, ReferenceArea, ReferenceLine, Area, ComposedChart
} from 'recharts';

// Функция для получения цвета в зависимости от загруженности
const getWorkloadGradientColor = (percent) => {
    // Градиент от зеленого к красному через желтый и оранжевый
    if (percent <= 20) return '#22c55e'; // Ярко-зеленый
    if (percent <= 40) return '#84cc16'; // Лайм
    if (percent <= 60) return '#eab308'; // Желтый
    if (percent <= 80) return '#f97316'; // Оранжевый
    return '#ef4444'; // Красный
};

// Получение более насыщенного цвета для той же загруженности
const getWorkloadDarkColor = (percent) => {
    if (percent <= 20) return '#16a34a';
    if (percent <= 40) return '#65a30d';
    if (percent <= 60) return '#ca8a04';
    if (percent <= 80) return '#ea580c';
    return '#dc2626';
};

// Стили линий на основе загруженности
const getLineStyle = (avgWorkload) => {
    if (avgWorkload >= 80) return { strokeWidth: 3.5, strokeDasharray: "0" }; // Толстая сплошная
    if (avgWorkload >= 60) return { strokeWidth: 3, strokeDasharray: "0" }; // Средняя сплошная
    if (avgWorkload >= 40) return { strokeWidth: 2.5, strokeDasharray: "5 5" }; // Пунктирная
    return { strokeWidth: 2, strokeDasharray: "3 3" }; // Мелкий пунктир
};

// Получение иконки статуса с использованием эмодзи
const getStatusIcon = (percent) => {
    if (percent >= 80) return <span style={{ fontSize: 16 }}>🔴</span>;
    if (percent >= 60) return <span style={{ fontSize: 16 }}>🟠</span>;
    if (percent >= 40) return <span style={{ fontSize: 16 }}>🟡</span>;
    return <span style={{ fontSize: 16 }}>🟢</span>;
};

// Простые компоненты для стрелок
const ArrowUp = () => (
    <span style={{ fontSize: 12, fontWeight: 'bold' }}>▲</span>
);

const ArrowDown = () => (
    <span style={{ fontSize: 12, fontWeight: 'bold' }}>▼</span>
);

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
                    // По умолчанию выбираем топ-5 самых загруженных сотрудников
                    const sortedByWorkload = result.employees
                        .map(emp => ({
                            ...emp,
                            avgWorkload: emp.workload.reduce((sum, p) => sum + p.workload_percent, 0) / emp.workload.length
                        }))
                        .sort((a, b) => b.avgWorkload - a.avgWorkload)
                        .slice(0, 5)
                        .map(emp => emp.employee_id);
                    setSelectedEmployees(sortedByWorkload);
                }
                if (tableEmployeeFilter.length === 0) {
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
        if (percent >= 80) return '#ef4444'; // красный
        if (percent >= 60) return '#f97316'; // оранжевый  
        if (percent >= 40) return '#eab308'; // желтый
        return '#22c55e'; // зеленый
    };

    // Получение статуса загруженности
    const getWorkloadStatus = (percent) => {
        if (percent >= 80) return 'Критическая';
        if (percent >= 60) return 'Высокая';
        if (percent >= 40) return 'Средняя';
        return 'Низкая';
    };

    // Кастомный тултип с улучшенным дизайном
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
                    minWidth: '280px',
                    maxWidth: '350px'
                }}>
                    <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 700, color: '#1a1a1a', borderBottom: '1px solid #f0f0f0', pb: 1 }}>
                        📅 {label}
                    </Typography>
                    {sortedPayload.map((entry, index) => {
                        const workloadEmployee = workloadData?.employees.find(emp => emp.employee_name === entry.dataKey);
                        const avgWorkload = workloadEmployee ? 
                            Math.round(workloadEmployee.workload.reduce((sum, p) => sum + p.workload_percent, 0) / workloadEmployee.workload.length) : 
                            entry.value;
                        
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
                                    {getStatusIcon(entry.value)}
                                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#1a1a1a', fontWeight: 500 }}>
                                        {entry.dataKey}
                                    </Typography>
                                </Box>
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
                                    <Typography variant="body2" sx={{ 
                                        fontWeight: 700, 
                                        color: getWorkloadDarkColor(entry.value),
                                        minWidth: '40px',
                                        textAlign: 'right'
                                    }}>
                                        {entry.value}%
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    })}
                    {sortedPayload.length > 0 && (
                        <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px solid #f0f0f0' }}>
                            <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic' }}>
                                💡 Цвет зависит от уровня загруженности
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

    // Кастомная легенда
    const CustomLegend = (props) => {
        const { payload } = props;
        const sortedEmployees = getSortedEmployeesForChart();
        
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
                        <Box key={employee.employee_id} sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            p: 1,
                            backgroundColor: '#ffffff',
                            borderRadius: 1,
                            border: '1px solid #e0e0e0'
                        }}>
                            {getStatusIcon(employee.avgWorkload)}
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
                            <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 500 }}>
                                {employee.employee_name}
                            </Typography>
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

            {/* Статистическая сводка */}
            {workloadData && !loading && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={3}>
                        <Paper sx={{ 
                            p: 2, 
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                            borderRadius: 2,
                            borderLeft: '4px solid #ef4444'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <span style={{ fontSize: 20 }}>🔴</span>
                                <Typography variant="subtitle2" sx={{ color: '#666' }}>
                                    Критическая загрузка
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{ color: '#ef4444', fontWeight: 600 }}>
                                {workloadData.employees.filter(emp => {
                                    const avg = emp.workload.reduce((sum, p) => sum + p.workload_percent, 0) / emp.workload.length;
                                    return avg >= 80;
                                }).length}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                                сотрудников (≥80%)
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Paper sx={{ 
                            p: 2, 
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                            borderRadius: 2,
                            borderLeft: '4px solid #f97316'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <span style={{ fontSize: 20 }}>🟠</span>
                                <Typography variant="subtitle2" sx={{ color: '#666' }}>
                                    Высокая загрузка
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{ color: '#f97316', fontWeight: 600 }}>
                                {workloadData.employees.filter(emp => {
                                    const avg = emp.workload.reduce((sum, p) => sum + p.workload_percent, 0) / emp.workload.length;
                                    return avg >= 60 && avg < 80;
                                }).length}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                                сотрудников (60-79%)
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Paper sx={{ 
                            p: 2, 
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                            borderRadius: 2,
                            borderLeft: '4px solid #eab308'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <span style={{ fontSize: 20 }}>🟡</span>
                                <Typography variant="subtitle2" sx={{ color: '#666' }}>
                                    Средняя загрузка
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{ color: '#eab308', fontWeight: 600 }}>
                                {workloadData.employees.filter(emp => {
                                    const avg = emp.workload.reduce((sum, p) => sum + p.workload_percent, 0) / emp.workload.length;
                                    return avg >= 40 && avg < 60;
                                }).length}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                                сотрудников (40-59%)
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Paper sx={{ 
                            p: 2, 
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                            borderRadius: 2,
                            borderLeft: '4px solid #22c55e'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <span style={{ fontSize: 20 }}>🟢</span>
                                <Typography variant="subtitle2" sx={{ color: '#666' }}>
                                    Низкая загрузка
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{ color: '#22c55e', fontWeight: 600 }}>
                                {workloadData.employees.filter(emp => {
                                    const avg = emp.workload.reduce((sum, p) => sum + p.workload_percent, 0) / emp.workload.length;
                                    return avg < 40;
                                }).length}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                                сотрудников (&lt;40%)
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            )}

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
                        {workloadData?.employees
                            .map(emp => ({
                                ...emp,
                                avgWorkload: Math.round(
                                    emp.workload.reduce((sum, p) => sum + p.workload_percent, 0) / 
                                    emp.workload.length
                                )
                            }))
                            .sort((a, b) => b.avgWorkload - a.avgWorkload)
                            .map((employee) => (
                                <Grid item xs={12} sm={6} md={4} key={employee.employee_id}>
                                    <FormControl component="fieldset" size="small">
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            p: 1,
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 1,
                                            backgroundColor: selectedEmployees.includes(employee.employee_id) ? '#f0f4ff' : 'transparent',
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

                {/* График */}
                {chartData.length > 0 && (
                    <>
                        <Box sx={{ height: 450, width: '100%' }}>
                            <ResponsiveContainer>
                                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid 
                                        strokeDasharray="2 2" 
                                        stroke="#e0e0e0" 
                                        strokeOpacity={0.5}
                                    />
                                    
                                    {/* Зоны загруженности */}
                                    <ReferenceArea y1={0} y2={40} fill="#22c55e" fillOpacity={0.1} />
                                    <ReferenceArea y1={40} y2={60} fill="#eab308" fillOpacity={0.1} />
                                    <ReferenceArea y1={60} y2={80} fill="#f97316" fillOpacity={0.1} />
                                    <ReferenceArea y1={80} y2={100} fill="#ef4444" fillOpacity={0.1} />
                                    
                                    {/* Референсные линии */}
                                    <ReferenceLine 
                                        y={80} 
                                        stroke="#ef4444" 
                                        strokeDasharray="5 5" 
                                        strokeWidth={2}
                                        label={{ value: "Критическая загрузка", position: "left", fill: "#ef4444", fontSize: 12 }}
                                    />
                                    <ReferenceLine 
                                        y={60} 
                                        stroke="#f97316" 
                                        strokeDasharray="5 5" 
                                        strokeWidth={1.5}
                                        label={{ value: "Высокая", position: "left", fill: "#f97316", fontSize: 11 }}
                                    />
                                    <ReferenceLine 
                                        y={40} 
                                        stroke="#eab308" 
                                        strokeDasharray="5 5" 
                                        strokeWidth={1}
                                        label={{ value: "Средняя", position: "left", fill: "#eab308", fontSize: 11 }}
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
                                        ticks={[0, 20, 40, 60, 80, 100]}
                                        label={{ value: 'Загруженность (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#666' } }}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    
                                    {getSortedEmployeesForChart().map((employee) => {
                                        const color = getWorkloadGradientColor(employee.avgWorkload);
                                        const lineStyle = getLineStyle(employee.avgWorkload);
                                        
                                        return (
                                            <Line
                                                key={employee.employee_id}
                                                type="monotone"
                                                dataKey={employee.employee_name}
                                                stroke={color}
                                                strokeWidth={lineStyle.strokeWidth}
                                                strokeDasharray={lineStyle.strokeDasharray}
                                                dot={{ 
                                                    r: 4, 
                                                    fill: color,
                                                    strokeWidth: 2,
                                                    stroke: '#ffffff'
                                                }}
                                                activeDot={{ 
                                                    r: 7, 
                                                    fill: color,
                                                    strokeWidth: 3,
                                                    stroke: '#ffffff',
                                                    filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.2))'
                                                }}
                                                connectNulls={false}
                                            />
                                        );
                                    })}
                                </ComposedChart>
                            </ResponsiveContainer>
                        </Box>
                        
                        {/* Кастомная легенда */}
                        <CustomLegend />
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
                                        Всего рабочих часов
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, color: '#424242', width: '15%' }}>
                                        Занято часов
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredEmployees
                                    .map(emp => ({
                                        ...emp,
                                        avgWorkload: Math.round(
                                            emp.workload.reduce((sum, p) => sum + p.workload_percent, 0) / 
                                            emp.workload.length
                                        )
                                    }))
                                    .sort((a, b) => b.avgWorkload - a.avgWorkload)
                                    .map((employee, employeeIndex) => {
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
                                                    onClick={() => handleRowToggle(employee.employee_id)}
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
            )}
        </Box>
    );
}

export default EmployeeWorkloadTab;
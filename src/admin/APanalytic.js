import React, { useState, useEffect } from 'react';
import { 
    Typography, Box, Paper, Grid, Tabs, Tab, 
    FormControl, InputLabel, Select, MenuItem, 
    TextField, Button, CircularProgress, Divider,
    Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Card, CardContent,
    OutlinedInput, Checkbox, ListItemText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

// Импортируем компоненты для графиков
// Примечание: вам может потребоваться установить эти библиотеки
// npm install recharts

import { 
    BarChart, Bar, LineChart, Line, PieChart, Pie, 
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, Cell 
} from 'recharts';

function APanalytic() {
    // Состояние для управления вкладками
    const [activeTab, setActiveTab] = useState(0);
    
    // Обработчик изменения вкладки
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" align="center" gutterBottom>
                Аналитика
            </Typography>
            
            <Paper sx={{ mb: 3 }}>
                <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange} 
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label="Популярность услуг" />
                    <Tab label="Сравнение периодов" />
                    <Tab label="Загруженность сотрудников" />
                    <Tab label="Финансы" />
                    <Tab label="Клиенты" />
                </Tabs>
            </Paper>
            
            <Box sx={{ mt: 2 }}>
                {activeTab === 0 && <ServicePopularityTab />}
                {activeTab === 1 && <ServiceComparisonTab />}
                {activeTab === 2 && <EmployeeWorkloadTab />}
                {activeTab === 3 && <FinancialTab />}
                {activeTab === 4 && <ClientsTab />}
            </Box>
        </Box>
    );
}

// Компонент для отображения популярности услуг
function ServicePopularityTab() {
    const [startDate, setStartDate] = useState(format(subMonths(new Date(), 6), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [limit, setLimit] = useState(10);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `http://localhost:5000/api/analytics/service_popularity?start_date=${startDate}&end_date=${endDate}&limit=${limit}`
            );
            if (!response.ok) {
                throw new Error('Ошибка при получении данных');
            }
            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Популярность услуг
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                        <DatePicker
                            label="Начальная дата"
                            value={new Date(startDate)}
                            onChange={(newValue) => setStartDate(format(newValue, 'yyyy-MM-dd'))}
                            renderInput={(params) => <TextField {...params} fullWidth />}
                            slotProps={{
                                textField: { fullWidth: true }
                            }}
                        />
                    </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                        <DatePicker
                            label="Конечная дата"
                            value={new Date(endDate)}
                            onChange={(newValue) => setEndDate(format(newValue, 'yyyy-MM-dd'))}
                            renderInput={(params) => <TextField {...params} fullWidth />}
                            slotProps={{
                                textField: { fullWidth: true }
                            }}
                        />
                    </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={2}>
                    <TextField
                        label="Лимит"
                        type="number"
                        value={limit}
                        onChange={(e) => setLimit(e.target.value)}
                        fullWidth
                    />
                </Grid>
                <Grid item xs={12} sm={2}>
                    <Button 
                        variant="contained" 
                        onClick={fetchData}
                        fullWidth
                        sx={{ height: '56px' }}
                    >
                        Применить
                    </Button>
                </Grid>
            </Grid>
            
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            )}
            
            {error && (
                <Typography color="error" sx={{ my: 2 }}>
                    Ошибка: {error}
                </Typography>
            )}
            
            {data && !loading && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Услуга</TableCell>
                                <TableCell align="right">Всего бронирований</TableCell>
                                {data.months.map((month) => (
                                    <TableCell key={month} align="right">{month}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.services.map((service) => (
                                <TableRow key={service.service_id}>
                                    <TableCell component="th" scope="row">
                                        {service.service_name}
                                    </TableCell>
                                    <TableCell align="right">{service.total_bookings}</TableCell>
                                    {data.months.map((month) => (
                                        <TableCell key={month} align="right">
                                            {service.months[month] || 0}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}

// Компонент для сравнения популярности услуг в разные периоды
function ServiceComparisonTab() {
    const [period1Start, setPeriod1Start] = useState(format(subMonths(new Date(), 6), 'yyyy-MM-dd'));
    const [period1End, setPeriod1End] = useState(format(subMonths(new Date(), 3), 'yyyy-MM-dd'));
    const [period2Start, setPeriod2Start] = useState(format(subMonths(new Date(), 3), 'yyyy-MM-dd'));
    const [period2End, setPeriod2End] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [limit, setLimit] = useState(10);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `http://localhost:5000/api/analytics/service_popularity_comparison?period1_start=${period1Start}&period1_end=${period1End}&period2_start=${period2Start}&period2_end=${period2End}&limit=${limit}`
            );
            if (!response.ok) {
                throw new Error('Ошибка при получении данных');
            }
            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Сравнение популярности услуг в разные периоды
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" gutterBottom>
                        Период 1
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                                <DatePicker
                                    label="Начало"
                                    value={new Date(period1Start)}
                                    onChange={(newValue) => setPeriod1Start(format(newValue, 'yyyy-MM-dd'))}
                                    slotProps={{
                                        textField: { fullWidth: true }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                                <DatePicker
                                    label="Конец"
                                    value={new Date(period1End)}
                                    onChange={(newValue) => setPeriod1End(format(newValue, 'yyyy-MM-dd'))}
                                    slotProps={{
                                        textField: { fullWidth: true }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                    </Grid>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" gutterBottom>
                        Период 2
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                                <DatePicker
                                    label="Начало"
                                    value={new Date(period2Start)}
                                    onChange={(newValue) => setPeriod2Start(format(newValue, 'yyyy-MM-dd'))}
                                    slotProps={{
                                        textField: { fullWidth: true }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                                <DatePicker
                                    label="Конец"
                                    value={new Date(period2End)}
                                    onChange={(newValue) => setPeriod2End(format(newValue, 'yyyy-MM-dd'))}
                                    slotProps={{
                                        textField: { fullWidth: true }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                    </Grid>
                </Grid>
                
                <Grid item xs={12} sm={10}>
                    <TextField
                        label="Лимит"
                        type="number"
                        value={limit}
                        onChange={(e) => setLimit(e.target.value)}
                        fullWidth
                    />
                </Grid>
                <Grid item xs={12} sm={2}>
                    <Button 
                        variant="contained" 
                        onClick={fetchData}
                        fullWidth
                        sx={{ height: '56px' }}
                    >
                        Применить
                    </Button>
                </Grid>
            </Grid>
            
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            )}
            
            {error && (
                <Typography color="error" sx={{ my: 2 }}>
                    Ошибка: {error}
                </Typography>
            )}
            
            {data && !loading && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Услуга</TableCell>
                                <TableCell align="right">
                                    Период 1 ({data.period1.start} - {data.period1.end})
                                </TableCell>
                                <TableCell align="right">
                                    Период 2 ({data.period2.start} - {data.period2.end})
                                </TableCell>
                                <TableCell align="right">Изменение (%)</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.services.map((service) => (
                                <TableRow key={service.service_id}>
                                    <TableCell component="th" scope="row">
                                        {service.service_name}
                                    </TableCell>
                                    <TableCell align="right">{service.period1_bookings}</TableCell>
                                    <TableCell align="right">{service.period2_bookings}</TableCell>
                                    <TableCell 
                                        align="right"
                                        sx={{ 
                                            color: service.change_percent > 0 ? 'green' : 
                                                  service.change_percent < 0 ? 'red' : 'inherit'
                                        }}
                                    >
                                        {service.change_percent > 0 ? '+' : ''}{service.change_percent}%
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}

// Компонент для отображения загруженности сотрудников
function EmployeeWorkloadTab() {
    const [startDate, setStartDate] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [groupBy, setGroupBy] = useState('day');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `http://localhost:5000/api/analytics/employee_workload?start_date=${startDate}&end_date=${endDate}&group_by=${groupBy}`
            );
            if (!response.ok) {
                throw new Error('Ошибка при получении данных');
            }
            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Загруженность сотрудников
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                        <DatePicker
                            label="Начальная дата"
                            value={new Date(startDate)}
                            onChange={(newValue) => setStartDate(format(newValue, 'yyyy-MM-dd'))}
                            slotProps={{
                                textField: { fullWidth: true }
                            }}
                        />
                    </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                        <DatePicker
                            label="Конечная дата"
                            value={new Date(endDate)}
                            onChange={(newValue) => setEndDate(format(newValue, 'yyyy-MM-dd'))}
                            slotProps={{
                                textField: { fullWidth: true }
                            }}
                        />
                    </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={2}>
                    <FormControl fullWidth>
                        <InputLabel>Группировка</InputLabel>
                        <Select
                            value={groupBy}
                            label="Группировка"
                            onChange={(e) => setGroupBy(e.target.value)}
                        >
                            <MenuItem value="day">По дням</MenuItem>
                            <MenuItem value="week">По неделям</MenuItem>
                            <MenuItem value="month">По месяцам</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={2}>
                    <Button 
                        variant="contained" 
                        onClick={fetchData}
                        fullWidth
                        sx={{ height: '56px' }}
                    >
                        Применить
                    </Button>
                </Grid>
            </Grid>
            
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            )}
            
            {error && (
                <Typography color="error" sx={{ my: 2 }}>
                    Ошибка: {error}
                </Typography>
            )}
            
            {data && !loading && (
                <Grid container spacing={3}>
                    {data.employees.map((employee) => (
                        <Grid item xs={12} md={6} key={employee.employee_id}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        {employee.employee_name}
                                    </Typography>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Период</TableCell>
                                                    <TableCell align="right">Занято слотов</TableCell>
                                                    <TableCell align="right">Всего слотов</TableCell>
                                                    <TableCell align="right">Загруженность (%)</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {employee.workload.map((period) => (
                                                    <TableRow key={period.period}>
                                                        <TableCell>{period.period}</TableCell>
                                                        <TableCell align="right">{period.booked_slots}</TableCell>
                                                        <TableCell align="right">{period.total_slots}</TableCell>
                                                        <TableCell 
                                                            align="right"
                                                            sx={{ 
                                                                color: period.workload_percent > 80 ? 'red' : 
                                                                      period.workload_percent > 50 ? 'orange' : 'green'
                                                            }}
                                                        >
                                                            {period.workload_percent}%
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
}

// Компонент для отображения финансовой аналитики
function FinancialTab() {
    const [startDate, setStartDate] = useState(format(subMonths(new Date(), 3), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [groupBy, setGroupBy] = useState('month');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `http://localhost:5000/api/analytics/financial?start_date=${startDate}&end_date=${endDate}&group_by=${groupBy}`
            );
            if (!response.ok) {
                throw new Error('Ошибка при получении данных');
            }
            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Финансовая аналитика
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                        <DatePicker
                            label="Начальная дата"
                            value={new Date(startDate)}
                            onChange={(newValue) => setStartDate(format(newValue, 'yyyy-MM-dd'))}
                            slotProps={{
                                textField: { fullWidth: true }
                            }}
                        />
                    </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                        <DatePicker
                            label="Конечная дата"
                            value={new Date(endDate)}
                            onChange={(newValue) => setEndDate(format(newValue, 'yyyy-MM-dd'))}
                            slotProps={{
                                textField: { fullWidth: true }
                            }}
                        />
                    </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={2}>
                    <FormControl fullWidth>
                        <InputLabel>Группировка</InputLabel>
                        <Select
                            value={groupBy}
                            label="Группировка"
                            onChange={(e) => setGroupBy(e.target.value)}
                        >
                            <MenuItem value="day">По дням</MenuItem>
                            <MenuItem value="week">По неделям</MenuItem>
                            <MenuItem value="month">По месяцам</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={2}>
                    <Button 
                        variant="contained" 
                        onClick={fetchData}
                        fullWidth
                        sx={{ height: '56px' }}
                    >
                        Применить
                    </Button>
                </Grid>
            </Grid>
            
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            )}
            
            {error && (
                <Typography color="error" sx={{ my: 2 }}>
                    Ошибка: {error}
                </Typography>
            )}
            
            {data && !loading && (
                <Box>
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Общая выручка
                                    </Typography>
                                    <Typography variant="h4">
                                        {data.total_revenue} ₽
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Всего записей
                                    </Typography>
                                    <Typography variant="h4">
                                        {data.total_appointments}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Средний чек
                                    </Typography>
                                    <Typography variant="h4">
                                        {data.average_check} ₽
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                    
                    <Typography variant="h6" gutterBottom>
                        Выручка по периодам
                    </Typography>
                    <TableContainer component={Paper} sx={{ mb: 3 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Период</TableCell>
                                    <TableCell align="right">Выручка (₽)</TableCell>
                                    <TableCell align="right">Количество записей</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.periods.map((period) => (
                                    <TableRow key={period.period}>
                                        <TableCell>{period.period}</TableCell>
                                        <TableCell align="right">{period.revenue}</TableCell>
                                        <TableCell align="right">{period.appointments_count}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    
                    <Typography variant="h6" gutterBottom>
                        Выручка по услугам
                    </Typography>
                    <TableContainer component={Paper} sx={{ mb: 3 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Услуга</TableCell>
                                    <TableCell align="right">Выручка (₽)</TableCell>
                                    <TableCell align="right">Количество записей</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.services.map((service) => (
                                    <TableRow key={service.service_id}>
                                        <TableCell>{service.service_name}</TableCell>
                                        <TableCell align="right">{service.revenue}</TableCell>
                                        <TableCell align="right">{service.appointments_count}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    
                    <Typography variant="h6" gutterBottom>
                        Выручка по сотрудникам
                    </Typography>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Сотрудник</TableCell>
                                    <TableCell align="right">Выручка (₽)</TableCell>
                                    <TableCell align="right">Количество записей</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.employees.map((employee) => (
                                    <TableRow key={employee.employee_id}>
                                        <TableCell>{employee.employee_name}</TableCell>
                                        <TableCell align="right">{employee.revenue}</TableCell>
                                        <TableCell align="right">{employee.appointments_count}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
        </Box>
    );
}

function ClientsTab() {
    const [startDate, setStartDate] = useState(format(subMonths(new Date(), 6), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [groupBy, setGroupBy] = useState('month');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `http://localhost:5000/api/analytics/clients?start_date=${startDate}&end_date=${endDate}&group_by=${groupBy}`
            );
            if (!response.ok) {
                throw new Error('Ошибка при получении данных');
            }
            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Цвета для графика статусов клиентов
    const statusColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c'];

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Клиентская аналитика
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                        <DatePicker
                            label="Начальная дата"
                            value={new Date(startDate)}
                            onChange={(newValue) => setStartDate(format(newValue, 'yyyy-MM-dd'))}
                            slotProps={{
                                textField: { fullWidth: true }
                            }}
                        />
                    </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                        <DatePicker
                            label="Конечная дата"
                            value={new Date(endDate)}
                            onChange={(newValue) => setEndDate(format(newValue, 'yyyy-MM-dd'))}
                            slotProps={{
                                textField: { fullWidth: true }
                            }}
                        />
                    </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={2}>
                    <FormControl fullWidth>
                        <InputLabel>Группировка</InputLabel>
                        <Select
                            value={groupBy}
                            label="Группировка"
                            onChange={(e) => setGroupBy(e.target.value)}
                        >
                            <MenuItem value="day">По дням</MenuItem>
                            <MenuItem value="week">По неделям</MenuItem>
                            <MenuItem value="month">По месяцам</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={2}>
                    <Button 
                        variant="contained" 
                        onClick={fetchData}
                        fullWidth
                        sx={{ height: '56px' }}
                    >
                        Применить
                    </Button>
                </Grid>
            </Grid>
            
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            )}
            
            {error && (
                <Typography color="error" sx={{ my: 2 }}>
                    Ошибка: {error}
                </Typography>
            )}
            
            {data && !loading && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Общая информация
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="body1">
                                        Всего клиентов:
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {data.total_clients}
                                    </Typography>
                                </Box>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle1" gutterBottom>
                                    Новые клиенты по периодам
                                </Typography>
                                <Box sx={{ height: 300, mt: 2 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={data.new_clients.data}
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="period" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="new_clients" name="Новые клиенты" fill="#8884d8" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Распределение клиентов по статусам
                                </Typography>
                                <Box sx={{ height: 300, mt: 2 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.status_distribution}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="count"
                                                nameKey="status"
                                            >
                                                {data.status_distribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={statusColors[index % statusColors.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value, name, props) => [value, props.payload.status]} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Частота повторных посещений
                                </Typography>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Клиент</TableCell>
                                                <TableCell align="right">Количество посещений</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {data.repeat_visits.slice(0, 10).map((client) => (
                                                <TableRow key={client.client_id}>
                                                    <TableCell>{client.client_name}</TableCell>
                                                    <TableCell align="right">{client.visits_count}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Предпочтения клиентов по услугам
                                </Typography>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Услуга</TableCell>
                                                <TableCell align="right">Количество записей</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {data.service_preferences.slice(0, 10).map((service) => (
                                                <TableRow key={service.service_id}>
                                                    <TableCell>{service.service_name}</TableCell>
                                                    <TableCell align="right">{service.bookings_count}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
}
export default APanalytic;
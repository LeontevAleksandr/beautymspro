import React, { useState } from 'react';
import { Typography, Box, Tooltip, Button, TextField, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, FormControl, InputLabel, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import BuildIcon from '@mui/icons-material/Build';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';

function AdminPanel({ records }) {
    const [activeSection, setActiveSection] = useState('home');
    const [filter, setFilter] = useState('');
    const [serviceFilter, setServiceFilter] = useState('');
    const [masterFilter, setMasterFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [newRecord, setNewRecord] = useState({ name: '', service: '', date: '', time: '', master: '', status: '' });

    const filteredRecords = records.filter(record =>
        (record.name.toLowerCase().includes(filter.toLowerCase()) ||
            record.service.toLowerCase().includes(filter.toLowerCase()) ||
            record.master.toLowerCase().includes(filter.toLowerCase())) &&
        (serviceFilter === '' || record.service === serviceFilter) &&
        (masterFilter === '' || record.master === masterFilter) &&
        (statusFilter === '' || record.status === statusFilter)
    );

    const handleOpenDialog = () => {
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleAddRecord = () => {
        // Логика добавления новой записи
        console.log('Добавлена новая запись:', newRecord);
        handleCloseDialog();
    };

    const renderSection = () => {
        switch (activeSection) {
            case 'home':
                return <Typography variant="h6" align="center">Добро пожаловать в админ-панель!</Typography>;
            case 'records':
                return (
                    <Box>
                        <Typography variant="h6" align="center" gutterBottom>Управление записями</Typography>
                        <Button variant="contained" color="primary" onClick={handleOpenDialog} sx={{ mb: 2 }}>
                            Добавить запись
                        </Button>
                        <Dialog open={openDialog} onClose={handleCloseDialog}>
                            <DialogTitle>Добавить новую запись</DialogTitle>
                            <DialogContent>
                                <TextField
                                    label="Имя клиента"
                                    fullWidth
                                    margin="normal"
                                    value={newRecord.name}
                                    onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
                                />
                                <TextField
                                    label="Услуга"
                                    fullWidth
                                    margin="normal"
                                    value={newRecord.service}
                                    onChange={(e) => setNewRecord({ ...newRecord, service: e.target.value })}
                                />
                                <TextField
                                    label="Дата"
                                    type="date"
                                    fullWidth
                                    margin="normal"
                                    InputLabelProps={{ shrink: true }}
                                    value={newRecord.date}
                                    onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                                />
                                <TextField
                                    label="Время"
                                    type="time"
                                    fullWidth
                                    margin="normal"
                                    InputLabelProps={{ shrink: true }}
                                    value={newRecord.time}
                                    onChange={(e) => setNewRecord({ ...newRecord, time: e.target.value })}
                                />
                                <TextField
                                    label="Мастер"
                                    fullWidth
                                    margin="normal"
                                    value={newRecord.master}
                                    onChange={(e) => setNewRecord({ ...newRecord, master: e.target.value })}
                                />
                                <TextField
                                    label="Статус"
                                    fullWidth
                                    margin="normal"
                                    value={newRecord.status}
                                    onChange={(e) => setNewRecord({ ...newRecord, status: e.target.value })}
                                />
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleCloseDialog} color="secondary">Отмена</Button>
                                <Button onClick={handleAddRecord} color="primary">Добавить</Button>
                            </DialogActions>
                        </Dialog>
                        <Box sx={{ position: 'sticky', top: 0, backgroundColor: '#F8F9FA', zIndex: 1, padding: 2 }}>
                            <TextField
                                label="Поиск"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            />
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Услуга</InputLabel>
                                    <Select
                                        value={serviceFilter}
                                        onChange={(e) => setServiceFilter(e.target.value)}
                                    >
                                        <MenuItem value="">Все</MenuItem>
                                        {[...new Set(records.map(record => record.service))].map(service => (
                                            <MenuItem key={service} value={service}>{service}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth>
                                    <InputLabel>Мастер</InputLabel>
                                    <Select
                                        value={masterFilter}
                                        onChange={(e) => setMasterFilter(e.target.value)}
                                    >
                                        <MenuItem value="">Все</MenuItem>
                                        {[...new Set(records.map(record => record.master))].map(master => (
                                            <MenuItem key={master} value={master}>{master}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth>
                                    <InputLabel>Статус</InputLabel>
                                    <Select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <MenuItem value="">Все</MenuItem>
                                        {[...new Set(records.map(record => record.status))].map(status => (
                                            <MenuItem key={status} value={status}>{status}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>
                        <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: 'auto', mt: 2 }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Имя клиента</TableCell>
                                        <TableCell>Услуга</TableCell>
                                        <TableCell>Дата</TableCell>
                                        <TableCell>Время</TableCell>
                                        <TableCell>Мастер</TableCell>
                                        <TableCell>Статус</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredRecords.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell>{record.name}</TableCell>
                                            <TableCell>{record.service}</TableCell>
                                            <TableCell>{record.date}</TableCell>
                                            <TableCell>{record.time}</TableCell>
                                            <TableCell>{record.master}</TableCell>
                                            <TableCell>{record.status}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                );
            case 'services':
                return <Typography variant="h6" align="center">Управление услугами</Typography>;
            case 'staff':
                return <Typography variant="h6" align="center">Управление персоналом</Typography>;
            case 'specializations':
                return <Typography variant="h6" align="center">Управление специализациями</Typography>;
            case 'clients':
                return <Typography variant="h6" align="center">Управление клиентами</Typography>;
            case 'records':
                return (
                    <Box>
                        <Typography variant="h6" align="center" gutterBottom>Управление записями</Typography>
                        <table>
                            <thead>
                                <tr>
                                    <th>Имя клиента</th>
                                    <th>Услуга</th>
                                    <th>Дата</th>
                                    <th>Время</th>
                                    <th>Мастер</th>
                                    <th>Статус</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((record) => (
                                    <tr key={record.id}>
                                        <td>{record.name}</td>
                                        <td>{record.service}</td>
                                        <td>{record.date}</td>
                                        <td>{record.time}</td>
                                        <td>{record.master}</td>
                                        <td>{record.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Box>
                );
            case 'analytics':
                return <Typography variant="h6" align="center">Аналитика</Typography>;
            default:
                return null;
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', background: '#F8F9FA' }}>
            <Box sx={{ width: '80px', background: '#FFFFFF', boxShadow: '2px 0 5px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                <Tooltip title="Главная" placement="right">
                    <Button onClick={() => setActiveSection('home')} sx={{ minWidth: 0, mb: 2 }}>
                        <HomeIcon sx={{ color: '#333' }} />
                    </Button>
                </Tooltip>
                <Tooltip title="Услуги" placement="right">
                    <Button onClick={() => setActiveSection('services')} sx={{ minWidth: 0, mb: 2 }}>
                        <BuildIcon sx={{ color: '#333' }} />
                    </Button>
                </Tooltip>
                <Tooltip title="Персонал" placement="right">
                    <Button onClick={() => setActiveSection('staff')} sx={{ minWidth: 0, mb: 2 }}>
                        <PeopleIcon sx={{ color: '#333' }} />
                    </Button>
                </Tooltip>
                <Tooltip title="Специализации" placement="right">
                    <Button onClick={() => setActiveSection('specializations')} sx={{ minWidth: 0, mb: 2 }}>
                        <CategoryIcon sx={{ color: '#333' }} />
                    </Button>
                </Tooltip>
                <Tooltip title="Клиенты" placement="right">
                    <Button onClick={() => setActiveSection('clients')} sx={{ minWidth: 0, mb: 2 }}>
                        <AssignmentIcon sx={{ color: '#333' }} />
                    </Button>
                </Tooltip>
                <Tooltip title="Записи" placement="right">
                    <Button onClick={() => setActiveSection('records')} sx={{ minWidth: 0, mb: 2 }}>
                        <AssignmentIcon sx={{ color: '#333' }} />
                    </Button>
                </Tooltip>
                <Tooltip title="Аналитика" placement="right">
                    <Button onClick={() => setActiveSection('analytics')} sx={{ minWidth: 0, mb: 2 }}>
                        <BarChartIcon sx={{ color: '#333' }} />
                    </Button>
                </Tooltip>
            </Box>
            <Box sx={{ flexGrow: 1, py: 4 }}>
                {renderSection()}
            </Box>
        </Box>
    );
}

export default AdminPanel;
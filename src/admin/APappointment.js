import React, { useState } from 'react';
import { Typography, Box, Button, TextField, TableContainer, 
    Paper, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, 
    FormControl, InputLabel, Dialog, DialogActions, DialogContent, DialogTitle, 
    FormControlLabel, Checkbox } from '@mui/material';

function APappointment({ records, clients, setClients, employees, services }) {
    const [openDialog, setOpenDialog] = useState(false);
    const [filter, setFilter] = useState('');
    const [serviceFilter, setServiceFilter] = useState('');
    const [masterFilter, setMasterFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [newRecord, setNewRecord] = useState({
        name: '',
        service: '',
        date: '',
        time: '',
        master: '',
        status: ''
    });
    const [addNewClient, setAddNewClient] = useState(false);
    const [newClient, setNewClient] = useState({
        full_name: '',
        phone: '',
        email: ''
    });

    const handleClientChange = (e) => {
        if (e.target.value === 'new') {
            setAddNewClient(true);
            setNewRecord(prev => ({ ...prev, client_id: '' }));
        } else {
            setAddNewClient(false);
            setNewRecord(prev => ({ ...prev, client_id: e.target.value }));
        }
    };

    const handleAddClient = async () => {
        const resp = await fetch('http://localhost:5000/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newClient)
        });
        if (resp.ok) {
            const created = await resp.json();
            setClients(prev => [...prev, created]);
            setNewRecord(prev => ({ ...prev, client_id: created.id }));
            setAddNewClient(false);
            setNewClient({ full_name: '', phone: '', email: '' });
        } else {
            alert('Ошибка при создании клиента');
        }
    };

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

    const handleAddRecord = async () => {
        let clientId = newRecord.client_id;
        if (addNewClient) {
            const resp = await fetch('http://localhost:5000/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newClient)
            });
            if (resp.ok) {
                const created = await resp.json();
                clientId = created.id;
            } else {
                alert('Ошибка при создании клиента');
                return;
            }
        }
        const datetime = newRecord.date && newRecord.time
            ? `${newRecord.date}T${newRecord.time}:00`
            : null;
        const appointmentData = {
            client_id: clientId,
            service_id: newRecord.service_id,
            employee_id: newRecord.employee_id,
            status: newRecord.status,
            datetime,
            is_completed: !!newRecord.is_completed,
            is_paid: !!newRecord.is_paid,
            notes: newRecord.notes || ''
        };
        const resp = await fetch('http://localhost:5000/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appointmentData)
        });
        if (resp.ok) {
            handleCloseDialog();
        } else {
            alert('Ошибка при создании записи');
        }
    };

    return (
        <Box>
            <Typography variant="h6" align="center" gutterBottom>Управление записями</Typography>
            <Button variant="contained" color="primary" onClick={handleOpenDialog} sx={{ mb: 2 }}>
                Добавить запись
            </Button>
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Добавить новую запись</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Клиент</InputLabel>
                        <Select
                            value={addNewClient ? 'new' : (newRecord.client_id || '')}
                            onChange={handleClientChange}
                        >
                            {clients.map(client => (
                                <MenuItem key={client.id} value={client.id}>{client.full_name}</MenuItem>
                            ))}
                            <MenuItem value="new">Добавить нового клиента</MenuItem>
                        </Select>
                    </FormControl>
                    {addNewClient && (
                        <Box>
                            <TextField
                                label="ФИО"
                                fullWidth
                                margin="normal"
                                value={newClient.full_name}
                                onChange={e => setNewClient({ ...newClient, full_name: e.target.value })}
                            />
                            <TextField
                                label="Телефон"
                                fullWidth
                                margin="normal"
                                value={newClient.phone}
                                onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                            />
                            <TextField
                                label="Email"
                                fullWidth
                                margin="normal"
                                value={newClient.email}
                                onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                <Button
                                    onClick={handleAddClient}
                                    variant="contained"
                                    color="primary"
                                >
                                    Добавить клиента
                                </Button>
                            </Box>
                        </Box>
                    )}
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Услуга</InputLabel>
                        <Select
                            value={newRecord.service_id || ''}
                            onChange={e => setNewRecord({ ...newRecord, service_id: e.target.value })}
                        >
                            {services.map(service => (
                                <MenuItem key={service.id} value={service.id}>{service.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Мастер</InputLabel>
                        <Select
                            value={newRecord.employee_id || ''}
                            onChange={e => setNewRecord({ ...newRecord, employee_id: e.target.value })}
                        >
                            {employees.map(emp => (
                                <MenuItem key={emp.id} value={emp.id}>{emp.full_name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        label="Дата"
                        type="date"
                        fullWidth
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                        value={newRecord.date}
                        onChange={e => setNewRecord({ ...newRecord, date: e.target.value })}
                    />
                    <TextField
                        label="Время"
                        type="time"
                        fullWidth
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                        value={newRecord.time}
                        onChange={e => setNewRecord({ ...newRecord, time: e.target.value })}
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Статус</InputLabel>
                        <Select
                            value={newRecord.status || ''}
                            onChange={e => setNewRecord({ ...newRecord, status: e.target.value })}
                        >
                            <MenuItem value="created">Создана</MenuItem>
                            <MenuItem value="confirmed">Подтверждена</MenuItem>
                            <MenuItem value="completed">Завершена</MenuItem>
                            <MenuItem value="cancelled">Отменена</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={!!newRecord.is_completed}
                                onChange={e => setNewRecord({ ...newRecord, is_completed: e.target.checked })}
                            />
                        }
                        label="Завершено"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={!!newRecord.is_paid}
                                onChange={e => setNewRecord({ ...newRecord, is_paid: e.target.checked })}
                            />
                        }
                        label="Оплачено"
                    />
                    <TextField
                        label="Заметки"
                        fullWidth
                        margin="normal"
                        value={newRecord.notes || ''}
                        onChange={e => setNewRecord({ ...newRecord, notes: e.target.value })}
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
}

export default APappointment;
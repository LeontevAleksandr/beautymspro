import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, FormControl, InputLabel, Select, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, Divider } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import './APspecialization.css';

function APspecialization() {
    const [specializations, setSpecializations] = useState([]);
    const [qualifications, setQualifications] = useState([]);
    const [newSpecialization, setNewSpecialization] = useState({ name: '' });
    const [newQualification, setNewQualification] = useState({ 
        name: '', 
        priority: 1
    });
    const [editingSpecialization, setEditingSpecialization] = useState(null);
    const [editingQualification, setEditingQualification] = useState(null);
    const [openQualificationDialog, setOpenQualificationDialog] = useState(false);
    const [openSpecializationQualificationsDialog, setOpenSpecializationQualificationsDialog] = useState(false);
    const [selectedSpecialization, setSelectedSpecialization] = useState(null);
    const [specializationQualifications, setSpecializationQualifications] = useState([]);

    useEffect(() => {
        fetchSpecializations();
        fetchQualifications();
    }, []);

    const fetchSpecializations = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/specializations');
            const data = await response.json();
            setSpecializations(data);
        } catch (error) {
            console.error('Ошибка при получении специализаций:', error);
        }
    };

    const fetchQualifications = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/qualifications');
            const data = await response.json();
            // Сортируем квалификации по приоритету
            data.sort((a, b) => a.priority - b.priority);
            setQualifications(data);
        } catch (error) {
            console.error('Ошибка при получении квалификаций:', error);
        }
    };

    const fetchSpecializationQualifications = async (specializationId) => {
        try {
            // Здесь нужно использовать правильный эндпоинт для получения квалификаций специализации
            // Возможно, вам нужно создать новый эндпоинт в бэкенде или использовать существующий
            // Например, можно использовать фильтрацию на стороне клиента:
            const response = await fetch(`http://localhost:5000/api/specialization_qualifications`);
            const data = await response.json();
            // Фильтруем только те записи, которые относятся к выбранной специализации
            const filteredData = data.filter(item => item.specialization_id === specializationId);
            setSpecializationQualifications(filteredData);
        } catch (error) {
            console.error('Ошибка при получении квалификаций специализации:', error);
        }
    };

    const handleSpecializationChange = (e) => {
        setNewSpecialization({
            ...newSpecialization,
            [e.target.name]: e.target.value
        });
    };

    const handleQualificationChange = (e) => {
        setNewQualification({
            ...newQualification,
            [e.target.name]: e.target.value
        });
    };

    const handleAddSpecialization = async () => {
        if (!newSpecialization.name.trim()) return;
        
        try {
            const response = await fetch('http://localhost:5000/api/specializations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newSpecialization)
            });
            
            if (response.ok) {
                setNewSpecialization({ name: '' });
                fetchSpecializations();
            }
        } catch (error) {
            console.error('Ошибка при добавлении специализации:', error);
        }
    };

    const handleUpdateSpecialization = async () => {
        if (!editingSpecialization || !editingSpecialization.name.trim()) return;
        
        try {
            const response = await fetch(`http://localhost:5000/api/specializations/${editingSpecialization.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: editingSpecialization.name })
            });
            
            if (response.ok) {
                setEditingSpecialization(null);
                fetchSpecializations();
            }
        } catch (error) {
            console.error('Ошибка при обновлении специализации:', error);
        }
    };

    const handleDeleteSpecialization = async (id) => {
        if (!window.confirm('Вы уверены, что хотите удалить эту специализацию?')) return;
        
        try {
            const response = await fetch(`http://localhost:5000/api/specializations/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                fetchSpecializations();
            }
        } catch (error) {
            console.error('Ошибка при удалении специализации:', error);
        }
    };

    const handleAddQualification = async () => {
        if (!newQualification.name.trim()) return;
        
        try {
            const response = await fetch('http://localhost:5000/api/qualifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newQualification)
            });
            
            if (response.ok) {
                setNewQualification({ name: '', priority: 1 });
                fetchQualifications();
                setOpenQualificationDialog(false);
            }
        } catch (error) {
            console.error('Ошибка при добавлении квалификации:', error);
        }
    };

    const handleUpdateQualification = async () => {
        if (!editingQualification || !editingQualification.name.trim()) return;
        
        try {
            const response = await fetch(`http://localhost:5000/api/qualifications/${editingQualification.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: editingQualification.name,
                    priority: editingQualification.priority
                })
            });
            
            if (response.ok) {
                setEditingQualification(null);
                fetchQualifications();
                setOpenQualificationDialog(false);
            }
        } catch (error) {
            console.error('Ошибка при обновлении квалификации:', error);
        }
    };

    const handleDeleteQualification = async (id) => {
        if (!window.confirm('Вы уверены, что хотите удалить эту квалификацию?')) return;
        
        try {
            const response = await fetch(`http://localhost:5000/api/qualifications/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                fetchQualifications();
            }
        } catch (error) {
            console.error('Ошибка при удалении квалификации:', error);
        }
    };

    const handleMovePriority = async (qualificationId, direction) => {
        const qualification = qualifications.find(q => q.id === qualificationId);
        if (!qualification) return;
        
        const currentIndex = qualifications.findIndex(q => q.id === qualificationId);
        let targetIndex;
        
        if (direction === 'up' && currentIndex > 0) {
            targetIndex = currentIndex - 1;
        } else if (direction === 'down' && currentIndex < qualifications.length - 1) {
            targetIndex = currentIndex + 1;
        } else {
            return; // Нельзя переместить дальше
        }
        
        const targetQualification = qualifications[targetIndex];
        
        // Меняем приоритеты местами
        try {
            // Обновляем текущую квалификацию
            await fetch(`http://localhost:5000/api/qualifications/${qualification.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...qualification,
                    priority: targetQualification.priority
                })
            });
            
            // Обновляем целевую квалификацию
            await fetch(`http://localhost:5000/api/qualifications/${targetQualification.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...targetQualification,
                    priority: qualification.priority
                })
            });
            
            // Обновляем список квалификаций
            fetchQualifications();
        } catch (error) {
            console.error('Ошибка при изменении приоритета:', error);
        }
    };

    const handleOpenSpecializationQualifications = (specialization) => {
        setSelectedSpecialization(specialization);
        fetchSpecializationQualifications(specialization.id);
        setOpenSpecializationQualificationsDialog(true);
    };

    const handleAddQualificationToSpecialization = async (qualificationId) => {
        if (!selectedSpecialization) return;
        
        try {
            const response = await fetch(`http://localhost:5000/api/specialization_qualifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    specialization_id: selectedSpecialization.id,
                    qualification_id: qualificationId,
                    description: ''
                })
            });
            
            if (response.ok) {
                fetchSpecializationQualifications(selectedSpecialization.id);
            }
        } catch (error) {
            console.error('Ошибка при добавлении квалификации к специализации:', error);
        }
    };

    const handleRemoveQualificationFromSpecialization = async (qualificationId) => {
        if (!selectedSpecialization) return;
        
        try {
            const response = await fetch(`http://localhost:5000/api/specialization_qualifications/${selectedSpecialization.id}/${qualificationId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                fetchSpecializationQualifications(selectedSpecialization.id);
            }
        } catch (error) {
            console.error('Ошибка при удалении квалификации из специализации:', error);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Управление специализациями и квалификациями
            </Typography>
            
            {/* Секция специализаций */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Специализации
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                            label="Название специализации"
                            name="name"
                            value={newSpecialization.name}
                            onChange={handleSpecializationChange}
                            fullWidth
                        />
                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={handleAddSpecialization}
                            sx={{ minWidth: '150px' }}
                        >
                            Добавить
                        </Button>
                    </Box>
                </Box>
                
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Название</TableCell>
                                <TableCell>Действия</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {specializations.map((spec) => (
                                <TableRow key={spec.id}>
                                    <TableCell>
                                        {editingSpecialization && editingSpecialization.id === spec.id ? (
                                            <TextField
                                                value={editingSpecialization.name}
                                                onChange={(e) => setEditingSpecialization({
                                                    ...editingSpecialization,
                                                    name: e.target.value
                                                })}
                                                fullWidth
                                            />
                                        ) : (
                                            spec.name
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingSpecialization && editingSpecialization.id === spec.id ? (
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button 
                                                    size="small" 
                                                    variant="contained" 
                                                    color="primary" 
                                                    onClick={handleUpdateSpecialization}
                                                >
                                                    Сохранить
                                                </Button>
                                                <Button 
                                                    size="small" 
                                                    variant="outlined" 
                                                    onClick={() => setEditingSpecialization(null)}
                                                >
                                                    Отмена
                                                </Button>
                                            </Box>
                                        ) : (
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button 
                                                    size="small" 
                                                    variant="outlined" 
                                                    onClick={() => setEditingSpecialization(spec)}
                                                >
                                                    Изменить
                                                </Button>
                                                <Button 
                                                    size="small" 
                                                    variant="outlined" 
                                                    color="secondary"
                                                    onClick={() => handleOpenSpecializationQualifications(spec)}
                                                >
                                                    Квалификации
                                                </Button>
                                                <Button 
                                                    size="small" 
                                                    variant="outlined" 
                                                    color="error" 
                                                    onClick={() => handleDeleteSpecialization(spec.id)}
                                                >
                                                    Удалить
                                                </Button>
                                            </Box>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
            
            {/* Секция квалификаций */}
            <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                        Уровни квалификации
                    </Typography>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<AddIcon />}
                        onClick={() => {
                            setEditingQualification(null);
                            setNewQualification({ name: '', priority: 1 });
                            setOpenQualificationDialog(true);
                        }}
                    >
                        Добавить квалификацию
                    </Button>
                </Box>
                
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Приоритет</TableCell>
                                <TableCell>Название</TableCell>
                                <TableCell>Действия</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {qualifications.map((qual, index) => (
                                <TableRow key={qual.id}>
                                    <TableCell>{qual.priority}</TableCell>
                                    <TableCell>{qual.name}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <IconButton 
                                                size="small" 
                                                color="primary" 
                                                disabled={index === 0}
                                                onClick={() => handleMovePriority(qual.id, 'up')}
                                            >
                                                <ArrowUpwardIcon />
                                            </IconButton>
                                            <IconButton 
                                                size="small" 
                                                color="primary" 
                                                disabled={index === qualifications.length - 1}
                                                onClick={() => handleMovePriority(qual.id, 'down')}
                                            >
                                                <ArrowDownwardIcon />
                                            </IconButton>
                                            <IconButton 
                                                size="small" 
                                                color="primary" 
                                                onClick={() => {
                                                    setEditingQualification(qual);
                                                    setOpenQualificationDialog(true);
                                                }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton 
                                                size="small" 
                                                color="error" 
                                                onClick={() => handleDeleteQualification(qual.id)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
            
            {/* Диалог добавления/редактирования квалификации */}
            <Dialog open={openQualificationDialog} onClose={() => setOpenQualificationDialog(false)}>
                <DialogTitle>
                    {editingQualification ? 'Редактирование квалификации' : 'Добавление новой квалификации'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1, width: '400px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Название квалификации"
                            name="name"
                            value={editingQualification ? editingQualification.name : newQualification.name}
                            onChange={(e) => {
                                if (editingQualification) {
                                    setEditingQualification({
                                        ...editingQualification,
                                        name: e.target.value
                                    });
                                } else {
                                    handleQualificationChange(e);
                                }
                            }}
                            fullWidth
                        />
                        <TextField
                            label="Приоритет"
                            name="priority"
                            type="number"
                            value={editingQualification ? editingQualification.priority : newQualification.priority}
                            onChange={(e) => {
                                if (editingQualification) {
                                    setEditingQualification({
                                        ...editingQualification,
                                        priority: parseInt(e.target.value)
                                    });
                                } else {
                                    handleQualificationChange(e);
                                }
                            }}
                            fullWidth
                            InputProps={{ inputProps: { min: 1 } }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenQualificationDialog(false)}>Отмена</Button>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={editingQualification ? handleUpdateQualification : handleAddQualification}
                    >
                        {editingQualification ? 'Сохранить' : 'Добавить'}
                    </Button>
                </DialogActions>
            </Dialog>
            
            {/* Диалог управления квалификациями специализации */}
            <Dialog 
                open={openSpecializationQualificationsDialog} 
                onClose={() => setOpenSpecializationQualificationsDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {selectedSpecialization ? `Квалификации для специализации: ${selectedSpecialization.name}` : 'Квалификации специализации'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', gap: 2, height: '400px' }}>
                        {/* Список доступных квалификаций */}
                        <Box sx={{ flex: 1, border: '1px solid #ddd', borderRadius: '4px', overflow: 'auto' }}>
                            <Typography variant="subtitle1" sx={{ p: 1, bgcolor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                                Доступные квалификации
                            </Typography>
                            <List>
                                {qualifications
                                    .filter(qual => !specializationQualifications.some(sq => sq.id === qual.id))
                                    .map(qual => (
                                        <ListItem 
                                            key={qual.id}
                                            secondaryAction={
                                                <IconButton 
                                                    edge="end" 
                                                    onClick={() => handleAddQualificationToSpecialization(qual.id)}
                                                >
                                                    <AddIcon />
                                                </IconButton>
                                            }
                                        >
                                            <ListItemText 
                                                primary={qual.name} 
                                                secondary={`Приоритет: ${qual.priority}`} 
                                            />
                                        </ListItem>
                                    ))
                                }
                                {qualifications
                                    .filter(qual => !specializationQualifications.some(sq => sq.id === qual.id))
                                    .length === 0 && (
                                        <ListItem>
                                            <ListItemText primary="Нет доступных квалификаций" />
                                        </ListItem>
                                    )
                                }
                            </List>
                        </Box>
                        
                        {/* Список выбранных квалификаций */}
                        <Box sx={{ flex: 1, border: '1px solid #ddd', borderRadius: '4px', overflow: 'auto' }}>
                            <Typography variant="subtitle1" sx={{ p: 1, bgcolor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                                Выбранные квалификации
                            </Typography>
                            <List>
                                {specializationQualifications.map(qual => (
                                    <ListItem 
                                        key={qual.id}
                                        secondaryAction={
                                            <IconButton 
                                                edge="end" 
                                                color="error"
                                                onClick={() => handleRemoveQualificationFromSpecialization(qual.id)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        }
                                    >
                                        <ListItemText 
                                            primary={qual.name} 
                                            secondary={`Приоритет: ${qual.priority}`} 
                                        />
                                    </ListItem>
                                ))}
                                {specializationQualifications.length === 0 && (
                                    <ListItem>
                                        <ListItemText primary="Нет выбранных квалификаций" />
                                    </ListItem>
                                )}
                            </List>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenSpecializationQualificationsDialog(false)}>Закрыть</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default APspecialization;
import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, FormControl, InputLabel, Select, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, FormGroup, FormControlLabel } from '@mui/material';

function APspecialization() {
    const [specializations, setSpecializations] = useState([]);
    const [qualificationLevels, setQualificationLevels] = useState([]);
    const [newSpecialization, setNewSpecialization] = useState({ name: '' });
    const [newQualificationLevel, setNewQualificationLevel] = useState({ 
        name: '', 
        specialization_id: '',
        description: '' 
    });
    const [editingSpecialization, setEditingSpecialization] = useState(null);
    const [editingQualificationLevel, setEditingQualificationLevel] = useState(null);

    useEffect(() => {
        fetchSpecializations();
        fetchQualificationLevels();
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

    const fetchQualificationLevels = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/qualification_levels');
            const data = await response.json();
            setQualificationLevels(data);
        } catch (error) {
            console.error('Ошибка при получении уровней квалификации:', error);
        }
    };

    const handleSpecializationChange = (e) => {
        setNewSpecialization({
            ...newSpecialization,
            [e.target.name]: e.target.value
        });
    };

    const handleQualificationLevelChange = (e) => {
        setNewQualificationLevel({
            ...newQualificationLevel,
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
                // Также обновляем уровни квалификации, так как они могут быть связаны с удаленной специализацией
                fetchQualificationLevels();
            }
        } catch (error) {
            console.error('Ошибка при удалении специализации:', error);
        }
    };

    const handleAddQualificationLevel = async () => {
        if (!newQualificationLevel.name.trim() || !newQualificationLevel.specialization_id) return;
        
        try {
            const response = await fetch('http://localhost:5000/api/qualification_levels', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newQualificationLevel)
            });
            
            if (response.ok) {
                setNewQualificationLevel({ name: '', specialization_id: '', description: '' });
                fetchQualificationLevels();
            }
        } catch (error) {
            console.error('Ошибка при добавлении уровня квалификации:', error);
        }
    };

    const handleUpdateQualificationLevel = async () => {
        if (!editingQualificationLevel || !editingQualificationLevel.name.trim()) return;
        
        try {
            const response = await fetch(`http://localhost:5000/api/qualification_levels/${editingQualificationLevel.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: editingQualificationLevel.name,
                    specialization_id: editingQualificationLevel.specialization_id,
                    description: editingQualificationLevel.description
                })
            });
            
            if (response.ok) {
                setEditingQualificationLevel(null);
                fetchQualificationLevels();
            }
        } catch (error) {
            console.error('Ошибка при обновлении уровня квалификации:', error);
        }
    };

    const handleDeleteQualificationLevel = async (id) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот уровень квалификации?')) return;
        
        try {
            const response = await fetch(`http://localhost:5000/api/qualification_levels/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                fetchQualificationLevels();
            }
        } catch (error) {
            console.error('Ошибка при удалении уровня квалификации:', error);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Управление специализациями и уровнями квалификации
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
            
            {/* Секция уровней квалификации */}
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Уровни квалификации
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>Специализация</InputLabel>
                            <Select
                                name="specialization_id"
                                value={newQualificationLevel.specialization_id}
                                onChange={handleQualificationLevelChange}
                                label="Специализация"
                            >
                                {specializations.map((spec) => (
                                    <MenuItem key={spec.id} value={spec.id}>
                                        {spec.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        <TextField
                            label="Название уровня квалификации"
                            name="name"
                            value={newQualificationLevel.name}
                            onChange={handleQualificationLevelChange}
                            fullWidth
                        />
                        
                        <TextField
                            label="Описание"
                            name="description"
                            value={newQualificationLevel.description}
                            onChange={handleQualificationLevelChange}
                            multiline
                            rows={3}
                            fullWidth
                        />
                        
                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={handleAddQualificationLevel}
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            Добавить уровень квалификации
                        </Button>
                    </Box>
                </Box>
                
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Название</TableCell>
                                <TableCell>Специализация</TableCell>
                                <TableCell>Описание</TableCell>
                                <TableCell>Действия</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {qualificationLevels.map((level) => (
                                <TableRow key={level.id}>
                                    <TableCell>
                                        {editingQualificationLevel && editingQualificationLevel.id === level.id ? (
                                            <TextField
                                                value={editingQualificationLevel.name}
                                                onChange={(e) => setEditingQualificationLevel({
                                                    ...editingQualificationLevel,
                                                    name: e.target.value
                                                })}
                                                fullWidth
                                            />
                                        ) : (
                                            level.name
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingQualificationLevel && editingQualificationLevel.id === level.id ? (
                                            <FormControl fullWidth>
                                                <Select
                                                    value={editingQualificationLevel.specialization_id}
                                                    onChange={(e) => setEditingQualificationLevel({
                                                        ...editingQualificationLevel,
                                                        specialization_id: e.target.value
                                                    })}
                                                >
                                                    {specializations.map((spec) => (
                                                        <MenuItem key={spec.id} value={spec.id}>
                                                            {spec.name}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        ) : (
                                            specializations.find(s => s.id === level.specialization_id)?.name || '—'
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingQualificationLevel && editingQualificationLevel.id === level.id ? (
                                            <TextField
                                                value={editingQualificationLevel.description}
                                                onChange={(e) => setEditingQualificationLevel({
                                                    ...editingQualificationLevel,
                                                    description: e.target.value
                                                })}
                                                multiline
                                                rows={2}
                                                fullWidth
                                            />
                                        ) : (
                                            level.description || '—'
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingQualificationLevel && editingQualificationLevel.id === level.id ? (
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button 
                                                    size="small" 
                                                    variant="contained" 
                                                    color="primary" 
                                                    onClick={handleUpdateQualificationLevel}
                                                >
                                                    Сохранить
                                                </Button>
                                                <Button 
                                                    size="small" 
                                                    variant="outlined" 
                                                    onClick={() => setEditingQualificationLevel(null)}
                                                >
                                                    Отмена
                                                </Button>
                                            </Box>
                                        ) : (
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button 
                                                    size="small" 
                                                    variant="outlined" 
                                                    onClick={() => setEditingQualificationLevel(level)}
                                                >
                                                    Изменить
                                                </Button>
                                                <Button 
                                                    size="small" 
                                                    variant="outlined" 
                                                    color="error" 
                                                    onClick={() => handleDeleteQualificationLevel(level.id)}
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
        </Box>
    );
}

export default APspecialization;
import React, { useState, useEffect } from 'react';
import { 
    Box, Button, TextField, Typography,
    Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, Dialog, 
    DialogTitle, DialogContent, DialogActions, List, ListItem, 
    ListItemText, Stack
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BadgeIcon from '@mui/icons-material/Badge';
import SchoolIcon from '@mui/icons-material/School';
import ViewListIcon from '@mui/icons-material/ViewList';
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
        <Box sx={{ 
            p: 3, 
            backgroundColor: '#fafafa',
            minHeight: '100vh'
        }}>
            {/* ============ ЗАГОЛОВОК ============ */}
            <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                justifyContent="space-between" 
                alignItems={{ xs: 'stretch', sm: 'center' }}
                spacing={2}
                sx={{ mb: 3 }}
            >
                <Box>
                    <Typography 
                        variant="h5" 
                        sx={{ 
                            fontWeight: 500,
                            color: '#1a1a1a',
                            mb: 0.5
                        }}
                    >
                        Управление специализациями
                    </Typography>
                    <Typography 
                        variant="body2" 
                        sx={{ color: '#666' }}
                    >
                        Настройка специализаций и уровней квалификации для сотрудников салона
                        {specializations.length > 0 && (
                            <Box component="span" sx={{ ml: 2 }}>
                                • Всего специализаций: {specializations.length} 
                                • Уровней квалификации: {qualifications.length}
                            </Box>
                        )}
                    </Typography>
                </Box>
            </Stack>
            
            {/* ============ СЕКЦИЯ СПЕЦИАЛИЗАЦИЙ ============ */}
            <Paper sx={{ 
                p: 2, 
                mb: 3, 
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)', 
                borderRadius: 3,
                border: '1px solid #e0e0e0' 
            }}>
                <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    justifyContent="space-between" 
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    spacing={2}
                    sx={{ mb: 2 }}
                >
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <BadgeIcon sx={{ fontSize: 20, color: '#666' }} />
                        <Typography 
                            variant="h6" 
                            sx={{ 
                                fontWeight: 500,
                                color: '#424242'
                            }}
                        >
                            Специализации
                        </Typography>
                    </Stack>
                </Stack>
                
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                            label="Название специализации"
                            name="name"
                            value={newSpecialization.name}
                            onChange={handleSpecializationChange}
                            fullWidth
                            size="small"
                            sx={{ 
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                }
                            }}
                        />
                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={handleAddSpecialization}
                            startIcon={<AddIcon />}
                            sx={{ 
                                minWidth: '160px',
                                borderRadius: 2, 
                                textTransform: 'none',
                                backgroundColor: '#1976d2',
                                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)'
                            }}
                        >
                            Добавить
                        </Button>
                    </Box>
                </Box>
                
                <TableContainer sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
                    <Table size="small">
                        <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                            <TableRow>
                                <TableCell 
                                    sx={{ 
                                        fontWeight: 600, 
                                        color: '#424242',
                                        borderBottom: '1px solid #e0e0e0',
                                        py: 2,
                                        width: '50%'
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <BadgeIcon sx={{ fontSize: 18, color: '#666' }} />
                                        <span>Название</span>
                                    </Stack>
                                </TableCell>
                                <TableCell 
                                    sx={{ 
                                        fontWeight: 600, 
                                        color: '#424242',
                                        borderBottom: '1px solid #e0e0e0',
                                        py: 2,
                                        width: '50%'
                                    }}
                                >
                                    Действия
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {specializations.map((spec) => (
                                <TableRow key={spec.id} sx={{ 
                                    '&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
                                    '&:hover': { backgroundColor: '#f5f5f5' }
                                }}>
                                    <TableCell sx={{ py: 1.5 }}>
                                        {editingSpecialization && editingSpecialization.id === spec.id ? (
                                            <TextField
                                                value={editingSpecialization.name}
                                                onChange={(e) => setEditingSpecialization({
                                                    ...editingSpecialization,
                                                    name: e.target.value
                                                })}
                                                size="small"
                                                fullWidth
                                                sx={{ 
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 2
                                                    }
                                                }}
                                            />
                                        ) : (
                                            spec.name
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ py: 1.5 }}>
                                        {editingSpecialization && editingSpecialization.id === spec.id ? (
                                            <Stack direction="row" spacing={1}>
                                                <Button 
                                                    size="small" 
                                                    variant="contained" 
                                                    color="primary" 
                                                    onClick={handleUpdateSpecialization}
                                                    sx={{ 
                                                        borderRadius: 2, 
                                                        textTransform: 'none',
                                                        boxShadow: 'none'
                                                    }}
                                                >
                                                    Сохранить
                                                </Button>
                                                <Button 
                                                    size="small" 
                                                    variant="outlined" 
                                                    onClick={() => setEditingSpecialization(null)}
                                                    sx={{ 
                                                        borderRadius: 2, 
                                                        textTransform: 'none'
                                                    }}
                                                >
                                                    Отмена
                                                </Button>
                                            </Stack>
                                        ) : (
                                            <Stack direction="row" spacing={1}>
                                                <Button 
                                                    size="small" 
                                                    variant="outlined" 
                                                    onClick={() => setEditingSpecialization(spec)}
                                                    startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                                                    sx={{ 
                                                        borderRadius: 2, 
                                                        textTransform: 'none',
                                                        borderColor: '#1976d2',
                                                        color: '#1976d2'
                                                    }}
                                                >
                                                    Изменить
                                                </Button>
                                                <Button 
                                                    size="small" 
                                                    variant="outlined" 
                                                    color="secondary"
                                                    onClick={() => handleOpenSpecializationQualifications(spec)}
                                                    startIcon={<ViewListIcon sx={{ fontSize: 16 }} />}
                                                    sx={{ 
                                                        borderRadius: 2, 
                                                        textTransform: 'none',
                                                        borderColor: '#673ab7',
                                                        color: '#673ab7'
                                                    }}
                                                >
                                                    Квалификации
                                                </Button>
                                                <Button 
                                                    size="small" 
                                                    variant="outlined" 
                                                    color="error" 
                                                    onClick={() => handleDeleteSpecialization(spec.id)}
                                                    startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
                                                    sx={{ 
                                                        borderRadius: 2, 
                                                        textTransform: 'none'
                                                    }}
                                                >
                                                    Удалить
                                                </Button>
                                            </Stack>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
            
            {/* ============ СЕКЦИЯ КВАЛИФИКАЦИЙ ============ */}
            <Paper sx={{ 
                p: 2, 
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)', 
                borderRadius: 3,
                border: '1px solid #e0e0e0' 
            }}>
                <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    justifyContent="space-between" 
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    spacing={2}
                    sx={{ mb: 2 }}
                >
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <SchoolIcon sx={{ fontSize: 20, color: '#666' }} />
                        <Typography 
                            variant="h6" 
                            sx={{ 
                                fontWeight: 500,
                                color: '#424242'
                            }}
                        >
                            Уровни квалификации
                        </Typography>
                    </Stack>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<AddIcon />}
                        onClick={() => {
                            setEditingQualification(null);
                            setNewQualification({ name: '', priority: 1 });
                            setOpenQualificationDialog(true);
                        }}
                        sx={{ 
                            minWidth: '220px',
                            borderRadius: 2, 
                            textTransform: 'none',
                            backgroundColor: '#1976d2',
                            boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)'
                        }}
                    >
                        Добавить квалификацию
                    </Button>
                </Stack>
                
                <TableContainer sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
                    <Table size="small">
                        <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                            <TableRow>
                                <TableCell 
                                    sx={{ 
                                        fontWeight: 600, 
                                        color: '#424242',
                                        borderBottom: '1px solid #e0e0e0',
                                        py: 2,
                                        width: '15%'
                                    }}
                                >
                                    Приоритет
                                </TableCell>
                                <TableCell 
                                    sx={{ 
                                        fontWeight: 600, 
                                        color: '#424242',
                                        borderBottom: '1px solid #e0e0e0',
                                        py: 2,
                                        width: '35%'
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <SchoolIcon sx={{ fontSize: 18, color: '#666' }} />
                                        <span>Название</span>
                                    </Stack>
                                </TableCell>
                                <TableCell 
                                    sx={{ 
                                        fontWeight: 600, 
                                        color: '#424242',
                                        borderBottom: '1px solid #e0e0e0',
                                        py: 2,
                                        width: '50%'
                                    }}
                                >
                                    Действия
                                </TableCell>
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
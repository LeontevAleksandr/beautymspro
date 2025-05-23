import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, Button, Paper, TextField, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, Select, MenuItem, Checkbox,
  Stack, Divider
} from '@mui/material';
import { Edit, Delete, Add, LocalOffer, Category, Timer, AttachMoney } from '@mui/icons-material';

const APservice = () => {
  const [services, setServices] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [availableQualifications, setAvailableQualifications] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    specialization_id: '',
    base_price: '',
    duration: '',
    qualification_prices: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceQualifications, setServiceQualifications] = useState([]);

  useEffect(() => {
    fetchServices();
    fetchSpecializations();
    fetchQualifications();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/services');
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Ошибка при получении услуг:', error);
    }
  };

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
      data.sort((a, b) => a.priority - b.priority);
      setQualifications(data);
    } catch (error) {
      console.error('Ошибка при получении квалификаций:', error);
    }
  };

  // Получение квалификаций для выбранной специализации
  const fetchQualificationsBySpecialization = async (specializationId) => {
    if (!specializationId) {
      setAvailableQualifications([]);
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/specialization_qualifications`);
      if (response.ok) {
        const data = await response.json();
        // Фильтруем только те записи, которые относятся к выбранной специализации
        const filteredData = data.filter(item => item.specialization_id === parseInt(specializationId));
        
        // Получаем полные данные о квалификациях
        const qualIds = filteredData.map(item => item.qualification_id);
        const availableQuals = qualifications.filter(q => qualIds.includes(q.id));
        setAvailableQualifications(availableQuals);
      } else {
        console.warn('Ошибка при получении квалификаций для специализации');
        setAvailableQualifications(qualifications);
      }
    } catch (error) {
      console.error('Ошибка при получении квалификаций для специализации:', error);
      setAvailableQualifications(qualifications);
    }
  };

  // Получение квалификаций для выбранной услуги
  const fetchServiceQualifications = async (serviceId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/service_qualifications`);
      if (response.ok) {
        const data = await response.json();
        // Фильтруем только те записи, которые относятся к выбранной услуге
        const filteredData = data.filter(item => item.service_id === serviceId);
        setServiceQualifications(filteredData);
      }
    } catch (error) {
      console.error('Ошибка при получении квалификаций услуги:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Если изменилась специализация, обновляем доступные квалификации
    if (name === 'specialization_id') {
      fetchQualificationsBySpecialization(value);
      // Очищаем выбранные квалификации при смене специализации
      setFormData({
        ...formData,
        [name]: value,
        qualification_prices: []
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleQualificationPriceChange = (qualificationId, price) => {
    const updatedPrices = [...formData.qualification_prices];
    const existingIndex = updatedPrices.findIndex(item => item.qualification_id === qualificationId);
    
    if (price === '') {
      // Если цена пустая, удаляем квалификацию из списка
      if (existingIndex !== -1) {
        updatedPrices.splice(existingIndex, 1);
      }
    } else {
      // Иначе обновляем или добавляем
      const priceValue = parseFloat(price);
      if (existingIndex !== -1) {
        updatedPrices[existingIndex] = {
          qualification_id: qualificationId,
          price: priceValue,
          is_allowed: true
        };
      } else {
        updatedPrices.push({
          qualification_id: qualificationId,
          price: priceValue,
          is_allowed: true
        });
      }
    }
    
    setFormData({
      ...formData,
      qualification_prices: updatedPrices
    });
  };

  const isQualificationIncluded = (qualificationPrices, qualificationId) => {
    return qualificationPrices.some(item => item.qualification_id === qualificationId);
  };

  const getPriceForQualification = (qualificationPrices, qualificationId) => {
    const item = qualificationPrices.find(item => item.qualification_id === qualificationId);
    return item ? item.price : '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const serviceData = {
      name: formData.name,
      specialization_id: parseInt(formData.specialization_id),
      base_price: parseFloat(formData.base_price),
      duration: parseInt(formData.duration)
    };
    
    try {
      let serviceResponse;
      
      if (isEditing) {
        // Обновление услуги
        serviceResponse = await fetch(`http://localhost:5000/api/services/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(serviceData)
        });
      } else {
        // Создание новой услуги
        serviceResponse = await fetch('http://localhost:5000/api/services', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(serviceData)
        });
      }
      
      if (serviceResponse.ok) {
        const responseData = await serviceResponse.json();
        const serviceId = responseData.id || editingId;
        
        // Обрабатываем квалификации только если они выбраны
        if (formData.qualification_prices && formData.qualification_prices.length > 0) {
          // Сначала удаляем существующие связи для этой услуги
          if (isEditing) {
            await fetch(`http://localhost:5000/api/service_qualifications/${serviceId}`, {
              method: 'DELETE'
            });
          }
          
          // Затем добавляем новые связи
          for (const qualPrice of formData.qualification_prices) {
            await fetch('http://localhost:5000/api/service_qualifications', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                service_id: serviceId,
                qualification_id: qualPrice.qualification_id,
                price_modified: qualPrice.price
              })
            });
          }
        }
        
        // Сбрасываем форму и обновляем список услуг
        resetForm();
        fetchServices();
      }
    } catch (error) {
      console.error('Ошибка при сохранении услуги:', error);
    }
  };

  const handleEdit = async (service) => {
    setIsEditing(true);
    setEditingId(service.id);
    
    // Получаем квалификации для выбранной специализации
    await fetchQualificationsBySpecialization(service.specialization_id);
    
    // Получаем квалификации для выбранной услуги
    await fetchServiceQualifications(service.id);
    
    // Формируем массив qualification_prices на основе полученных данных
    const qualificationPrices = serviceQualifications.map(sq => ({
      qualification_id: sq.qualification_id,
      price: sq.price_modified,
      is_allowed: sq.is_allowed
    }));
    
    setFormData({
      name: service.name,
      specialization_id: service.specialization_id,
      base_price: service.base_price,
      duration: service.duration,
      qualification_prices: qualificationPrices
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту услугу?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/services/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchServices();
      }
    } catch (error) {
      console.error('Ошибка при удалении услуги:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      specialization_id: '',
      base_price: '',
      duration: '',
      qualification_prices: []
    });
    setIsEditing(false);
    setEditingId(null);
    setAvailableQualifications([]);
  };

  const handleOpenQualifications = (service) => {
    setSelectedService(service);
    fetchServiceQualifications(service.id);
    setOpenDialog(true);
  };

  const getQualificationName = (id) => {
    const qual = qualifications.find(q => q.id === id);
    return qual ? qual.name : `Квалификация ${id}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* ============ ЗАГОЛОВОК И ПАНЕЛЬ УПРАВЛЕНИЯ ============ */}
      <Stack direction="column" spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 500, color: '#1a1a1a' }}>
          Управление услугами
        </Typography>
        <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
          Добавляйте, редактируйте и управляйте услугами вашего салона
        </Typography>
      </Stack>
      
      {/* ============ ФОРМА ДОБАВЛЕНИЯ/РЕДАКТИРОВАНИЯ ============ */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 3, 
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', 
          border: '1px solid #e0e0e0' 
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, color: '#1a1a1a', mb: 2 }}>
          {isEditing ? 'Редактирование услуги' : 'Добавление новой услуги'}
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            {/* Основная информация */}
            <Stack spacing={2}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  color: '#424242',
                  fontWeight: 500,
                  mb: 1
                }}
              >
                Основная информация
              </Typography>
              
              <TextField
                label="Название услуги"
                name="name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                required
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              
              <FormControl 
                fullWidth 
                required
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              >
                <InputLabel>Специализация</InputLabel>
                <Select
                  name="specialization_id"
                  value={formData.specialization_id}
                  onChange={handleChange}
                  label="Специализация"
                >
                  {specializations.map((spec) => (
                    <MenuItem key={spec.id} value={spec.id}>
                      {spec.name}
                    </MenuItem>
                  ))}
                </Select>
                <Typography variant="caption" sx={{ mt: 0.5, ml: 1.5, color: '#666' }}>
                  Выберите специализацию из списка
                </Typography>
              </FormControl>
            </Stack>
            
            <Divider sx={{ my: 1 }} />
            
            {/* Параметры услуги */}
            <Stack spacing={2}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  color: '#424242',
                  fontWeight: 500,
                  mb: 1
                }}
              >
                Параметры услуги
              </Typography>
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Базовая цена"
                  name="base_price"
                  type="number"
                  value={formData.base_price}
                  onChange={handleChange}
                  fullWidth
                  required
                  InputProps={{ 
                    inputProps: { min: 0, step: 50 },
                    startAdornment: <AttachMoney sx={{ color: '#666', fontSize: 18, mr: 0.5 }} />
                  }}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
                
                <TextField
                  label="Длительность (мин)"
                  name="duration"
                  type="number"
                  value={formData.duration}
                  onChange={handleChange}
                  fullWidth
                  required
                  InputProps={{ 
                    inputProps: { min: 0, step: 5 },
                    startAdornment: <Timer sx={{ color: '#666', fontSize: 18, mr: 0.5 }} />
                  }}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Stack>
            </Stack>
            
            <Divider sx={{ my: 1 }} />
            
            {/* Уровни квалификации */}
            <FormControl fullWidth>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  color: '#424242',
                  fontWeight: 500,
                  mb: 2
                }}
              >
                Уровни квалификации и цены
              </Typography>
              
              <TableContainer 
                component={Paper} 
                sx={{ 
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)', 
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  overflow: 'hidden',
                  mb: 2
                }}
              >
                <Table size="small">
                  <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                    <TableRow>
                      <TableCell 
                        sx={{ 
                          fontWeight: 600, 
                          color: '#424242',
                          borderBottom: '1px solid #e0e0e0',
                          py: 1.5
                        }}
                      >
                        Уровень квалификации
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          fontWeight: 600, 
                          color: '#424242',
                          borderBottom: '1px solid #e0e0e0',
                          py: 1.5,
                          width: '120px'
                        }}
                      >
                        Включить
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          fontWeight: 600, 
                          color: '#424242',
                          borderBottom: '1px solid #e0e0e0',
                          py: 1.5,
                          width: '180px'
                        }}
                      >
                        Цена
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(availableQualifications.length > 0 ? availableQualifications : []).map((qual) => {
                      const isIncluded = isQualificationIncluded(formData.qualification_prices, qual.id);
                      const price = getPriceForQualification(formData.qualification_prices, qual.id) || '';
                      
                      return (
                        <TableRow 
                          key={qual.id}
                          hover
                          sx={{
                            '&:hover': {
                              backgroundColor: '#f5f7fa'
                            }
                          }}
                        >
                          <TableCell 
                            sx={{ 
                              py: 1.5,
                              borderBottom: '1px solid #f0f0f0'
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {qual.name}
                            </Typography>
                          </TableCell>
                          <TableCell 
                            sx={{ 
                              py: 1.5,
                              borderBottom: '1px solid #f0f0f0'
                            }}
                          >
                            <Checkbox
                              checked={isIncluded}
                              onChange={(e) => {
                                if (e.target.checked && !isIncluded) {
                                  handleQualificationPriceChange(qual.id, formData.base_price || 0);
                                } else if (!e.target.checked && isIncluded) {
                                  handleQualificationPriceChange(qual.id, '');
                                }
                              }}
                              disabled={!formData.specialization_id}
                              size="small"
                              sx={{
                                color: '#bbbbbb',
                                '&.Mui-checked': {
                                  color: '#1976d2',
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell 
                            sx={{ 
                              py: 1.5,
                              borderBottom: '1px solid #f0f0f0'
                            }}
                          >
                            <TextField
                              type="number"
                              size="small"
                              value={price}
                              onChange={(e) => handleQualificationPriceChange(qual.id, e.target.value)}
                              disabled={!isIncluded || !formData.specialization_id}
                              InputProps={{ 
                                inputProps: { min: 0, step: 50 },
                                sx: { borderRadius: 1.5 }
                              }}
                              sx={{ width: '150px' }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {availableQualifications.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 3, color: '#666' }}>
                          {!formData.specialization_id 
                            ? "Выберите специализацию, чтобы увидеть доступные квалификации" 
                            : "Для выбранной специализации не найдено квалификаций"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {!formData.specialization_id && (
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                  Выберите специализацию, чтобы увидеть доступные квалификации
                </Typography>
              )}
              {formData.specialization_id && availableQualifications.length === 0 && (
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                  Для выбранной специализации не найдено квалификаций. Добавьте их в разделе "Специализации"
                </Typography>
              )}
            </FormControl>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={isEditing ? <Edit /> : <Add />}
                disabled={!formData.name || !formData.specialization_id || !formData.base_price || !formData.duration}
                sx={{ 
                  borderRadius: 2, 
                  textTransform: 'none',
                  backgroundColor: '#1976d2',
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)',
                  minWidth: 160,
                  '&:hover': {
                    backgroundColor: '#1565c0',
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.35)'
                  }
                }}
              >
                {isEditing ? 'Сохранить изменения' : 'Добавить услугу'}
              </Button>
              
              {isEditing && (
                <Button
                  variant="outlined"
                  onClick={resetForm}
                  sx={{ 
                    borderRadius: 2, 
                    textTransform: 'none',
                    borderColor: '#e0e0e0',
                    color: '#666',
                    '&:hover': {
                      borderColor: '#bdbdbd',
                      backgroundColor: '#f5f5f5'
                    }
                  }}
                >
                  Отмена
                </Button>
              )}
            </Box>
          </Stack>
        </Box>
      </Paper>
      
      {/* ============ СПИСОК УСЛУГ ============ */}
      <Stack direction="column" spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 500, color: '#1a1a1a' }}>
          Список услуг
        </Typography>
        <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
          Все доступные услуги вашего салона
        </Typography>
      </Stack>
      
      <TableContainer 
        component={Paper} 
        sx={{ 
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', 
          borderRadius: 3,
          border: '1px solid #e0e0e0',
          overflow: 'hidden'
        }}
      >
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
            <TableRow>
              <TableCell 
                sx={{ 
                  fontWeight: 600, 
                  color: '#424242',
                  borderBottom: '1px solid #e0e0e0',
                  py: 2,
                  width: '25%'
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <LocalOffer sx={{ fontSize: 18, color: '#666' }} />
                  <span>Название</span>
                </Stack>
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 600, 
                  color: '#424242',
                  borderBottom: '1px solid #e0e0e0',
                  py: 2,
                  width: '20%'
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Category sx={{ fontSize: 18, color: '#666' }} />
                  <span>Специализация</span>
                </Stack>
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 600, 
                  color: '#424242',
                  borderBottom: '1px solid #e0e0e0',
                  py: 2,
                  width: '15%'
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <AttachMoney sx={{ fontSize: 18, color: '#666' }} />
                  <span>Базовая цена</span>
                </Stack>
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 600, 
                  color: '#424242',
                  borderBottom: '1px solid #e0e0e0',
                  py: 2,
                  width: '15%'
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Timer sx={{ fontSize: 18, color: '#666' }} />
                  <span>Длительность</span>
                </Stack>
              </TableCell>
              <TableCell 
                align="center"
                sx={{ 
                  fontWeight: 600, 
                  color: '#424242',
                  borderBottom: '1px solid #e0e0e0',
                  py: 2,
                  width: '25%'
                }}
              >
                Действия
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {services.length > 0 ? (
              services.map((service, index) => (
                <TableRow 
                  key={service.id} 
                  hover
                  sx={{
                    '&:hover': {
                      backgroundColor: '#f5f7fa'
                    },
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafbfc',
                    borderLeft: '4px solid transparent',
                    '&:hover': {
                      backgroundColor: '#f5f7fa',
                      borderLeft: '4px solid #e3f2fd'
                    }
                  }}
                >
                  <TableCell 
                    sx={{ 
                      py: 2,
                      borderBottom: '1px solid #f0f0f0',
                      pl: 3
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500,
                        color: '#1a1a1a'
                      }}
                    >
                      {service.name}
                    </Typography>
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      py: 2,
                      borderBottom: '1px solid #f0f0f0'
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#424242'
                      }}
                    >
                      {service.specialization ? service.specialization.name : 'Не указана'}
                    </Typography>
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      py: 2,
                      borderBottom: '1px solid #f0f0f0'
                    }}
                  >
                    <Box 
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        backgroundColor: '#e8f5e8',
                        color: '#2e7d32',
                        borderRadius: '8px',
                        px: 1.5,
                        py: 0.5,
                        fontSize: '0.875rem',
                        fontWeight: 500
                      }}
                    >
                      {service.base_price} ₽
                    </Box>
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      py: 2,
                      borderBottom: '1px solid #f0f0f0'
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ color: '#424242' }}
                    >
                      {service.duration} мин
                    </Typography>
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ 
                      py: 2,
                      borderBottom: '1px solid #f0f0f0'
                    }}
                  >
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => handleEdit(service)}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          borderColor: '#e0e0e0',
                          color: '#1976d2',
                          '&:hover': {
                            backgroundColor: 'rgba(25, 118, 210, 0.08)',
                            borderColor: '#1976d2'
                          }
                        }}
                      >
                        Изменить
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenQualifications(service)}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          borderColor: '#e0e0e0',
                          color: '#9c27b0',
                          '&:hover': {
                            backgroundColor: 'rgba(156, 39, 176, 0.08)',
                            borderColor: '#9c27b0'
                          }
                        }}
                      >
                        Квалификации
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Delete />}
                        onClick={() => handleDelete(service.id)}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          borderColor: '#e0e0e0',
                          color: '#d32f2f',
                          '&:hover': {
                            backgroundColor: 'rgba(211, 47, 47, 0.08)',
                            borderColor: '#d32f2f'
                          }
                        }}
                      >
                        Удалить
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell 
                  colSpan={5} 
                  align="center"
                  sx={{ 
                    py: 6,
                    color: '#666'
                  }}
                >
                  <Typography variant="body2">
                    Нет данных
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* ============ ДИАЛОГ ПРОСМОТРА КВАЛИФИКАЦИЙ ============ */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            borderBottom: '1px solid #e0e0e0', 
            pb: 2,
            fontWeight: 500
          }}
        >
          Квалификации для услуги: {selectedService?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TableContainer 
            sx={{ 
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)', 
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              overflow: 'hidden'
            }}
          >
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                <TableRow>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      color: '#424242',
                      borderBottom: '1px solid #e0e0e0',
                      py: 1.5
                    }}
                  >
                    Квалификация
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      color: '#424242',
                      borderBottom: '1px solid #e0e0e0',
                      py: 1.5
                    }}
                  >
                    Цена
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      color: '#424242',
                      borderBottom: '1px solid #e0e0e0',
                      py: 1.5
                    }}
                  >
                    Разрешена
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {serviceQualifications.map((sq) => (
                  <TableRow 
                    key={sq.qualification_id}
                    hover
                    sx={{
                      '&:hover': {
                        backgroundColor: '#f5f7fa'
                      }
                    }}
                  >
                    <TableCell 
                      sx={{ 
                        py: 1.5,
                        borderBottom: '1px solid #f0f0f0'
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {getQualificationName(sq.qualification_id)}
                      </Typography>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        py: 1.5,
                        borderBottom: '1px solid #f0f0f0'
                      }}
                    >
                      <Box 
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          backgroundColor: '#e8f5e8',
                          color: '#2e7d32',
                          borderRadius: '8px',
                          px: 1.5,
                          py: 0.5,
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}
                      >
                        {sq.price_modified} ₽
                      </Box>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        py: 1.5,
                        borderBottom: '1px solid #f0f0f0'
                      }}
                    >
                      <Box 
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          backgroundColor: sq.is_allowed ? '#e3f2fd' : '#ffebee',
                          color: sq.is_allowed ? '#1976d2' : '#d32f2f',
                          borderRadius: '8px',
                          px: 1.5,
                          py: 0.5,
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}
                      >
                        {sq.is_allowed ? 'Да' : 'Нет'}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {serviceQualifications.length === 0 && (
                  <TableRow>
                    <TableCell 
                      colSpan={3} 
                      align="center"
                      sx={{ 
                        py: 3,
                        color: '#666'
                      }}
                    >
                      <Typography variant="body2">
                        Нет доступных квалификаций для этой услуги
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions 
          sx={{ 
            borderTop: '1px solid #e0e0e0', 
            p: 2.5
          }}
        >
          <Button 
            onClick={() => setOpenDialog(false)}
            sx={{ 
              textTransform: 'none',
              borderRadius: 2,
              px: 3
            }}
          >
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default APservice;
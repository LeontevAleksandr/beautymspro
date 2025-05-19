import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, FormControl, InputLabel, Select, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, FormControlLabel, FormGroup, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

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
      <Typography variant="h5" gutterBottom>
        {isEditing ? 'Редактирование услуги' : 'Добавление новой услуги'}
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Название услуги"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
          />
          
          <FormControl fullWidth required>
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
          </FormControl>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Базовая цена"
              name="base_price"
              type="number"
              value={formData.base_price}
              onChange={handleChange}
              fullWidth
              required
              InputProps={{ inputProps: { min: 0, step: 50 } }}
            />
            
            <TextField
              label="Длительность (мин)"
              name="duration"
              type="number"
              value={formData.duration}
              onChange={handleChange}
              fullWidth
              required
              InputProps={{ inputProps: { min: 0, step: 5 } }}
            />
          </Box>
          
          <FormControl fullWidth>
            <Typography variant="subtitle1" gutterBottom>
              Уровни квалификации и цены
            </Typography>
            <TableContainer component={Paper} sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Уровень квалификации</TableCell>
                    <TableCell>Включить</TableCell>
                    <TableCell>Цена</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(availableQualifications.length > 0 ? availableQualifications : []).map((qual) => {
                    const isIncluded = isQualificationIncluded(formData.qualification_prices, qual.id);
                    const price = getPriceForQualification(formData.qualification_prices, qual.id) || '';
                    
                    return (
                      <TableRow key={qual.id}>
                        <TableCell>{qual.name}</TableCell>
                        <TableCell>
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
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={price}
                            onChange={(e) => handleQualificationPriceChange(qual.id, e.target.value)}
                            disabled={!isIncluded || !formData.specialization_id}
                            InputProps={{ inputProps: { min: 0, step: 50 } }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
              color="primary"
              disabled={!formData.name || !formData.specialization_id || !formData.base_price || !formData.duration}
            >
              {isEditing ? 'Сохранить изменения' : 'Добавить услугу'}
            </Button>
            
            {isEditing && (
              <Button
                variant="outlined"
                onClick={resetForm}
              >
                Отмена
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
      
      <Typography variant="h6" gutterBottom>
        Список услуг
      </Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>Специализация</TableCell>
              <TableCell>Базовая цена</TableCell>
              <TableCell>Длительность (мин)</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell>{service.name}</TableCell>
                <TableCell>{service.specialization ? service.specialization.name : 'Не указана'}</TableCell>
                <TableCell>{service.base_price}</TableCell>
                <TableCell>{service.duration}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => handleEdit(service)}
                    >
                      Изменить
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="secondary"
                      onClick={() => handleOpenQualifications(service)}
                    >
                      Квалификации
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDelete(service.id)}
                    >
                      Удалить
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Диалог для просмотра квалификаций услуги */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Квалификации для услуги: {selectedService?.name}
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Квалификация</TableCell>
                  <TableCell>Цена</TableCell>
                  <TableCell>Разрешена</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {serviceQualifications.map((sq) => (
                  <TableRow key={sq.qualification_id}>
                    <TableCell>{getQualificationName(sq.qualification_id)}</TableCell>
                    <TableCell>{sq.price_modified}</TableCell>
                    <TableCell>{sq.is_allowed ? 'Да' : 'Нет'}</TableCell>
                  </TableRow>
                ))}
                {serviceQualifications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      Нет доступных квалификаций для этой услуги
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default APservice;
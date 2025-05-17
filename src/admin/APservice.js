import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, FormControl, InputLabel, Select, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, FormControlLabel, FormGroup } from '@mui/material';

const APservice = () => {
  const [services, setServices] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    specialization_id: '',
    qualification_level_ids: [],
    duration: '',
    price: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

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
      const response = await fetch('http://localhost:5000/api/qualification_levels');
      const data = await response.json();
      setQualifications(data);
    } catch (error) {
      console.error('Ошибка при получении квалификаций:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleQualificationChange = (qualId) => {
    const currentQualifications = [...formData.qualification_level_ids];
    const index = currentQualifications.indexOf(qualId);
    
    if (index === -1) {
      // Добавляем квалификацию
      currentQualifications.push(qualId);
    } else {
      // Удаляем квалификацию
      currentQualifications.splice(index, 1);
    }
    
    setFormData({
      ...formData,
      qualification_level_ids: currentQualifications
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Подготовка данных для отправки
    const serviceData = {
      name: formData.name,
      specialization_id: formData.specialization_id,
      qualification_level_ids: formData.qualification_level_ids,
      duration: parseInt(formData.duration),
      price: parseFloat(formData.price)
    };
    
    try {
      if (isEditing) {
        await fetch(`http://localhost:5000/api/services/${editId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(serviceData)
        });
      } else {
        await fetch('http://localhost:5000/api/services', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(serviceData)
        });
      }
      resetForm();
      fetchServices();
    } catch (error) {
      console.error('Ошибка при сохранении услуги:', error);
    }
  };

  const handleEdit = (service) => {
    setIsEditing(true);
    setEditId(service.id);
    
    // Преобразуем qualification_level_ids в массив, если это строка или число
    let qualificationIds = service.qualification_level_ids || [];
    if (!Array.isArray(qualificationIds)) {
      qualificationIds = qualificationIds ? [qualificationIds] : [];
    }
    
    setFormData({
      name: service.name,
      specialization_id: service.specialization_id,
      qualification_level_ids: qualificationIds,
      duration: service.duration,
      price: service.price
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту услугу?')) {
      try {
        await fetch(`http://localhost:5000/api/services/${id}`, {
          method: 'DELETE'
        });
        fetchServices();
      } catch (error) {
        console.error('Ошибка при удалении услуги:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      specialization_id: '',
      qualification_level_ids: [],
      duration: '',
      price: ''
    });
    setIsEditing(false);
    setEditId(null);
  };

  // Получение названия специализации по ID
  const getSpecializationName = (specId) => {
    const spec = specializations.find(s => s.id === specId);
    return spec ? spec.name : '—';
  };

  // Получение названий квалификаций по массиву ID
  const getQualificationNames = (qualIds) => {
    if (!qualIds || qualIds.length === 0) return '—';
    
    // Преобразуем в массив, если это не массив
    const idsArray = Array.isArray(qualIds) ? qualIds : [qualIds];
    
    return idsArray
      .map(id => {
        const qual = qualifications.find(q => q.id === id);
        return qual ? qual.name : null;
      })
      .filter(name => name !== null)
      .join(', ');
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
          
          <FormControl fullWidth>
            <Typography variant="subtitle1" gutterBottom>
              Требуемые уровни квалификации
            </Typography>
            <FormGroup>
              {qualifications.map((qual) => (
                <FormControlLabel
                  key={qual.id}
                  control={
                    <Checkbox
                      checked={formData.qualification_level_ids.includes(qual.id)}
                      onChange={() => handleQualificationChange(qual.id)}
                    />
                  }
                  label={qual.name}
                />
              ))}
            </FormGroup>
          </FormControl>
          
          <TextField
            label="Длительность (минуты)"
            name="duration"
            type="number"
            value={formData.duration}
            onChange={handleChange}
            fullWidth
            required
          />
          
          <TextField
            label="Цена"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            fullWidth
            required
          />
          
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button type="submit" variant="contained" color="primary">
              {isEditing ? 'Сохранить изменения' : 'Добавить услугу'}
            </Button>
            {isEditing && (
              <Button variant="outlined" color="secondary" onClick={resetForm}>
                Отменить
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
      
      <Typography variant="h5" gutterBottom>
        Список услуг
      </Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>Специализация</TableCell>
              <TableCell>Требуемые квалификации</TableCell>
              <TableCell>Длительность (мин)</TableCell>
              <TableCell>Цена</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell>{service.name}</TableCell>
                <TableCell>
                  {getSpecializationName(service.specialization_id)}
                </TableCell>
                <TableCell>
                  {getQualificationNames(service.qualification_level_ids)}
                </TableCell>
                <TableCell>{service.duration}</TableCell>
                <TableCell>{service.price}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" onClick={() => handleEdit(service)}>
                      Изменить
                    </Button>
                    <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(service.id)}>
                      Удалить
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default APservice;
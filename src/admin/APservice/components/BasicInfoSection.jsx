import React from 'react';
import {
  Stack,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

const BasicInfoSection = ({ formData, specializations, onChange }) => {
  return (
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
        onChange={onChange}
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
          onChange={onChange}
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
  );
};

export default BasicInfoSection;
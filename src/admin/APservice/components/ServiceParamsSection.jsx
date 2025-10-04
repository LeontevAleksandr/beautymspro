import React from 'react';
import { Stack, Typography, TextField } from '@mui/material';
import { Timer } from '@mui/icons-material';

const ServiceParamsSection = ({ formData, onChange }) => {
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
        Параметры услуги
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="Базовая цена"
          name="base_price"
          type="number"
          value={formData.base_price}
          onChange={onChange}
          fullWidth
          required
          InputProps={{
            inputProps: { min: 0, step: 50 }
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
          onChange={onChange}
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
  );
};

export default ServiceParamsSection;
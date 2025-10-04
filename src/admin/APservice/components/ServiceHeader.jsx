import React from 'react';
import { Typography, Stack } from '@mui/material';

const ServiceHeader = () => {
  return (
    <Stack direction="column" spacing={2} sx={{ mb: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 500, color: '#1a1a1a' }}>
        Управление услугами
      </Typography>
      <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
        Добавляйте, редактируйте и управляйте услугами вашего салона
      </Typography>
    </Stack>
  );
};

export default ServiceHeader;
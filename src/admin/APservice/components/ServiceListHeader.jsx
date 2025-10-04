import React from 'react';
import { Typography, Stack } from '@mui/material';

const ServiceListHeader = () => {
  return (
    <Stack direction="column" spacing={2} sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 500, color: '#1a1a1a' }}>
        Список услуг
      </Typography>
      <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
        Все доступные услуги вашего салона
      </Typography>
    </Stack>
  );
};

export default ServiceListHeader;
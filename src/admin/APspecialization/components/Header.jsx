import React from 'react';
import { Box, Typography, Stack } from '@mui/material';

export const Header = ({ specializationsCount, qualificationsCount }) => {
  return (
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
          {specializationsCount > 0 && (
            <Box component="span" sx={{ ml: 2 }}>
              • Всего специализаций: {specializationsCount} 
              • Уровней квалификации: {qualificationsCount}
            </Box>
          )}
        </Typography>
      </Box>
    </Stack>
  );
};
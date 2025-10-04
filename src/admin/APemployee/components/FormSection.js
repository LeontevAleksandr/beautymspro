import React from 'react';
import { Stack, Typography } from '@mui/material';

const FormSection = ({ title, children }) => {
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
        {title}
      </Typography>
      {children}
    </Stack>
  );
};

export default FormSection;
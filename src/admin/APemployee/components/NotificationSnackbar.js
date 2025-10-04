import React from 'react';
import { Snackbar, Alert } from '@mui/material';

const NotificationSnackbar = ({ 
  open, 
  message, 
  severity, 
  onClose 
}) => {
  return (
    <Snackbar 
      open={open} 
      autoHideDuration={4000} 
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert 
        onClose={onClose} 
        severity={severity} 
        sx={{ 
          width: '100%',
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationSnackbar;
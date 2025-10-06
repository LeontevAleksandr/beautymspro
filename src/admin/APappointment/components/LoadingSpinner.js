import React from 'react';
import { Box, CircularProgress } from '@mui/material';

export const LoadingSpinner = () => (
    <Box 
        sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '400px' 
        }}
    >
        <CircularProgress size={48} sx={{ color: '#1976d2' }} />
    </Box>
);
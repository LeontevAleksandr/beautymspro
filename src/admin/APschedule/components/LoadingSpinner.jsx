import React from 'react';
import { Box, CircularProgress } from '@mui/material';

const LoadingSpinner = () => {
    return (
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
};

export default LoadingSpinner;
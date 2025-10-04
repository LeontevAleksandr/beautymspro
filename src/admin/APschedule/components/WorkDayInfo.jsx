import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const WorkDayInfo = ({ employeeName, date }) => {
    return (
        <Box sx={{ 
            p: 2, 
            backgroundColor: '#f8f9fa', 
            borderRadius: 2,
            border: '1px solid #e0e0e0'
        }}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                        Сотрудник:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {employeeName}
                    </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                        Дата:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {date ? format(date, 'dd.MM.yyyy, EEEE', { locale: ru }) : ''}
                    </Typography>
                </Grid>
            </Grid>
        </Box>
    );
};

export default WorkDayInfo;
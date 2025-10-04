import React from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const FormulaSelector = ({ value, onChange }) => {
    return (
        <Box>
            <Typography 
                variant="subtitle2" 
                sx={{ 
                    color: '#424242',
                    fontWeight: 500,
                    mb: 1
                }}
            >
                Выберите формулу графика:
            </Typography>
            <FormControl 
                fullWidth 
                size="small" 
                sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                    }
                }}
            >
                <InputLabel>Формула графика</InputLabel>
                <Select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    label="Формула графика"
                >
                    <MenuItem value="1/1">1/1 - День через день</MenuItem>
                    <MenuItem value="1/2">1/2 - 1 рабочий / 2 выходных</MenuItem>
                    <MenuItem value="2/1">2/1 - 2 рабочих / 1 выходной</MenuItem>
                    <MenuItem value="2/2">2/2 - 2 рабочих / 2 выходных</MenuItem>
                    <MenuItem value="3/3">3/3 - 3 рабочих / 3 выходных</MenuItem>
                    <MenuItem value="5/2">5/2 - Стандартная рабочая неделя</MenuItem>
                    <MenuItem value="6/1">6/1 - 6 рабочих / 1 выходной</MenuItem>
                    <MenuItem value="7/0">7/0 - Без выходных</MenuItem>
                </Select>
            </FormControl>
        </Box>
    );
};

export default FormulaSelector;
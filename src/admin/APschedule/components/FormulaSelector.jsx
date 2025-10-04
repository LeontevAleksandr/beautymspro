import React from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, ToggleButtonGroup, ToggleButton } from '@mui/material';
import WeekdaySelector from './WeekdaySelector';

const FormulaSelector = ({ value, onChange, useCustom, onToggleMode, selectedDays, onToggleDays }) => {
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
            
            <ToggleButtonGroup
                value={useCustom ? 'custom' : 'formula'}
                exclusive
                onChange={(e, newValue) => newValue && onToggleMode(newValue === 'custom')}
                fullWidth
                size="small"
                sx={{ mb: 2 }}
            >
                <ToggleButton value="formula" sx={{ textTransform: 'none', py: 1 }}>
                    Готовая формула
                </ToggleButton>
                <ToggleButton value="custom" sx={{ textTransform: 'none', py: 1 }}>
                    Выбор дней недели
                </ToggleButton>
            </ToggleButtonGroup>

            {!useCustom ? (
                <FormControl 
                    fullWidth 
                    size="small" 
                    sx={{ 
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
            ) : (
                <WeekdaySelector 
                    selectedDays={selectedDays}
                    onToggleDay={onToggleDays}
                />
            )}
        </Box>
    );
};

export default FormulaSelector;
import React from 'react';
import { 
    Paper, Grid, FormControl, InputLabel, 
    Select, MenuItem, Button 
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { format } from 'date-fns';
import { GROUP_BY_OPTIONS } from '../utils/constants';

/**
 * Компонент фильтров для анализа загруженности
 * @param {Date} startDate - Начальная дата периода
 * @param {Date} endDate - Конечная дата периода
 * @param {string} groupBy - Тип группировки (day/week/month)
 * @param {Function} onStartDateChange - Обработчик изменения начальной даты
 * @param {Function} onEndDateChange - Обработчик изменения конечной даты
 * @param {Function} onGroupByChange - Обработчик изменения группировки
 * @param {Function} onApply - Обработчик применения фильтров
 */
const WorkloadFilters = ({
    startDate,
    endDate,
    groupBy,
    onStartDateChange,
    onEndDateChange,
    onGroupByChange,
    onApply
}) => {
    return (
        <Paper sx={{ 
            p: 3, 
            mb: 3, 
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            borderRadius: 2
        }}>
            <Grid container spacing={2}>
                {/* Начальная дата */}
                <Grid item xs={12} sm={3}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                        <DatePicker
                            label="Начальная дата"
                            value={new Date(startDate)}
                            onChange={(newValue) => {
                                if (newValue) {
                                    onStartDateChange(format(newValue, 'yyyy-MM-dd'));
                                }
                            }}
                            slotProps={{
                                textField: { 
                                    fullWidth: true, 
                                    size: 'small',
                                    sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } }
                                }
                            }}
                        />
                    </LocalizationProvider>
                </Grid>

                {/* Конечная дата */}
                <Grid item xs={12} sm={3}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                        <DatePicker
                            label="Конечная дата"
                            value={new Date(endDate)}
                            onChange={(newValue) => {
                                if (newValue) {
                                    onEndDateChange(format(newValue, 'yyyy-MM-dd'));
                                }
                            }}
                            slotProps={{
                                textField: { 
                                    fullWidth: true, 
                                    size: 'small',
                                    sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } }
                                }
                            }}
                        />
                    </LocalizationProvider>
                </Grid>

                {/* Группировка */}
                <Grid item xs={12} sm={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Группировка</InputLabel>
                        <Select
                            value={groupBy}
                            label="Группировка"
                            onChange={(e) => onGroupByChange(e.target.value)}
                            sx={{ borderRadius: 2 }}
                        >
                            {GROUP_BY_OPTIONS.map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* Кнопка применения */}
                <Grid item xs={12} sm={3}>
                    <Button 
                        variant="contained" 
                        onClick={onApply}
                        fullWidth
                        size="small"
                        sx={{ 
                            height: '40px',
                            borderRadius: 2,
                            textTransform: 'none',
                            minWidth: '160px',
                            backgroundColor: '#1976d2',
                            '&:hover': { backgroundColor: '#1565c0' }
                        }}
                    >
                        Применить
                    </Button>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default WorkloadFilters;
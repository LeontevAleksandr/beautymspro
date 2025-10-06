import React, { useState } from 'react';
import { Autocomplete, TextField, Box, Typography, Stack, Chip, MenuItem } from '@mui/material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import AddIcon from '@mui/icons-material/Add';

export const ClientSelector = ({ 
    clients, 
    value, 
    onChange,
    appointments = [],
    size = "small",
    onAddNew // ДОБАВЛЕНО
}) => {
    const [inputValue, setInputValue] = useState('');
    const selectedClient = value ? clients.find(c => c.id === value) : null;

    const getClientStats = (clientId) => {
        const clientApps = appointments.filter(app => app.client_id === clientId);
        const visits = clientApps.length;
        const lastVisit = clientApps.length > 0 
            ? clientApps.sort((a, b) => new Date(b.datetime) - new Date(a.datetime))[0].datetime
            : null;
        return { visits, lastVisit };
    };

    return (
        <Autocomplete
            value={selectedClient}
            inputValue={inputValue}
            onInputChange={(event, newInputValue) => {
                setInputValue(newInputValue);
            }}
            onChange={(event, newValue) => {
                if (newValue && newValue.id === 'add-new') {
                    onAddNew?.(inputValue);
                    setInputValue('');
                } else {
                    onChange(newValue ? newValue.id : '');
                }
            }}
            options={[
                { id: 'add-new', full_name: 'Добавить нового клиента', isAddButton: true },
                ...clients
            ]}
            getOptionLabel={(option) => option.isAddButton ? '' : (option.full_name || '')}
            filterOptions={(options, { inputValue }) => {
                const searchTerm = inputValue.toLowerCase();
                const filtered = options.filter(option => {
                    if (option.isAddButton) return true;
                    return option.full_name?.toLowerCase().includes(searchTerm) ||
                           option.phone?.toLowerCase().includes(searchTerm) ||
                           option.email?.toLowerCase().includes(searchTerm);
                });
                return filtered;
            }}
            renderOption={(props, option) => {
                if (option.isAddButton) {
                    return (
                        <MenuItem
                            {...props}
                            sx={{
                                color: '#1976d2',
                                fontWeight: 500,
                                borderBottom: '1px solid #e0e0e0',
                                py: 1.5,
                                '&:hover': {
                                    backgroundColor: '#e3f2fd'
                                }
                            }}
                        >
                            <AddIcon sx={{ fontSize: 18, mr: 1 }} />
                            {option.full_name}
                        </MenuItem>
                    );
                }

                const { visits, lastVisit } = getClientStats(option.id);
                
                return (
                    <Box 
                        component="li" 
                        {...props} 
                        sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'flex-start !important',
                            py: 1.5,
                            borderBottom: '1px solid #f0f0f0',
                            '&:last-child': { borderBottom: 'none' }
                        }}
                    >
                        <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5 }}>
                            {option.full_name}
                        </Typography>
                        <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                            {option.phone && (
                                <Typography variant="caption" color="text.secondary">
                                    {option.phone}
                                </Typography>
                            )}
                            {option.email && (
                                <Typography variant="caption" color="text.secondary">
                                    {option.email}
                                </Typography>
                            )}
                        </Stack>
                        {visits > 0 && (
                            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                <Chip 
                                    label={`${visits} визитов`} 
                                    size="small" 
                                    sx={{ 
                                        height: 18, 
                                        fontSize: '0.7rem',
                                        backgroundColor: '#e3f2fd',
                                        color: '#1976d2'
                                    }} 
                                />
                                {lastVisit && (
                                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: '18px' }}>
                                        Последний: {format(new Date(lastVisit), 'dd.MM.yyyy', { locale: ru })}
                                    </Typography>
                                )}
                            </Stack>
                        )}
                    </Box>
                );
            }}
            renderInput={(params) => (
                <TextField 
                    {...params} 
                    label="Клиент" 
                    size={size}
                    placeholder="Начните вводить имя, телефон или email..."
                />
            )}
            noOptionsText="Клиенты не найдены"
            sx={{ width: '100%' }}
        />
    );
};
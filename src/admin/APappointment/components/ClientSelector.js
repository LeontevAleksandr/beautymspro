import React from 'react';
import { Autocomplete, TextField, Box, Typography, Stack, Chip } from '@mui/material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export const ClientSelector = ({ 
    clients, 
    value, 
    onChange,
    appointments = [],
    size = "small"
}) => {
    // Находим клиента по ID
    const selectedClient = value ? clients.find(c => c.id === value) : null;

    // Подсчет визитов и последнего визита
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
            onChange={(event, newValue) => {
                onChange(newValue ? newValue.id : '');
            }}
            options={clients}
            getOptionLabel={(option) => option.full_name || ''}
            filterOptions={(options, { inputValue }) => {
                const searchTerm = inputValue.toLowerCase();
                return options.filter(option => 
                    option.full_name.toLowerCase().includes(searchTerm) ||
                    option.phone?.toLowerCase().includes(searchTerm) ||
                    option.email?.toLowerCase().includes(searchTerm)
                );
            }}
            renderOption={(props, client) => {
                const { visits, lastVisit } = getClientStats(client.id);
                
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
                            {client.full_name}
                        </Typography>
                        <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                            {client.phone && (
                                <Typography variant="caption" color="text.secondary">
                                    {client.phone}
                                </Typography>
                            )}
                            {client.email && (
                                <Typography variant="caption" color="text.secondary">
                                    {client.email}
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
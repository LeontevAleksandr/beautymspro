// Диалог настройки предпочтений клиента

import React from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogTitle,
    TextField, Button, Box, Typography, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { theme } from '../styles/theme';

const PreferencesDialog = ({
    open,
    onClose,
    selectedClient,
    preferencesForm,
    clientStatuses,
    onFormChange,
    onSave
}) => {
    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: theme.shadows.card
                }
            }}
        >
            <DialogTitle sx={{ color: theme.colors.primaryText, fontWeight: 600 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SettingsIcon sx={{ fontSize: 24, mr: 1, color: theme.colors.accent }} />
                    Настройка предпочтений клиента
                </Box>
            </DialogTitle>
            <DialogContent>
                {selectedClient && (
                    <Box sx={{ mt: 1 }}>
                        <Box sx={{
                            p: 2,
                            mb: 3,
                            backgroundColor: theme.colors.tableHeader,
                            borderRadius: 2,
                            border: `1px solid ${theme.colors.border}`
                        }}>
                            <Typography variant="subtitle1" sx={{ color: theme.colors.primaryText, fontWeight: 500 }}>
                                Клиент: {selectedClient.full_name}
                            </Typography>
                        </Box>
                        
                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel size="small">Статус клиента</InputLabel>
                            <Select
                                name="client_status_id"
                                value={preferencesForm.client_status_id}
                                onChange={onFormChange}
                                label="Статус клиента"
                                size="small"
                                sx={{
                                    borderRadius: 2
                                }}
                            >
                                {clientStatuses.map((status) => (
                                    <MenuItem key={status.id} value={status.id}>
                                        {status.status}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        <TextField
                            name="preferences"
                            label="Предпочтения клиента"
                            fullWidth
                            multiline
                            rows={4}
                            size="small"
                            value={preferencesForm.preferences || ''}
                            onChange={onFormChange}
                            placeholder="Введите информацию о предпочтениях клиента (аллергии, особые пожелания и т.д.)"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                }
                            }}
                        />
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 1 }}>
                <Button 
                    onClick={onClose}
                    sx={{ 
                        textTransform: 'none',
                        borderRadius: 2,
                        minWidth: 100
                    }}
                >
                    Отмена
                </Button>
                <Button 
                    onClick={onSave} 
                    variant="contained" 
                    color="primary"
                    sx={{ 
                        textTransform: 'none',
                        borderRadius: 2,
                        minWidth: 100,
                        boxShadow: theme.shadows.button
                    }}
                >
                    Сохранить
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PreferencesDialog;
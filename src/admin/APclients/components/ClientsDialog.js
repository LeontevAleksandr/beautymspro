// Диалог добавления/редактирования клиента

import React from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogTitle,
    TextField, Button, Grid, Box
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { theme } from '../styles/theme';

const ClientsDialog = ({
    open,
    onClose,
    selectedClient,
    clientForm,
    formErrors,
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
                    <PersonIcon sx={{ fontSize: 24, mr: 1, color: theme.colors.accent }} />
                    {selectedClient ? 'Редактирование клиента' : 'Добавление нового клиента'}
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <TextField
                            name="full_name"
                            label="ФИО клиента"
                            fullWidth
                            size="small"
                            value={clientForm.full_name}
                            onChange={onFormChange}
                            error={formErrors.full_name}
                            helperText={formErrors.full_name ? 'Введите ФИО клиента' : ''}
                            required
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                }
                            }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            name="phone"
                            label="Телефон"
                            placeholder="+7 (XXX) XXX-XX-XX"
                            fullWidth
                            size="small"
                            value={clientForm.phone}
                            onChange={onFormChange}
                            error={formErrors.phone}
                            helperText={formErrors.phone ? 'Введите корректный номер телефона в формате +7 (XXX) XXX-XX-XX' : 'Номер будет автоматически отформатирован'}
                            required
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                }
                            }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            name="email"
                            label="Email"
                            fullWidth
                            size="small"
                            value={clientForm.email}
                            onChange={onFormChange}
                            error={formErrors.email}
                            helperText={formErrors.email ? 'Введите корректный email' : ''}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                }
                            }}
                        />
                    </Grid>
                </Grid>
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

export default ClientsDialog;
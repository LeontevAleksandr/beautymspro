// Диалог добавления/редактирования статуса

import React from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogTitle,
    TextField, Button, Box
} from '@mui/material';
import StatusIcon from '@mui/icons-material/Label';
import { theme } from '../styles/theme';

const StatusDialog = ({
    open,
    onClose,
    editingStatus,
    newStatus,
    onStatusChange,
    onSave
}) => {
    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="xs"
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
                    <StatusIcon sx={{ fontSize: 24, mr: 1, color: theme.colors.accent }} />
                    {editingStatus ? 'Редактирование статуса' : 'Добавление нового статуса'}
                </Box>
            </DialogTitle>
            <DialogContent>
                <TextField
                    name="status"
                    label="Название статуса"
                    fullWidth
                    size="small"
                    value={newStatus.status}
                    onChange={onStatusChange}
                    sx={{ 
                        mt: 1,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                        }
                    }}
                    required
                />
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

export default StatusDialog;
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button } from '@mui/material';
import { getClientName, getServiceName } from '../utils/dataHelpers.js';

// ==================== КОМПОНЕНТ ДИАЛОГА УДАЛЕНИЯ ====================
export const DeleteDialog = ({
    openDeleteDialog,
    setOpenDeleteDialog,
    appointmentToDelete,
    confirmDeleteAppointment,
    clientsArray,
    servicesArray
}) => {
    return (
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
            <DialogTitle>Удаление записи</DialogTitle>
            <DialogContent>
                {appointmentToDelete && (
                    <Typography>
                        Удалить запись <strong>{getClientName(appointmentToDelete.client_id, clientsArray)}</strong> на услугу <strong>{getServiceName(appointmentToDelete.service_id, servicesArray)}</strong>?
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button 
                    onClick={() => setOpenDeleteDialog(false)}
                    sx={{ textTransform: 'none' }}
                >
                    Отмена
                </Button>
                <Button 
                    onClick={confirmDeleteAppointment} 
                    color="error" 
                    variant="contained"
                    sx={{ textTransform: 'none' }}
                >
                    Удалить
                </Button>
            </DialogActions>
        </Dialog>
    );
};
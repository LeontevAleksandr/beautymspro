// Хук для работы со статусами клиентов

import { useState, useEffect } from 'react';
import { 
    fetchClientStatuses, 
    createClientStatus, 
    updateClientStatus, 
    deleteClientStatus 
} from '../services/clientsApi';
import { INITIAL_STATUS_FORM } from '../utils/constants';

export const useStatusesData = (showSnackbar) => {
    const [clientStatuses, setClientStatuses] = useState([]);
    const [openStatusDialog, setOpenStatusDialog] = useState(false);
    const [newStatus, setNewStatus] = useState(INITIAL_STATUS_FORM);
    const [editingStatus, setEditingStatus] = useState(null);

    // Загрузка статусов
    const loadClientStatuses = async () => {
        try {
            const data = await fetchClientStatuses();
            setClientStatuses(data);
        } catch (error) {
            showSnackbar(`Ошибка при загрузке статусов клиентов: ${error.message}`, 'error');
        }
    };

    useEffect(() => {
        loadClientStatuses();
    }, []);

    // Добавление нового статуса
    const handleAddStatus = () => {
        setEditingStatus(null);
        setNewStatus(INITIAL_STATUS_FORM);
        setOpenStatusDialog(true);
    };

    // Редактирование статуса
    const handleEditStatus = (status) => {
        setEditingStatus(status);
        setNewStatus({ status: status.status });
        setOpenStatusDialog(true);
    };

    // Сохранение статуса
    const handleSaveStatus = async () => {
        if (!newStatus.status.trim()) {
            showSnackbar('Название статуса не может быть пустым', 'error');
            return;
        }
        
        try {
            if (editingStatus) {
                await updateClientStatus(editingStatus.id, newStatus);
                showSnackbar('Статус успешно обновлен', 'success');
            } else {
                await createClientStatus(newStatus);
                showSnackbar('Статус успешно добавлен', 'success');
            }
            
            setOpenStatusDialog(false);
            loadClientStatuses();
        } catch (error) {
            showSnackbar(`Ошибка: ${error.message}`, 'error');
        }
    };

    // Удаление статуса
    const handleDeleteStatus = async (status) => {
        if (!window.confirm(`Вы уверены, что хотите удалить статус "${status.status}"?`)) {
            return;
        }
        
        try {
            await deleteClientStatus(status.id);
            loadClientStatuses();
            showSnackbar('Статус успешно удален', 'success');
        } catch (error) {
            showSnackbar(`Ошибка при удалении: ${error.message}`, 'error');
        }
    };

    return {
        clientStatuses,
        openStatusDialog,
        newStatus,
        editingStatus,
        setOpenStatusDialog,
        setNewStatus,
        handleAddStatus,
        handleEditStatus,
        handleSaveStatus,
        handleDeleteStatus,
        loadClientStatuses
    };
};
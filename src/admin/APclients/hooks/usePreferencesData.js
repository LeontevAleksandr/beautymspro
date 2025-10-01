// Хук для работы с предпочтениями клиентов

import { useState, useEffect } from 'react';
import { 
    fetchClientPreferences, 
    createClientPreferences, 
    updateClientPreferences 
} from '../services/clientsApi';
import { INITIAL_PREFERENCES_FORM } from '../utils/constants';

export const usePreferencesData = (showSnackbar) => {
    const [clientPreferences, setClientPreferences] = useState([]);
    const [openPreferencesDialog, setOpenPreferencesDialog] = useState(false);
    const [preferencesForm, setPreferencesForm] = useState(INITIAL_PREFERENCES_FORM);
    const [selectedClient, setSelectedClient] = useState(null);

    // Загрузка предпочтений
    const loadClientPreferences = async () => {
        try {
            const data = await fetchClientPreferences();
            setClientPreferences(data);
        } catch (error) {
            showSnackbar(`Ошибка при загрузке предпочтений клиентов: ${error.message}`, 'error');
        }
    };

    useEffect(() => {
        loadClientPreferences();
    }, []);

    // Добавление/редактирование предпочтений
    const handleAddPreferences = (client) => {
        // Проверяем, есть ли уже предпочтения для этого клиента
        const existingPreferences = clientPreferences.find(p => p.client_id === client.id);
        
        if (existingPreferences) {
            setPreferencesForm({
                client_id: existingPreferences.client_id,
                client_status_id: existingPreferences.client_status_id || '',
                preferences: existingPreferences.preferences || ''
            });
            setSelectedClient({...client, preferences_id: existingPreferences.id});
        } else {
            setPreferencesForm({
                client_id: client.id,
                client_status_id: '',
                preferences: ''
            });
            setSelectedClient(client);
        }
        
        setOpenPreferencesDialog(true);
    };

    // Сохранение предпочтений
    const handleSavePreferences = async () => {
        if (!preferencesForm.client_id || !preferencesForm.client_status_id) {
            showSnackbar('Выберите статус клиента', 'error');
            return;
        }
        
        try {
            const existingPreferences = clientPreferences.find(p => p.client_id === preferencesForm.client_id);
            
            if (existingPreferences) {
                await updateClientPreferences(existingPreferences.id, preferencesForm);
            } else {
                await createClientPreferences(preferencesForm);
            }
            
            setOpenPreferencesDialog(false);
            loadClientPreferences();
            showSnackbar('Предпочтения клиента сохранены', 'success');
        } catch (error) {
            showSnackbar(`Ошибка: ${error.message}`, 'error');
        }
    };

    // Обработка изменений в форме предпочтений
    const handlePreferencesFormChange = (e) => {
        const { name, value } = e.target;
        setPreferencesForm({
            ...preferencesForm,
            [name]: value
        });
    };

    // Получение статуса клиента
    const getClientStatus = (clientId, clientStatuses) => {
        const preference = clientPreferences.find(p => p.client_id === clientId);
        if (!preference) return 'Не установлен';
        
        const status = clientStatuses.find(s => s.id === preference.client_status_id);
        return status ? status.status : 'Не установлен';
    };

    return {
        clientPreferences,
        openPreferencesDialog,
        preferencesForm,
        selectedClient,
        setOpenPreferencesDialog,
        setSelectedClient,
        handleAddPreferences,
        handleSavePreferences,
        handlePreferencesFormChange,
        loadClientPreferences,
        getClientStatus
    };
};
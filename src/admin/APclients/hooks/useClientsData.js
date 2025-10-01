// Хук для работы с данными клиентов
import { useState, useEffect } from 'react';
import { 
    fetchClients, 
    createClient, 
    updateClient, 
    deleteClient 
} from '../services/clientsApi';
import { formatPhoneForDB, formatPhoneForDisplay, formatPhoneInput } from '../utils/phoneUtils';
import { validateClientForm } from '../utils/validation';
import { INITIAL_CLIENT_FORM, INITIAL_FORM_ERRORS } from '../utils/constants';

export const useClientsData = (showSnackbar) => {
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [openClientDialog, setOpenClientDialog] = useState(false);
    const [clientForm, setClientForm] = useState(INITIAL_CLIENT_FORM);
    const [formErrors, setFormErrors] = useState(INITIAL_FORM_ERRORS);

    // Загрузка клиентов
    const loadClients = async () => {
        try {
            const data = await fetchClients();
            setClients(data);
        } catch (error) {
            showSnackbar(`Ошибка при загрузке клиентов: ${error.message}`, 'error');
        }
    };

    useEffect(() => {
        loadClients();
    }, []);

    // Валидация формы клиента
    const validateForm = () => {
        const { errors, isValid } = validateClientForm(clientForm);
        setFormErrors(errors);
        return isValid;
    };

    // Добавление нового клиента
    const handleAddClient = () => {
        setSelectedClient(null);
        setClientForm(INITIAL_CLIENT_FORM);
        setFormErrors(INITIAL_FORM_ERRORS);
        setOpenClientDialog(true);
    };

    // Редактирование клиента
    const handleEditClient = (client) => {
        setSelectedClient(client);
        setClientForm({
            full_name: client.full_name || '',
            phone: formatPhoneForDisplay(client.phone) || '',
            email: client.email || ''
        });
        setFormErrors(INITIAL_FORM_ERRORS);
        setOpenClientDialog(true);
    };

    // Сохранение клиента
    const handleSaveClient = async () => {
        if (!validateForm()) return;
        
        try {
            const dataToSend = {
                full_name: clientForm.full_name.trim(),
                phone: formatPhoneForDB(clientForm.phone),
                email: clientForm.email?.trim() || null,
                telegram_chat_id: null
            };
            
            console.log('Отправляемые данные:', dataToSend);
            
            if (selectedClient) {
                await updateClient(selectedClient.id, dataToSend);
                showSnackbar('Клиент успешно обновлен', 'success');
            } else {
                await createClient(dataToSend);
                showSnackbar('Клиент успешно добавлен', 'success');
            }
            
            setOpenClientDialog(false);
            loadClients();
        } catch (error) {
            showSnackbar(`Ошибка: ${error.message}`, 'error');
        }
    };

    // Удаление клиента
    const handleDeleteClient = async (client) => {
        if (!window.confirm(`Вы уверены, что хотите удалить клиента ${client.full_name}?`)) {
            return;
        }
        
        try {
            await deleteClient(client.id);
            loadClients();
            showSnackbar('Клиент успешно удален', 'success');
        } catch (error) {
            showSnackbar(`Ошибка при удалении: ${error.message}`, 'error');
        }
    };

    // Обработка изменений в форме
    const handleClientFormChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;
        
        // Форматирование телефона при вводе
        if (name === 'phone') {
            formattedValue = formatPhoneInput(value);
        }
        
        setClientForm({
            ...clientForm,
            [name]: formattedValue
        });
        
        // Сбрасываем ошибку для поля, которое изменилось
        if (formErrors[name]) {
            setFormErrors({
                ...formErrors,
                [name]: false
            });
        }
    };

    return {
        clients,
        selectedClient,
        openClientDialog,
        clientForm,
        formErrors,
        setOpenClientDialog,
        handleAddClient,
        handleEditClient,
        handleSaveClient,
        handleDeleteClient,
        handleClientFormChange,
        loadClients
    };
};
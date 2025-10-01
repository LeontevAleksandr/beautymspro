// Утилиты для поиска и фильтрации клиентов

import { formatPhoneForDisplay } from './phoneUtils';

// Улучшенная функция фильтрации клиентов
export const getFilteredClients = (clients, clientPreferences, searchTerm, statusFilter) => {
    let filtered = clients;
    
    // Фильтрация по поисковому запросу
    if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(client => {
            // Поиск по ФИО
            const nameMatch = client.full_name.toLowerCase().includes(searchLower);
            
            // Поиск по телефону (и по оригинальному, и по отформатированному номеру)
            const phoneMatch = client.phone && (
                client.phone.includes(searchTerm) ||
                formatPhoneForDisplay(client.phone).includes(searchTerm)
            );
            
            // Поиск по email
            const emailMatch = client.email && 
                client.email.toLowerCase().includes(searchLower);
            
            return nameMatch || phoneMatch || emailMatch;
        });
    }
    
    // Фильтрация по статусу
    if (statusFilter) {
        filtered = filtered.filter(client => {
            const preference = clientPreferences.find(p => p.client_id === client.id);
            
            if (statusFilter === 'no_status') {
                // Показать клиентов без статуса
                return !preference || !preference.client_status_id;
            } else {
                // Показать клиентов с определенным статусом
                return preference && preference.client_status_id === parseInt(statusFilter);
            }
        });
    }
    
    return filtered;
};

// Функция группировки клиентов по статусам
export const getGroupedClients = (clients, clientPreferences, clientStatuses, searchTerm, statusFilter) => {
    const filteredClients = getFilteredClients(clients, clientPreferences, searchTerm, statusFilter);
    const grouped = {};
    
    filteredClients.forEach(client => {
        const preference = clientPreferences.find(p => p.client_id === client.id);
        let statusName = 'Без статуса';
        let statusId = 'no_status';
        
        if (preference) {
            const status = clientStatuses.find(s => s.id === preference.client_status_id);
            if (status) {
                statusName = status.status;
                statusId = status.id;
            }
        }
        
        if (!grouped[statusId]) {
            grouped[statusId] = {
                statusName: statusName,
                clients: []
            };
        }
        
        grouped[statusId].clients.push(client);
    });
    
    // Сортируем группы: сначала "Без статуса", потом остальные по алфавиту
    const sortedGroups = Object.entries(grouped).sort(([keyA, groupA], [keyB, groupB]) => {
        if (keyA === 'no_status') return 1; // "Без статуса" в конец
        if (keyB === 'no_status') return -1;
        return groupA.statusName.localeCompare(groupB.statusName);
    });
    
    return sortedGroups;
};

// Проверка наличия активных фильтров
export const hasActiveFilters = (searchTerm, statusFilter) => {
    return Boolean(searchTerm || statusFilter);
};
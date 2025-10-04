// Хук для управления фильтрами и поиском

import { useState } from 'react';
import { getFilteredClients, getGroupedClients, hasActiveFilters as checkActiveFilters } from '../utils/searchFilterUtils';

export const useFilters = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [groupByStatus, setGroupByStatus] = useState(true);

    // Функция очистки всех фильтров
    const clearAllFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
    };

    // Проверка наличия активных фильтров
    const hasActiveFilters = checkActiveFilters(searchTerm, statusFilter);

    // Получение отфильтрованных клиентов
    const getFilteredClientsData = (clients, clientPreferences) => {
        return getFilteredClients(clients, clientPreferences, searchTerm, statusFilter);
    };

    // Получение сгруппированных клиентов
    const getGroupedClientsData = (clients, clientPreferences, clientStatuses) => {
        return getGroupedClients(clients, clientPreferences, clientStatuses, searchTerm, statusFilter);
    };

    return {
        searchTerm,
        statusFilter,
        groupByStatus,
        hasActiveFilters,
        setSearchTerm,
        setStatusFilter,
        setGroupByStatus,
        clearAllFilters,
        getFilteredClientsData,
        getGroupedClientsData
    };
};
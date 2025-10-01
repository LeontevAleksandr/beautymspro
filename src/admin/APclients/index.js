// Главный компонент APclients
import React from 'react';
import { 
    Typography, Box, Paper, Tabs, Tab
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import StatusIcon from '@mui/icons-material/Label';

// Импорты компонентов
import SearchFilter from './components/SearchFilter';
import ClientsTable from './components/ClientsTable';
import StatusesTable from './components/StatusesTable';
import ClientsDialog from './components/ClientsDialog';
import StatusDialog from './components/StatusDialog';
import PreferencesDialog from './components/PreferencesDialog';
import NotificationSnackbar from './components/NotificationSnackbar';

// Импорты хуков
import { useClientsData } from './hooks/useClientsData';
import { useStatusesData } from './hooks/useStatusesData';
import { usePreferencesData } from './hooks/usePreferencesData';
import { useFilters } from './hooks/useFilters';
import { useUIState } from './hooks/useUIState';

// Импорты стилей и утилит
import { theme } from './styles/theme';

function APclients() {
    // Хуки для управления состоянием
    const { activeTab, snackbar, showSnackbar, handleCloseSnackbar, handleTabChange } = useUIState();
    
    const {
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
        handleClientFormChange
    } = useClientsData(showSnackbar);
    
    const {
        clientStatuses,
        openStatusDialog,
        newStatus,
        editingStatus,
        setOpenStatusDialog,
        setNewStatus,
        handleAddStatus,
        handleEditStatus,
        handleSaveStatus,
        handleDeleteStatus
    } = useStatusesData(showSnackbar);
    
    const {
        clientPreferences,
        openPreferencesDialog,
        preferencesForm,
        selectedClient: selectedPreferencesClient,
        setOpenPreferencesDialog,
        setSelectedClient,
        handleAddPreferences,
        handleSavePreferences,
        handlePreferencesFormChange,
        getClientStatus
    } = usePreferencesData(showSnackbar);
    
    const {
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
    } = useFilters();

    // Функции получения данных для таблицы
    const getFilteredClients = () => getFilteredClientsData(clients, clientPreferences);
    const getGroupedClients = () => getGroupedClientsData(clients, clientPreferences, clientStatuses);

    return (
        <Box sx={{ 
            backgroundColor: theme.colors.background, 
            minHeight: '100vh',
            p: 3
        }}>
            <Typography 
                variant="h6" 
                align="center" 
                gutterBottom
                sx={{ 
                    color: theme.colors.primaryText,
                    fontWeight: 600,
                    mb: 3
                }}
            >
                Управление клиентами
            </Typography>
            
            <Paper sx={{ 
                p: 3, 
                mb: 3,
                boxShadow: theme.shadows.card,
                borderRadius: 3,
                border: `1px solid ${theme.colors.border}`
            }}>
                <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange} 
                    centered
                    sx={{ 
                        mb: 3,
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            minWidth: 160,
                            fontSize: '0.9rem'
                        },
                        '& .MuiTabs-indicator': {
                            backgroundColor: theme.colors.accent
                        }
                    }}
                >
                    <Tab 
                        label="Клиенты" 
                        icon={<PersonIcon sx={{ fontSize: 18 }} />}
                        iconPosition="start"
                    />
                    <Tab 
                        label="Статусы клиентов" 
                        icon={<StatusIcon sx={{ fontSize: 18 }} />}
                        iconPosition="start"
                    />
                </Tabs>
                
                {activeTab === 0 && (
                    <>
                        <SearchFilter
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            statusFilter={statusFilter}
                            setStatusFilter={setStatusFilter}
                            clientStatuses={clientStatuses}
                            hasActiveFilters={hasActiveFilters}
                            clearAllFilters={clearAllFilters}
                            groupByStatus={groupByStatus}
                            setGroupByStatus={setGroupByStatus}
                            onAddClient={handleAddClient}
                        />
                        
                        <ClientsTable
                            clients={clients}
                            groupByStatus={groupByStatus}
                            getGroupedClients={getGroupedClients}
                            getFilteredClients={getFilteredClients}
                            getClientStatus={(clientId) => getClientStatus(clientId, clientStatuses)}
                            onEditClient={handleEditClient}
                            onDeleteClient={handleDeleteClient}
                            onAddPreferences={handleAddPreferences}
                        />
                    </>
                )}

                {activeTab === 1 && (
                    <StatusesTable
                        clientStatuses={clientStatuses}
                        onAddStatus={handleAddStatus}
                        onEditStatus={handleEditStatus}
                        onDeleteStatus={handleDeleteStatus}
                    />
                )}
            </Paper>
            
            {/* Диалоги */}
            <ClientsDialog
                open={openClientDialog}
                onClose={() => setOpenClientDialog(false)}
                selectedClient={selectedClient}
                clientForm={clientForm}
                formErrors={formErrors}
                onFormChange={handleClientFormChange}
                onSave={handleSaveClient}
            />
            
            <StatusDialog
                open={openStatusDialog}
                onClose={() => setOpenStatusDialog(false)}
                editingStatus={editingStatus}
                newStatus={newStatus}
                onStatusChange={(e) => setNewStatus({ status: e.target.value })}
                onSave={handleSaveStatus}
            />
            
            <PreferencesDialog
                open={openPreferencesDialog}
                onClose={() => setOpenPreferencesDialog(false)}
                selectedClient={selectedPreferencesClient}
                preferencesForm={preferencesForm}
                clientStatuses={clientStatuses}
                onFormChange={handlePreferencesFormChange}
                onSave={handleSavePreferences}
            />
            
            {/* Уведомления */}
            <NotificationSnackbar
                snackbar={snackbar}
                onClose={handleCloseSnackbar}
            />
        </Box>
    );
}

export default APclients;
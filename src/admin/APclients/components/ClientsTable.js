// Компонент таблицы клиентов

import React from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Box, IconButton, Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import StatusIcon from '@mui/icons-material/Label';
import { theme } from '../styles/theme';
import { formatPhoneForDisplay } from '../utils/phoneUtils';

const ClientsTable = ({
    clients,
    groupByStatus,
    getGroupedClients,
    getFilteredClients,
    getClientStatus,
    onEditClient,
    onDeleteClient,
    onAddPreferences
}) => {
    return (
        <TableContainer 
            component={Paper} 
            sx={{ 
                boxShadow: theme.shadows.card,
                borderRadius: 2,
                border: `1px solid ${theme.colors.border}`
            }}
        >
            <Table size="small">
                <TableHead>
                    <TableRow sx={{ backgroundColor: theme.colors.tableHeader }}>
                        <TableCell sx={{ width: '25%', fontWeight: 600, color: theme.colors.primaryText }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <PersonIcon sx={{ fontSize: 18, mr: 1 }} />
                                ФИО
                            </Box>
                        </TableCell>
                        <TableCell sx={{ width: '20%', fontWeight: 600, color: theme.colors.primaryText }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <PhoneIcon sx={{ fontSize: 18, mr: 1 }} />
                                Телефон
                            </Box>
                        </TableCell>
                        <TableCell sx={{ width: '20%', fontWeight: 600, color: theme.colors.primaryText }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <EmailIcon sx={{ fontSize: 18, mr: 1 }} />
                                Email
                            </Box>
                        </TableCell>
                        <TableCell sx={{ width: '15%', fontWeight: 600, color: theme.colors.primaryText }}>Telegram ID</TableCell>
                        <TableCell sx={{ width: '15%', fontWeight: 600, color: theme.colors.primaryText }}>Статус</TableCell>
                        <TableCell align="center" sx={{ width: '15%', fontWeight: 600, color: theme.colors.primaryText }}>Действия</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {groupByStatus ? (
                        // Группированный вид
                        getGroupedClients().length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ color: theme.colors.secondaryText, py: 4 }}>
                                    Клиенты не найдены
                                </TableCell>
                            </TableRow>
                        ) : (
                            getGroupedClients().map(([statusId, group]) => (
                                <React.Fragment key={statusId}>
                                    {/* Заголовок группы */}
                                    <TableRow>
                                        <TableCell 
                                            colSpan={6} 
                                            sx={{
                                                backgroundColor: theme.colors.accent + '10',
                                                borderTop: `2px solid ${theme.colors.accent}`,
                                                borderBottom: `1px solid ${theme.colors.accent}30`,
                                                py: 1.5,
                                                fontWeight: 600,
                                                color: theme.colors.accent,
                                                fontSize: '0.95rem'
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <StatusIcon sx={{ fontSize: 20, mr: 1 }} />
                                                {group.statusName} ({group.clients.length})
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                    
                                    {/* Клиенты в группе */}
                                    {group.clients.map((client, clientIndex) => (
                                        <TableRow 
                                            key={client.id}
                                            sx={{
                                                backgroundColor: clientIndex % 2 === 0 ? theme.colors.tableRowEven : theme.colors.tableRowOdd,
                                                '&:hover': {
                                                    backgroundColor: theme.colors.hover
                                                },
                                                '&:last-child td': {
                                                    borderBottom: `2px solid ${theme.colors.border}`
                                                }
                                            }}
                                        >
                                            <TableCell sx={{ 
                                                color: theme.colors.primaryText,
                                                pl: 4 // Отступ для визуального вложения
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <PersonIcon sx={{ fontSize: 16, mr: 1, color: theme.colors.secondaryText }} />
                                                    {client.full_name}
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ color: theme.colors.primaryText }}>
                                                {formatPhoneForDisplay(client.phone)}
                                            </TableCell>
                                            <TableCell sx={{ color: theme.colors.secondaryText }}>
                                                {client.email || '-'}
                                            </TableCell>
                                            <TableCell sx={{ color: theme.colors.secondaryText }}>
                                                {client.telegram_chat_id || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{
                                                    display: 'inline-block',
                                                    px: 2,
                                                    py: 0.5,
                                                    borderRadius: 2,
                                                    backgroundColor: statusId === 'no_status' 
                                                        ? theme.colors.secondaryText + '20' 
                                                        : theme.colors.accent + '20',
                                                    color: statusId === 'no_status' 
                                                        ? theme.colors.secondaryText 
                                                        : theme.colors.accent,
                                                    fontSize: '0.75rem'
                                                }}>
                                                    {group.statusName}
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="Редактировать">
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => onEditClient(client)}
                                                        sx={{ mr: 0.5 }}
                                                    >
                                                        <EditIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Настройки и предпочтения">
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => onAddPreferences(client)}
                                                        sx={{ mr: 0.5 }}
                                                    >
                                                        <SettingsIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Удалить">
                                                    <IconButton 
                                                        size="small" 
                                                        color="error"
                                                        onClick={() => onDeleteClient(client)}
                                                    >
                                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </React.Fragment>
                            ))
                        )
                    ) : (
                        // Обычный список
                        getFilteredClients().length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ color: theme.colors.secondaryText, py: 4 }}>
                                    Клиенты не найдены
                                </TableCell>
                            </TableRow>
                        ) : (
                            getFilteredClients().map((client, index) => (
                                <TableRow 
                                    key={client.id}
                                    sx={{
                                        backgroundColor: index % 2 === 0 ? theme.colors.tableRowEven : theme.colors.tableRowOdd,
                                        '&:hover': {
                                            backgroundColor: theme.colors.hover
                                        }
                                    }}
                                >
                                    <TableCell sx={{ color: theme.colors.primaryText }}>{client.full_name}</TableCell>
                                    <TableCell sx={{ color: theme.colors.primaryText }}>
                                        {formatPhoneForDisplay(client.phone)}
                                    </TableCell>
                                    <TableCell sx={{ color: theme.colors.secondaryText }}>
                                        {client.email || '-'}
                                    </TableCell>
                                    <TableCell sx={{ color: theme.colors.secondaryText }}>
                                        {client.telegram_chat_id || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{
                                            display: 'inline-block',
                                            px: 2,
                                            py: 0.5,
                                            borderRadius: 2,
                                            backgroundColor: theme.colors.accent + '20',
                                            color: theme.colors.accent,
                                            fontSize: '0.8rem'
                                        }}>
                                            {getClientStatus(client.id)}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Редактировать">
                                            <IconButton 
                                                size="small" 
                                                onClick={() => onEditClient(client)}
                                                sx={{ mr: 0.5 }}
                                            >
                                                <EditIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Настройки и предпочтения">
                                            <IconButton 
                                                size="small" 
                                                onClick={() => onAddPreferences(client)}
                                                sx={{ mr: 0.5 }}
                                            >
                                                <SettingsIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Удалить">
                                            <IconButton 
                                                size="small" 
                                                color="error"
                                                onClick={() => onDeleteClient(client)}
                                            >
                                                <DeleteIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default ClientsTable;
// Компонент таблицы статусов клиентов

import React from 'react';
import {
    Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, IconButton, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StatusIcon from '@mui/icons-material/Label';
import { theme } from '../styles/theme';

const StatusesTable = ({
    clientStatuses,
    onAddStatus,
    onEditStatus,
    onDeleteStatus
}) => {
    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon sx={{ fontSize: 18 }} />}
                    onClick={onAddStatus}
                    sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        minWidth: 160,
                        boxShadow: theme.shadows.button
                    }}
                >
                    Добавить статус
                </Button>
            </Box>
            
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
                            <TableCell sx={{ fontWeight: 600, color: theme.colors.primaryText }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <StatusIcon sx={{ fontSize: 18, mr: 1 }} />
                                    Название статуса
                                </Box>
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600, color: theme.colors.primaryText, width: '20%' }}>
                                Действия
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {clientStatuses.map((status, index) => (
                            <TableRow 
                                key={status.id}
                                sx={{
                                    backgroundColor: index % 2 === 0 ? theme.colors.tableRowEven : theme.colors.tableRowOdd,
                                    '&:hover': {
                                        backgroundColor: theme.colors.hover
                                    }
                                }}
                            >
                                <TableCell sx={{ color: theme.colors.primaryText }}>{status.status}</TableCell>
                                <TableCell align="center">
                                    <Tooltip title="Редактировать">
                                        <IconButton 
                                            size="small" 
                                            onClick={() => onEditStatus(status)}
                                            sx={{ mr: 1 }}
                                        >
                                            <EditIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Удалить">
                                        <IconButton 
                                            size="small" 
                                            color="error"
                                            onClick={() => onDeleteStatus(status)}
                                        >
                                            <DeleteIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                        {clientStatuses.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={2} align="center" sx={{ color: theme.colors.secondaryText, py: 4 }}>
                                    Статусы не найдены
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
};

export default StatusesTable;
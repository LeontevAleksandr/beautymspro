import React from 'react';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow,
    Paper,
    IconButton,
    Typography
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { format } from 'date-fns';

const ExceptionsTable = ({ exceptions, onDelete }) => {
    if (exceptions.length === 0) {
        return (
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Нет добавленных перерывов
            </Typography>
        );
    }

    return (
        <TableContainer 
            component={Paper} 
            sx={{ 
                mb: 2,
                boxShadow: 'none',
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                overflow: 'hidden'
            }}
        >
            <Table size="small">
                <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Начало</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Конец</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Причина</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Действия</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {exceptions.map((exception, index) => (
                        <TableRow 
                            key={index}
                            sx={{
                                '&:hover': {
                                    backgroundColor: '#f5f7fa'
                                }
                            }}
                        >
                            <TableCell sx={{ py: 1.5 }}>
                                {format(exception.startTime, 'HH:mm')}
                            </TableCell>
                            <TableCell sx={{ py: 1.5 }}>
                                {format(exception.endTime, 'HH:mm')}
                            </TableCell>
                            <TableCell sx={{ py: 1.5 }}>
                                {exception.reason}
                            </TableCell>
                            <TableCell sx={{ py: 1.5 }}>
                                <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={() => onDelete(index)}
                                    sx={{
                                        '&:hover': {
                                            backgroundColor: 'rgba(211, 47, 47, 0.08)'
                                        }
                                    }}
                                >
                                    <Delete fontSize="small" />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default ExceptionsTable;
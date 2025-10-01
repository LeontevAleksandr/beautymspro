import React from 'react';
import { 
    Card, CardContent, Box, Typography, Alert,
    TableContainer, Table, TableHead, TableRow, 
    TableCell, TableBody, Button
} from '@mui/material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { calculateWorkloadChange } from '../utils/dateHelpers';
import { WorkloadBar, OptimalityChip } from './VisualizationComponents';

// ==================== КОМПОНЕНТ РЕЗУЛЬТАТОВ ПОИСКА ====================
export const SearchResults = ({
    smartResults,
    isSearching,
    smartSearch,
    employeeWorkload,
    handleSlotSelect
}) => {
    // Результаты поиска
    if (smartResults.length > 0) {
        return (
            <Card sx={{ border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                <CardContent sx={{ p: 0 }}>
                    <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                            Найдено {smartResults.length} вариантов
                        </Typography>
                    </Box>
                    
                    <TableContainer sx={{ maxHeight: 500 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Дата и время</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Мастер</TableCell>
                                    <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Загруженность</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Оптимальность</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Действие</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {smartResults.map((slot, index) => {
                                    const workloadData = employeeWorkload.find(w => 
                                        w.employee_id === slot.employee_id && w.period === slot.date
                                    );
                                    const currentWorkload = workloadData ? workloadData.workload_percent : 0;
                                    const estimatedNewWorkload = calculateWorkloadChange(currentWorkload, slot.duration);
                                    
                                    return (
                                        <TableRow 
                                            key={index}
                                            sx={{ 
                                                '&:hover': { 
                                                    backgroundColor: '#f5f7fa',
                                                    cursor: 'pointer' 
                                                }
                                            }}
                                            onClick={() => handleSlotSelect(slot)}
                                        >
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {format(new Date(slot.date), 'dd.MM.yyyy', { locale: ru })}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {slot.start_time} - {slot.end_time}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {slot.employee_name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <WorkloadBar 
                                                    workloadBefore={currentWorkload}
                                                    workloadAfter={estimatedNewWorkload}
                                                    employeeName={slot.employee_name}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <OptimalityChip optimality={slot.optimality} />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<CheckCircleIcon />}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSlotSelect(slot);
                                                    }}
                                                    sx={{ textTransform: 'none' }}
                                                >
                                                    Выбрать
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        );
    }
    
    // Сообщение об отсутствии результатов
    if (!isSearching && smartResults.length === 0 && smartSearch.serviceId) {
        return (
            <Alert severity="info">
                Не найдено подходящих временных слотов в указанный период. 
                Попробуйте расширить диапазон дат или изменить предпочтения.
            </Alert>
        );
    }
    
    return null;
};
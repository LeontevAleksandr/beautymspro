import React from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button,
    Box,
    Stack,
    Divider
} from '@mui/material';
import { Schedule } from '@mui/icons-material';
import FormulaSelector from './FormulaSelector';
import WorkHoursSelector from './WorkHoursSelector';
import DateRangeInfo from './DateRangeInfo';
import DateRangePicker from './DateRangePicker';
import EmployeeSelector from './EmployeeSelector';

const AutoFillDialog = ({ 
    open,
    formula,
    workHours,
    startDate,
    endDate,
    selectedRange,
    employees,
    selectedEmployees,
    onClose,
    onSave,
    onFormulaChange,
    onWorkHoursChange,
    onDateRangeSelect,
    onEmployeesChange
}) => {
    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    overflow: 'hidden'
                }
            }}
        >
            <DialogTitle 
                sx={{ 
                    borderBottom: '1px solid #e0e0e0', 
                    pb: 2,
                    fontWeight: 500,
                    backgroundColor: '#f8f9fa'
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Schedule sx={{ fontSize: 20, color: '#1976d2' }} />
                    <span>Автоматическое заполнение графика</span>
                </Stack>
            </DialogTitle>
            
            <DialogContent sx={{ pt: 3, pb: 2, backgroundColor: '#fafafa' }}>
                <Box sx={{ mt: 1 }}>
                    <Stack spacing={2.5}>
                        {/* Формула графика */}
                        <FormulaSelector
                            value={formula}
                            onChange={onFormulaChange}
                        />
                        
                        <Divider sx={{ my: 1 }} />
                        
                        {/* Рабочие часы */}
                        <WorkHoursSelector
                            startTime={workHours.start_time}
                            endTime={workHours.end_time}
                            onStartChange={(value) => onWorkHoursChange('start_time', value)}
                            onEndChange={(value) => onWorkHoursChange('end_time', value)}
                        />
                        
                        <Divider sx={{ my: 1 }} />
                        
                        {/* Диапазон дат */}
                        <Box>
                            <DateRangeInfo
                                startDate={startDate}
                                endDate={endDate}
                                selectedRange={selectedRange}
                            />
                            
                            <DateRangePicker
                                startDate={startDate}
                                endDate={endDate}
                                onChange={onDateRangeSelect}
                            />
                        </Box>
                        
                        <Divider sx={{ my: 1 }} />
                        
                        {/* Выбор сотрудников */}
                        <EmployeeSelector
                            employees={employees}
                            selectedEmployees={selectedEmployees}
                            onChange={onEmployeesChange}
                        />
                    </Stack>
                </Box>
            </DialogContent>
            
            <DialogActions 
                sx={{ 
                    borderTop: '1px solid #e0e0e0', 
                    p: 2.5,
                    gap: 1,
                    backgroundColor: '#f8f9fa'
                }}
            >
                <Button 
                    onClick={onClose}
                    sx={{ 
                        textTransform: 'none',
                        borderRadius: 2,
                        px: 3
                    }}
                >
                    Отмена
                </Button>
                <Button 
                    onClick={onSave} 
                    variant="contained" 
                    color="primary"
                    disabled={selectedEmployees.length === 0}
                    startIcon={<Schedule />}
                    sx={{ 
                        textTransform: 'none',
                        borderRadius: 2,
                        px: 3,
                        backgroundColor: '#1976d2',
                        boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)',
                        '&:hover': {
                            backgroundColor: '#1565c0',
                            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.35)'
                        }
                    }}
                >
                    Сгенерировать график
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AutoFillDialog;
import React from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button,
    Stack,
    Typography,
    Divider
} from '@mui/material';
import WorkDayInfo from './WorkDayInfo';
import WorkTimePickers from './WorkTimePickers';
import ExceptionsTable from './ExceptionsTable';
import AddExceptionForm from './AddExceptionForm';

const TimeDialog = ({ 
    open,
    isEdit,
    employeeName,
    date,
    startTime,
    endTime,
    exceptions,
    newException,
    onClose,
    onSave,
    onStartTimeChange,
    onEndTimeChange,
    onDeleteException,
    onExceptionChange,
    onAddException
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
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                }
            }}
        >
            <DialogTitle 
                sx={{ 
                    borderBottom: '1px solid #e0e0e0', 
                    pb: 2,
                    fontWeight: 500
                }}
            >
                {isEdit ? 'Редактировать рабочее время' : 'Добавить рабочий день'}
            </DialogTitle>
            
            <DialogContent sx={{ pt: 3 }}>
                <Stack spacing={2.5}>
                    {/* Основная информация */}
                    <Stack spacing={2}>
                        <Typography 
                            variant="subtitle2" 
                            sx={{ 
                                color: '#424242',
                                fontWeight: 500,
                                mb: 1
                            }}
                        >
                            Информация о рабочем дне
                        </Typography>
                        
                        <WorkDayInfo 
                            employeeName={employeeName}
                            date={date}
                        />
                        
                        <WorkTimePickers
                            startTime={startTime}
                            endTime={endTime}
                            onStartChange={onStartTimeChange}
                            onEndChange={onEndTimeChange}
                        />
                    </Stack>

                    <Divider sx={{ my: 1 }} />
                    
                    {/* Секция исключений (перерывов) */}
                    <Stack spacing={2}>
                        <Typography 
                            variant="subtitle2" 
                            sx={{ 
                                color: '#424242',
                                fontWeight: 500,
                                mb: 1
                            }}
                        >
                            Перерывы
                        </Typography>
                        
                        <ExceptionsTable 
                            exceptions={exceptions}
                            onDelete={onDeleteException}
                        />
                        
                        <AddExceptionForm
                            startTime={newException.startTime}
                            endTime={newException.endTime}
                            reason={newException.reason}
                            onChange={onExceptionChange}
                            onAdd={onAddException}
                        />
                    </Stack>
                </Stack>
            </DialogContent>
            
            <DialogActions 
                sx={{ 
                    borderTop: '1px solid #e0e0e0', 
                    p: 2.5,
                    gap: 1
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
                    sx={{ 
                        textTransform: 'none',
                        borderRadius: 2,
                        px: 3,
                        backgroundColor: '#1976d2',
                        '&:hover': {
                            backgroundColor: '#1565c0'
                        }
                    }}
                >
                    Сохранить
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TimeDialog;
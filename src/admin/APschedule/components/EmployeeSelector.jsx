import React from 'react';
import { 
    Box, 
    Typography, 
    Paper, 
    FormGroup, 
    FormControlLabel, 
    Checkbox,
    Stack
} from '@mui/material';
import { Person, Info } from '@mui/icons-material';

const EmployeeSelector = ({ employees, selectedEmployees, onChange }) => {
    const handleToggle = (employeeId) => {
        const newEmployees = selectedEmployees.includes(employeeId)
            ? selectedEmployees.filter(id => id !== employeeId)
            : [...selectedEmployees, employeeId];
        onChange(newEmployees);
    };

    return (
        <Box>
            <Typography 
                variant="subtitle2" 
                sx={{ 
                    color: '#424242',
                    fontWeight: 500,
                    mb: 1
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Person sx={{ fontSize: 18, color: '#666' }} />
                    <span>Выберите сотрудников:</span>
                </Stack>
            </Typography>
            
            <Paper 
                elevation={0} 
                sx={{ 
                    p: 2, 
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    bgcolor: 'white',
                    maxHeight: '200px',
                    overflow: 'auto'
                }}
            >
                <FormGroup sx={{ mb: 1 }}>
                    {employees.map(employee => (
                        <FormControlLabel
                            key={employee.id}
                            control={
                                <Checkbox
                                    size="small"
                                    checked={selectedEmployees.includes(employee.id)}
                                    onChange={() => handleToggle(employee.id)}
                                    sx={{
                                        '&.Mui-checked': {
                                            color: '#1976d2'
                                        }
                                    }}
                                />
                            }
                            label={
                                <Typography variant="body2">{employee.full_name}</Typography>
                            }
                            sx={{ mb: 0.5 }}
                        />
                    ))}
                </FormGroup>
            </Paper>
            
            <Box sx={{ 
                mt: 2, 
                p: 2, 
                bgcolor: '#f5f5f5', 
                borderRadius: 2, 
                border: '1px solid #e0e0e0' 
            }}>
                <Typography variant="body2" color="textSecondary">
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Info sx={{ fontSize: 16, color: '#1976d2' }} />
                        <span>
                            График будет сгенерирован в выбранном диапазоне дат. 
                            Существующие записи не будут перезаписаны.
                        </span>
                    </Stack>
                </Typography>
            </Box>
        </Box>
    );
};

export default EmployeeSelector;
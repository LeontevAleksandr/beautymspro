import React from 'react';
import { TextField } from '@mui/material';
import FormSection from './FormSection';

const BasicInfoSection = ({ 
  employeeForm, 
  formErrors, 
  onChange 
}) => {
  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2
    }
  };

  return (
    <FormSection title="Основная информация">
      <TextField
        fullWidth
        label="ФИО"
        name="full_name"
        value={employeeForm.full_name}
        onChange={onChange}
        error={formErrors.full_name}
        helperText={formErrors.full_name ? "Обязательное поле" : "Фамилия, имя и отчество"}
        required
        size="small"
        sx={textFieldStyle}
      />
      
      <TextField
        fullWidth
        label="Номер паспорта"
        name="passport_number"
        value={employeeForm.passport_number}
        onChange={onChange}
        error={formErrors.passport_number}
        helperText={formErrors.passport_number ? "Обязательное поле" : "Серия и номер без пробелов"}
        required
        size="small"
        sx={textFieldStyle}
      />
    </FormSection>
  );
};

export default BasicInfoSection;
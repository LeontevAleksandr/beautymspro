import React from 'react';
import { TextField } from '@mui/material';
import FormSection from './FormSection';

const ContactInfoSection = ({ 
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
    <FormSection title="Контактная информация">
      <TextField
        fullWidth
        label="Телефон"
        name="phone"
        value={employeeForm.phone}
        onChange={onChange}
        error={formErrors.phone}
        helperText={formErrors.phone ? "Неверный формат" : "Формат: +79001234567"}
        size="small"
        sx={textFieldStyle}
      />
      
      <TextField
        fullWidth
        label="Email"
        name="email"
        value={employeeForm.email}
        onChange={onChange}
        error={formErrors.email}
        helperText={formErrors.email ? "Неверный формат" : "example@domain.com"}
        size="small"
        sx={textFieldStyle}
      />
    </FormSection>
  );
};

export default ContactInfoSection;
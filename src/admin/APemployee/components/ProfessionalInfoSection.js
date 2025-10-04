import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import FormSection from './FormSection';

const ProfessionalInfoSection = ({ 
  employeeForm, 
  onChange,
  specializations,
  availableQualifications
}) => {
  const selectStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2
    }
  };

  return (
    <FormSection title="Профессиональная информация">
      <FormControl 
        fullWidth 
        size="small"
        sx={selectStyle}
      >
        <InputLabel>Специализация</InputLabel>
        <Select
          name="specialization_id"
          value={employeeForm.specialization_id}
          onChange={onChange}
          label="Специализация"
        >
          <MenuItem value="">Не выбрано</MenuItem>
          {specializations.map(spec => (
            <MenuItem key={spec.id} value={spec.id}>{spec.name}</MenuItem>
          ))}
        </Select>
        <FormHelperText>Выберите специализацию из списка</FormHelperText>
      </FormControl>
      
      <FormControl 
        fullWidth 
        size="small"
        disabled={!employeeForm.specialization_id}
        sx={selectStyle}
      >
        <InputLabel>Квалификация</InputLabel>
        <Select
          name="qualification_level_id"
          value={employeeForm.qualification_level_id}
          onChange={onChange}
          label="Квалификация"
        >
          <MenuItem value="">Не выбрано</MenuItem>
          {availableQualifications.map(qual => (
            <MenuItem key={qual.id} value={qual.id}>{qual.name}</MenuItem>
          ))}
        </Select>
        <FormHelperText>
          {!employeeForm.specialization_id 
            ? "Сначала выберите специализацию" 
            : "Выберите уровень квалификации"}
        </FormHelperText>
      </FormControl>
    </FormSection>
  );
};

export default ProfessionalInfoSection;
import React from 'react';
import { TextField, Box, FormControlLabel, Checkbox } from '@mui/material';
import FormSection from './FormSection';

const SecuritySection = ({ 
  employeeForm, 
  formErrors, 
  onChange,
  selectedEmployee,
  changePassword,
  onChangePasswordToggle
}) => {
  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2
    }
  };

  return (
    <FormSection title="Безопасность">
      {selectedEmployee ? (
        <Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={changePassword}
                onChange={onChangePasswordToggle}
                size="small"
              />
            }
            label="Изменить пароль"
            sx={{ mb: changePassword ? 2 : 0 }}
          />
          {changePassword && (
            <TextField
              fullWidth
              label="Новый пароль"
              name="password"
              type="password"
              value={employeeForm.password}
              onChange={onChange}
              error={formErrors.password}
              helperText={formErrors.password ? "Обязательное поле" : "Новый пароль для входа"}
              required
              size="small"
              sx={textFieldStyle}
            />
          )}
        </Box>
      ) : (
        <TextField
          fullWidth
          label="Пароль"
          name="password"
          type="password"
          value={employeeForm.password}
          onChange={onChange}
          error={formErrors.password}
          helperText={formErrors.password ? "Обязательное поле" : "Пароль для входа в систему"}
          required
          size="small"
          sx={textFieldStyle}
        />
      )}
    </FormSection>
  );
};

export default SecuritySection;
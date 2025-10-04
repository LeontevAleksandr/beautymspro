import React from 'react';
import { 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle,
  Button,
  Stack,
  Divider
} from '@mui/material';
import BasicInfoSection from './BasicInfoSection';
import ContactInfoSection from './ContactInfoSection';
import SecuritySection from './SecuritySection';
import ProfessionalInfoSection from './ProfessionalInfoSection';
import { 
  dialogPaperStyle, 
  dialogTitleStyle, 
  dialogContentStyle,
  primaryButtonStyle,
  secondaryButtonStyle 
} from '../styles/formStyles';

const EmployeeDialog = ({ 
  open,
  onClose,
  onSubmit,
  selectedEmployee,
  employeeForm,
  formErrors,
  onChange,
  changePassword,
  onChangePasswordToggle,
  specializations,
  availableQualifications
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: dialogPaperStyle }}
    >
      <DialogTitle sx={dialogTitleStyle}>
        {selectedEmployee ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
      </DialogTitle>

      <DialogContent sx={dialogContentStyle}>
        <Stack spacing={2.5}>
          <BasicInfoSection
            employeeForm={employeeForm}
            formErrors={formErrors}
            onChange={onChange}
          />

          <Divider sx={{ my: 1 }} />

          <ContactInfoSection
            employeeForm={employeeForm}
            formErrors={formErrors}
            onChange={onChange}
          />

          <Divider sx={{ my: 1 }} />

          <SecuritySection
            employeeForm={employeeForm}
            formErrors={formErrors}
            onChange={onChange}
            selectedEmployee={selectedEmployee}
            changePassword={changePassword}
            onChangePasswordToggle={onChangePasswordToggle}
          />

          <Divider sx={{ my: 1 }} />

          <ProfessionalInfoSection
            employeeForm={employeeForm}
            onChange={onChange}
            specializations={specializations}
            availableQualifications={availableQualifications}
          />
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
            ...secondaryButtonStyle,
            px: 3
          }}
        >
          Отмена
        </Button>
        <Button 
          onClick={onSubmit} 
          variant="contained"
          sx={{ 
            ...primaryButtonStyle,
            px: 3
          }}
        >
          {selectedEmployee ? 'Сохранить' : 'Добавить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeDialog;
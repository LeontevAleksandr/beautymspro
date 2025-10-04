import React from 'react';
import { Box } from '@mui/material';
import { useEmployeesData } from './hooks/useEmployeesData';
import { useEmployeeForm } from './hooks/useEmployeeForm';
import { useEmployeeActions } from './hooks/useEmployeeActions';
import { useSnackbar } from './hooks/useSnackbar';
import PageHeader from './components/PageHeader';
import EmployeesTable from './components/EmployeesTable';
import EmployeeDialog from './components/EmployeeDialog';
import NotificationSnackbar from './components/NotificationSnackbar';

function APemployee() {
  // Хук уведомлений
  const { snackbar, showSnackbar, handleCloseSnackbar } = useSnackbar();

  // Хук данных сотрудников
  const {
    employees,
    specializations,
    qualifications,
    groupedEmployees,
    loading,
    loadEmployees
  } = useEmployeesData(showSnackbar);

  // Хук формы сотрудника
  const {
    employeeForm,
    formErrors,
    selectedEmployee,
    changePassword,
    availableQualifications,
    openEmployeeDialog,
    handleFormChange,
    validateForm,
    openAddDialog,
    openEditDialog,
    closeDialog,
    handleChangePasswordToggle
  } = useEmployeeForm(qualifications, showSnackbar);

  // Хук действий с сотрудниками
  const {
    handleDeleteEmployee,
    handleSubmitEmployee
  } = useEmployeeActions(
    loadEmployees,
    closeDialog,
    showSnackbar,
    validateForm,
    employeeForm,
    selectedEmployee,
    changePassword
  );

  return (
    <Box sx={{ 
      p: 3, 
      backgroundColor: '#fafafa',
      minHeight: '100vh'
    }}>
      {/* Заголовок страницы */}
      <PageHeader
        employeesCount={employees.length}
        specializationsCount={Object.keys(groupedEmployees).length}
        onAddEmployee={openAddDialog}
      />

      {/* Таблица сотрудников */}
      <EmployeesTable
        groupedEmployees={groupedEmployees}
        onEdit={openEditDialog}
        onDelete={handleDeleteEmployee}
      />

      {/* Диалог добавления/редактирования */}
      <EmployeeDialog
        open={openEmployeeDialog}
        onClose={closeDialog}
        onSubmit={handleSubmitEmployee}
        selectedEmployee={selectedEmployee}
        employeeForm={employeeForm}
        formErrors={formErrors}
        onChange={handleFormChange}
        changePassword={changePassword}
        onChangePasswordToggle={handleChangePasswordToggle}
        specializations={specializations}
        availableQualifications={availableQualifications}
      />

      {/* Уведомления */}
      <NotificationSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleCloseSnackbar}
      />
    </Box>
  );
}

export default APemployee;
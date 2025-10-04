import { createEmployee, updateEmployee, deleteEmployee } from '../services/employeeService';

export const useEmployeeActions = (
  loadEmployees, 
  closeDialog, 
  showSnackbar,
  validateForm,
  employeeForm,
  selectedEmployee,
  changePassword
) => {
  // Удаление сотрудника
  const handleDeleteEmployee = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
      try {
        await deleteEmployee(id);
        loadEmployees();
        showSnackbar('Сотрудник успешно удален', 'success');
      } catch (error) {
        showSnackbar(error.message, 'error');
      }
    }
  };

  // Сохранение сотрудника (создание или обновление)
  const handleSubmitEmployee = async () => {
    if (!validateForm()) {
      showSnackbar('Пожалуйста, заполните все обязательные поля корректно', 'error');
      return;
    }

    try {
      // Создаем копию данных формы
      const formData = { ...employeeForm };

      // Если редактируем сотрудника и не меняем пароль, удаляем поле password
      if (selectedEmployee && !changePassword) {
        delete formData.password;
      }

      if (selectedEmployee) {
        await updateEmployee(selectedEmployee.id, formData);
        showSnackbar('Сотрудник успешно обновлен', 'success');
      } else {
        await createEmployee(formData);
        showSnackbar('Сотрудник успешно добавлен', 'success');
      }

      loadEmployees();
      closeDialog();
    } catch (error) {
      showSnackbar(error.message, 'error');
    }
  };

  return {
    handleDeleteEmployee,
    handleSubmitEmployee
  };
};
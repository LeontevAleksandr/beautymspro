import { useState } from 'react';
import { INITIAL_EMPLOYEE_FORM, INITIAL_FORM_ERRORS } from '../utils/constants';
import { validateEmployeeForm } from '../utils/validation';
import { fetchSpecializationQualifications } from '../services/employeeService';
import { filterQualificationsBySpecialization } from '../utils/dataUtils';

export const useEmployeeForm = (qualifications, showSnackbar) => {
  const [employeeForm, setEmployeeForm] = useState(INITIAL_EMPLOYEE_FORM);
  const [formErrors, setFormErrors] = useState(INITIAL_FORM_ERRORS);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [changePassword, setChangePassword] = useState(false);
  const [availableQualifications, setAvailableQualifications] = useState([]);
  const [openEmployeeDialog, setOpenEmployeeDialog] = useState(false);

  // Загрузка доступных квалификаций для выбранной специализации
  const loadQualificationsBySpecialization = async (specializationId) => {
    if (!specializationId) {
      setAvailableQualifications([]);
      return;
    }

    try {
      const data = await fetchSpecializationQualifications();
      const availableQuals = filterQualificationsBySpecialization(
        data, 
        qualifications, 
        specializationId
      );
      
      setAvailableQualifications(availableQuals);
      
      // Сбрасываем выбранную квалификацию, если она не доступна для новой специализации
      const qualIds = data
        .filter(item => item.specialization_id === parseInt(specializationId))
        .map(item => item.qualification_id);
      
      if (employeeForm.qualification_level_id && 
          !qualIds.includes(parseInt(employeeForm.qualification_level_id))) {
        setEmployeeForm(prev => ({
          ...prev,
          qualification_level_id: ''
        }));
      }
    } catch (error) {
      showSnackbar(error.message, 'error');
      setAvailableQualifications([]);
    }
  };

  // Обработка изменений в форме
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    // Если изменилась специализация, обновляем доступные квалификации
    if (name === 'specialization_id') {
      loadQualificationsBySpecialization(value);
    }
    
    setEmployeeForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Сбрасываем ошибку для поля, которое изменилось
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: false
      }));
    }
  };

  // Валидация формы
  const validateForm = () => {
    const { errors, isValid } = validateEmployeeForm(
      employeeForm, 
      selectedEmployee, 
      changePassword
    );
    
    setFormErrors(errors);
    return isValid;
  };

  // Открытие диалога для добавления сотрудника
  const openAddDialog = () => {
    setSelectedEmployee(null);
    setEmployeeForm(INITIAL_EMPLOYEE_FORM);
    setFormErrors(INITIAL_FORM_ERRORS);
    setChangePassword(false);
    setAvailableQualifications([]);
    setOpenEmployeeDialog(true);
  };

  // Открытие диалога для редактирования сотрудника
  const openEditDialog = (employee) => {
    setSelectedEmployee(employee);
    setEmployeeForm({
      full_name: employee.full_name,
      passport_number: employee.passport_number,
      phone: employee.phone || '',
      email: employee.email || '',
      password: '',
      specialization_id: employee.specialization_id || '',
      qualification_level_id: employee.qualification_level_id || ''
    });
    setFormErrors(INITIAL_FORM_ERRORS);
    setChangePassword(false);
    
    // Загружаем доступные квалификации для выбранной специализации
    if (employee.specialization_id) {
      loadQualificationsBySpecialization(employee.specialization_id);
    } else {
      setAvailableQualifications([]);
    }
    
    setOpenEmployeeDialog(true);
  };

  // Закрытие диалога
  const closeDialog = () => {
    setOpenEmployeeDialog(false);
    setSelectedEmployee(null);
    setEmployeeForm(INITIAL_EMPLOYEE_FORM);
    setFormErrors(INITIAL_FORM_ERRORS);
    setChangePassword(false);
    setAvailableQualifications([]);
  };

  // Обработка переключения изменения пароля
  const handleChangePasswordToggle = (e) => {
    setChangePassword(e.target.checked);
    if (!e.target.checked) {
      // Если отключили изменение пароля, сбрасываем ошибку пароля
      setFormErrors(prev => ({
        ...prev,
        password: false
      }));
    }
  };

  return {
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
  };
};
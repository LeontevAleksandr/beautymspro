// Валидация телефона
export const validatePhone = (phone) => {
  if (!phone) return false;
  return /^\+?\d{10,15}$/.test(phone);
};

// Валидация email
export const validateEmail = (email) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Валидация формы сотрудника
export const validateEmployeeForm = (employeeForm, selectedEmployee, changePassword) => {
  const errors = {
    full_name: !employeeForm.full_name.trim(),
    passport_number: !employeeForm.passport_number.trim(),
    phone: employeeForm.phone && !validatePhone(employeeForm.phone),
    email: employeeForm.email && !validateEmail(employeeForm.email),
    password: (!selectedEmployee && !employeeForm.password) || 
              (selectedEmployee && changePassword && !employeeForm.password)
  };
  
  return {
    errors,
    isValid: !Object.values(errors).some(error => error)
  };
};
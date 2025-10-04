import { useState, useEffect } from 'react';
import { 
  fetchEmployees, 
  fetchSpecializations, 
  fetchQualifications 
} from '../services/employeeService';
import { groupEmployeesBySpecialization, sortQualificationsByPriority } from '../utils/dataUtils';

export const useEmployeesData = (showSnackbar) => {
  const [employees, setEmployees] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [groupedEmployees, setGroupedEmployees] = useState({});
  const [loading, setLoading] = useState(true);

  // Загрузка сотрудников
  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await fetchEmployees();
      setEmployees(data);
    } catch (error) {
      showSnackbar(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка специализаций
  const loadSpecializations = async () => {
    try {
      const data = await fetchSpecializations();
      setSpecializations(data);
    } catch (error) {
      showSnackbar(error.message, 'error');
    }
  };

  // Загрузка квалификаций
  const loadQualifications = async () => {
    try {
      const data = await fetchQualifications();
      const sortedData = sortQualificationsByPriority(data);
      setQualifications(sortedData);
    } catch (error) {
      showSnackbar(error.message, 'error');
    }
  };

  // Загрузка всех данных при монтировании
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadEmployees(),
          loadSpecializations(),
          loadQualifications()
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
  }, []);

  // Группировка сотрудников при изменении данных
  useEffect(() => {
    if (employees.length > 0) {
      const grouped = groupEmployeesBySpecialization(employees);
      setGroupedEmployees(grouped);
    }
  }, [employees]);

  return {
    employees,
    specializations,
    qualifications,
    groupedEmployees,
    loading,
    loadEmployees
  };
};
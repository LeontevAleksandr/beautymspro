import { NO_SPECIALIZATION_KEY, NO_SPECIALIZATION_ID, DEFAULT_PRIORITY } from './constants';

// Группировка сотрудников по специализациям
export const groupEmployeesBySpecialization = (employees) => {
  const grouped = {};
  
  employees.forEach(employee => {
    const specializationName = employee.specialization 
      ? employee.specialization.name 
      : NO_SPECIALIZATION_KEY;
    const specializationId = employee.specialization 
      ? employee.specialization.id 
      : NO_SPECIALIZATION_ID;
    
    if (!grouped[specializationName]) {
      grouped[specializationName] = {
        id: specializationId,
        name: specializationName,
        employees: []
      };
    }
    
    grouped[specializationName].employees.push(employee);
  });
  
  // Сортируем сотрудников внутри каждой группы по приоритету квалификации
  Object.keys(grouped).forEach(specName => {
    grouped[specName].employees.sort((a, b) => {
      const priorityA = a.qualification ? a.qualification.priority : DEFAULT_PRIORITY;
      const priorityB = b.qualification ? b.qualification.priority : DEFAULT_PRIORITY;
      return priorityA - priorityB;
    });
  });
  
  return grouped;
};

// Сортировка квалификаций по приоритету
export const sortQualificationsByPriority = (qualifications) => {
  return [...qualifications].sort((a, b) => a.priority - b.priority);
};

// Фильтрация квалификаций по специализации
export const filterQualificationsBySpecialization = (
  specializationQualifications, 
  qualifications, 
  specializationId
) => {
  const filteredData = specializationQualifications.filter(
    item => item.specialization_id === parseInt(specializationId)
  );
  
  const qualIds = filteredData.map(item => item.qualification_id);
  const availableQuals = qualifications.filter(q => qualIds.includes(q.id));
  
  return sortQualificationsByPriority(availableQuals);
};
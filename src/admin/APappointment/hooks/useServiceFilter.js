import { useMemo } from 'react';

// ==================== ХУК ФИЛЬТРАЦИИ УСЛУГ ПО МАСТЕРУ ====================
export const useServiceFilter = (services, employees, newRecord, serviceQualifications) => {
    const filteredServices = useMemo(() => {
        // Если мастер не выбран, показываем все услуги
        if (!newRecord.employee_id) {
            return services;
        }

        const selectedEmployee = employees.find(emp => emp.id === newRecord.employee_id);
        if (!selectedEmployee) {
            return services;
        }

        // Фильтруем услуги по специализации мастера
        const servicesBySpecialization = services.filter(
            service => service.specialization_id === selectedEmployee.specialization_id
        );

        // Дополнительно фильтруем по квалификации, если есть данные
        if (serviceQualifications.length > 0) {
            return servicesBySpecialization.filter(service => {
                return serviceQualifications.some(q => 
                    q.service_id === service.id &&
                    q.qualification_id === selectedEmployee.qualification_level_id && 
                    q.is_allowed
                );
            });
        }

        return servicesBySpecialization;
    }, [services, employees, newRecord.employee_id, serviceQualifications]);

    return filteredServices;
};
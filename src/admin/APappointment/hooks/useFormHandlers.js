import { useCallback } from 'react';
import { fetchServiceQualifications } from '../services/api.js';

// ==================== ОБРАБОТЧИКИ ФОРМ ====================
export const useFormHandlers = ({
    services,
    employees,
    serviceQualifications,
    newRecord,
    setAvailableEmployees,
    setServicePrice,
    setNewRecord
}) => {
    const updateAvailableEmployees = useCallback(async (serviceId) => {
        if (!serviceId) {
            setAvailableEmployees([]);
            setServicePrice(null);
            return;
        }

        try {
            const selectedService = services.find(s => s.id === serviceId);
            if (!selectedService) return;

            const qualifications = await fetchServiceQualifications(serviceId);
            
            const filtered = employees.filter(emp => {
                if (emp.specialization_id !== selectedService.specialization_id) return false;
                
                return qualifications.some(q => 
                    q.qualification_id === emp.qualification_level_id && q.is_allowed
                );
            });
            
            setAvailableEmployees(filtered);
            
            if (newRecord.employee_id && !filtered.some(emp => emp.id === newRecord.employee_id)) {
                setNewRecord(prev => ({ ...prev, employee_id: '' }));
                setServicePrice(null);
            }
        } catch (error) {
            console.error('Ошибка при обновлении списка мастеров:', error);
            setAvailableEmployees([]);
        }
    }, [services, employees, newRecord.employee_id, setAvailableEmployees, setServicePrice, setNewRecord]);

    const updateServicePrice = useCallback((serviceId, employeeId) => {
        if (!serviceId || !employeeId) {
            setServicePrice(null);
            return;
        }

        try {
            const selectedService = services.find(s => s.id === serviceId);
            const selectedEmployee = employees.find(e => e.id === employeeId);
            
            if (!selectedService || !selectedEmployee) return;

            const qualification = serviceQualifications.find(q => 
                q.qualification_id === selectedEmployee.qualification_level_id
            );

            const calculatedPrice = qualification?.price_modified || selectedService.base_price;
            setServicePrice(calculatedPrice);
            
            setNewRecord(prev => ({ ...prev, final_price: calculatedPrice }));
        } catch (error) {
            console.error('Ошибка при обновлении цены услуги:', error);
            setServicePrice(null);
        }
    }, [services, employees, serviceQualifications, setServicePrice, setNewRecord]);

    return {
        updateAvailableEmployees,
        updateServicePrice
    };
};
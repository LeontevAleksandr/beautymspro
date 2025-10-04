import { useCallback } from 'react';

// ==================== ОБРАБОТЧИКИ ФОРМ ====================
export const useFormHandlers = ({
    services,
    employees,
    serviceQualifications,
    qualificationsCache, // ДОБАВЛЕНО: кэш
    newRecord,
    setAvailableEmployees,
    setServicePrice,
    setNewRecord,
    showSnackbar,
    loadServiceQualifications // ДОБАВЛЕНО: функция загрузки с кэшем
}) => {
    const updateAvailableEmployees = useCallback(async (serviceId) => {
        if (!serviceId) {
            setAvailableEmployees([]);
            setServicePrice(null);
            setNewRecord(prev => ({ ...prev, custom_duration: '', final_price: '' }));
            return;
        }

        try {
            const selectedService = services.find(s => s.id === serviceId);
            if (!selectedService) return;

            // Сразу устанавливаем базовые значения услуги
            setServicePrice(selectedService.base_price);
            setNewRecord(prev => ({ 
                ...prev, 
                custom_duration: selectedService.duration,
                final_price: selectedService.base_price 
            }));

            // ИСПРАВЛЕНО: Используем loadServiceQualifications с кэшем
            const qualifications = await loadServiceQualifications(serviceId);
            
            const filtered = employees.filter(emp => {
                if (emp.specialization_id !== selectedService.specialization_id) return false;
                return qualifications.some(q => 
                    q.qualification_id === emp.qualification_level_id && q.is_allowed
                );
            });
            
            setAvailableEmployees(filtered);
            
            if (newRecord.employee_id && !filtered.some(emp => emp.id === newRecord.employee_id)) {
                showSnackbar('Выбранный мастер не может выполнить эту услугу', 'warning');
            }
        } catch (error) {
            console.error('Ошибка при обновлении списка мастеров:', error);
            setAvailableEmployees([]);
        }
    }, [services, employees, newRecord.employee_id, setAvailableEmployees, setServicePrice, setNewRecord, showSnackbar, loadServiceQualifications]);

    const updateServicePrice = useCallback((serviceId, employeeId) => {
        if (!serviceId || !employeeId) return;

        try {
            const selectedService = services.find(s => s.id === serviceId);
            const selectedEmployee = employees.find(e => e.id === employeeId);
            
            if (!selectedService || !selectedEmployee) return;

            // Ищем модифицированную цену по квалификации
            const qualification = serviceQualifications.find(q => 
                q.qualification_id === selectedEmployee.qualification_level_id
            );

            const calculatedPrice = qualification?.price_modified || selectedService.base_price;
            setServicePrice(calculatedPrice);
            
            // Обновляем только цену, продолжительность уже установлена
            setNewRecord(prev => ({ ...prev, final_price: calculatedPrice }));
        } catch (error) {
            console.error('Ошибка при обновлении цены услуги:', error);
        }
    }, [services, employees, serviceQualifications, setServicePrice, setNewRecord]);

    return {
        updateAvailableEmployees,
        updateServicePrice
    };
};
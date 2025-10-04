import { useCallback } from 'react';
import { format } from 'date-fns';
import { fetchEmployeeWorkload, fetchAvailableSlots } from '../services/smartSearchApi.js';
import { fetchServiceQualifications } from '../services/api.js';
import { calculateSlotOptimality } from '../utils/dateHelpers.js';
import { INITIAL_RECORD_STATE } from '../utils/constants.js';

export const useSmartSearch = ({
    smartSearch,
    services,
    employees,
    setEmployeeWorkload,
    setServerError,
    setIsSearching,
    setSmartResults,
    setSelectedSlot,
    setNewRecord,
    setAvailableEmployees,
    setServicePrice,
    setOpenSmartDialog,
    showSnackbar
}) => {
    // ==================== ФУНКЦИИ УМНОГО ПОИСКА ====================
    const performSmartSearch = useCallback(async () => {
        if (!smartSearch.serviceId) {
            setServerError('Выберите услугу для поиска');
            return;
        }

        setIsSearching(true);
        setServerError(null);

        try {
            console.log('Начинаем умный поиск...', smartSearch);

            // Получаем данные о загруженности
            const workload = await fetchEmployeeWorkload(smartSearch.startDate, smartSearch.endDate);
            setEmployeeWorkload(workload);
            console.log('Загруженность сотрудников:', workload);

            // Определяем мастеров для поиска
            const service = services.find(s => s.id === parseInt(smartSearch.serviceId));
            if (!service) {
                setServerError('Услуга не найдена');
                return;
            }

            console.log('Выбранная услуга:', service);

            const qualifications = await fetchServiceQualifications(smartSearch.serviceId);
            const suitableEmployees = employees.filter(emp => {
                if (emp.specialization_id !== service.specialization_id) return false;
                return qualifications.some(q => 
                    q.qualification_id === emp.qualification_level_id && q.is_allowed
                );
            });

            console.log('Подходящие мастера:', suitableEmployees);

            if (suitableEmployees.length === 0) {
                setServerError('Не найдены мастера для выбранной услуги');
                return;
            }

            // Фильтруем мастеров по предпочтениям
            const employeesToSearch = smartSearch.preferredEmployeeId 
                ? suitableEmployees.filter(emp => emp.id === parseInt(smartSearch.preferredEmployeeId))
                : suitableEmployees;

            console.log('Мастера для поиска:', employeesToSearch);

            // Собираем все доступные слоты
            const allSlots = [];
            const currentDate = new Date(smartSearch.startDate);
            const endDate = new Date(smartSearch.endDate);

            while (currentDate <= endDate) {
                const dateString = format(currentDate, 'yyyy-MM-dd');
                
                for (const employee of employeesToSearch) {
                    try {
                        const slots = await fetchAvailableSlots(employee.id, currentDate, smartSearch.serviceId);
                        console.log(`Слоты для ${employee.full_name} на ${dateString}:`, slots);
                        
                        slots.forEach(slot => {
                            allSlots.push({
                                date: dateString,
                                start_time: slot.start,
                                end_time: slot.end,
                                duration: slot.duration,
                                employee_id: employee.id,
                                employee_name: employee.full_name,
                                service_id: smartSearch.serviceId,
                                service_name: service.name,
                                price: service.base_price
                            });
                        });
                    } catch (error) {
                        console.error(`Ошибка при загрузке слотов для ${employee.full_name}:`, error);
                    }
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }

            console.log('Все найденные слоты:', allSlots);

            if (allSlots.length === 0) {
                setServerError('Не найдено доступных временных слотов в указанный период');
                setSmartResults([]);
                return;
            }

            // Рассчитываем оптимальность и сортируем
            const slotsWithScore = allSlots.map(slot => ({
                ...slot,
                optimality: calculateSlotOptimality(slot, smartSearch, workload)
            }));

            slotsWithScore.sort((a, b) => b.optimality - a.optimality);

            const limitedResults = slotsWithScore.slice(0, smartSearch.maxResults);
            setSmartResults(limitedResults);
            console.log('Результаты с оценками:', limitedResults);

            if (limitedResults.length === 0) {
                setServerError('Не найдено подходящих слотов с учетом ваших предпочтений');
            }

        } catch (error) {
            console.error('Ошибка при выполнении поиска:', error);
            setServerError('Ошибка при поиске времени: ' + error.message);
        } finally {
            setIsSearching(false);
        }
    }, [smartSearch, services, employees, setEmployeeWorkload, setServerError, setIsSearching, setSmartResults]);

    const handleSlotSelect = useCallback((slot) => {
        setSelectedSlot(slot);
        
        // Автозаполнение формы записи
        setNewRecord({
            ...INITIAL_RECORD_STATE,
            service_id: slot.service_id,
            employee_id: slot.employee_id,
            date: slot.date,
            time: slot.start_time,
            final_price: slot.price,
            reminder_time: '' // Сбрасываем напоминание при автоподборе
        });

        // Устанавливаем доступных мастеров (только выбранного)
        const selectedEmployee = employees.find(emp => emp.id === slot.employee_id);
        if (selectedEmployee) {
            setAvailableEmployees([selectedEmployee]);
        }

        setServicePrice(slot.price);
        setOpenSmartDialog(false);
        
        showSnackbar('Слот выбран! Заполните данные клиента для завершения записи.', 'success');
    }, [employees, setSelectedSlot, setNewRecord, setAvailableEmployees, setServicePrice, setOpenSmartDialog, showSnackbar]);

    return {
        performSmartSearch,
        handleSlotSelect
    };
};
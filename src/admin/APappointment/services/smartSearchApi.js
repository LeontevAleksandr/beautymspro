import { format } from 'date-fns';

const API_BASE_URL = 'http://localhost:5000/api';

// ==================== ФУНКЦИИ УМНОГО ПОИСКА ====================
export const fetchEmployeeWorkload = async (startDate, endDate) => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/analytics/employee_workload?start_date=${format(startDate, 'yyyy-MM-dd')}&end_date=${format(endDate, 'yyyy-MM-dd')}&group_by=day`
        );
        if (response.ok) {
            const data = await response.json();
            // Преобразуем в плоский массив для удобства
            const flatWorkload = [];
            data.employees.forEach(emp => {
                emp.workload.forEach(w => {
                    flatWorkload.push({
                        employee_id: emp.employee_id,
                        employee_name: emp.employee_name,
                        period: w.period,
                        workload_percent: w.workload_percent,
                        booked_hours: w.booked_hours,
                        total_hours: w.total_hours
                    });
                });
            });
            return flatWorkload;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
        console.error('Ошибка при загрузке данных загруженности:', error);
        throw error;
    }
};

export const fetchAvailableSlots = async (employeeId, date, serviceId) => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/available_slots?employee_id=${employeeId}&date=${format(date, 'yyyy-MM-dd')}&service_id=${serviceId}`
        );
        if (response.ok) {
            const data = await response.json();
            // Возвращаем массив слотов в правильном формате
            return data.available_slots || [];
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
        console.error('Ошибка при загрузке доступных слотов:', error);
        throw error;
    }
};
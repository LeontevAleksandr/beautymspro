/**
 * Вспомогательные функции для работы с данными загруженности
 */

/**
 * Подготовка данных для графика из данных загруженности
 * @param {Object} data - Данные загруженности от API
 * @param {Array<number>} selectedEmployees - ID выбранных сотрудников
 * @returns {Array<Object>} Данные для отображения на графике
 */
export const prepareChartData = (data, selectedEmployees) => {
    if (!data || !data.employees) return [];

    const selectedEmployeesData = data.employees.filter(emp => 
        selectedEmployees.includes(emp.employee_id)
    );

    // Собираем все уникальные периоды
    const allPeriods = new Set();
    selectedEmployeesData.forEach(emp => {
        emp.workload.forEach(period => allPeriods.add(period.period));
    });

    // Создаем данные для графика
    const chartData = Array.from(allPeriods).sort().map(period => {
        const dataPoint = { period };
        selectedEmployeesData.forEach(emp => {
            const periodData = emp.workload.find(w => w.period === period);
            dataPoint[emp.employee_name] = periodData ? periodData.workload_percent : 0;
        });
        return dataPoint;
    });

    return chartData;
};

/**
 * Получение отсортированных сотрудников для графика с расчетом средней загруженности
 * @param {Object} workloadData - Данные загруженности от API
 * @param {Array<number>} selectedEmployees - ID выбранных сотрудников
 * @returns {Array<Object>} Отсортированные сотрудники с avgWorkload
 */
export const getSortedEmployeesForChart = (workloadData, selectedEmployees) => {
    if (!workloadData) return [];
    
    const selectedEmployeesData = workloadData.employees.filter(emp => 
        selectedEmployees.includes(emp.employee_id)
    );

    return selectedEmployeesData
        .map(emp => {
            const avgWorkload = Math.round(
                emp.workload.reduce((sum, period) => sum + period.workload_percent, 0) / 
                emp.workload.length
            );
            return {
                ...emp,
                avgWorkload
            };
        })
        .sort((a, b) => b.avgWorkload - a.avgWorkload);
};

/**
 * Получение топ-N самых загруженных сотрудников
 * @param {Object} workloadData - Данные загруженности от API
 * @param {number} count - Количество сотрудников для выборки
 * @returns {Array<number>} ID самых загруженных сотрудников
 */
export const getTopLoadedEmployees = (workloadData, count = 5) => {
    if (!workloadData || !workloadData.employees) return [];

    return workloadData.employees
        .map(emp => ({
            ...emp,
            avgWorkload: emp.workload.reduce((sum, p) => sum + p.workload_percent, 0) / emp.workload.length
        }))
        .sort((a, b) => b.avgWorkload - a.avgWorkload)
        .slice(0, count)
        .map(emp => emp.employee_id);
};

/**
 * Расчет средней загруженности сотрудника
 * @param {Object} employee - Объект сотрудника с массивом workload
 * @returns {number} Средняя загруженность (округленная)
 */
export const calculateAverageWorkload = (employee) => {
    if (!employee || !employee.workload || employee.workload.length === 0) return 0;
    
    const total = employee.workload.reduce((sum, period) => sum + period.workload_percent, 0);
    return Math.round(total / employee.workload.length);
};
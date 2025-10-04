import { ENDPOINTS } from '../utils/constants';

/**
 * API функции для работы с загруженностью сотрудников
 */

/**
 * Получение списка всех сотрудников
 * @returns {Promise<Array>} Массив сотрудников
 * @throws {Error} При ошибке запроса
 */
export const fetchEmployees = async () => {
    try {
        const response = await fetch(ENDPOINTS.EMPLOYEES);
        if (!response.ok) {
            throw new Error('Ошибка при получении списка сотрудников');
        }
        return await response.json();
    } catch (error) {
        console.error('Ошибка fetchEmployees:', error);
        throw error;
    }
};

/**
 * Получение данных загруженности сотрудников за период
 * @param {string} startDate - Дата начала периода (YYYY-MM-DD)
 * @param {string} endDate - Дата окончания периода (YYYY-MM-DD)
 * @param {string} groupBy - Группировка данных (day/week/month)
 * @returns {Promise<Object>} Данные загруженности
 * @throws {Error} При ошибке запроса
 */
export const fetchWorkloadData = async (startDate, endDate, groupBy) => {
    try {
        const url = `${ENDPOINTS.EMPLOYEE_WORKLOAD}?start_date=${startDate}&end_date=${endDate}&group_by=${groupBy}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Ошибка при получении данных загруженности');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Ошибка fetchWorkloadData:', error);
        throw error;
    }
};
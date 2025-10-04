import { useState, useEffect } from 'react';
import { fetchEmployees, fetchWorkloadData } from '../services/workloadApi';
import { prepareChartData, getTopLoadedEmployees } from '../utils/workloadHelpers';
import { INITIAL_FILTERS, DEFAULT_TOP_EMPLOYEES_COUNT } from '../utils/constants';

/**
 * Хук для управления данными загруженности сотрудников
 * @returns {Object} Состояния и функции для работы с данными загруженности
 */
export const useWorkloadData = () => {
    // Состояние для фильтров
    const [startDate, setStartDate] = useState(INITIAL_FILTERS.START_DATE);
    const [endDate, setEndDate] = useState(INITIAL_FILTERS.END_DATE);
    const [groupBy, setGroupBy] = useState(INITIAL_FILTERS.GROUP_BY);
    
    // Состояние для данных
    const [loading, setLoading] = useState(false);
    const [workloadData, setWorkloadData] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [error, setError] = useState(null);
    
    // Состояние для графика
    const [chartData, setChartData] = useState([]);
    
    // Состояние для раскрытых строк таблицы
    const [expandedRows, setExpandedRows] = useState({});
    
    // Состояние для фильтра сотрудников в таблице
    const [tableEmployeeFilter, setTableEmployeeFilter] = useState([]);

    /**
     * Загрузка списка сотрудников
     */
    const loadEmployees = async () => {
        try {
            const data = await fetchEmployees();
            setEmployees(data);
        } catch (err) {
            setError(err.message);
        }
    };

    /**
     * Загрузка данных загруженности
     */
    const loadWorkloadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchWorkloadData(startDate, endDate, groupBy);
            setWorkloadData(result);
            
            // Инициализируем выбранных сотрудников, если еще не выбраны
            if (result && result.employees) {
                if (selectedEmployees.length === 0) {
                    // По умолчанию выбираем топ-5 самых загруженных сотрудников
                    const topEmployees = getTopLoadedEmployees(result, DEFAULT_TOP_EMPLOYEES_COUNT);
                    setSelectedEmployees(topEmployees);
                }
                if (tableEmployeeFilter.length === 0) {
                    setTableEmployeeFilter(result.employees.map(emp => emp.employee_id));
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Обновление данных графика при изменении выбранных сотрудников
     */
    const updateChartData = () => {
        if (workloadData) {
            const newChartData = prepareChartData(workloadData, selectedEmployees);
            setChartData(newChartData);
        }
    };

    /**
     * Обработчик изменения фильтра сотрудников для таблицы
     */
    const handleTableEmployeeFilterChange = (event) => {
        const value = event.target.value;
        setTableEmployeeFilter(typeof value === 'string' ? value.split(',') : value);
    };

    /**
     * Обработчик раскрытия/сворачивания строки таблицы
     */
    const handleRowToggle = (employeeId) => {
        setExpandedRows(prev => ({
            ...prev,
            [employeeId]: !prev[employeeId]
        }));
    };

    // Загрузка сотрудников и данных при монтировании
    useEffect(() => {
        loadEmployees();
        loadWorkloadData();
    }, []);

    // Перезагрузка данных при изменении фильтров
    useEffect(() => {
        if (startDate && endDate && groupBy) {
            loadWorkloadData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, endDate, groupBy]);

    // Обновление графика при изменении выбранных сотрудников или данных
    useEffect(() => {
        updateChartData();
    }, [selectedEmployees, workloadData]);

    return {
        // Фильтры
        startDate,
        endDate,
        groupBy,
        setStartDate,
        setEndDate,
        setGroupBy,
        
        // Данные
        loading,
        workloadData,
        employees,
        selectedEmployees,
        setSelectedEmployees,
        error,
        
        // График
        chartData,
        
        // Таблица
        expandedRows,
        tableEmployeeFilter,
        handleTableEmployeeFilterChange,
        handleRowToggle,
        
        // Функции загрузки
        loadWorkloadData
    };
};
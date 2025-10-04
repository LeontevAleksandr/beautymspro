import React from 'react';
import { 
    Typography, Box, Paper, CircularProgress, Alert 
} from '@mui/material';

// Компоненты
import WorkloadFilters from './components/WorkloadFilters';
import StatisticsCards from './components/StatisticsCards';
import EmployeeSelector from './components/EmployeeSelector';
import WorkloadChart from './components/WorkloadChart';
import WorkloadTable from './components/WorkloadTable';

// Хуки
import { useWorkloadData } from './hooks/useWorkloadData';

// Утилиты
import { getSortedEmployeesForChart } from './utils/workloadHelpers';

/**
 * Главный компонент аналитики загруженности сотрудников
 * Объединяет все подкомпоненты и управляет общим состоянием через хук useWorkloadData
 */
function EmployeeWorkloadTab() {
    // Получаем все состояния и функции из хука
    const {
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
    } = useWorkloadData();

    // Получение отсортированных сотрудников для графика и легенды
    const sortedEmployees = getSortedEmployeesForChart(workloadData, selectedEmployees);

    return (
        <Box sx={{ p: 3, backgroundColor: '#fafafa', minHeight: '100vh' }}>
            {/* Заголовок */}
            <Typography variant="h4" gutterBottom sx={{ color: '#1a1a1a', mb: 3 }}>
                Загруженность сотрудников
            </Typography>
            
            {/* Фильтры */}
            <WorkloadFilters
                startDate={startDate}
                endDate={endDate}
                groupBy={groupBy}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onGroupByChange={setGroupBy}
                onApply={loadWorkloadData}
            />

            {/* Статистические карточки */}
            {workloadData && !loading && (
                <StatisticsCards workloadData={workloadData} />
            )}

            {/* Секция графика */}
            <Paper sx={{ 
                p: 3, 
                mb: 3, 
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                borderRadius: 2
            }}>
                <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 1 }}
                >
                    📈 График загруженности
                </Typography>
                
                {/* Селектор сотрудников */}
                {workloadData && (
                    <EmployeeSelector
                        workloadData={workloadData}
                        selectedEmployees={selectedEmployees}
                        onSelectionChange={setSelectedEmployees}
                        sortedEmployees={sortedEmployees}
                    />
                )}

                {/* График */}
                {chartData.length > 0 && (
                    <WorkloadChart
                        chartData={chartData}
                        sortedEmployees={sortedEmployees}
                        workloadData={workloadData}
                    />
                )}
            </Paper>

            {/* Индикаторы загрузки и ошибок */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            )}
            
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}
            
            {/* Таблица детализации */}
            {workloadData && !loading && (
                <WorkloadTable
                    workloadData={workloadData}
                    tableEmployeeFilter={tableEmployeeFilter}
                    onFilterChange={handleTableEmployeeFilterChange}
                    expandedRows={expandedRows}
                    onRowToggle={handleRowToggle}
                />
            )}
        </Box>
    );
}

export default EmployeeWorkloadTab;
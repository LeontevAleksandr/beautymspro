import React from 'react';
import { Box } from '@mui/material';
import { 
    ComposedChart, Line, XAxis, YAxis, 
    CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceArea, ReferenceLine
} from 'recharts';
import { getWorkloadGradientColor, getLineStyle } from '../utils/workloadColors';
import CustomTooltip from './CustomTooltip';
import CustomLegend from './CustomLegend';

/**
 * Компонент графика загруженности сотрудников
 * @param {Array} chartData - Данные для графика
 * @param {Array} sortedEmployees - Отсортированные сотрудники с avgWorkload
 * @param {Object} workloadData - Полные данные загруженности для тултипа
 */
const WorkloadChart = ({ chartData, sortedEmployees, workloadData }) => {
    if (!chartData || chartData.length === 0) {
        return null;
    }

    return (
        <>
            {/* График */}
            <Box sx={{ height: 450, width: '100%' }}>
                <ResponsiveContainer>
                    <ComposedChart 
                        data={chartData} 
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        {/* Сетка */}
                        <CartesianGrid 
                            strokeDasharray="2 2" 
                            stroke="#e0e0e0" 
                            strokeOpacity={0.5}
                        />
                        
                        {/* Зоны загруженности (фоновые области) */}
                        <ReferenceArea 
                            y1={0} 
                            y2={40} 
                            fill="#22c55e" 
                            fillOpacity={0.1} 
                        />
                        <ReferenceArea 
                            y1={40} 
                            y2={60} 
                            fill="#eab308" 
                            fillOpacity={0.1} 
                        />
                        <ReferenceArea 
                            y1={60} 
                            y2={80} 
                            fill="#f97316" 
                            fillOpacity={0.1} 
                        />
                        <ReferenceArea 
                            y1={80} 
                            y2={100} 
                            fill="#ef4444" 
                            fillOpacity={0.1} 
                        />
                        
                        {/* Референсные линии с подписями */}
                        <ReferenceLine 
                            y={80} 
                            stroke="#ef4444" 
                            strokeDasharray="5 5" 
                            strokeWidth={2}
                            label={{ 
                                value: "Критическая загрузка", 
                                position: "left", 
                                fill: "#ef4444", 
                                fontSize: 12 
                            }}
                        />
                        <ReferenceLine 
                            y={60} 
                            stroke="#f97316" 
                            strokeDasharray="5 5" 
                            strokeWidth={1.5}
                            label={{ 
                                value: "Высокая", 
                                position: "left", 
                                fill: "#f97316", 
                                fontSize: 11 
                            }}
                        />
                        <ReferenceLine 
                            y={40} 
                            stroke="#eab308" 
                            strokeDasharray="5 5" 
                            strokeWidth={1}
                            label={{ 
                                value: "Средняя", 
                                position: "left", 
                                fill: "#eab308", 
                                fontSize: 11 
                            }}
                        />
                        
                        {/* Оси */}
                        <XAxis 
                            dataKey="period" 
                            tick={{ fontSize: 12, fill: "#666" }}
                            stroke="#666"
                            strokeWidth={1}
                        />
                        <YAxis 
                            tick={{ fontSize: 12, fill: "#666" }}
                            stroke="#666"
                            strokeWidth={1}
                            domain={[0, 100]}
                            ticks={[0, 20, 40, 60, 80, 100]}
                            label={{ 
                                value: 'Загруженность (%)', 
                                angle: -90, 
                                position: 'insideLeft', 
                                style: { textAnchor: 'middle', fill: '#666' } 
                            }}
                        />
                        
                        {/* Кастомный тултип */}
                        <Tooltip content={<CustomTooltip workloadData={workloadData} />} />
                        
                        {/* Линии для каждого сотрудника */}
                        {sortedEmployees.map((employee) => {
                            const color = getWorkloadGradientColor(employee.avgWorkload);
                            const lineStyle = getLineStyle(employee.avgWorkload);
                            
                            return (
                                <Line
                                    key={employee.employee_id}
                                    type="monotone"
                                    dataKey={employee.employee_name}
                                    stroke={color}
                                    strokeWidth={lineStyle.strokeWidth}
                                    strokeDasharray={lineStyle.strokeDasharray}
                                    dot={{ 
                                        r: 4, 
                                        fill: color,
                                        strokeWidth: 2,
                                        stroke: '#ffffff'
                                    }}
                                    activeDot={{ 
                                        r: 7, 
                                        fill: color,
                                        strokeWidth: 3,
                                        stroke: '#ffffff',
                                        filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.2))'
                                    }}
                                    connectNulls={false}
                                />
                            );
                        })}
                    </ComposedChart>
                </ResponsiveContainer>
            </Box>
            
            {/* Кастомная легенда */}
            <CustomLegend sortedEmployees={sortedEmployees} />
        </>
    );
};

export default WorkloadChart;
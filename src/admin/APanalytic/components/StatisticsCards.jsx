import React from 'react';
import { Grid, Paper, Box, Typography } from '@mui/material';
import { calculateAverageWorkload } from '../utils/workloadHelpers';

/**
 * Компонент статистических карточек с распределением сотрудников по уровням загруженности
 * @param {Object} workloadData - Данные загруженности от API
 */
const StatisticsCards = ({ workloadData }) => {
    if (!workloadData || !workloadData.employees) {
        return null;
    }

    // Подсчет сотрудников по категориям загруженности
    const statistics = {
        critical: workloadData.employees.filter(emp => {
            const avg = calculateAverageWorkload(emp);
            return avg >= 80;
        }).length,
        high: workloadData.employees.filter(emp => {
            const avg = calculateAverageWorkload(emp);
            return avg >= 60 && avg < 80;
        }).length,
        medium: workloadData.employees.filter(emp => {
            const avg = calculateAverageWorkload(emp);
            return avg >= 40 && avg < 60;
        }).length,
        low: workloadData.employees.filter(emp => {
            const avg = calculateAverageWorkload(emp);
            return avg < 40;
        }).length
    };

    // Конфигурация карточек
    const cards = [
        {
            key: 'critical',
            icon: '🔴',
            title: 'Критическая загрузка',
            count: statistics.critical,
            color: '#ef4444',
            range: '≥80%'
        },
        {
            key: 'high',
            icon: '🟠',
            title: 'Высокая загрузка',
            count: statistics.high,
            color: '#f97316',
            range: '60-79%'
        },
        {
            key: 'medium',
            icon: '🟡',
            title: 'Средняя загрузка',
            count: statistics.medium,
            color: '#eab308',
            range: '40-59%'
        },
        {
            key: 'low',
            icon: '🟢',
            title: 'Низкая загрузка',
            count: statistics.low,
            color: '#22c55e',
            range: '<40%'
        }
    ];

    return (
        <Grid container spacing={2} sx={{ mb: 3 }}>
            {cards.map((card) => (
                <Grid item xs={12} md={3} key={card.key}>
                    <Paper sx={{ 
                        p: 2, 
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        borderRadius: 2,
                        borderLeft: `4px solid ${card.color}`
                    }}>
                        {/* Заголовок с иконкой */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <span style={{ fontSize: 20 }}>{card.icon}</span>
                            <Typography variant="subtitle2" sx={{ color: '#666' }}>
                                {card.title}
                            </Typography>
                        </Box>
                        
                        {/* Количество сотрудников */}
                        <Typography variant="h4" sx={{ color: card.color, fontWeight: 600 }}>
                            {card.count}
                        </Typography>
                        
                        {/* Диапазон */}
                        <Typography variant="caption" sx={{ color: '#666' }}>
                            сотрудников ({card.range})
                        </Typography>
                    </Paper>
                </Grid>
            ))}
        </Grid>
    );
};

export default StatisticsCards;
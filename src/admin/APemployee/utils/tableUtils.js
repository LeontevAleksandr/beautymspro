import { NO_SPECIALIZATION_KEY } from './constants';

// Сортировка групп специализаций
export const sortSpecializationGroups = (groupNames) => {
  return [...groupNames].sort((a, b) => {
    // Сортируем группы: "Без специализации" в конец
    if (a === NO_SPECIALIZATION_KEY) return 1;
    if (b === NO_SPECIALIZATION_KEY) return -1;
    return a.localeCompare(b);
  });
};

// Определение цвета строки на основе индекса
export const getRowBackgroundColor = (index) => {
  return index % 2 === 0 ? '#ffffff' : '#fafbfc';
};

// Стили для ячеек таблицы
export const getTableCellStyle = (index) => ({
  backgroundColor: getRowBackgroundColor(index),
  py: 1.5,
  color: '#1a1a1a',
  borderBottom: '1px solid #f0f0f0',
  transition: 'background-color 0.2s ease'
});

// Стили для строки с hover эффектом
export const getTableRowStyle = (index) => ({
  backgroundColor: getRowBackgroundColor(index),
  '&:hover': {
    backgroundColor: '#f5f7fa'
  }
});
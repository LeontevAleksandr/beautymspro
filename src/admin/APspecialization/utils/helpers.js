// Валидация данных
export const isValidName = (name) => {
  return name && name.trim().length > 0;
};

// Проверка возможности перемещения приоритета
export const canMovePriority = (currentIndex, direction, listLength) => {
  if (direction === 'up') {
    return currentIndex > 0;
  }
  if (direction === 'down') {
    return currentIndex < listLength - 1;
  }
  return false;
};

// Получение целевого индекса для перемещения
export const getTargetIndex = (currentIndex, direction) => {
  return direction === 'up' ? currentIndex - 1 : currentIndex + 1;
};

// Обработка ошибок с логированием
export const handleError = (action, error) => {
  console.error(`Ошибка при ${action}:`, error);
};
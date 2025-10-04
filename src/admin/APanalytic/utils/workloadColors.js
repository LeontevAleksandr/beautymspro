// Утилиты для работы с цветами загруженности

/**
 * Получение цвета градиента в зависимости от процента загруженности
 * @param {number} percent - процент загруженности (0-100)
 * @returns {string} HEX код цвета
 */
export const getWorkloadGradientColor = (percent) => {
    if (percent <= 20) return '#22c55e'; // Ярко-зеленый
    if (percent <= 40) return '#84cc16'; // Лайм
    if (percent <= 60) return '#eab308'; // Желтый
    if (percent <= 80) return '#f97316'; // Оранжевый
    return '#ef4444'; // Красный
};

/**
 * Получение более насыщенного цвета для той же загруженности
 * @param {number} percent - процент загруженности (0-100)
 * @returns {string} HEX код темного цвета
 */
export const getWorkloadDarkColor = (percent) => {
    if (percent <= 20) return '#16a34a';
    if (percent <= 40) return '#65a30d';
    if (percent <= 60) return '#ca8a04';
    if (percent <= 80) return '#ea580c';
    return '#dc2626';
};

/**
 * Получение цвета для загруженности (основная палитра)
 * @param {number} percent - процент загруженности (0-100)
 * @returns {string} HEX код цвета
 */
export const getWorkloadColor = (percent) => {
    if (percent >= 80) return '#ef4444'; // красный
    if (percent >= 60) return '#f97316'; // оранжевый  
    if (percent >= 40) return '#eab308'; // желтый
    return '#22c55e'; // зеленый
};

/**
 * Получение текстового статуса загруженности
 * @param {number} percent - процент загруженности (0-100)
 * @returns {string} Текстовый статус
 */
export const getWorkloadStatus = (percent) => {
    if (percent >= 80) return 'Критическая';
    if (percent >= 60) return 'Высокая';
    if (percent >= 40) return 'Средняя';
    return 'Низкая';
};

/**
 * Получение стилей линии на графике в зависимости от средней загруженности
 * @param {number} avgWorkload - средняя загруженность (0-100)
 * @returns {object} Объект со стилями для линии
 */
export const getLineStyle = (avgWorkload) => {
    if (avgWorkload >= 80) return { strokeWidth: 3.5, strokeDasharray: "0" }; // Толстая сплошная
    if (avgWorkload >= 60) return { strokeWidth: 3, strokeDasharray: "0" }; // Средняя сплошная
    if (avgWorkload >= 40) return { strokeWidth: 2.5, strokeDasharray: "5 5" }; // Пунктирная
    return { strokeWidth: 2, strokeDasharray: "3 3" }; // Мелкий пунктир
};

/**
 * Получение иконки-эмодзи статуса загруженности
 * @param {number} percent - процент загруженности (0-100)
 * @returns {JSX.Element} React элемент с иконкой
 */
export const getStatusIcon = (percent) => {
    if (percent >= 80) return <span style={{ fontSize: 16 }}>🔴</span>;
    if (percent >= 60) return <span style={{ fontSize: 16 }}>🟠</span>;
    if (percent >= 40) return <span style={{ fontSize: 16 }}>🟡</span>;
    return <span style={{ fontSize: 16 }}>🟢</span>;
};

/**
 * Компонент стрелки вверх
 */
export const ArrowUp = () => (
    <span style={{ fontSize: 12, fontWeight: 'bold' }}>▲</span>
);

/**
 * Компонент стрелки вниз
 */
export const ArrowDown = () => (
    <span style={{ fontSize: 12, fontWeight: 'bold' }}>▼</span>
);
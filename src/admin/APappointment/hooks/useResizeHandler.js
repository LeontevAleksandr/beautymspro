import { useCallback } from 'react';
import { format } from 'date-fns';
import { SLOT_DURATION, TABLE_ROW_HEIGHT } from '../utils/constants.js';

// ==================== ОБРАБОТЧИК ИЗМЕНЕНИЯ РАЗМЕРА ====================
export const useResizeHandler = ({
    services,
    fetchAppointmentsForDate,
    selectedDate,
    showSnackbar
}) => {
    const handleResizeStart = useCallback((appointment, e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const service = services.find(s => s.id === appointment.service_id);
        if (!service) return;
        
        const appointmentElement = e.currentTarget.closest('[data-appointment-id]');
        if (!appointmentElement) return;
        
        const timeTable = appointmentElement.closest('table');
        if (!timeTable) return;
        
        // Отключаем transitions во время drag
        appointmentElement.style.transition = 'none';
        
        // Находим начальную строку записи
        const appointmentTime = format(new Date(appointment.datetime), 'HH:mm');
        const rows = Array.from(timeTable.querySelectorAll('tbody tr'));
        const startRowIndex = rows.findIndex(row => {
            const timeCell = row.querySelector('td:first-child');
            return timeCell && timeCell.textContent.trim() === appointmentTime;
        });
        
        if (startRowIndex === -1) {
            // Восстанавливаем transition если что-то пошло не так
            appointmentElement.style.transition = '';
            return;
        }
        
        const initialDuration = appointment.custom_duration || service.duration;
        let currentDuration = initialDuration;
        let isDragging = true;
        
        // Получаем изначальную позицию и размеры
        const tableRect = timeTable.getBoundingClientRect();
        const realRowHeight = rows[0]?.getBoundingClientRect().height || TABLE_ROW_HEIGHT;
        
        const handleMouseMove = (moveEvent) => {
            if (!isDragging) return;
            
            // Вычисляем позицию курсора относительно таблицы
            const relativeY = moveEvent.clientY - tableRect.top;
            
            // Определяем строку на основе позиции курсора
            let targetRowIndex = -1;
            let cumulativeHeight = 0;
            
            // Учитываем заголовок таблицы
            const headerRow = timeTable.querySelector('thead tr');
            if (headerRow) {
                cumulativeHeight += headerRow.getBoundingClientRect().height;
            }
            
            // Ищем целевую строку
            for (let i = 0; i < rows.length; i++) {
                const rowHeight = rows[i].getBoundingClientRect().height;
                if (relativeY >= cumulativeHeight && relativeY < cumulativeHeight + rowHeight) {
                    targetRowIndex = i;
                    break;
                }
                cumulativeHeight += rowHeight;
            }
            
            // Если курсор ниже всех строк, берем последнюю строку
            if (targetRowIndex === -1 && relativeY >= cumulativeHeight) {
                targetRowIndex = rows.length - 1;
            }
            
            // Проверяем, что мы не выше начальной строки
            if (targetRowIndex < startRowIndex) return;
            
            // Правильный расчет новой длительности
            const rowsSpanned = targetRowIndex - startRowIndex + 1;
            const newDuration = rowsSpanned * SLOT_DURATION;
            
            if (newDuration !== currentDuration && newDuration >= SLOT_DURATION) {
                currentDuration = newDuration;
                
                // Плавное обновление высоты без transition
                const newHeight = rowsSpanned * realRowHeight;
                appointmentElement.style.height = `${newHeight}px`;
                
                // Обновляем также handle для лучшего UX
                const resizeHandle = appointmentElement.querySelector('.resize-handle');
                if (resizeHandle) {
                    resizeHandle.style.backgroundColor = '#1976d2';
                    resizeHandle.style.opacity = '1';
                }
            }
        };
        
        const handleMouseUp = async () => {
            isDragging = false;
            
            // Восстанавливаем transitions
            appointmentElement.style.transition = 'all 0.2s ease';
            
            // Восстанавливаем стиль handle
            const resizeHandle = appointmentElement.querySelector('.resize-handle');
            if (resizeHandle) {
                resizeHandle.style.backgroundColor = '';
                resizeHandle.style.opacity = '';
            }
            
            // Очищаем обработчики событий
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            // Восстанавливаем стили курсора
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            
            // Сохраняем изменения, если длительность изменилась
            if (currentDuration !== initialDuration) {
                try {
                    const response = await fetch(`http://localhost:5000/api/appointments/${appointment.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ custom_duration: currentDuration }),
                    });
                    
                    if (response.ok) {
                        // Обновляем данные и позволяем useEffect пересчитать размеры
                        await fetchAppointmentsForDate(selectedDate);
                        showSnackbar('Продолжительность записи успешно обновлена', 'success');
                    } else {
                        // Возвращаем исходную высоту при ошибке
                        const originalSlotsCount = Math.ceil(initialDuration / SLOT_DURATION);
                        const originalHeight = originalSlotsCount * realRowHeight;
                        appointmentElement.style.height = `${originalHeight}px`;
                        showSnackbar('Ошибка при обновлении продолжительности записи', 'error');
                    }
                } catch (error) {
                    console.error('Ошибка при обновлении продолжительности:', error);
                    // Возвращаем исходную высоту при ошибке
                    const originalSlotsCount = Math.ceil(initialDuration / SLOT_DURATION);
                    const originalHeight = originalSlotsCount * realRowHeight;
                    appointmentElement.style.height = `${originalHeight}px`;
                    showSnackbar('Ошибка при обновлении продолжительности записи', 'error');
                }
            } else {
                // Если длительность не изменилась, просто восстанавливаем transition
                setTimeout(() => {
                    appointmentElement.style.transition = '';
                }, 100);
            }
        };
        
        // Устанавливаем стили курсора
        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';
        
        // Добавляем обработчики событий
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
    }, [services, fetchAppointmentsForDate, selectedDate, showSnackbar]);

    return {
        handleResizeStart
    };
};
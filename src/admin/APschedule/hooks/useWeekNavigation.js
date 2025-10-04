import { 
    startOfWeek, 
    endOfWeek, 
    eachDayOfInterval, 
    addWeeks, 
    subWeeks 
} from 'date-fns';

export const useWeekNavigation = (currentDate, setCurrentDate) => {
    
    // Получение дней текущей недели
    const getDaysInWeek = () => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Неделя начинается с понедельника
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    };

    // Переход к предыдущей неделе
    const goToPreviousWeek = () => {
        setCurrentDate(prevDate => subWeeks(prevDate, 1));
    };

    // Переход к следующей неделе
    const goToNextWeek = () => {
        setCurrentDate(prevDate => addWeeks(prevDate, 1));
    };

    // Переход к текущей неделе
    const goToCurrentWeek = () => {
        setCurrentDate(new Date());
    };

    return {
        getDaysInWeek,
        goToPreviousWeek,
        goToNextWeek,
        goToCurrentWeek
    };
};
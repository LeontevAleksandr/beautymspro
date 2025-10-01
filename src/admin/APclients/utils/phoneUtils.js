// Утилиты для работы с телефонными номерами

// Функция форматирования номера телефона для отображения
export const formatPhoneForDisplay = (phone) => {
    if (!phone) return '';
    
    // Убираем все символы кроме цифр
    const cleaned = phone.replace(/\D/g, '');
    
    // Если номер начинается с 8, заменяем на +7
    let formatted = cleaned;
    if (cleaned.startsWith('8') && cleaned.length === 11) {
        formatted = '7' + cleaned.substring(1);
    }
    
    // Форматируем как +7 (XXX) XXX-XX-XX
    if (formatted.length >= 10) {
        const match = formatted.match(/^7?(\d{3})(\d{3})(\d{2})(\d{2})/);
        if (match) {
            return `+7 (${match[1]}) ${match[2]}-${match[3]}-${match[4]}`;
        }
    }
    
    return phone;
};

// Функция форматирования номера телефона для базы данных
export const formatPhoneForDB = (phone) => {
    if (!phone) return '';
    
    // Убираем все символы кроме цифр
    const cleaned = phone.replace(/\D/g, '');
    
    // Преобразуем в формат 89XXXXXXXXX
    if (cleaned.startsWith('7') && cleaned.length === 11) {
        return '8' + cleaned.substring(1);
    } else if (cleaned.startsWith('8') && cleaned.length === 11) {
        return cleaned;
    }
    
    return cleaned;
};

// Функция валидации номера телефона
export const validatePhone = (phone) => {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, '');
    return (cleaned.startsWith('7') || cleaned.startsWith('8')) && cleaned.length === 11;
};

// Функция форматирования телефона при вводе
export const formatPhoneInput = (value) => {
    // Убираем все кроме цифр и +
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // Если начинается с +7 или просто цифры
    if (cleaned.startsWith('+7') || cleaned.startsWith('7') || cleaned.startsWith('8')) {
        const digits = cleaned.replace(/\D/g, '');
        let phoneDigits = digits;
        
        // Нормализуем номер
        if (phoneDigits.startsWith('7') && phoneDigits.length <= 11) {
            phoneDigits = phoneDigits;
        } else if (phoneDigits.startsWith('8') && phoneDigits.length <= 11) {
            phoneDigits = '7' + phoneDigits.substring(1);
        } else if (phoneDigits.length <= 10) {
            phoneDigits = '7' + phoneDigits;
        }
        
        // Форматируем для отображения
        if (phoneDigits.length >= 4) {
            const match = phoneDigits.match(/^7(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
            if (match) {
                let formattedValue = '+7';
                if (match[1]) formattedValue += ` (${match[1]}`;
                if (match[1] && match[1].length === 3) formattedValue += ')';
                if (match[2]) formattedValue += ` ${match[2]}`;
                if (match[3]) formattedValue += `-${match[3]}`;
                if (match[4]) formattedValue += `-${match[4]}`;
                return formattedValue;
            }
        } else {
            return cleaned;
        }
    }
    
    return cleaned;
};
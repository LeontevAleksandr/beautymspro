import re

class PhoneUtils:
    """Утилиты для работы с номерами телефонов"""
    
    @staticmethod
    def normalize_client_phone(phone_input):
        """
        Нормализация номера телефона к формату 89010010101 для клиентов
        
        Args:
            phone_input (str): Входной номер телефона в любом формате
            
        Returns:
            str or None: Нормализованный номер или None если формат неверный
        """
        digits_only = re.sub(r'\D', '', phone_input)
        
        if digits_only.startswith('79') and len(digits_only) == 11:
            return '8' + digits_only[1:]
        elif digits_only.startswith('89') and len(digits_only) == 11:
            return digits_only
        elif digits_only.startswith('9') and len(digits_only) == 10:
            return '8' + digits_only
        elif len(digits_only) == 10 and not digits_only.startswith('8'):
            return '8' + digits_only
        return None
    
    @staticmethod
    def normalize_employee_phone(phone_input):
        """
        Нормализация номера телефона к формату +7XXXXXXXXXX для сотрудников
        
        Args:
            phone_input (str): Входной номер телефона в любом формате
            
        Returns:
            str or None: Нормализованный номер или None если формат неверный
        """
        digits_only = re.sub(r'\D', '', phone_input)
        
        # Приводим все форматы к +7XXXXXXXXXX для сотрудников
        if digits_only.startswith('79') and len(digits_only) == 11:
            return '+' + digits_only  # 79010010101 -> +79010010101
        elif digits_only.startswith('89') and len(digits_only) == 11:
            return '+7' + digits_only[1:]  # 89010010101 -> +79010010101
        elif digits_only.startswith('9') and len(digits_only) == 10:
            return '+7' + digits_only  # 9010010101 -> +79010010101
        elif digits_only.startswith('7') and len(digits_only) == 11:
            return '+' + digits_only  # 79010010101 -> +79010010101
        elif len(digits_only) == 10 and not digits_only.startswith(('7', '8')):
            return '+7' + digits_only  # 9010010101 -> +79010010101
        elif digits_only.startswith('8') and len(digits_only) == 11:
            return '+7' + digits_only[1:]  # 89010010101 -> +79010010101
        return None
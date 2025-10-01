from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session
from models import (
    Schedule, Service, ServiceComplex, Appointment, ScheduleException,
    ServiceComplexPivot, AppointmentServicePivot
)

class SlotsService:
    """Сервис для работы с доступными временными слотами"""
    
    @staticmethod
    def get_service_duration(session: Session, service_id=None, complex_id=None, custom_duration=None):
        """Определяет продолжительность услуги или комплекса"""
        total_duration = 0
        
        if custom_duration:
            return int(custom_duration)
        
        if service_id:
            service = session.query(Service).get(service_id)
            if not service:
                raise ValueError('Услуга не найдена')
            total_duration = service.duration
        
        if complex_id:
            complex = session.query(ServiceComplex).get(complex_id)
            if not complex:
                raise ValueError('Комплекс услуг не найден')
            
            # Получаем все услуги в комплексе
            complex_services = session.query(Service).join(
                ServiceComplexPivot, 
                Service.id == ServiceComplexPivot.service_id
            ).filter(
                ServiceComplexPivot.complex_id == complex_id
            ).all()
            
            # Суммируем продолжительность всех услуг в комплексе
            for s in complex_services:
                total_duration += s.duration
        
        # Если продолжительность не определена, используем стандартное значение
        if total_duration == 0:
            total_duration = 60  # Стандартная продолжительность 1 час
        
        return total_duration
    
    @staticmethod
    def get_busy_slots(session: Session, employee_id, schedule_start, schedule_end, schedule):
        """Получает список занятых временных интервалов"""
        busy_slots = []
        
        # Получаем существующие записи на этот день
        existing_appointments = session.query(Appointment).filter(
            Appointment.employee_id == employee_id,
            Appointment.datetime >= schedule_start,
            Appointment.datetime <= schedule_end,
            Appointment.status != 'cancelled'
        ).all()
        
        for appointment in existing_appointments:
            # Получаем продолжительность существующей записи
            existing_duration = 0
            
            # Используем пользовательскую продолжительность из самой записи
            if appointment.custom_duration:
                existing_duration = appointment.custom_duration
            else:
                # Получаем услуги для существующей записи
                existing_services = session.query(Service).join(
                    AppointmentServicePivot,
                    Service.id == AppointmentServicePivot.service_id
                ).filter(
                    AppointmentServicePivot.appointment_id == appointment.id
                ).all()
                
                # Суммируем продолжительность всех услуг
                for s in existing_services:
                    existing_duration += s.duration
            
            # Если продолжительность не определена, используем стандартное значение
            if existing_duration == 0:
                existing_duration = 60
            
            start_time = appointment.datetime
            end_time = start_time + timedelta(minutes=existing_duration)
            
            busy_slots.append({
                'start': start_time,
                'end': end_time
            })
        
        # Получаем перерывы (исключения) в расписании
        exceptions = session.query(ScheduleException).filter(
            ScheduleException.schedule_id == schedule.id
        ).all()
        
        for exception in exceptions:
            if exception.start_time and exception.end_time:
                exception_start = datetime.combine(schedule.date, exception.start_time)
                exception_end = datetime.combine(schedule.date, exception.end_time)
                
                busy_slots.append({
                    'start': exception_start,
                    'end': exception_end
                })
        
        return busy_slots
    
    @staticmethod
    def generate_time_slots(schedule_start, schedule_end, total_duration, slot_interval):
        """Генерирует все возможные временные слоты с заданным интервалом"""
        all_slots = []
        current_time = schedule_start
        
        while current_time + timedelta(minutes=total_duration) <= schedule_end:
            all_slots.append({
                'start': current_time,
                'end': current_time + timedelta(minutes=total_duration)
            })
            current_time += timedelta(minutes=slot_interval)
        
        return all_slots
    
    @staticmethod
    def filter_available_slots(all_slots, busy_slots):
        """Фильтрует доступные слоты (не пересекающиеся с занятыми)"""
        available_slots = []
        
        for slot in all_slots:
            is_available = True
            
            for busy_slot in busy_slots:
                # Проверяем пересечение временных интервалов
                if (
                    # Слот начинается во время занятого
                    (slot['start'] >= busy_slot['start'] and slot['start'] < busy_slot['end']) or
                    # Слот заканчивается во время занятого
                    (slot['end'] > busy_slot['start'] and slot['end'] <= busy_slot['end']) or 
                    # Слот полностью содержит занятый
                    (slot['start'] <= busy_slot['start'] and slot['end'] >= busy_slot['end'])
                ):
                    is_available = False
                    break
            
            if is_available:
                available_slots.append(slot)
        
        return available_slots
    
    @staticmethod
    def get_available_slots(session: Session, employee_id, date_str, service_id=None, 
                          complex_id=None, custom_duration=None, slot_interval=30):
        """
        Получение доступных временных слотов для записи к определенному сотруднику на определенную дату
        
        Args:
            session: Сессия базы данных
            employee_id: ID сотрудника
            date_str: дата (YYYY-MM-DD)
            service_id: ID услуги (опционально)
            complex_id: ID комплекса услуг (опционально)
            custom_duration: продолжительность в минутах (опционально)
            slot_interval: интервал слотов в минутах (по умолчанию 30)
        
        Returns:
            dict: Словарь с информацией о доступных слотах
        
        Raises:
            ValueError: При ошибках валидации входных данных
        """
        
        if not all([employee_id, date_str]):
            raise ValueError('Необходимо указать ID сотрудника и дату')
        
        # Преобразуем строку в объект date
        requested_date = date.fromisoformat(date_str)
        
        # Получаем расписание сотрудника на указанную дату
        schedule = session.query(Schedule).filter(
            Schedule.employee_id == employee_id,
            Schedule.date == requested_date
        ).first()
        
        if not schedule:
            raise ValueError('Нет расписания для сотрудника на эту дату')
        
        # Определяем начало и конец рабочего дня
        schedule_start = datetime.combine(schedule.date, schedule.start_time)
        schedule_end = datetime.combine(schedule.date, schedule.end_time)
        
        # Получаем продолжительность услуги
        total_duration = SlotsService.get_service_duration(
            session, service_id, complex_id, custom_duration
        )
        
        # Получаем занятые слоты
        busy_slots = SlotsService.get_busy_slots(
            session, employee_id, schedule_start, schedule_end, schedule
        )
        
        # Генерируем все возможные слоты
        all_slots = SlotsService.generate_time_slots(
            schedule_start, schedule_end, total_duration, slot_interval
        )
        
        # Фильтруем доступные слоты
        available_time_slots = SlotsService.filter_available_slots(all_slots, busy_slots)
        
        # Форматируем результат
        available_slots = []
        for slot in available_time_slots:
            available_slots.append({
                'start': slot['start'].strftime('%H:%M'),
                'end': slot['end'].strftime('%H:%M'),
                'duration': total_duration
            })
        
        return {
            'employee_id': int(employee_id),
            'date': date_str,
            'working_hours': {
                'start': schedule.start_time.strftime('%H:%M'),
                'end': schedule.end_time.strftime('%H:%M')
            },
            'service_duration': total_duration,
            'available_slots': available_slots
        }
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import (
    Appointment, Service, ServiceComplex, Schedule, ScheduleException,
    ServiceComplexPivot, AppointmentServicePivot, AppointmentComplexPivot
)
import logging
import asyncio

logger = logging.getLogger(__name__)

class AppointmentService:
    """Сервис для работы с записями"""

    @staticmethod
    def calculate_duration(session: Session, service_id=None, complex_id=None, custom_duration=None):
        """Вычисляет общую продолжительность записи"""
        total_duration = 0

        # Если указана пользовательская продолжительность, используем её
        if custom_duration is not None:
            return custom_duration

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

        return total_duration

    @staticmethod
    def get_appointment_duration(session: Session, appointment):
        """Получает продолжительность существующей записи"""
        # Используем пользовательскую продолжительность из самой записи
        if appointment.custom_duration:
            return appointment.custom_duration

        # Получаем услуги для записи
        existing_services = session.query(Service).join(
            AppointmentServicePivot,
            Service.id == AppointmentServicePivot.service_id
        ).filter(
            AppointmentServicePivot.appointment_id == appointment.id
        ).all()

        # Суммируем продолжительность всех услуг
        total_duration = 0
        for s in existing_services:
            total_duration += s.duration

        # Если продолжительность не определена, используем стандартное значение
        if total_duration == 0:
            total_duration = 60  # Стандартная продолжительность 1 час

        return total_duration

    @staticmethod
    def check_schedule_availability(session: Session, employee_id, appointment_datetime, duration):
        """Проверяет доступность сотрудника в указанное время"""
        appointment_end_time = appointment_datetime + timedelta(minutes=duration)

        # Проверяем расписание
        schedule = session.query(Schedule).filter(
            Schedule.employee_id == employee_id,
            Schedule.date == appointment_datetime.date()
        ).first()

        if not schedule:
            raise ValueError('Нет расписания для сотрудника на эту дату')

        # Проверяем рабочее время
        schedule_start = datetime.combine(schedule.date, schedule.start_time)
        schedule_end = datetime.combine(schedule.date, schedule.end_time)

        if appointment_datetime < schedule_start or appointment_end_time > schedule_end:
            raise ValueError('Время записи выходит за рамки рабочего времени сотрудника')

        return schedule

    @staticmethod
    def check_time_conflicts(session: Session, employee_id, appointment_datetime, duration, exclude_appointment_id=None):
        """Проверяет конфликты с другими записями"""
        appointment_end_time = appointment_datetime + timedelta(minutes=duration)

        # Получаем все записи сотрудника на этот день
        query = session.query(Appointment).filter(
            Appointment.employee_id == employee_id,
            Appointment.datetime >= appointment_datetime.replace(hour=0, minute=0, second=0),
            Appointment.datetime <= appointment_datetime.replace(hour=23, minute=59, second=59),
            Appointment.status != 'cancelled'
        )

        if exclude_appointment_id:
            query = query.filter(Appointment.id != exclude_appointment_id)

        existing_appointments = query.all()

        for existing_app in existing_appointments:
            existing_duration = AppointmentService.get_appointment_duration(session, existing_app)
            existing_datetime = existing_app.datetime
            existing_end_time = existing_datetime + timedelta(minutes=existing_duration)

            # Проверяем пересечение времени
            if (
                (appointment_datetime >= existing_datetime and appointment_datetime < existing_end_time) or
                (appointment_end_time > existing_datetime and appointment_end_time <= existing_end_time) or
                (appointment_datetime <= existing_datetime and appointment_end_time >= existing_end_time)
            ):
                raise ValueError(f'Временной слот занят другой записью (ID: {existing_app.id})')

    @staticmethod
    def check_schedule_exceptions(session: Session, employee_id, appointment_datetime, duration):
        """Проверяет исключения в расписании (перерывы, отпуска)"""
        appointment_end_time = appointment_datetime + timedelta(minutes=duration)
        appointment_date = appointment_datetime.date()

        # Получаем исключения в расписании
        exceptions = session.query(ScheduleException).join(Schedule).filter(
            Schedule.employee_id == employee_id,
            Schedule.date == appointment_date
        ).all()

        for exception in exceptions:
            # Проверяем временное исключение (перерыв)
            if exception.start_time and exception.end_time:
                exception_start = datetime.combine(appointment_date, exception.start_time)
                exception_end = datetime.combine(appointment_date, exception.end_time)

                # Проверяем пересечение времени записи с исключением
                if (
                    (appointment_datetime >= exception_start and appointment_datetime < exception_end) or
                    (appointment_end_time > exception_start and appointment_end_time <= exception_end) or
                    (appointment_datetime <= exception_start and appointment_end_time >= exception_end)
                ):
                    raise ValueError('Временной слот пересекается с перерывом сотрудника')

    @staticmethod
    def create_appointment_relations(session: Session, appointment, service_id=None, complex_id=None):
        """Создает связи записи с услугами и комплексами"""
        # Добавляем связь с услугой, если она указана
        if service_id:
            service_pivot = AppointmentServicePivot(
                appointment_id=appointment.id,
                service_id=service_id
            )
            session.add(service_pivot)

        # Добавляем связь с комплексом, если он указан
        if complex_id:
            complex_pivot = AppointmentComplexPivot(
                appointment_id=appointment.id,
                complex_id=complex_id
            )
            session.add(complex_pivot)

            # Также добавляем связи со всеми услугами в комплексе
            complex_services = session.query(Service).join(
                ServiceComplexPivot,
                Service.id == ServiceComplexPivot.service_id
            ).filter(
                ServiceComplexPivot.complex_id == complex_id
            ).all()

            for s in complex_services:
                service_pivot = AppointmentServicePivot(
                    appointment_id=appointment.id,
                    service_id=s.id
                )
                session.add(service_pivot)


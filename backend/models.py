from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, BigInteger, Text, Date, Time, Table
from sqlalchemy.orm import relationship
from .database import Base
from sqlalchemy import Enum
import enum

class ClientStatus(Base):
    __tablename__ = 'client_statuses'
    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, index=True)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    client_preferences = relationship("ClientPreferences", back_populates="client_status")

class Qualification(Base):
    __tablename__ = 'qualifications'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    priority = Column(Integer, unique=True)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    
    employees = relationship("Employee", back_populates="qualification")
    specialization_qualifications = relationship("SpecializationQualificationPivot", back_populates="qualification")
    service_qualifications = relationship("ServiceQualificationPivot", back_populates="qualification")

class Client(Base):
    __tablename__ = 'clients'
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    phone = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    telegram_chat_id = Column(BigInteger, unique=True, nullable=True)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    
    appointments = relationship("Appointment", back_populates="client")
    preferences = relationship("ClientPreferences", back_populates="client")

class Specialization(Base):
    __tablename__ = 'specializations'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    
    employees = relationship("Employee", back_populates="specialization")
    services = relationship("Service", back_populates="specialization")
    specialization_qualifications = relationship("SpecializationQualificationPivot", back_populates="specialization")

# Новая таблица для связи специализаций и квалификаций
class SpecializationQualification(Base):
    __tablename__ = 'specialization_qualifications'
    specialization_id = Column(Integer, ForeignKey('specializations.id'), primary_key=True)
    qualification_id = Column(Integer, ForeignKey('qualifications.id'), primary_key=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    
    specialization = relationship("Specialization", back_populates="specialization_qualifications")
    qualification = relationship("Qualification", back_populates="specialization_qualifications")

class Employee(Base):
    __tablename__ = 'employees'
    id = Column(Integer, primary_key=True, index=True)
    specialization_id = Column(Integer, ForeignKey('specializations.id'))
    qualification_level_id = Column(Integer, ForeignKey('qualifications.id'))
    full_name = Column(String, unique=True, index=True)
    passport_number = Column(String, unique=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    password = Column(String(255))
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    
    specialization = relationship("Specialization", back_populates="employees")
    qualification = relationship("Qualification", back_populates="employees")
    appointments = relationship("Appointment", back_populates="employee")
    schedules = relationship("Schedule", back_populates="employee")

class ServiceComplex(Base):
    __tablename__ = 'service_complexes'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    price = Column(Float)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    
    services = relationship("Service", secondary="service_complex_pivot", back_populates="complexes")
    appointments = relationship("Appointment", secondary="appointment_complex_pivot", back_populates="complexes")

class Service(Base):
    __tablename__ = 'services'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    specialization_id = Column(Integer, ForeignKey('specializations.id'))
    base_price = Column(Float)  # Базовая стоимость услуги
    duration = Column(Integer)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    
    specialization = relationship("Specialization", back_populates="services")
    service_qualifications = relationship("ServiceQualificationPivot", back_populates="service")
    complexes = relationship("ServiceComplex", secondary="service_complex_pivot", back_populates="services")
    appointments = relationship("Appointment", secondary="appointment_service_pivot", back_populates="services")

# Новая таблица для связи услуг и квалификаций с ценами
class SpecializationQualificationPivot(Base):
    __tablename__ = 'specialization_qualification_pivot'
    specialization_id = Column(Integer, ForeignKey('specializations.id'), primary_key=True)
    qualification_id = Column(Integer, ForeignKey('qualifications.id'), primary_key=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    
    specialization = relationship("Specialization", back_populates="specialization_qualifications")
    qualification = relationship("Qualification", back_populates="specialization_qualifications")

class ServiceQualificationPivot(Base):
    __tablename__ = 'service_qualification_pivot'
    service_id = Column(Integer, ForeignKey('services.id'), primary_key=True)
    qualification_id = Column(Integer, ForeignKey('qualifications.id'), primary_key=True)
    price_modifier = Column(Float, default=0.0)  # Модификатор цены для данного уровня квалификации
    is_allowed = Column(Boolean, default=True)  # Разрешен ли данный уровень квалификации для услуги
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    
    service = relationship("Service", back_populates="service_qualifications")
    qualification = relationship("Qualification", back_populates="service_qualifications")

class Appointment(Base):
    __tablename__ = 'appointments'
    id = Column(Integer, primary_key=True, index=True)
    status = Column(String)
    client_id = Column(Integer, ForeignKey('clients.id'))
    employee_id = Column(Integer, ForeignKey('employees.id'))
    service_id = Column(Integer, ForeignKey('services.id'))
    complex_id = Column(Integer, ForeignKey('service_complexes.id'), nullable=True)
    datetime = Column(DateTime)
    is_completed = Column(Boolean, default=False)
    is_paid = Column(Boolean, default=False)
    notes = Column(Text)
    final_price = Column(Float)  # Итоговая цена с учетом квалификации мастера
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    
    client = relationship("Client", back_populates="appointments")
    employee = relationship("Employee", back_populates="appointments")
    schedules = relationship("Schedule", secondary="schedule_appointment", back_populates="appointments")
    notifications = relationship("Notification", back_populates="appointment")
    services = relationship("Service", secondary="appointment_service_pivot", back_populates="appointments")
    complexes = relationship("ServiceComplex", secondary="appointment_complex_pivot", back_populates="appointments")

class Schedule(Base):
    __tablename__ = 'schedules'
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey('employees.id'))
    date = Column(Date)
    start_time = Column(Time)
    end_time = Column(Time)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    
    employee = relationship("Employee", back_populates="schedules")
    appointments = relationship("Appointment", secondary="schedule_appointment", back_populates="schedules")
    exceptions = relationship("ScheduleException", back_populates="schedule")
    workload = relationship("EmployeeWorkload", back_populates="schedule")

class ClientPreferences(Base):
    __tablename__ = 'client_preferences'
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey('clients.id'))
    client_status_id = Column(Integer, ForeignKey('client_statuses.id'))
    preferences = Column(Text)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    
    client = relationship("Client", back_populates="preferences")
    client_status = relationship("ClientStatus", back_populates="client_preferences")

class ScheduleException(Base):
    __tablename__ = 'schedule_exceptions'
    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey('schedules.id'))
    start_time = Column(Time)
    end_time = Column(Time)
    reason = Column(Text)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    
    schedule = relationship("Schedule", back_populates="exceptions")

class NotificationStatus(enum.Enum):
    scheduled = "scheduled"
    sent = "sent"
    failed = "failed"

class Notification(Base):
    __tablename__ = 'notifications'
    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey('appointments.id'))
    scheduled_at = Column(DateTime)
    sent_at = Column(DateTime, nullable=True)
    status = Column(Enum(NotificationStatus), nullable=False)
    attempts = Column(Integer, default=0)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    
    appointment = relationship("Appointment", back_populates="notifications")

class EmployeeWorkload(Base):
    __tablename__ = 'employee_workload'
    schedule_id = Column(Integer, ForeignKey('schedules.id'), primary_key=True)
    booked_slots = Column(Integer)
    
    schedule = relationship("Schedule", back_populates="workload")

class ServicePopularity(Base):
    __tablename__ = 'service_popularity'
    service_id = Column(Integer, ForeignKey('services.id'), primary_key=True)
    month = Column(Date, primary_key=True)
    total_bookings = Column(Integer)
    
    service = relationship("Service")


class ServiceComplexPivot(Base):
    __tablename__ = 'service_complex_pivot'
    service_id = Column(Integer, ForeignKey('services.id'), primary_key=True)
    complex_id = Column(Integer, ForeignKey('service_complexes.id'), primary_key=True)

class ScheduleAppointment(Base):
    __tablename__ = 'schedule_appointment'
    schedule_id = Column(Integer, ForeignKey('schedules.id'), primary_key=True)
    appointment_id = Column(Integer, ForeignKey('appointments.id'), primary_key=True)

class AppointmentServicePivot(Base):
    __tablename__ = 'appointment_service_pivot'
    service_id = Column(Integer, ForeignKey('services.id'), primary_key=True)
    appointment_id = Column(Integer, ForeignKey('appointments.id'), primary_key=True)

class AppointmentComplexPivot(Base):
    __tablename__ = 'appointment_complex_pivot'
    complex_id = Column(Integer, ForeignKey('service_complexes.id'), primary_key=True)
    appointment_id = Column(Integer, ForeignKey('appointments.id'), primary_key=True)
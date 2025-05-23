from flask import Flask, jsonify, request
from datetime import datetime, date, time, timedelta
import enum
from .database import engine
from .models import Base
from .models import (
    ClientStatus, Client, Specialization, Employee, 
    ServiceComplex, Service, Appointment, Schedule,
    ClientPreferences, ScheduleException, Notification,
    EmployeeWorkload, ServicePopularity, Qualification,
    ServiceComplexPivot, ScheduleAppointment,
    AppointmentServicePivot, AppointmentComplexPivot, 
    SpecializationQualificationPivot, ServiceQualificationPivot
)
from .database import SessionLocal
from sqlalchemy.exc import IntegrityError
import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import logging
from flask_cors import CORS

from sqlalchemy import func, extract, case, and_, or_, desc, distinct, text
from sqlalchemy.sql import label

from .app_analytics import register_analytics_routes

# Настройка логирования
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Функция для создания базы данных, если она не существует
def create_database_if_not_exists():
    # Получаем параметры подключения из переменных окружения или используем значения по умолчанию
    DB_USER = os.environ.get('DB_USER', 'postgres')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', '1234')
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_PORT = os.environ.get('DB_PORT', '5432')
    DB_NAME = os.environ.get('DB_NAME', 'db_beauty_room_38')
    
    try:
        # Подключаемся к серверу PostgreSQL
        conn = psycopg2.connect(
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT,
            database='postgres'  # Подключаемся к системной базе postgres
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Проверяем, существует ли база данных
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (DB_NAME,))
        exists = cursor.fetchone()
        
        if not exists:
            logger.info(f"База данных {DB_NAME} не существует. Создаем...")
            # Создаем базу данных
            cursor.execute(f'CREATE DATABASE {DB_NAME}')
            logger.info(f"База данных {DB_NAME} успешно создана!")
        else:
            logger.info(f"База данных {DB_NAME} уже существует.")
        
        cursor.close()
        conn.close()
        
        # Создаем таблицы в базе данных
        Base.metadata.create_all(bind=engine)
        logger.info("Таблицы успешно созданы или уже существуют.")
        
        return True
    except Exception as e:
        logger.error(f"Ошибка при создании базы данных: {str(e)}")
        return False

app = Flask(__name__)
CORS(app)

register_analytics_routes(
    app, 
    SessionLocal, 
    Service, 
    ServicePopularity, 
    Employee, 
    Schedule, 
    EmployeeWorkload, 
    Appointment
)

# Вспомогательные функции
import enum

def serialize(model_instance):
    if not model_instance:
        return None
    result = {}
    for c in model_instance.__table__.columns:
        value = getattr(model_instance, c.name)
        # Обработка типов, которые не сериализуются в JSON напрямую
        if isinstance(value, (datetime, date)):
            result[c.name] = value.isoformat()
        elif isinstance(value, time):
            result[c.name] = value.strftime('%H:%M:%S')
        elif isinstance(value, enum.Enum):
            result[c.name] = value.value
        else:
            result[c.name] = value
    return result

def get_or_404(session, model, id):
    instance = session.query(model).get(id)
    if not instance:
        return None
    return instance

@app.route('/api/hello')
def hello():
    return jsonify({'message': 'Привет от бэкенда Beauty Room!'})

# ========== Основные CRUD эндпоинты ==========

# Qualification
@app.route('/api/qualifications', methods=['GET', 'POST'])
@app.route('/api/qualifications/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def qualifications(id=None):
    session = SessionLocal()
    try:
        if request.method == 'GET':
            if id:
                qualification = get_or_404(session, Qualification, id)
                if not qualification:
                    return jsonify({'error': 'Not found'}), 404
                return jsonify(serialize(qualification))
            else:
                qualifications = session.query(Qualification).all()
                return jsonify([serialize(q) for q in qualifications])
        elif request.method == 'POST':
            data = request.json
            qualification = Qualification(
                name=data['name'],
                priority=data['priority'],
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            session.add(qualification)
            session.commit()
            return jsonify(serialize(qualification)), 201
        elif request.method == 'PUT':
            qualification = get_or_404(session, Qualification, id)
            if not qualification:
                return jsonify({'error': 'Not found'}), 404
            data = request.json
            qualification.name = data.get('name', qualification.name)
            qualification.priority = data.get('priority', qualification.priority)
            qualification.updated_at = datetime.now()
            session.commit()
            return jsonify(serialize(qualification))
        elif request.method == 'DELETE':
            qualification = get_or_404(session, Qualification, id)
            if not qualification:
                return jsonify({'error': 'Not found'}), 404
            session.delete(qualification)
            session.commit()
            return jsonify({'message': 'Deleted successfully'}), 200
    except IntegrityError as e:
        session.rollback()
        return jsonify({'error': 'Integrity error', 'details': str(e)}), 400
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()

# ClientStatus
@app.route('/api/client_statuses', methods=['GET', 'POST'])
@app.route('/api/client_statuses/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def client_statuses(id=None):
    session = SessionLocal()
    try:
        if request.method == 'GET':
            if id:
                status = get_or_404(session, ClientStatus, id)
                if not status:
                    return jsonify({'error': 'Not found'}), 404
                return jsonify(serialize(status))
            else:
                statuses = session.query(ClientStatus).all()
                return jsonify([serialize(s) for s in statuses])
                
        elif request.method == 'POST':
            data = request.json
            status = ClientStatus(
                status=data['status'],
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            session.add(status)
            session.commit()
            return jsonify(serialize(status)), 201
            
        elif request.method == 'PUT':
            status = get_or_404(session, ClientStatus, id)
            if not status:
                return jsonify({'error': 'Not found'}), 404
            data = request.json
            status.status = data.get('status', status.status)
            status.updated_at = datetime.now()
            session.commit()
            return jsonify(serialize(status))
            
        elif request.method == 'DELETE':
            status = get_or_404(session, ClientStatus, id)
            if not status:
                return jsonify({'error': 'Not found'}), 404
            session.delete(status)
            session.commit()
            return jsonify({'message': 'Deleted successfully'}), 200
            
    except IntegrityError as e:
        session.rollback()
        return jsonify({'error': 'Integrity error', 'details': str(e)}), 400
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()

# Client
@app.route('/api/clients', methods=['GET', 'POST'])
@app.route('/api/clients/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def clients(id=None):
    session = SessionLocal()
    try:
        if request.method == 'GET':
            if id:
                client = get_or_404(session, Client, id)
                if not client:
                    return jsonify({'error': 'Not found'}), 404
                return jsonify(serialize(client))
            else:
                clients = session.query(Client).all()
                return jsonify([serialize(c) for c in clients])
                
        elif request.method == 'POST':
            data = request.json
            client = Client(
                full_name=data['full_name'],
                phone=data['phone'],
                email=data.get('email'),  # email может быть null
                telegram_chat_id=data.get('telegram_chat_id'),  # может быть null
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            session.add(client)
            session.commit()
            return jsonify(serialize(client)), 201
            
        elif request.method == 'PUT':
            client = get_or_404(session, Client, id)
            if not client:
                return jsonify({'error': 'Not found'}), 404
            data = request.json
            client.full_name = data.get('full_name', client.full_name)
            client.phone = data.get('phone', client.phone)
            client.email = data.get('email', client.email)
            client.updated_at = datetime.now()
            session.commit()
            return jsonify(serialize(client))
            
        elif request.method == 'DELETE':
            client = get_or_404(session, Client, id)
            if not client:
                return jsonify({'error': 'Not found'}), 404
            session.delete(client)
            session.commit()
            return jsonify({'message': 'Deleted successfully'}), 200
            
    except IntegrityError as e:
        session.rollback()
        return jsonify({'error': 'Integrity error', 'details': str(e)}), 400
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()

# Specialization
@app.route('/api/specializations', methods=['GET', 'POST'])
@app.route('/api/specializations/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def specializations(id=None):
    session = SessionLocal()
    try:
        if request.method == 'GET':
            if id:
                spec = get_or_404(session, Specialization, id)
                if not spec:
                    return jsonify({'error': 'Not found'}), 404
                return jsonify(serialize(spec))
            else:
                specs = session.query(Specialization).all()
                return jsonify([serialize(s) for s in specs])
                
        elif request.method == 'POST':
            data = request.json
            spec = Specialization(
                name=data['name'],
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            session.add(spec)
            session.commit()
            return jsonify(serialize(spec)), 201
            
        elif request.method == 'PUT':
            spec = get_or_404(session, Specialization, id)
            if not spec:
                return jsonify({'error': 'Not found'}), 404
            data = request.json
            spec.name = data.get('name', spec.name)
            spec.updated_at = datetime.now()
            session.commit()
            return jsonify(serialize(spec))
            
        elif request.method == 'DELETE':
            spec = get_or_404(session, Specialization, id)
            if not spec:
                return jsonify({'error': 'Not found'}), 404
            session.delete(spec)
            session.commit()
            return jsonify({'message': 'Deleted successfully'}), 200
            
    except IntegrityError as e:
        session.rollback()
        return jsonify({'error': 'Integrity error', 'details': str(e)}), 400
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()

# Employee
@app.route('/api/employees', methods=['GET', 'POST'])
@app.route('/api/employees/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def employees(id=None):
    session = SessionLocal()
    try:
        if request.method == 'GET':
            if id:
                emp = get_or_404(session, Employee, id)
                if not emp:
                    return jsonify({'error': 'Not found'}), 404
                data = serialize(emp)
                data['specialization'] = serialize(emp.specialization) if hasattr(emp, 'specialization') and emp.specialization else None
                data['qualification'] = serialize(emp.qualification) if hasattr(emp, 'qualification') and emp.qualification else None
                return jsonify(data)
            else:
                emps = session.query(Employee).all()
                result = []
                for emp in emps:
                    item = serialize(emp)
                    item['specialization'] = serialize(emp.specialization) if hasattr(emp, 'specialization') and emp.specialization else None
                    item['qualification'] = serialize(emp.qualification) if hasattr(emp, 'qualification') and emp.qualification else None
                    result.append(item)
                return jsonify(result)
                
        elif request.method == 'POST':
            data = request.json
            emp = Employee(
                specialization_id=data.get('specialization_id'),
                qualification_level_id=data.get('qualification_level_id'),
                full_name=data['full_name'],
                passport_number=data['passport_number'],
                phone=data.get('phone'),
                email=data.get('email'),
                password=data['password'],
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            session.add(emp)
            session.commit()
            return jsonify(serialize(emp)), 201
            
        elif request.method == 'PUT':
            emp = get_or_404(session, Employee, id)
            if not emp:
                return jsonify({'error': 'Not found'}), 404
            data = request.json
            emp.specialization_id = data.get('specialization_id', emp.specialization_id)
            emp.qualification_level_id = data.get('qualification_level_id', emp.qualification_level_id)
            emp.full_name = data.get('full_name', emp.full_name)
            emp.passport_number = data.get('passport_number', emp.passport_number)
            emp.phone = data.get('phone', emp.phone)
            emp.email = data.get('email', emp.email)
            if 'password' in data:
                emp.password = data['password']
            emp.updated_at = datetime.now()
            session.commit()
            return jsonify(serialize(emp))
            
        elif request.method == 'DELETE':
            emp = get_or_404(session, Employee, id)
            if not emp:
                return jsonify({'error': 'Not found'}), 404
            session.delete(emp)
            session.commit()
            return jsonify({'message': 'Deleted successfully'}), 200
            
    except IntegrityError as e:
        session.rollback()
        return jsonify({'error': 'Integrity error', 'details': str(e)}), 400
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()

# ServiceComplex
@app.route('/api/service_complexes', methods=['GET', 'POST'])
@app.route('/api/service_complexes/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def service_complexes(id=None):
    session = SessionLocal()
    try:
        if request.method == 'GET':
            if id:
                complex = get_or_404(session, ServiceComplex, id)
                if not complex:
                    return jsonify({'error': 'Not found'}), 404
                return jsonify(serialize(complex))
            else:
                complexes = session.query(ServiceComplex).all()
                return jsonify([serialize(c) for c in complexes])
                
        elif request.method == 'POST':
            data = request.json
            complex = ServiceComplex(
                name=data['name'],
                price=data['price'],
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            session.add(complex)
            session.commit()
            return jsonify(serialize(complex)), 201
            
        elif request.method == 'PUT':
            complex = get_or_404(session, ServiceComplex, id)
            if not complex:
                return jsonify({'error': 'Not found'}), 404
            data = request.json
            complex.name = data.get('name', complex.name)
            complex.price = data.get('price', complex.price)
            complex.updated_at = datetime.now()
            session.commit()
            return jsonify(serialize(complex))
            
        elif request.method == 'DELETE':
            complex = get_or_404(session, ServiceComplex, id)
            if not complex:
                return jsonify({'error': 'Not found'}), 404
            session.delete(complex)
            session.commit()
            return jsonify({'message': 'Deleted successfully'}), 200
            
    except IntegrityError as e:
        session.rollback()
        return jsonify({'error': 'Integrity error', 'details': str(e)}), 400
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()

# Service
@app.route('/api/services', methods=['GET', 'POST'])
@app.route('/api/services/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def services(id=None):
    session = SessionLocal()
    try:
        if request.method == 'GET':
            if id:
                service = get_or_404(session, Service, id)
                if not service:
                    return jsonify({'error': 'Not found'}), 404
                # Добавляем связанные объекты
                data = serialize(service)
                data['specialization'] = serialize(service.specialization) if hasattr(service, 'specialization') and service.specialization else None
                return jsonify(data)
            else:
                services_list = session.query(Service).all()
                result = []
                for s in services_list:
                    item = serialize(s)
                    item['specialization'] = serialize(s.specialization) if hasattr(s, 'specialization') and s.specialization else None
                    result.append(item)
                return jsonify(result)
        elif request.method == 'POST':
            data = request.json
            service = Service(
                name=data['name'],
                specialization_id=data['specialization_id'],
                base_price=data['base_price'],
                duration=data['duration'],
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            session.add(service)
            session.commit()
            return jsonify(serialize(service)), 201
        elif request.method == 'PUT':
            service = get_or_404(session, Service, id)
            if not service:
                return jsonify({'error': 'Not found'}), 404
            data = request.json
            service.name = data.get('name', service.name)
            service.specialization_id = data.get('specialization_id', service.specialization_id)
            service.base_price = data.get('base_price', service.base_price)
            service.duration = data.get('duration', service.duration)
            service.updated_at = datetime.now()
            session.commit()
            return jsonify(serialize(service))
        elif request.method == 'DELETE':
            service = get_or_404(session, Service, id)
            if not service:
                return jsonify({'error': 'Not found'}), 404
            session.delete(service)
            session.commit()
            return jsonify({'message': 'Deleted successfully'}), 200
    except IntegrityError as e:
        session.rollback()
        return jsonify({'error': 'Integrity error', 'details': str(e)}), 400
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()

# Appointment
@app.route('/api/appointments', methods=['GET', 'POST'])
@app.route('/api/appointments/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def appointments(id=None):
    session = SessionLocal()
    try:
        if request.method == 'GET':
            if id:
                appointment = get_or_404(session, Appointment, id)
                if not appointment:
                    return jsonify({'error': 'Not found'}), 404
                return jsonify(serialize(appointment))
            else:
                appointments = session.query(Appointment).all()
                return jsonify([serialize(a) for a in appointments])
                
        elif request.method == 'POST':
            data = request.json
            
            # Получаем данные из запроса
            client_id = data['client_id']
            employee_id = data['employee_id']
            service_id = data.get('service_id')
            complex_id = data.get('complex_id')
            appointment_datetime = datetime.fromisoformat(data['datetime'])
            status = data.get('status', 'scheduled')
            custom_duration = data.get('custom_duration')  # Пользовательская продолжительность
            final_price = data.get('final_price')  # Итоговая цена
            
            # Проверяем, что указана хотя бы одна услуга или комплекс
            if not service_id and not complex_id:
                return jsonify({'error': 'Необходимо указать услугу или комплекс услуг'}), 400
            
            # Получаем информацию об услуге для определения продолжительности
            total_duration = 0
            
            if service_id:
                service = session.query(Service).get(service_id)
                if not service:
                    return jsonify({'error': 'Услуга не найдена'}), 404
                
                # Используем пользовательскую продолжительность, если она указана
                if custom_duration is not None:
                    total_duration = custom_duration
                else:
                    total_duration = service.duration
            
            if complex_id:
                complex = session.query(ServiceComplex).get(complex_id)
                if not complex:
                    return jsonify({'error': 'Комплекс услуг не найден'}), 404
                
                # Получаем все услуги в комплексе
                complex_services = session.query(Service).join(
                    ServiceComplexPivot, 
                    Service.id == ServiceComplexPivot.service_id
                ).filter(
                    ServiceComplexPivot.complex_id == complex_id
                ).all()
                
                # Суммируем продолжительность всех услуг в комплексе
                # Если указана пользовательская продолжительность, используем её вместо суммы
                if custom_duration is not None:
                    total_duration = custom_duration
                else:
                    for s in complex_services:
                        total_duration += s.duration
            
            # Вычисляем время окончания процедуры
            appointment_end_time = appointment_datetime + timedelta(minutes=total_duration)
            
            # Проверяем, что время записи попадает в рабочее время сотрудника
            schedule = session.query(Schedule).filter(
                Schedule.employee_id == employee_id,
                Schedule.date == appointment_datetime.date()
            ).first()
            
            if not schedule:
                return jsonify({'error': 'Нет расписания для сотрудника на эту дату'}), 400
            
            # Проверяем, что время записи попадает в рабочее время
            schedule_start = datetime.combine(schedule.date, schedule.start_time)
            schedule_end = datetime.combine(schedule.date, schedule.end_time)
            
            if appointment_datetime < schedule_start or appointment_end_time > schedule_end:
                return jsonify({'error': 'Время записи выходит за рамки рабочего времени сотрудника'}), 400
            
            # Проверяем, что нет пересечений с другими записями
            existing_appointments = session.query(Appointment).filter(
                Appointment.employee_id == employee_id,
                Appointment.datetime >= schedule_start,
                Appointment.datetime <= schedule_end,
                Appointment.status != 'cancelled'
            ).all()
            
            for existing_app in existing_appointments:
                # Получаем продолжительность существующей записи
                existing_duration = 0
                
                # Используем пользовательскую продолжительность из самой записи
                if existing_app.custom_duration:
                    existing_duration = existing_app.custom_duration
                else:
                    # Получаем услуги для существующей записи
                    existing_services = session.query(Service).join(
                        AppointmentServicePivot,
                        Service.id == AppointmentServicePivot.service_id
                    ).filter(
                        AppointmentServicePivot.appointment_id == existing_app.id
                    ).all()
                    
                    # Суммируем продолжительность всех услуг
                    for s in existing_services:
                        existing_duration += s.duration
                
                # Если продолжительность не определена, используем стандартное значение
                if existing_duration == 0:
                    existing_duration = 60  # Стандартная продолжительность 1 час
                
                existing_datetime = existing_app.datetime
                existing_end_time = existing_datetime + timedelta(minutes=existing_duration)
                
                # Проверяем пересечение времени
                if (
                    # Новая запись начинается во время существующей
                    (appointment_datetime >= existing_datetime and appointment_datetime < existing_end_time) or
                    # Новая запись заканчивается во время существующей
                    (appointment_end_time > existing_datetime and appointment_end_time <= existing_end_time) or 
                    # Новая запись полностью содержит существующую
                    (appointment_datetime <= existing_datetime and appointment_end_time >= existing_end_time)
                ):
                    return jsonify({
                        'error': 'Временной слот занят другой записью',
                        'conflict_appointment_id': existing_app.id
                    }), 409
            
            # Создаем запись
            appointment = Appointment(
                client_id=client_id,
                employee_id=employee_id,
                datetime=appointment_datetime,
                status=status,
                service_id=service_id,
                complex_id=complex_id,
                custom_duration=custom_duration,  # Сохраняем в саму запись
                final_price=final_price,  # Сохраняем итоговую цену
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            session.add(appointment)
            session.flush()  # Получаем ID созданной записи
            
            # Добавляем связь с услугой, если она указана
            if service_id:
                service_pivot = AppointmentServicePivot(
                    appointment_id=appointment.id,
                    service_id=service_id
                    # Убираем custom_duration отсюда, так как оно теперь в самой записи
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
                for s in complex_services:
                    service_pivot = AppointmentServicePivot(
                        appointment_id=appointment.id,
                        service_id=s.id
                    )
                    session.add(service_pivot)
            
            session.commit()
            return jsonify(serialize(appointment)), 201
        
        elif request.method == 'PUT':
            appointment = get_or_404(session, Appointment, id)
            if not appointment:
                return jsonify({'error': 'Not found'}), 404
            
            data = request.json
            custom_duration = data.get('custom_duration')  # Получаем пользовательскую продолжительность
            
            # Проверяем возможность обновления записи, только если изменяется дата/время, услуга или сотрудник
            if ('datetime' in data and data['datetime'] != appointment.datetime) or \
               ('service_id' in data and data['service_id'] != appointment.service_id) or \
               ('employee_id' in data and data['employee_id'] != appointment.employee_id) or \
               ('custom_duration' in data):  # Также проверяем, если изменилась продолжительность
                
                appointment_datetime = datetime.fromisoformat(data.get('datetime', appointment.datetime).replace('Z', '+00:00') if isinstance(data.get('datetime', appointment.datetime), str) else data.get('datetime', appointment.datetime).isoformat())
                employee_id = data.get('employee_id', appointment.employee_id)
                service_id = data.get('service_id')
                
                # Получаем информацию об услуге и продолжительности
                total_duration = 0
                
                # Если указана пользовательская продолжительность, используем её
                if custom_duration is not None:
                    total_duration = custom_duration
                elif service_id:
                    # Если указан новый service_id, получаем его продолжительность
                    service = session.query(Service).get(service_id)
                    if not service:
                        return jsonify({'error': 'Услуга не найдена'}), 404
                    total_duration = service.duration
                elif appointment.custom_duration:
                    # Используем существующую пользовательскую продолжительность из записи
                    total_duration = appointment.custom_duration
                else:
                    # Получаем продолжительность из текущей услуги
                    existing_services = session.query(Service).join(
                        AppointmentServicePivot,
                        Service.id == AppointmentServicePivot.service_id
                    ).filter(
                        AppointmentServicePivot.appointment_id == appointment.id
                    ).all()
                    
                    # Суммируем продолжительность всех услуг
                    for s in existing_services:
                        total_duration += s.duration
                
                # Если продолжительность не определена, используем стандартное значение
                if total_duration == 0:
                    total_duration = 60  # Стандартная продолжительность 1 час
                
                # Вычисляем время окончания процедуры
                appointment_end_time = appointment_datetime + timedelta(minutes=total_duration)
                
                # 1. Проверка конфликта с другими записями
                existing_appointments = session.query(Appointment).filter(
                    Appointment.employee_id == employee_id,
                    Appointment.id != id
                ).all()
                
                for existing_app in existing_appointments:
                    # Пропускаем отменённые записи
                    if existing_app.status == 'cancelled':
                        continue
                    
                    # Получаем продолжительность существующей записи
                    existing_duration = 0
                    
                    # Используем пользовательскую продолжительность из самой записи
                    if existing_app.custom_duration:
                        existing_duration = existing_app.custom_duration
                    else:
                        # Получаем услуги для существующей записи
                        existing_services = session.query(Service).join(
                            AppointmentServicePivot,
                            Service.id == AppointmentServicePivot.service_id
                        ).filter(
                            AppointmentServicePivot.appointment_id == existing_app.id
                        ).all()
                        
                        # Суммируем продолжительность всех услуг
                        for s in existing_services:
                            existing_duration += s.duration
                    
                    # Если продолжительность не определена, используем стандартное значение
                    if existing_duration == 0:
                        existing_duration = 60  # Стандартная продолжительность 1 час
                    
                    existing_datetime = existing_app.datetime
                    existing_end_time = existing_datetime + timedelta(minutes=existing_duration)
                    
                    # Проверяем пересечение времени
                    if (
                        # Новая запись начинается во время существующей
                        (appointment_datetime >= existing_datetime and appointment_datetime < existing_end_time) or 
                        # Новая запись заканчивается во время существующей
                        (appointment_end_time > existing_datetime and appointment_end_time <= existing_end_time) or 
                        # Новая запись полностью содержит существующую
                        (appointment_datetime <= existing_datetime and appointment_end_time >= existing_end_time)
                    ):
                        return jsonify({
                            'error': 'Временной слот занят другой записью',
                            'conflict_appointment_id': existing_app.id
                        }), 409
                
                # 2. Проверка графика работы сотрудника
                appointment_date = appointment_datetime.date()
                appointment_time = appointment_datetime.time()
                
                # Проверяем, есть ли расписание на этот день
                schedule = session.query(Schedule).filter(
                    Schedule.employee_id == employee_id,
                    Schedule.date == appointment_date
                ).first()
                
                if not schedule:
                    return jsonify({'error': 'Сотрудник не работает в этот день недели'}), 409
                
                # Проверяем, входит ли время начала и окончания записи в рабочее время
                schedule_start = datetime.combine(appointment_date, schedule.start_time)
                schedule_end = datetime.combine(appointment_date, schedule.end_time)
                
                if appointment_datetime < schedule_start or appointment_end_time > schedule_end:
                    return jsonify({'error': 'Время записи выходит за рамки рабочего времени сотрудника'}), 409
                
                # 3. Проверка исключений в расписании (перерывы, отпуска и т.д.)
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
                            # Запись начинается во время исключения
                            (appointment_datetime >= exception_start and appointment_datetime < exception_end) or 
                            # Запись заканчивается во время исключения
                            (appointment_end_time > exception_start and appointment_end_time <= exception_end) or 
                            # Запись полностью содержит исключение
                            (appointment_datetime <= exception_start and appointment_end_time >= exception_end)
                        ):
                            return jsonify({'error': 'Временной слот пересекается с перерывом сотрудника'}), 409
            
            # Если все проверки пройдены успешно или они не требовались, обновляем запись
            appointment.client_id = data.get('client_id', appointment.client_id)
            appointment.employee_id = data.get('employee_id', appointment.employee_id)
            appointment.datetime = data.get('datetime', appointment.datetime)
            appointment.status = data.get('status', appointment.status)
            appointment.service_id = data.get('service_id', appointment.service_id)
            appointment.complex_id = data.get('complex_id', appointment.complex_id)
            appointment.custom_duration = data.get('custom_duration', appointment.custom_duration)
            appointment.is_paid = data.get('is_paid', appointment.is_paid)
            appointment.is_completed = data.get('is_completed', appointment.is_completed)
            appointment.notes = data.get('notes', appointment.notes)
            appointment.final_price = data.get('final_price', appointment.final_price)
            appointment.updated_at = datetime.now()
            
            # Обновляем связь с услугой, если она указана
            if 'service_id' in data:
                service_id = data.get('service_id')
                
                # Получаем текущую связь с услугой
                service_pivot = session.query(AppointmentServicePivot).filter_by(
                    appointment_id=appointment.id
                ).first()
                
                if service_pivot and service_id:
                    # Обновляем существующую связь
                    service_pivot.service_id = service_id
                elif service_id:
                    # Создаем новую связь
                    new_pivot = AppointmentServicePivot(
                        appointment_id=appointment.id,
                        service_id=service_id
                        # Убираем custom_duration, так как оно теперь в самой записи
                    )
                    session.add(new_pivot)
            
            session.commit()
            return jsonify(serialize(appointment))
            
        elif request.method == 'DELETE':
            appointment = get_or_404(session, Appointment, id)
            if not appointment:
                return jsonify({'error': 'Not found'}), 404
            session.delete(appointment)
            session.commit()
            return jsonify({'message': 'Deleted successfully'}), 200
            
    except IntegrityError as e:
        session.rollback()
        return jsonify({'error': 'Integrity error', 'details': str(e)}), 400
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()

# Schedule
@app.route('/api/schedules', methods=['GET', 'POST'])
@app.route('/api/schedules/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def schedules(id=None):
    session = SessionLocal()
    try:
        if request.method == 'GET':
            if id:
                schedule = get_or_404(session, Schedule, id)
                if not schedule:
                    return jsonify({'error': 'Not found'}), 404
                return jsonify(serialize(schedule))
            else:
                schedules = session.query(Schedule).all()
                return jsonify([serialize(s) for s in schedules])
                
        elif request.method == 'POST':
            data = request.json
            schedule = Schedule(
                employee_id=data['employee_id'],
                date=date.fromisoformat(data['date']),
                start_time=time.fromisoformat(data['start_time']),
                end_time=time.fromisoformat(data['end_time']),
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            session.add(schedule)
            session.commit()
            return jsonify(serialize(schedule)), 201
            
        elif request.method == 'PUT':
            schedule = get_or_404(session, Schedule, id)
            if not schedule:
                return jsonify({'error': 'Not found'}), 404
            data = request.json
            schedule.employee_id = data.get('employee_id', schedule.employee_id)
            if 'date' in data:
                schedule.date = date.fromisoformat(data['date'])
            if 'start_time' in data:
                schedule.start_time = time.fromisoformat(data['start_time'])
            if 'end_time' in data:
                schedule.end_time = time.fromisoformat(data['end_time'])
            schedule.updated_at = datetime.now()
            session.commit()
            return jsonify(serialize(schedule))
            
        elif request.method == 'DELETE':
            schedule = get_or_404(session, Schedule, id)
            if not schedule:
                return jsonify({'error': 'Not found'}), 404
            session.delete(schedule)
            session.commit()
            return jsonify({'message': 'Deleted successfully'}), 200
            
    except IntegrityError as e:
        session.rollback()
        return jsonify({'error': 'Integrity error', 'details': str(e)}), 400
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()

# ClientPreferences
@app.route('/api/client_preferences', methods=['GET', 'POST'])
@app.route('/api/client_preferences/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def client_preferences(id=None):
    session = SessionLocal()
    try:
        if request.method == 'GET':
            if id:
                pref = get_or_404(session, ClientPreferences, id)
                if not pref:
                    return jsonify({'error': 'Not found'}), 404
                return jsonify(serialize(pref))
            else:
                prefs = session.query(ClientPreferences).all()
                return jsonify([serialize(p) for p in prefs])
                
        elif request.method == 'POST':
            data = request.json
            pref = ClientPreferences(
                client_id=data['client_id'],
                client_status_id=data['client_status_id'],
                preferences=data.get('preferences'),
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            session.add(pref)
            session.commit()
            return jsonify(serialize(pref)), 201
            
        elif request.method == 'PUT':
            pref = get_or_404(session, ClientPreferences, id)
            if not pref:
                return jsonify({'error': 'Not found'}), 404
            data = request.json
            pref.client_id = data.get('client_id', pref.client_id)
            pref.client_status_id = data.get('client_status_id', pref.client_status_id)
            pref.preferences = data.get('preferences', pref.preferences)
            pref.updated_at = datetime.now()
            session.commit()
            return jsonify(serialize(pref))
            
        elif request.method == 'DELETE':
            pref = get_or_404(session, ClientPreferences, id)
            if not pref:
                return jsonify({'error': 'Not found'}), 404
            session.delete(pref)
            session.commit()
            return jsonify({'message': 'Deleted successfully'}), 200
            
    except IntegrityError as e:
        session.rollback()
        return jsonify({'error': 'Integrity error', 'details': str(e)}), 400
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()

# ScheduleException
@app.route('/api/schedule_exceptions', methods=['GET', 'POST'])
@app.route('/api/schedule_exceptions/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def schedule_exceptions(id=None):
    session = SessionLocal()
    try:
        if request.method == 'GET':
            if id:
                exc = get_or_404(session, ScheduleException, id)
                if not exc:
                    return jsonify({'error': 'Not found'}), 404
                return jsonify(serialize(exc))
            else:
                exceptions = session.query(ScheduleException).all()
                return jsonify([serialize(e) for e in exceptions])
                
        elif request.method == 'POST':
            data = request.json
            exc = ScheduleException(
                schedule_id=data['schedule_id'],
                start_time=time.fromisoformat(data['start_time']),
                end_time=time.fromisoformat(data['end_time']),
                reason=data['reason'],
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            session.add(exc)
            session.commit()
            return jsonify(serialize(exc)), 201
            
        elif request.method == 'PUT':
            exc = get_or_404(session, ScheduleException, id)
            if not exc:
                return jsonify({'error': 'Not found'}), 404
            data = request.json
            exc.schedule_id = data.get('schedule_id', exc.schedule_id)
            if 'start_time' in data:
                exc.start_time = time.fromisoformat(data['start_time'])
            if 'end_time' in data:
                exc.end_time = time.fromisoformat(data['end_time'])
            exc.reason = data.get('reason', exc.reason)
            exc.updated_at = datetime.now()
            session.commit()
            return jsonify(serialize(exc))
            
        elif request.method == 'DELETE':
            exc = get_or_404(session, ScheduleException, id)
            if not exc:
                return jsonify({'error': 'Not found'}), 404
            session.delete(exc)
            session.commit()
            return jsonify({'message': 'Deleted successfully'}), 200
            
    except IntegrityError as e:
        session.rollback()
        return jsonify({'error': 'Integrity error', 'details': str(e)}), 400
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()

# Notification
@app.route('/api/notifications', methods=['GET', 'POST'])
@app.route('/api/notifications/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def notifications(id=None):
    session = SessionLocal()
    try:
        if request.method == 'GET':
            if id:
                notification = get_or_404(session, Notification, id)
                if not notification:
                    return jsonify({'error': 'Not found'}), 404
                data = serialize(notification)
                data['appointment'] = serialize(notification.appointment) if hasattr(notification, 'appointment') and notification.appointment else None
                return jsonify(data)
            else:
                notifications = session.query(Notification).all()
                result = []
                for n in notifications:
                    item = serialize(n)
                    item['appointment'] = serialize(n.appointment) if hasattr(n, 'appointment') and n.appointment else None
                    result.append(item)
                return jsonify(result)
        elif request.method == 'POST':
            data = request.json
            notification = Notification(
                appointment_id=data['appointment_id'],
                scheduled_at=datetime.fromisoformat(data['scheduled_at']),
                sent_at=datetime.fromisoformat(data['sent_at']) if data.get('sent_at') else None,
                status=data['status'],
                attempts=data.get('attempts', 0),
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            session.add(notification)
            session.commit()
            return jsonify(serialize(notification)), 201
        elif request.method == 'PUT':
            notification = get_or_404(session, Notification, id)
            if not notification:
                return jsonify({'error': 'Not found'}), 404
            data = request.json
            notification.appointment_id = data.get('appointment_id', notification.appointment_id)
            if 'scheduled_at' in data:
                notification.scheduled_at = datetime.fromisoformat(data['scheduled_at'])
            if 'sent_at' in data:
                notification.sent_at = datetime.fromisoformat(data['sent_at']) if data['sent_at'] else None
            notification.status = data.get('status', notification.status)
            notification.attempts = data.get('attempts', notification.attempts)
            notification.updated_at = datetime.now()
            session.commit()
            return jsonify(serialize(notification))
        elif request.method == 'DELETE':
            notification = get_or_404(session, Notification, id)
            if not notification:
                return jsonify({'error': 'Not found'}), 404
            session.delete(notification)
            session.commit()
            return jsonify({'message': 'Deleted successfully'}), 200
    except IntegrityError as e:
        session.rollback()
        return jsonify({'error': 'Integrity error', 'details': str(e)}), 400
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()

# EmployeeWorkload
@app.route('/api/employee_workload', methods=['GET', 'POST'])
@app.route('/api/employee_workload/<int:schedule_id>', methods=['GET', 'PUT', 'DELETE'])
def employee_workload(schedule_id=None):
    session = SessionLocal()
    try:
        if request.method == 'GET':
            if schedule_id:
                workload = get_or_404(session, EmployeeWorkload, schedule_id)
                if not workload:
                    return jsonify({'error': 'Not found'}), 404
                return jsonify(serialize(workload))
            else:
                workloads = session.query(EmployeeWorkload).all()
                return jsonify([serialize(w) for w in workloads])
                
        elif request.method == 'POST':
            data = request.json
            booked_slots = data['booked_slots']
            total_slots = data['total_slots']
            
            # Расчет процента загруженности
            workload_percent = round((booked_slots / total_slots) * 100, 2) if total_slots > 0 else 0
            
            workload = EmployeeWorkload(
                schedule_id=data['schedule_id'],
                booked_slots=booked_slots,
                total_slots=total_slots,
                workload_percent=workload_percent
            )
            session.add(workload)
            session.commit()
            return jsonify(serialize(workload)), 201
            
        elif request.method == 'PUT':
            workload = get_or_404(session, EmployeeWorkload, schedule_id)
            if not workload:
                return jsonify({'error': 'Not found'}), 404
            data = request.json
            workload.schedule_id = data.get('schedule_id', workload.schedule_id)
            workload.booked_slots = data.get('booked_slots', workload.booked_slots)
            workload.total_slots = data.get('total_slots', workload.total_slots)
            
            # Пересчет процента загруженности при обновлении
            workload.workload_percent = round((workload.booked_slots / workload.total_slots) * 100, 2) if workload.total_slots > 0 else 0
            
            session.commit()

            return jsonify(serialize(workload))
            
        elif request.method == 'DELETE':
            workload = get_or_404(session, EmployeeWorkload, schedule_id)
            if not workload:
                return jsonify({'error': 'Not found'}), 404
            session.delete(workload)
            session.commit()
            return jsonify({'message': 'Deleted successfully'}), 200
            
    except IntegrityError as e:
        session.rollback()
        return jsonify({'error': 'Integrity error', 'details': str(e)}), 400
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()

# ServicePopularity
@app.route('/api/service_popularity', methods=['GET', 'POST'])
@app.route('/api/service_popularity/<int:service_id>/<string:month>', methods=['GET', 'PUT', 'DELETE'])
def service_popularity(service_id=None, month=None):
    session = SessionLocal()
    try:
        if request.method == 'GET':
            if service_id and month:
                popularity = session.query(ServicePopularity).filter_by(
                    service_id=service_id,
                    month=date.fromisoformat(month)
                ).first()
                if not popularity:
                    return jsonify({'error': 'Not found'}), 404
                return jsonify(serialize(popularity))
            else:
                popularities = session.query(ServicePopularity).all()
                return jsonify([serialize(p) for p in popularities])
                
        elif request.method == 'POST':
            data = request.json
            popularity = ServicePopularity(
                service_id=data['service_id'],
                month=date.fromisoformat(data['month']),
                total_bookings=data['total_bookings']
            )
            session.add(popularity)
            session.commit()
            return jsonify(serialize(popularity)), 201
            
        elif request.method == 'PUT':
            if not service_id or not month:
                return jsonify({'error': 'service_id and month are required'}), 400
            popularity = session.query(ServicePopularity).filter_by(
                service_id=service_id,
                month=date.fromisoformat(month)
            ).first()
            if not popularity:
                return jsonify({'error': 'Not found'}), 404
            data = request.json
            popularity.service_id = data.get('service_id', popularity.service_id)
            if 'month' in data:
                popularity.month = date.fromisoformat(data['month'])
            popularity.total_bookings = data.get('total_bookings', popularity.total_bookings)
            session.commit()
            return jsonify(serialize(popularity))
            
        elif request.method == 'DELETE':
            if not service_id or not month:
                return jsonify({'error': 'service_id and month are required'}), 400
            popularity = session.query(ServicePopularity).filter_by(
                service_id=service_id,
                month=date.fromisoformat(month)
            ).first()
            if not popularity:
                return jsonify({'error': 'Not found'}), 404
            session.delete(popularity)
            session.commit()
            return jsonify({'message': 'Deleted successfully'}), 200
            
    except IntegrityError as e:
        session.rollback()
        return jsonify({'error': 'Integrity error', 'details': str(e)}), 400
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()

# ========== Связующие таблицы (многие-ко-многим) ==========

# ServiceComplexPivot
@app.route('/api/service_complex_pivot', methods=['GET', 'POST'])
@app.route('/api/service_complex_pivot/<int:service_id>/<int:complex_id>', methods=['DELETE'])
def service_complex_pivot(service_id=None, complex_id=None):
    session = SessionLocal()
    try:
        if request.method == 'GET':
            pivots = session.query(ServiceComplexPivot).all()
            return jsonify([{'service_id': p.service_id, 'complex_id': p.complex_id} for p in pivots])
                
        elif request.method == 'POST':
            data = request.json
            pivot = ServiceComplexPivot(
                service_id=data['service_id'],
                complex_id=data['complex_id']
            )
            session.add(pivot)
            session.commit()
            return jsonify({'service_id': pivot.service_id, 'complex_id': pivot.complex_id}), 201
            
        elif request.method == 'DELETE':
            if not service_id or not complex_id:
                return jsonify({'error': 'service_id and complex_id are required'}), 400
            pivot = session.query(ServiceComplexPivot).filter_by(
                service_id=service_id,
                complex_id=complex_id
            ).first()
            if not pivot:
                return jsonify({'error': 'Not found'}), 404
            session.delete(pivot)
            session.commit()
            return jsonify({'message': 'Deleted successfully'}), 200
            
    except IntegrityError as e:
        session.rollback()
        return jsonify({'error': 'Integrity error', 'details': str(e)}), 400
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()

# ScheduleAppointment
@app.route('/api/schedule_appointment', methods=['GET', 'POST'])
@app.route('/api/schedule_appointment/<int:schedule_id>/<int:appointment_id>', methods=['DELETE'])
def schedule_appointment(schedule_id=None, appointment_id=None):
    session = SessionLocal()
    try:
        if request.method == 'GET':
            pivots = session.query(ScheduleAppointment).all()
            return jsonify([{'schedule_id': p.schedule_id, 'appointment_id': p.appointment_id} for p in pivots])
                    
        elif request.method == 'POST':
            data = request.json
            pivot = ScheduleAppointment(
                schedule_id=data['schedule_id'],
                appointment_id=data['appointment_id']
            )
            session.add(pivot)
            session.commit()
            return jsonify({'schedule_id': pivot.schedule_id, 'appointment_id': pivot.appointment_id}), 201
            
        elif request.method == 'DELETE':
            if not schedule_id or not appointment_id:
                return jsonify({'error': 'schedule_id and appointment_id are required'}), 400
            pivot = session.query(ScheduleAppointment).filter_by(
                schedule_id=schedule_id,
                appointment_id=appointment_id
            ).first()
            if not pivot:
                return jsonify({'error': 'Not found'}), 404
            session.delete(pivot)
            session.commit()
            return jsonify({'message': 'Deleted successfully'}), 200
            
    except IntegrityError as e:
        session.rollback()
        return jsonify({'error': 'Integrity error', 'details': str(e)}), 400
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()

# AppointmentServicePivot
@app.route('/api/appointment_service_pivot', methods=['GET', 'POST'])
@app.route('/api/appointment_service_pivot/<int:service_id>/<int:appointment_id>', methods=['GET', 'PUT', 'DELETE'])
def appointment_service_pivot(service_id=None, appointment_id=None):
    session = SessionLocal()
    try:
        if request.method == 'GET':
            if service_id and appointment_id:
                pivot = session.query(AppointmentServicePivot).filter_by(
                    service_id=service_id, appointment_id=appointment_id
                ).first()
                if not pivot:
                    return jsonify({'error': 'Not found'}), 404
                return jsonify(serialize(pivot))
            else:
                pivots = session.query(AppointmentServicePivot).all()
                return jsonify([serialize(p) for p in pivots])
                
        elif request.method == 'POST':
            data = request.json
            pivot = AppointmentServicePivot(
                service_id=data['service_id'],
                appointment_id=data['appointment_id'],
                custom_duration=data.get('custom_duration')  # Опциональный параметр
            )
            session.add(pivot)
            session.commit()
            return jsonify(serialize(pivot)), 201
            
        elif request.method == 'PUT':
            pivot = session.query(AppointmentServicePivot).filter_by(
                service_id=service_id, appointment_id=appointment_id
            ).first()
            if not pivot:
                return jsonify({'error': 'Not found'}), 404
            data = request.json
            if 'custom_duration' in data:
                pivot.custom_duration = data['custom_duration']
            session.commit()
            return jsonify(serialize(pivot))
            
        elif request.method == 'DELETE':
            pivot = session.query(AppointmentServicePivot).filter_by(
                service_id=service_id, appointment_id=appointment_id
            ).first()
            if not pivot:
                return jsonify({'error': 'Not found'}), 404
            session.delete(pivot)
            session.commit()
            return jsonify({'message': 'Deleted successfully'}), 200
            
    except IntegrityError as e:
        session.rollback()
        return jsonify({'error': 'Integrity error', 'details': str(e)}), 400
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()

# AppointmentComplexPivot
@app.route('/api/appointment_complex_pivot', methods=['GET', 'POST'])
@app.route('/api/appointment_complex_pivot/<int:complex_id>/<int:appointment_id>', methods=['DELETE'])
def appointment_complex_pivot(complex_id=None, appointment_id=None):
    session = SessionLocal()
    try:
        if request.method == 'GET':
            pivots = session.query(AppointmentComplexPivot).all()
            return jsonify([{'complex_id': p.complex_id, 'appointment_id': p.appointment_id} for p in pivots])
                
        elif request.method == 'POST':
            data = request.json
            pivot = AppointmentComplexPivot(
                complex_id=data['complex_id'],
                appointment_id=data['appointment_id']
            )
            session.add(pivot)
            session.commit()
            return jsonify({'complex_id': pivot.complex_id, 'appointment_id': pivot.appointment_id}), 201
            
        elif request.method == 'DELETE':
            if not complex_id or not appointment_id:
                return jsonify({'error': 'complex_id and appointment_id are required'}), 400
            pivot = session.query(AppointmentComplexPivot).filter_by(
                complex_id=complex_id,
                appointment_id=appointment_id
            ).first()
            if not pivot:
                return jsonify({'error': 'Not found'}), 404
            session.delete(pivot)
            session.commit()
            return jsonify({'message': 'Deleted successfully'}), 200
            
    except IntegrityError as e:
        session.rollback()
        return jsonify({'error': 'Integrity error', 'details': str(e)}), 400
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()

# SpecializationQualificationPivot
@app.route('/api/specialization_qualifications', methods=['GET', 'POST'])
@app.route('/api/specialization_qualifications/<int:specialization_id>/<int:qualification_id>', methods=['GET', 'PUT', 'DELETE'])
def specialization_qualifications(specialization_id=None, qualification_id=None):
    session = SessionLocal()
    try:
        if request.method == 'GET':
            if specialization_id is not None and qualification_id is not None:
                spec_qual = session.query(SpecializationQualificationPivot).filter_by(
                    specialization_id=specialization_id, 
                    qualification_id=qualification_id
                ).first()
                if not spec_qual:
                    return jsonify({'error': 'Not found'}), 404
                
                result = serialize(spec_qual)
                result['specialization'] = serialize(spec_qual.specialization_qualifications) if hasattr(spec_qual, 'specialization_qualifications') else None
                result['qualification'] = serialize(spec_qual.qualification) if hasattr(spec_qual, 'qualification') else None
                return jsonify(result)
            else:
                spec_quals = session.query(SpecializationQualificationPivot).all()
                result = []
                for sq in spec_quals:
                    item = serialize(sq)
                    item['specialization'] = serialize(sq.specialization_qualifications) if hasattr(sq, 'specialization_qualifications') else None
                    item['qualification'] = serialize(sq.qualification) if hasattr(sq, 'qualification') else None
                    result.append(item)
                return jsonify(result)
                
        elif request.method == 'POST':
            data = request.json
            spec_qual = SpecializationQualificationPivot(
                specialization_id=data['specialization_id'],
                qualification_id=data['qualification_id'],
                description=data.get('description')
            )
            session.add(spec_qual)
            session.commit()
            return jsonify(serialize(spec_qual)), 201
            
        elif request.method == 'PUT':
            spec_qual = session.query(SpecializationQualificationPivot).filter_by(
                specialization_id=specialization_id, 
                qualification_id=qualification_id
            ).first()
            if not spec_qual:
                return jsonify({'error': 'Not found'}), 404
                
            data = request.json
            spec_qual.description = data.get('description', spec_qual.description)
            session.commit()
            return jsonify(serialize(spec_qual))
            
        elif request.method == 'DELETE':
            spec_qual = session.query(SpecializationQualificationPivot).filter_by(
                specialization_id=specialization_id, 
                qualification_id=qualification_id
            ).first()
            if not spec_qual:
                return jsonify({'error': 'Not found'}), 404
                
            session.delete(spec_qual)
            session.commit()
            return jsonify({'message': 'Deleted successfully'}), 200
            
    except IntegrityError as e:
        session.rollback()
        return jsonify({'error': 'Integrity error', 'details': str(e)}), 400
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()

# ServiceQualificationPivot
@app.route('/api/service_qualifications', methods=['GET', 'POST'])
@app.route('/api/service_qualifications/<int:service_id>/<int:qualification_id>', methods=['GET', 'PUT', 'DELETE'])
@app.route('/api/service_qualifications/<int:service_id>', methods=['DELETE'])  # Новый маршрут
def service_qualifications(service_id=None, qualification_id=None):
    session = SessionLocal()
    try:
        if request.method == 'GET':
            if service_id is not None and qualification_id is not None:
                service_qual = session.query(ServiceQualificationPivot).filter_by(
                    service_id=service_id, 
                    qualification_id=qualification_id
                ).first()
                if not service_qual:
                    return jsonify({'error': 'Not found'}), 404
                
                result = serialize(service_qual)
                result['service'] = serialize(service_qual.service) if hasattr(service_qual, 'service') else None
                result['qualification'] = serialize(service_qual.qualification) if hasattr(service_qual, 'qualification') else None
                return jsonify(result)
            else:
                service_quals = session.query(ServiceQualificationPivot).all()
                result = []
                for sq in service_quals:
                    item = serialize(sq)
                    item['service'] = serialize(sq.service) if hasattr(sq, 'service') else None
                    item['qualification'] = serialize(sq.qualification) if hasattr(sq, 'qualification') else None
                    result.append(item)
                return jsonify(result)
                
        elif request.method == 'POST':
            data = request.json
            service_qual = ServiceQualificationPivot(
                service_id=data['service_id'],
                qualification_id=data['qualification_id'],
                price_modified=data.get('price_modified', 0.0),  # Измененное название и значение по умолчанию
                is_allowed=data.get('is_allowed', True)
            )
            session.add(service_qual)
            session.commit()
            return jsonify(serialize(service_qual)), 201
            
        elif request.method == 'PUT':
            service_qual = session.query(ServiceQualificationPivot).filter_by(
                service_id=service_id, 
                qualification_id=qualification_id
            ).first()
            if not service_qual:
                return jsonify({'error': 'Not found'}), 404
                
            data = request.json
            service_qual.price_modified = data.get('price_modified', service_qual.price_modified)
            service_qual.is_allowed = data.get('is_allowed', service_qual.is_allowed)
            session.commit()
            return jsonify(serialize(service_qual))
            
        elif request.method == 'DELETE':
            if service_id is not None and qualification_id is not None:
                # Удаление конкретной связи
                service_qual = session.query(ServiceQualificationPivot).filter_by(
                    service_id=service_id, 
                    qualification_id=qualification_id
                ).first()
                if not service_qual:
                    return jsonify({'error': 'Not found'}), 404
                    
                session.delete(service_qual)
                session.commit()
                return jsonify({'message': 'Deleted successfully'}), 200
            elif service_id is not None:
                # Удаление всех связей для услуги
                service_quals = session.query(ServiceQualificationPivot).filter_by(
                    service_id=service_id
                ).all()
                
                for sq in service_quals:
                    session.delete(sq)
                
                session.commit()
                return jsonify({'message': 'All qualifications for service deleted successfully'}), 200
            
    except IntegrityError as e:
        session.rollback()
        return jsonify({'error': 'Integrity error', 'details': str(e)}), 400
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()

# Get qualifications for a specific specialization
@app.route('/api/specializations/<int:specialization_id>/qualifications', methods=['GET'])
def get_specialization_qualifications(specialization_id):
    session = SessionLocal()
    try:
        spec_quals = session.query(SpecializationQualificationPivot).filter_by(
            specialization_id=specialization_id
        ).all()
        
        result = []
        for sq in spec_quals:
            item = serialize(sq)
            item['qualification'] = serialize(sq.qualification) if hasattr(sq, 'qualification') else None
            result.append(item)
            
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()

@app.route('/api/available_slots', methods=['GET'])
def available_slots():
    """
    Получение доступных временных слотов для записи к определенному сотруднику на определенную дату
    Параметры запроса:
    - employee_id: ID сотрудника
    - date: дата (YYYY-MM-DD)
    - service_id: ID услуги (опционально)
    - complex_id: ID комплекса услуг (опционально)
    - duration: продолжительность в минутах (опционально, если указаны service_id или complex_id)
    - slot_interval: интервал слотов в минутах (по умолчанию 30)
    """
    session = SessionLocal()
    try:
        # Получаем параметры запроса
        employee_id = request.args.get('employee_id')
        date_str = request.args.get('date')
        service_id = request.args.get('service_id')
        complex_id = request.args.get('complex_id')
        custom_duration = request.args.get('duration')
        slot_interval = int(request.args.get('slot_interval', 30))
        
        if not all([employee_id, date_str]):
            return jsonify({'error': 'Необходимо указать ID сотрудника и дату'}), 400
        
        # Преобразуем строку в объект date
        requested_date = date.fromisoformat(date_str)
        
        # Получаем расписание сотрудника на указанную дату
        schedule = session.query(Schedule).filter(
            Schedule.employee_id == employee_id,
            Schedule.date == requested_date
        ).first()
        
        if not schedule:
            return jsonify({'error': 'Нет расписания для сотрудника на эту дату'}), 404
        
        # Определяем начало и конец рабочего дня
        schedule_start = datetime.combine(schedule.date, schedule.start_time)
        schedule_end = datetime.combine(schedule.date, schedule.end_time)
        
        # Получаем продолжительность услуги
        total_duration = 0
        
        if custom_duration:
            total_duration = int(custom_duration)
        elif service_id:
            service = session.query(Service).get(service_id)
            if not service:
                return jsonify({'error': 'Услуга не найдена'}), 404
            total_duration = service.duration
        elif complex_id:
            complex = session.query(ServiceComplex).get(complex_id)
            if not complex:
                return jsonify({'error': 'Комплекс услуг не найден'}), 404
            
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
        
        # Получаем существующие записи на этот день
        existing_appointments = session.query(Appointment).filter(
            Appointment.employee_id == employee_id,
            Appointment.datetime >= schedule_start,
            Appointment.datetime <= schedule_end,
            Appointment.status != 'cancelled'
        ).all()
        
        # Создаем список занятых временных интервалов
        busy_slots = []
        
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
        
        # Генерируем все возможные временные слоты с заданным интервалом
        all_slots = []
        current_time = schedule_start
        
        while current_time + timedelta(minutes=total_duration) <= schedule_end:
            all_slots.append({
                'start': current_time,
                'end': current_time + timedelta(minutes=total_duration)
            })
            current_time += timedelta(minutes=slot_interval)
        
        # Фильтруем доступные слоты (не пересекающиеся с занятыми)
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
                available_slots.append({
                    'start': slot['start'].strftime('%H:%M'),
                    'end': slot['end'].strftime('%H:%M'),
                    'duration': total_duration
                })
        
        return jsonify({
            'employee_id': int(employee_id),
            'date': date_str,
            'working_hours': {
                'start': schedule.start_time.strftime('%H:%M'),
                'end': schedule.end_time.strftime('%H:%M')
            },
            'service_duration': total_duration,
            'available_slots': available_slots
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    finally:
        session.close()

if __name__ == '__main__':
    create_database_if_not_exists()
    app.run(host='0.0.0.0', port=5000, debug=True)
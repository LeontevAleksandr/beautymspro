from flask import Flask, jsonify, request
from datetime import datetime, date, time
import enum
from .database import engine
from .models import Base
from .models import (
    ClientStatus, Client, Specialization, Employee, 
    ServiceComplex, Service, Appointment, Schedule,
    ClientPreferences, ScheduleException, Notification,
    EmployeeWorkload, ServicePopularity, Qualification,
    ServiceComplexPivot, ScheduleAppointment,
    AppointmentServicePivot, AppointmentComplexPivot
)
from .database import SessionLocal
from datetime import datetime, date, time
from sqlalchemy.exc import IntegrityError
import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import logging
from flask_cors import CORS

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
                return jsonify(serialize(emp))
            else:
                emps = session.query(Employee).all()
                return jsonify([serialize(e) for e in emps])
                
        elif request.method == 'POST':
            data = request.json
            emp = Employee(
                specialization_id=data.get('specialization_id'),
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
                data['required_qualification'] = serialize(service.required_qualification) if hasattr(service, 'required_qualification') and service.required_qualification else None
                return jsonify(data)
            else:
                services_list = session.query(Service).all()
                result = []
                for s in services_list:
                    item = serialize(s)
                    item['specialization'] = serialize(s.specialization) if hasattr(s, 'specialization') and s.specialization else None
                    item['required_qualification'] = serialize(s.required_qualification) if hasattr(s, 'required_qualification') and s.required_qualification else None
                    result.append(item)
                return jsonify(result)
        elif request.method == 'POST':
            data = request.json
            service = Service(
                name=data['name'],
                specialization_id=data['specialization_id'],
                qualification_level_id=data.get('qualification_level_id'),
                duration=data['duration'],
                price=data['price'],
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
            service.qualification_level_id = data.get('qualification_level_id', service.qualification_level_id)
            service.duration = data.get('duration', service.duration)
            service.price = data.get('price', service.price)
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
            appointment = Appointment(
                status=data.get('status', 'created'),
                client_id=data['client_id'],
                employee_id=data['employee_id'],
                service_id=data.get('service_id'),
                complex_id=data.get('complex_id'),
                datetime=datetime.fromisoformat(data['datetime']),
                is_completed=data.get('is_completed', False),
                is_paid=data.get('is_paid', False),
                notes=data.get('notes'),
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            session.add(appointment)
            session.commit()
            return jsonify(serialize(appointment)), 201
            
        elif request.method == 'PUT':
            appointment = get_or_404(session, Appointment, id)
            if not appointment:
                return jsonify({'error': 'Not found'}), 404
            data = request.json
            appointment.status = data.get('status', appointment.status)
            appointment.client_id = data.get('client_id', appointment.client_id)
            appointment.employee_id = data.get('employee_id', appointment.employee_id)
            appointment.service_id = data.get('service_id', appointment.service_id)
            appointment.complex_id = data.get('complex_id', appointment.complex_id)
            if 'datetime' in data:
                appointment.datetime = datetime.fromisoformat(data['datetime'])
            appointment.is_completed = data.get('is_completed', appointment.is_completed)
            appointment.is_paid = data.get('is_paid', appointment.is_paid)
            appointment.notes = data.get('notes', appointment.notes)
            appointment.updated_at = datetime.now()
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
            workload = EmployeeWorkload(
                schedule_id=data['schedule_id'],
                booked_slots=data['booked_slots']
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
@app.route('/api/appointment_service_pivot/<int:service_id>/<int:appointment_id>', methods=['DELETE'])
def appointment_service_pivot(service_id=None, appointment_id=None):
    session = SessionLocal()
    try:
        if request.method == 'GET':
            pivots = session.query(AppointmentServicePivot).all()
            return jsonify([{'service_id': p.service_id, 'appointment_id': p.appointment_id} for p in pivots])
                
        elif request.method == 'POST':
            data = request.json
            pivot = AppointmentServicePivot(
                service_id=data['service_id'],
                appointment_id=data['appointment_id']
            )
            session.add(pivot)
            session.commit()
            return jsonify({'service_id': pivot.service_id, 'appointment_id': pivot.appointment_id}), 201
            
        elif request.method == 'DELETE':
            if not service_id or not appointment_id:
                return jsonify({'error': 'service_id and appointment_id are required'}), 400
            pivot = session.query(AppointmentServicePivot).filter_by(
                service_id=service_id,
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

if __name__ == '__main__':
    create_database_if_not_exists()
    app.run(host='0.0.0.0', port=5000, debug=True)
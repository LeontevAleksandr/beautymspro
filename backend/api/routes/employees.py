from flask import jsonify, request
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from database import SessionLocal
from models import Specialization, Employee
from api.utils.helpers import serialize, get_or_404

def register_specialization_routes(app):
    """Регистрация маршрутов для работы со специализациями"""
    
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

def register_employee_routes(app):
    """Регистрация маршрутов для работы с сотрудниками"""
    
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
                    telegram_chat_id=None,  # Добавлено поле telegram_chat_id
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
                if 'telegram_chat_id' in data:  # Обновляем только если передано
                    emp.telegram_chat_id = data['telegram_chat_id']
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
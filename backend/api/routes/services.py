from flask import jsonify, request
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from database import SessionLocal
from models import ServiceComplex, Service
from api.utils.helpers import serialize, get_or_404

def register_service_complex_routes(app):
    """Регистрация маршрутов для работы с комплексами услуг"""
    
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

def register_service_routes(app):
    """Регистрация маршрутов для работы с услугами"""
    
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
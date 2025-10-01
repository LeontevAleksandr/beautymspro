from flask import jsonify, request
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from database import SessionLocal
from models import Qualification, ClientStatus, Client, ClientPreferences
from api.utils.helpers import serialize, get_or_404

def register_basic_routes(app):
    """Регистрация базовых маршрутов"""
    
    @app.route('/api/hello')
    def hello():
        return jsonify({'message': 'Привет от бэкенда Beauty Room!'})

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

def register_client_routes(app):
    """Регистрация маршрутов для работы с клиентами"""
    
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
                client.telegram_chat_id = data.get('telegram_chat_id', client.telegram_chat_id)
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

def register_client_preferences_routes(app):
    """Регистрация маршрутов для работы с предпочтениями клиентов"""
    
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
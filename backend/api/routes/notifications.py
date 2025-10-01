from flask import jsonify, request
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from database import SessionLocal
from models import Notification
from api.utils.helpers import serialize, get_or_404

def register_notification_routes(app):
    """Регистрация маршрутов для работы с уведомлениями"""
    
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
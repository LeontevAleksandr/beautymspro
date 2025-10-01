from flask import jsonify, request
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from database import SessionLocal
from models import Notification
from notification_service import NotificationType, NotificationRecipient, NotificationStatus
from api.utils.helpers import serialize, get_or_404
import logging
import asyncio

logger = logging.getLogger(__name__)

def register_extended_notification_routes(app, notification_service):
    """Регистрация расширенных маршрутов для работы с уведомлениями"""
    
    @app.route('/api/notifications', methods=['GET', 'POST'])
    @app.route('/api/notifications/<int:id>', methods=['GET', 'PUT', 'DELETE'])
    def notifications_endpoint(id=None):
        session = SessionLocal()
        try:
            if request.method == 'GET':
                if id:
                    notification = get_or_404(session, Notification, id)
                    if not notification:
                        return jsonify({'error': 'Not found'}), 404
                    return jsonify(serialize(notification))
                else:
                    # Получаем параметры фильтрации
                    recipient_type = request.args.get('recipient_type')
                    notification_type = request.args.get('type')
                    status = request.args.get('status')
                    
                    query = session.query(Notification)
                    
                    if recipient_type:
                        query = query.filter(Notification.recipient_type == recipient_type)
                    if notification_type:
                        query = query.filter(Notification.type == notification_type)
                    if status:
                        query = query.filter(Notification.status == status)
                    
                    notifications = query.order_by(Notification.created_at.desc()).all()
                    return jsonify([serialize(n) for n in notifications])
                    
            elif request.method == 'POST':
                data = request.json
                notification = Notification(
                    type=NotificationType(data['type']),
                    recipient_type=NotificationRecipient(data['recipient_type']),
                    appointment_id=data.get('appointment_id'),
                    client_id=data.get('client_id'),
                    employee_id=data.get('employee_id'),
                    telegram_chat_id=data.get('telegram_chat_id'),
                    scheduled_at=datetime.fromisoformat(data['scheduled_at']),
                    title=data.get('title'),
                    message=data.get('message'),
                    additional_data=data.get('additional_data'),
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
                notification.status = NotificationStatus(data.get('status', notification.status.value))
                if 'scheduled_at' in data:
                    notification.scheduled_at = datetime.fromisoformat(data['scheduled_at'])
                notification.title = data.get('title', notification.title)
                notification.message = data.get('message', notification.message)
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
                
        except Exception as e:
            session.rollback()
            return jsonify({'error': str(e)}), 400
        finally:
            session.close()

    @app.route('/api/notifications/create-reminder', methods=['POST'])
    def create_appointment_reminder():
        """Создать напоминание о записи"""
        session = SessionLocal()
        try:
            data = request.json
            appointment_id = data['appointment_id']
            minutes_before = data.get('minutes_before', 60)
            custom_message = data.get('custom_message')
            
            # Используем async-функцию синхронно (в продакшене лучше использовать Celery)
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            notification = loop.run_until_complete(
                notification_service.create_appointment_reminder(
                    session, appointment_id, minutes_before, custom_message
                )
            )
            
            if notification:
                return jsonify(serialize(notification)), 201
            else:
                return jsonify({'error': 'Failed to create reminder'}), 400
                
        except Exception as e:
            logger.error(f"Error creating reminder: {e}")
            return jsonify({'error': str(e)}), 400
        finally:
            session.close()

    @app.route('/api/notifications/send-employee-notification', methods=['POST'])
    def send_employee_notification():
        """Отправить уведомление мастеру о новой записи"""
        session = SessionLocal()
        try:
            data = request.json
            appointment_id = data['appointment_id']
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            notifications = loop.run_until_complete(
                notification_service.create_appointment_notification(
                    session, appointment_id, NotificationType.appointment_created
                )
            )
            
            # Отправляем созданные уведомления
            for notification in notifications:
                loop.run_until_complete(
                    notification_service.send_notification(notification.id)
                )
            
            return jsonify({
                'message': f'Created and sent {len(notifications)} notifications',
                'notifications': [serialize(n) for n in notifications]
            }), 201
            
        except Exception as e:
            logger.error(f"Error sending employee notification: {e}")
            return jsonify({'error': str(e)}), 400
        finally:
            session.close()

    @app.route('/api/notifications/process-action', methods=['POST'])
    def process_notification_action():
        """Обработать действие пользователя с уведомлением"""
        try:
            data = request.json
            notification_id = data['notification_id']
            action_type = data['action_type']  # 'confirm', 'cancel', 'reschedule'
            telegram_chat_id = data['telegram_chat_id']
            callback_data = data.get('callback_data', '')
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            success = loop.run_until_complete(
                notification_service.process_user_action(
                    notification_id, action_type, telegram_chat_id, callback_data
                )
            )
            
            if success:
                return jsonify({'message': 'Action processed successfully'}), 200
            else:
                return jsonify({'error': 'Failed to process action'}), 400
                
        except Exception as e:
            logger.error(f"Error processing action: {e}")
            return jsonify({'error': str(e)}), 400

    @app.route('/api/notifications/send-pending', methods=['POST'])
    def send_pending_notifications():
        """Отправить все ожидающие уведомления (для тестирования)"""
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            notifications = loop.run_until_complete(
                notification_service.get_pending_notifications()
            )
            
            sent_count = 0
            for notification in notifications:
                success = loop.run_until_complete(
                    notification_service.send_notification(notification.id)
                )
                if success:
                    sent_count += 1
            
            return jsonify({
                'message': f'Sent {sent_count} of {len(notifications)} notifications'
            }), 200
            
        except Exception as e:
            logger.error(f"Error sending pending notifications: {e}")
            return jsonify({'error': str(e)}), 400
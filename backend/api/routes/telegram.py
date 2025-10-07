from flask import jsonify, request
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from database import SessionLocal
from models import Client, Employee
from api.utils.helpers import serialize, get_or_404
from api.utils.phone_utils import PhoneUtils
import logging

logger = logging.getLogger(__name__)

def register_telegram_routes(app):
    """Регистрация маршрутов для Telegram Bot API"""

    # ========== WEBHOOK ДЛЯ CALLBACK'ОВ ==========
    @app.route('/webhook/telegram', methods=['POST'])
    def telegram_webhook():
        """Обработчик webhook от Telegram для callback'ов"""
        try:
            data = request.get_json()
            logger.info(f"Получен webhook от Telegram: {data}")

            # Обрабатываем нажатия кнопок
            if 'callback_query' in data:
                callback = data['callback_query']
                callback_data = callback['data']
                chat_id = callback['from']['id']
                callback_query_id = callback['id']

                logger.info(f"Обработка callback: {callback_data} от chat_id {chat_id}")

                if callback_handler:
                    # Запускаем асинхронную обработку
                    asyncio.run(
                        callback_handler.handle_callback(
                            callback_data,
                            chat_id,
                            callback_query_id
                        )
                    )
                    return jsonify({"status": "ok"})
                else:
                    logger.error("Callback handler не установлен")
                    return jsonify({"status": "error", "message": "Callback handler not configured"}), 500

            # Можно добавить обработку обычных сообщений здесь
            elif 'message' in data:
                logger.info(f"Получено сообщение: {data['message']}")
                # Обработка текстовых сообщений от пользователей

            return jsonify({"status": "ignored"})

        except Exception as e:
            logger.error(f"Ошибка обработки webhook: {e}")
            return jsonify({"status": "error", "message": str(e)}), 500

    # Telegram Bot API endpoints для клиентов
    @app.route('/api/telegram/link-client', methods=['POST'])
    def link_telegram_client():
        """Связать клиента с Telegram chat_id или создать нового"""
        session = SessionLocal()
        try:
            data = request.json
            phone = data.get('phone')
            telegram_chat_id = data.get('telegram_chat_id')
            full_name = data.get('full_name')

            if not phone or not telegram_chat_id:
                return jsonify({'error': 'Phone and telegram_chat_id are required'}), 400

            normalized_phone = PhoneUtils.normalize_client_phone(phone)
            if not normalized_phone:
                return jsonify({'error': 'Invalid phone format'}), 400

            # Найти клиента по номеру телефона
            client = session.query(Client).filter(Client.phone == normalized_phone).first()

            if client:
                # Клиент существует - проверяем и обновляем
                if client.telegram_chat_id and client.telegram_chat_id != telegram_chat_id:
                    return jsonify({'error': 'This phone is already linked to another Telegram account'}), 400

                # Обновляем имя если оно изменилось и передано
                if full_name and client.full_name != full_name:
                    client.full_name = full_name

                client.telegram_chat_id = telegram_chat_id
                client.updated_at = datetime.now()
                session.commit()

                return jsonify({
                    'message': 'Client successfully linked to Telegram',
                    'client': serialize(client),
                    'action': 'updated'
                }), 200
            else:
                # Клиент не существует - создаем нового
                if not full_name:
                    return jsonify({'error': 'Full name is required for new client'}), 400

                # Проверить, не используется ли уже этот chat_id
                existing_chat = session.query(Client).filter(Client.telegram_chat_id == telegram_chat_id).first()
                if existing_chat:
                    return jsonify({'error': 'This Telegram account is already linked to another client'}), 400

                new_client = Client(
                    full_name=full_name,
                    phone=normalized_phone,
                    telegram_chat_id=telegram_chat_id,
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                session.add(new_client)
                session.commit()

                return jsonify({
                    'message': 'New client created and linked to Telegram',
                    'client': serialize(new_client),
                    'action': 'created'
                }), 201

        except IntegrityError as e:
            session.rollback()
            return jsonify({'error': 'Integrity error', 'details': str(e)}), 400
        except Exception as e:
            session.rollback()
            return jsonify({'error': str(e)}), 400
        finally:
            session.close()

    @app.route('/api/telegram/client/<int:chat_id>', methods=['GET'])
    def get_client_by_telegram(chat_id):
        """Получить клиента по Telegram chat_id"""
        session = SessionLocal()
        try:
            client = session.query(Client).filter(Client.telegram_chat_id == chat_id).first()

            if not client:
                return jsonify({'error': 'Client not found'}), 404

            return jsonify(serialize(client)), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 400
        finally:
            session.close()

    @app.route('/api/telegram/unlink-client', methods=['POST'])
    def unlink_telegram_client():
        """Отвязать клиента от Telegram"""
        session = SessionLocal()
        try:
            data = request.json
            client_id = data.get('client_id')

            if not client_id:
                return jsonify({'error': 'Client ID is required'}), 400

            client = get_or_404(session, Client, client_id)
            if not client:
                return jsonify({'error': 'Client not found'}), 404

            client.telegram_chat_id = None
            client.updated_at = datetime.now()
            session.commit()

            return jsonify({
                'message': 'Client successfully unlinked from Telegram',
                'client': serialize(client)
            }), 200

        except Exception as e:
            session.rollback()
            return jsonify({'error': str(e)}), 400
        finally:
            session.close()

def register_telegram_master_routes(app):
    """Регистрация маршрутов для Telegram Bot API мастеров"""

    @app.route('/api/telegram/master/<int:chat_id>', methods=['GET'])
    def get_master_by_telegram(chat_id):
        """Получить мастера по Telegram chat_id"""
        session = SessionLocal()
        try:
            master = session.query(Employee).filter(Employee.telegram_chat_id == chat_id).first()

            if not master:
                return jsonify({'error': 'Master not found'}), 404

            return jsonify(serialize(master)), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 400
        finally:
            session.close()

    @app.route('/api/telegram/master/auth', methods=['POST'])
    def authenticate_master():
        """Авторизация мастера и привязка к Telegram"""
        session = SessionLocal()
        try:
            data = request.json
            phone = data.get('phone')
            password = data.get('password')
            telegram_chat_id = data.get('telegram_chat_id')

            if not phone or not password or not telegram_chat_id:
                return jsonify({'error': 'Phone, password and telegram_chat_id are required'}), 400

            normalized_phone = PhoneUtils.normalize_employee_phone(phone)
            if not normalized_phone:
                return jsonify({'error': 'Invalid phone format. Use formats: +79010010101, 89010010101, or 9010010101'}), 400

            # Найти мастера по номеру телефона
            master = session.query(Employee).filter(Employee.phone == normalized_phone).first()

            if not master:
                return jsonify({'error': 'Master not found with this phone number'}), 404

            # Проверка пароля (в продакшене должно быть безопасное сравнение хешей)
            if master.password != password:
                return jsonify({'error': 'Invalid password'}), 401

            # Проверка, не привязан ли уже этот chat_id к другому мастеру
            existing_master = session.query(Employee).filter(
                Employee.telegram_chat_id == telegram_chat_id,
                Employee.id != master.id
            ).first()

            if existing_master:
                return jsonify({
                    'error': 'This Telegram account is already linked to another master',
                    'linked_master': existing_master.full_name
                }), 400

            # Проверяем, не привязан ли мастер уже к другому Telegram аккаунту
            if master.telegram_chat_id and master.telegram_chat_id != telegram_chat_id:
                return jsonify({
                    'error': 'This master is already linked to another Telegram account. Contact administrator to unlink.',
                    'current_chat_id': master.telegram_chat_id
                }), 400

            # Обновляем chat_id мастера
            master.telegram_chat_id = telegram_chat_id
            master.updated_at = datetime.now()
            session.commit()

            # Возвращаем данные мастера с дополнительной информацией
            master_data = serialize(master)
            if hasattr(master, 'specialization') and master.specialization:
                master_data['specialization'] = serialize(master.specialization)
            if hasattr(master, 'qualification') and master.qualification:
                master_data['qualification'] = serialize(master.qualification)

            return jsonify({
                'message': 'Successfully authenticated and linked to Telegram',
                'master': master_data
            }), 200

        except Exception as e:
            session.rollback()
            logger.error(f"Error in master authentication: {e}")
            return jsonify({'error': f'Authentication failed: {str(e)}'}), 500
        finally:
            session.close()

    @app.route('/api/telegram/unlink-master', methods=['POST'])
    def unlink_telegram_master():
        """Отвязать мастера от Telegram"""
        session = SessionLocal()
        try:
            data = request.json
            master_id = data.get('master_id')

            if not master_id:
                return jsonify({'error': 'Master ID is required'}), 400

            master = get_or_404(session, Employee, master_id)
            if not master:
                return jsonify({'error': 'Master not found'}), 404

            master.telegram_chat_id = None
            master.updated_at = datetime.now()
            session.commit()

            return jsonify({
                'message': 'Master successfully unlinked from Telegram',
                'master': serialize(master)
            }), 200

        except Exception as e:
            session.rollback()
            return jsonify({'error': str(e)}), 400
        finally:
            session.close()

import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_

from typing import List, Optional

from services.notifications.telegram_sender import TelegramSender
from models import (
    Notification,
    NotificationType,
    NotificationRecipient,
    NotificationStatus,
    Appointment,
    Client,
    Employee,
    Service,
)


logger = logging.getLogger(__name__)


class NotificationService:
    """
    Сервис для работы с уведомлениями.

    Содержит бизнес-логику: проверка, отправка, обновление статусов.
    """

    def __init__(self, db_session_factory, telegram_bot_token: str):
        self.db_session_factory = db_session_factory
        self.telegram_sender = TelegramSender(telegram_bot_token)

    async def check_and_send_notifications(self):
        """
        Основная функция: проверить и отправить готовые уведомления.
        """
        try:
            # 1. Получаем уведомления для отправки
            notifications = self._get_pending_notifications()

            # 2. Обрабатываем каждое уведомление
            for notification in notifications:
                await self._process_single_notification(notification)

        except Exception as e:
            logger.error(f"Ошибка при проверке уведомлений: {e}")
            return 0

    def _get_pending_notifications(self) -> list:
        """
        Получить уведомления готовые к отправке.

        Returns:
            list[Notification]: Список уведомлений для отправки
        """
        session = self.db_session_factory()
        try:
            notifications = (
                session.query(Notification)
                .filter(
                    and_(
                        Notification.status == NotificationStatus.scheduled,
                        Notification.scheduled_at <= datetime.now(),
                        Notification.attempts < Notification.max_attempts,
                    )
                )
                .all()
            )

            return notifications

        except Exception as e:
            logger.error(f"Ошибка при получении уведомлений: {e}")
            return []
        finally:
            session.close()

    async def _process_single_notification(self, notification: Notification) -> bool:
        """
        Обработать (отправить) одно уведомление.

        Args:
            notification: Уведомление для обработки

        Returns:
            bool: True если успешно отправлено
        """
        session = self.db_session_factory()

        try:
            notification = session.merge(notification)
            # Подготавливаем клавиатуру если это напоминание
            keyboard = None
            if notification.type == NotificationType.appointment_reminder:
                keyboard = self.telegram_sender.create_reminder_keyboard(
                    notification.id
                )

            # Отправляем через Telegram
            success = await self.telegram_sender.send_message(
                chat_id=notification.telegram_chat_id,
                text=notification.message,
                keyboard=keyboard,
            )

            notification.attempts += 1
            if success:
                notification.status = NotificationStatus.sent
                notification.sent_at = datetime.now()
                notification.updated_at = datetime.now()
            else:
                if notification.attempts >= notification.max_attempts:
                    notification.status = NotificationStatus.failed
                else:
                    notification.updated_at = datetime.now()

            session.commit()
            return success

        except Exception as e:
            # logger.error(f"Ошибка обработки уведомления {notification.id}: {e}")
            session.rollback()
            return False
        finally:
            session.close()

    # ============ Старые функции для создания уведомлений и сообщений к ним ============

    async def create_appointment_reminder(
        self,
        session: Session,
        appointment_id: int,
        minutes_before: int = 60,
        custom_message: Optional[str] = None,
    ) -> Optional[Notification]:
        """Создать напоминание о записи"""
        try:
            appointment = session.query(Appointment).get(appointment_id)
            if not appointment:
                logger.error(f"Appointment {appointment_id} not found")
                return None

            client = session.query(Client).get(appointment.client_id)
            if not client or not client.telegram_chat_id:
                logger.error(
                    f"Client {appointment.client_id} not found or no telegram_chat_id"
                )
                return None

            # Вычисляем время отправки
            appointment_time = appointment.datetime
            reminder_time = appointment_time - timedelta(minutes=minutes_before)

            # Проверяем, что время напоминания в будущем
            if reminder_time <= datetime.now():
                logger.warning(f"Reminder time {reminder_time} is in the past")
                return None

            # Генерируем сообщение
            message = self._generate_reminder_message(
                session, appointment, custom_message
            )
            title = f"Напоминание о записи через {minutes_before} мин"

            # Создаем уведомление
            notification = Notification(
                type=NotificationType.appointment_reminder,
                recipient_type=NotificationRecipient.client,
                appointment_id=appointment_id,
                client_id=appointment.client_id,
                telegram_chat_id=client.telegram_chat_id,
                scheduled_at=reminder_time,
                title=title,
                message=message,
                additional_data=json.dumps(
                    {
                        "minutes_before": minutes_before,
                        "appointment_datetime": appointment_time.isoformat(),
                    }
                ),
                created_at=datetime.now(),
                updated_at=datetime.now(),
            )

            session.add(notification)
            session.commit()

            logger.info(
                f"Created reminder notification {notification.id} for appointment {appointment_id}"
            )
            return notification

        except Exception as e:
            logger.error(f"Error creating appointment reminder: {e}")
            session.rollback()
            return None

    async def create_appointment_notification(
        self, session: Session, appointment_id: int, notification_type: NotificationType
    ) -> List[Notification]:
        """Создать уведомления о записи для мастера и/или админа"""
        notifications = []

        try:
            appointment = session.query(Appointment).get(appointment_id)
            if not appointment:
                return notifications

            # Уведомление для мастера
            if notification_type == NotificationType.appointment_created:
                employee = session.query(Employee).get(appointment.employee_id)
                if employee and employee.telegram_chat_id:
                    message = self._generate_employee_notification_message(
                        session, appointment
                    )

                    notification = Notification(
                        type=NotificationType.appointment_created,
                        recipient_type=NotificationRecipient.employee,
                        appointment_id=appointment_id,
                        employee_id=appointment.employee_id,
                        telegram_chat_id=employee.telegram_chat_id,
                        scheduled_at=datetime.now(),  # Отправляем сразу
                        title="Новая запись",
                        message=message,
                        created_at=datetime.now(),
                        updated_at=datetime.now(),
                    )

                    session.add(notification)
                    notifications.append(notification)

            # Здесь можно добавить уведомления для админа
            # if notification_type == NotificationType.admin_notification:
            #     ...

            session.commit()

        except Exception as e:
            logger.error(f"Error creating appointment notifications: {e}")
            session.rollback()

        return notifications

    def _generate_reminder_message(
        self,
        session: Session,
        appointment: Appointment,
        custom_message: Optional[str] = None,
    ) -> str:
        """Генерировать сообщение-напоминание"""
        if custom_message:
            return custom_message

        try:
            # Получаем информацию об услуге и мастере
            service_name = "Услуга"
            employee_name = "Мастер"

            if appointment.service_id:
                service = session.query(Service).get(appointment.service_id)
                if service:
                    service_name = service.name

            if appointment.employee_id:
                employee = session.query(Employee).get(appointment.employee_id)
                if employee:
                    employee_name = employee.full_name

            date_str = appointment.datetime.strftime("%d.%m.%Y")
            time_str = appointment.datetime.strftime("%H:%M")

            message = f"""🔔 Напоминание о записи!

📅 Дата: {date_str}
⏰ Время: {time_str}
💅 Услуга: {service_name}
👤 Мастер: {employee_name}

📍 Beauty Room 38
Ждем вас! ✨"""

            return message

        except Exception as e:
            logger.error(f"Error generating reminder message: {e}")
            return "Напоминание о вашей записи в Beauty Room 38"

    def _generate_employee_notification_message(
        self, session: Session, appointment: Appointment
    ) -> str:
        """Генерировать уведомление для мастера"""
        try:
            client_name = "Клиент"
            service_name = "Услуга"

            if appointment.client_id:
                client = session.query(Client).get(appointment.client_id)
                if client:
                    client_name = client.full_name

            if appointment.service_id:
                service = session.query(Service).get(appointment.service_id)
                if service:
                    service_name = service.name

            date_str = appointment.datetime.strftime("%d.%m.%Y")
            time_str = appointment.datetime.strftime("%H:%M")

            message = f"""📝 Новая запись!

👤 Клиент: {client_name}
📅 Дата: {date_str}
⏰ Время: {time_str}
💅 Услуга: {service_name}

Подготовьтесь к приему клиента! 💼"""

            return message

        except Exception as e:
            logger.error(f"Error generating employee notification: {e}")
            return "У вас новая запись!"

import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from services.notifications.telegram_sender import TelegramSender
from models import Notification, NotificationStatus, NotificationType

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Сервис для работы с уведомлениями.

    Содержит бизнес-логику: проверка, отправка, обновление статусов.
    """

    def __init__(self, db_session_factory, telegram_bot_token: str):
        self.db_session_factory = db_session_factory
        self.telegram_sender = TelegramSender(telegram_bot_token)
        logger.info("Инициализирован сервис уведомлений")

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
                        Notification.scheduled_at >= datetime.now(),
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

            # Обновляем статус
            notification.attempts += 1
            if success:
                notification.status = NotificationStatus.sent
                notification.sent_at = datetime.now()
                notification.updated_at = datetime.now()
                # logger.info(f"Уведомление {notification.id} отправлено")
            else:
                if notification.attempts >= notification.max_attempts:
                    notification.status = NotificationStatus.failed
                    logger.error(
                        f"Уведомление {notification.id} не отправлено после {notification.attempts} попыток"
                    )
                else:
                    # Оставляем scheduled для повторной попытки
                    logger.warning(
                        f"Уведомление {notification.id} не отправлено, попытка {notification.attempts}"
                    )

                notification.updated_at = datetime.now()

            session.commit()
            return success

        except Exception as e:
            logger.error(f"Ошибка обработки уведомления {notification.id}: {e}")
            session.rollback()
            return False
        finally:
            session.close()

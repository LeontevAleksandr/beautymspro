import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

import aiohttp
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from models import ( # Убрана точка
    Notification, NotificationAction, NotificationType, 
    NotificationRecipient, NotificationStatus,
    Appointment, Client, Employee
)

logger = logging.getLogger(__name__)

@dataclass
class NotificationConfig:
    telegram_bot_token: str
    base_url: str = "https://api.telegram.org/bot"
    
class NotificationService:
    def __init__(self, config: NotificationConfig, db_session_factory):
        self.config = config
        self.db_session_factory = db_session_factory
        
    async def create_appointment_reminder(
        self, 
        session: Session,
        appointment_id: int, 
        minutes_before: int = 60,
        custom_message: Optional[str] = None
    ) -> Optional[Notification]:
        """Создать напоминание о записи"""
        try:
            appointment = session.query(Appointment).get(appointment_id)
            if not appointment:
                logger.error(f"Appointment {appointment_id} not found")
                return None
            
            client = session.query(Client).get(appointment.client_id)
            if not client or not client.telegram_chat_id:
                logger.error(f"Client {appointment.client_id} not found or no telegram_chat_id")
                return None
            
            # Вычисляем время отправки
            appointment_time = appointment.datetime
            reminder_time = appointment_time - timedelta(minutes=minutes_before)
            
            # Проверяем, что время напоминания в будущем
            if reminder_time <= datetime.now():
                logger.warning(f"Reminder time {reminder_time} is in the past")
                return None
            
            # Генерируем сообщение
            message = self._generate_reminder_message(session, appointment, custom_message)
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
                additional_data=json.dumps({
                    "minutes_before": minutes_before,
                    "appointment_datetime": appointment_time.isoformat()
                }),
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            session.add(notification)
            session.commit()
            
            logger.info(f"Created reminder notification {notification.id} for appointment {appointment_id}")
            return notification
            
        except Exception as e:
            logger.error(f"Error creating appointment reminder: {e}")
            session.rollback()
            return None
    
    async def create_appointment_notification(
        self,
        session: Session,
        appointment_id: int,
        notification_type: NotificationType
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
                    message = self._generate_employee_notification_message(session, appointment)
                    
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
                        updated_at=datetime.now()
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
        custom_message: Optional[str] = None
    ) -> str:
        """Генерировать сообщение-напоминание"""
        if custom_message:
            return custom_message
        
        try:
            # Получаем информацию об услуге и мастере
            service_name = "Услуга"
            employee_name = "Мастер"
            
            if appointment.service_id:
                from .models import Service
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
        self,
        session: Session,
        appointment: Appointment
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
                from .models import Service
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
    
    async def send_notification(self, notification_id: int) -> bool:
        """Отправить уведомление"""
        session = self.db_session_factory()
        try:
            notification = session.query(Notification).get(notification_id)
            if not notification:
                return False
            
            if notification.status != NotificationStatus.scheduled:
                return False
            
            # Обновляем количество попыток
            notification.attempts += 1
            notification.updated_at = datetime.now()
            
            # Формируем клавиатуру для напоминаний
            keyboard = None
            if notification.type == NotificationType.appointment_reminder:
                keyboard = self._create_reminder_keyboard(notification.id)
            
            # Отправляем сообщение
            success = await self._send_telegram_message(
                chat_id=notification.telegram_chat_id,
                message=notification.message,
                keyboard=keyboard
            )
            
            if success:
                notification.status = NotificationStatus.sent
                notification.sent_at = datetime.now()
                logger.info(f"Notification {notification_id} sent successfully")
            else:
                if notification.attempts >= notification.max_attempts:
                    notification.status = NotificationStatus.failed
                    logger.error(f"Notification {notification_id} failed after {notification.attempts} attempts")
                else:
                    # Планируем повторную отправку через 5 минут
                    notification.scheduled_at = datetime.now() + timedelta(minutes=5)
                    logger.warning(f"Notification {notification_id} failed, retry scheduled")
            
            session.commit()
            return success
            
        except Exception as e:
            logger.error(f"Error sending notification {notification_id}: {e}")
            session.rollback()
            return False
        finally:
            session.close()
    
    def _create_reminder_keyboard(self, notification_id: int) -> Dict:
        """Создать клавиатуру для напоминания"""
        return {
            "inline_keyboard": [
                [
                    {
                        "text": "✅ Подтвердить запись",
                        "callback_data": f"confirm_appointment_{notification_id}"
                    }
                ],
                [
                    {
                        "text": "❌ Отменить запись", 
                        "callback_data": f"cancel_appointment_{notification_id}"
                    }
                ],
                [
                    {
                        "text": "📞 Перенести запись",
                        "callback_data": f"reschedule_appointment_{notification_id}"
                    }
                ]
            ]
        }
    
    async def _send_telegram_message(
        self,
        chat_id: int,
        message: str,
        keyboard: Optional[Dict] = None
    ) -> bool:
        """Отправить сообщение в Telegram"""
        try:
            url = f"{self.config.base_url}{self.config.telegram_bot_token}/sendMessage"
            
            payload = {
                "chat_id": chat_id,
                "text": message,
                "parse_mode": "HTML"
            }
            
            if keyboard:
                payload["reply_markup"] = json.dumps(keyboard)
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as response:
                    if response.status == 200:
                        return True
                    else:
                        logger.error(f"Telegram API error: {response.status}")
                        return False
                        
        except Exception as e:
            logger.error(f"Error sending telegram message: {e}")
            return False
    
    async def process_user_action(
        self,
        notification_id: int,
        action_type: str,
        telegram_chat_id: int,
        callback_data: str
    ) -> bool:
        """Обработать действие пользователя с уведомлением"""
        session = self.db_session_factory()
        try:
            notification = session.query(Notification).get(notification_id)
            if not notification:
                return False
            
            # Записываем действие
            action = NotificationAction(
                notification_id=notification_id,
                action_type=action_type,
                telegram_chat_id=telegram_chat_id,
                callback_data=callback_data,
                performed_at=datetime.now(),
                created_at=datetime.now()
            )
            
            session.add(action)
            
            # Обрабатываем действие
            if action_type == "confirm":
                await self._handle_appointment_confirmation(session, notification.appointment_id)
            elif action_type == "cancel":
                await self._handle_appointment_cancellation(session, notification.appointment_id)
            elif action_type == "reschedule":
                await self._handle_appointment_reschedule(session, notification.appointment_id)
            
            session.commit()
            return True
            
        except Exception as e:
            logger.error(f"Error processing user action: {e}")
            session.rollback()
            return False
        finally:
            session.close()
    
    async def _handle_appointment_confirmation(self, session: Session, appointment_id: int):
        """Обработать подтверждение записи"""
        appointment = session.query(Appointment).get(appointment_id)
        if appointment:
            # Можно добавить флаг confirmed в модель Appointment
            appointment.notes = (appointment.notes or "") + " [Подтверждено клиентом]"
            appointment.updated_at = datetime.now()
    
    async def _handle_appointment_cancellation(self, session: Session, appointment_id: int):
        """Обработать отмену записи"""
        appointment = session.query(Appointment).get(appointment_id)
        if appointment:
            appointment.status = "cancelled"
            appointment.updated_at = datetime.now()
    
    async def _handle_appointment_reschedule(self, session: Session, appointment_id: int):
        """Обработать перенос записи"""
        # Можно отправить сообщение с предложением связаться с администратором
        pass
    
    async def get_pending_notifications(self) -> List[Notification]:
        """Получить уведомления для отправки"""
        session = self.db_session_factory()
        try:
            now = datetime.now()
            notifications = session.query(Notification).filter(
                and_(
                    Notification.status == NotificationStatus.scheduled,
                    Notification.scheduled_at <= now,
                    Notification.attempts < Notification.max_attempts
                )
            ).all()
            
            return notifications
            
        finally:
            session.close()
    
    async def run_notification_worker(self):
        """Воркер для обработки уведомлений"""
        logger.info("Starting notification worker...")
        
        while True:
            try:
                notifications = await self.get_pending_notifications()
                
                for notification in notifications:
                    await self.send_notification(notification.id)
                    # Небольшая задержка между отправками
                    await asyncio.sleep(1)
                
                # Проверяем каждые 30 секунд
                await asyncio.sleep(30)
                
            except Exception as e:
                logger.error(f"Error in notification worker: {e}")
                await asyncio.sleep(60)  # При ошибке ждем больше
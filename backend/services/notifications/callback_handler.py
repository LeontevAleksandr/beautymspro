# import logging
# from datetime import datetime
# from sqlalchemy.orm import Session

# from models import Notification, NotificationAction, Appointment
# from .telegram_sender import TelegramSender

# logger = logging.getLogger(__name__)

# class CallbackHandler:
#     """
#     Обработчик callback'ов от Telegram.
#     Обрабатывает нажатия кнопок в уведомлениях.
#     """

#     def __init__(self, db_session_factory, telegram_sender: TelegramSender):
#         self.db_session_factory = db_session_factory
#         self.telegram_sender = telegram_sender
#         logger.info("Инициализирован обработчик callback'ов")

#     async def handle_callback(
#         self,
#         callback_data: str,
#         chat_id: int,
#         callback_query_id: str = None
#     ) -> bool:
#         """
#         Обработать callback от Telegram.

#         Args:
#             callback_data: Данные callback (например "confirm_123")
#             chat_id: ID чата пользователя
#             callback_query_id: ID callback query для ответа Telegram

#         Returns:
#             bool: True если callback обработан успешно
#         """
#         try:
#             # Парсим callback_data: "action_notification_id"
#             parts = callback_data.split('_')
#             if len(parts) != 2:
#                 logger.error(f"Неверный формат callback_data: {callback_data}")
#                 return False

#             action, notification_id_str = parts
#             notification_id = int(notification_id_str)

#             # Отвечаем Telegram что callback получен (убираем часики)
#             if callback_query_id:
#                 await self.telegram_sender.answer_callback_query(callback_query_id)

#             # Обрабатываем действие
#             return await self._process_action(action, notification_id, chat_id)

#         except Exception as e:
#             logger.error(f"Ошибка обработки callback: {e}")
#             return False

#     async def _process_action(self, action: str, notification_id: int, chat_id: int) -> bool:
#         """
#         Обработать конкретное действие.

#         Args:
#             action: Тип действия (confirm, cancel, reschedule)
#             notification_id: ID уведомления
#             chat_id: ID чата пользователя

#         Returns:
#             bool: True если действие обработано успешно
#         """
#         session = self.db_session_factory()
#         try:
#             # Находим уведомление
#             notification = session.query(Notification).get(notification_id)
#             if not notification:
#                 logger.error(f"Уведомление {notification_id} не найдено")
#                 return False

#             # Находим запись
#             appointment = session.query(Appointment).get(notification.appointment_id)
#             if not appointment:
#                 logger.error(f"Запись {notification.appointment_id} не найдена")
#                 return False

#             # Логируем действие
#             await self._log_action(session, notification_id, action, chat_id)

#             # Выполняем действие
#             if action == "confirm":
#                 result = await self._handle_confirm(session, appointment, chat_id)
#             elif action == "cancel":
#                 result = await self._handle_cancel(session, appointment, chat_id)
#             elif action == "reschedule":
#                 result = await self._handle_reschedule(session, appointment, chat_id)
#             else:
#                 logger.error(f"Неизвестное действие: {action}")
#                 return False

#             session.commit()
#             logger.info(f"Обработано действие {action} для уведомления {notification_id}")
#             return result

#         except Exception as e:
#             logger.error(f"Ошибка обработки действия {action}: {e}")
#             session.rollback()
#             return False
#         finally:
#             session.close()

#     async def _handle_confirm(self, session: Session, appointment: Appointment, chat_id: int) -> bool:
#         """Обработать подтверждение записи"""
#         try:
#             # Добавляем пометку в заметки
#             current_notes = appointment.notes or ""
#             appointment.notes = f"{current_notes}\n✅ Подтверждено клиентом через Telegram {datetime.now().strftime('%d.%m.%Y %H:%M')}".strip()
#             appointment.updated_at = datetime.now()

#             # Отправляем подтверждение
#             message = "✅ <b>Запись подтверждена!</b>\n\nЖдем вас в салоне! ✨"
#             success = await self.telegram_sender.send_message(chat_id, message)

#             return success

#         except Exception as e:
#             logger.error(f"Ошибка подтверждения записи: {e}")
#             return False

#     async def _handle_cancel(self, session: Session, appointment: Appointment, chat_id: int) -> bool:
#         """Обработать отмену записи"""
#         try:
#             # Меняем статус записи
#             appointment.status = "cancelled"
#             appointment.updated_at = datetime.now()

#             # Добавляем пометку
#             current_notes = appointment.notes or ""
#             appointment.notes = f"{current_notes}\n❌ Отменено клиентом через Telegram {datetime.now().strftime('%d.%m.%Y %H:%M')}".strip()

#             # Отправляем подтверждение
#             message = "❌ <b>Запись отменена</b>\n\nЕсли передумаете - будем рады вас видеть! 💫"
#             success = await self.telegram_sender.send_message(chat_id, message)

#             return success

#         except Exception as e:
#             logger.error(f"Ошибка отмены записи: {e}")
#             return False

#     async def _handle_reschedule(self, session: Session, appointment: Appointment, chat_id: int) -> bool:
#         """Обработать запрос на перенос записи"""
#         try:
#             # Добавляем пометку о запросе переноса
#             current_notes = appointment.notes or ""
#             appointment.notes = f"{current_notes}\n📞 Запрос на перенос через Telegram {datetime.now().strftime('%d.%m.%Y %H:%M')}".strip()
#             appointment.updated_at = datetime.now()

#             # Отправляем подтверждение
#             message = """📞 <b>Запрос на перенос отправлен!</b>

# Мы свяжемся с вами в ближайшее время для уточнения удобного времени.

# Спасибо! 💫"""
#             success = await self.telegram_sender.send_message(chat_id, message)

#             return success

#         except Exception as e:
#             logger.error(f"Ошибка обработки запроса переноса: {e}")
#             return False

#     async def _log_action(
#         self,
#         session: Session,
#         notification_id: int,
#         action: str,
#         chat_id: int
#     ) -> bool:
#         """Записать действие в историю"""
#         try:
#             action_record = NotificationAction(
#                 notification_id=notification_id,
#                 action_type=action,
#                 telegram_chat_id=chat_id,
#                 callback_data=f"{action}_{notification_id}",
#                 performed_at=datetime.now(),
#                 created_at=datetime.now()
#             )

#             session.add(action_record)
#             return True

#         except Exception as e:
#             logger.error(f"Ошибка логирования действия: {e}")
#             return False

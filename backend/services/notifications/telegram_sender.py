import logging
import aiohttp
import json
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class TelegramSender:
    """
    Класс для отправки сообщений через Telegram Bot API.
    Только отправка, без бизнес-логики.
    """

    def __init__(self, bot_token: str):
        self.bot_token = bot_token
        self.base_url = f"https://api.telegram.org/bot{bot_token}"

    async def send_message(
        self,
        chat_id: int,
        text: str,
        keyboard: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Отправить сообщение в Telegram.

        Args:
            chat_id: ID чата получателя
            text: Текст сообщения
            keyboard: Опциональная клавиатура для кнопок

        Returns:
            bool: True если сообщение отправлено успешно
        """
        try:
            url = f"{self.base_url}/sendMessage"
            payload = {
                "chat_id": chat_id,
                "text": text,
                "parse_mode": "HTML"
            }

            if keyboard:
                payload["reply_markup"] = json.dumps(keyboard)

            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as response:
                    if response.status == 200:
                        logger.debug(f"Сообщение отправлено в chat_id {chat_id}")
                        return True
                    else:
                        error_text = await response.text()
                        logger.error(f"Ошибка Telegram API: {response.status} - {error_text}")
                        return False

        except aiohttp.ClientError as e:
            logger.error(f"Ошибка соединения с Telegram: {e}")
            return False
        except Exception as e:
            logger.error(f"Неожиданная ошибка при отправке в Telegram: {e}")
            return False

    def create_reminder_keyboard(self, notification_id: int) -> Dict[str, Any]:
        """
        Создать клавиатуру для напоминания о записи.

        Args:
            notification_id: ID уведомления для callback данных

        Returns:
            Dict: Клавиатура для Telegram
        """
        return {
            "inline_keyboard": [
                [
                    {
                        "text": "✅ Подтвердить запись",
                        "callback_data": f"confirm_{notification_id}"
                    }
                ],
                [
                    {
                        "text": "❌ Отменить запись",
                        "callback_data": f"cancel_{notification_id}"
                    },
                    {
                        "text": "📞 Перенести запись",
                        "callback_data": f"reschedule_{notification_id}"
                    }
                ]
            ]
        }

    async def answer_callback_query(self, callback_query_id: str, text: str = "") -> bool:
        """
        Ответить на callback query (убрать часики в Telegram).

        Args:
            callback_query_id: ID callback query
            text: Текст для показа пользователю

        Returns:
            bool: True если ответ отправлен успешно
        """
        try:
            url = f"{self.base_url}/answerCallbackQuery"
            payload = {
                "callback_query_id": callback_query_id,
                "text": text
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as response:
                    return response.status == 200

        except Exception as e:
            logger.error(f"Ошибка ответа на callback: {e}")
            return False

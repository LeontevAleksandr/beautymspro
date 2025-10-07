import sys
import os
import asyncio
import logging
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Настройка логирования
logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Импорты наших модулей
from services.notifications import (
    NotificationWorker,
    NotificationService,
    TelegramSender,
    CallbackHandler,
)
from database import SessionLocal
from models import (
    Notification,
    NotificationStatus,
    NotificationType,
    Client,
    Appointment,
)


class TestNotificationSystem:
    """Интеграционный тест всей системы уведомлений"""

    def __init__(self):
        self.session_factory = SessionLocal
        self.telegram_token = "test_bot_token"  # Для тестов

        # Инициализируем все компоненты
        self.telegram_sender = TelegramSender(self.telegram_token)
        self.notification_service = NotificationService(
            self.session_factory, self.telegram_token
        )
        self.callback_handler = CallbackHandler(
            self.session_factory, self.telegram_sender
        )
        self.worker = NotificationWorker(
            check_interval=5
        )  # Короткий интервал для теста

    async def test_whole_system(self):
        """Тестируем всю систему"""
        print("🧪 ЗАПУСК ИНТЕГРАЦИОННОГО ТЕСТА")
        print("=" * 50)

        # 1. Тестируем создание тестовых данных
        test_client = await self._create_test_client()
        test_appointment = await self._create_test_appointment(test_client)
        test_notification = await self._create_test_notification(
            test_client, test_appointment
        )

        print("✅ Тестовые данные созданы")

        # 2. Тестируем сервис уведомлений
        print("\n🔍 ТЕСТИРУЕМ NOTIFICATION SERVICE...")
        sent_count = await self.notification_service.check_and_send_notifications()
        print(f"✅ NotificationService отправил {sent_count} уведомлений")

        # 3. Тестируем callback handler
        print("\n🔍 ТЕСТИРУЕМ CALLBACK HANDLER...")
        callback_data = f"confirm_{test_notification.id}"
        success = await self.callback_handler.handle_callback(
            callback_data, test_client.telegram_chat_id
        )
        print(f"✅ CallbackHandler обработал действие: {success}")

        # 4. Тестируем воркер
        print("\n🔍 ТЕСТИРУЕМ WORKER...")
        self.worker.set_check_callback(
            self.notification_service.check_and_send_notifications
        )
        self.worker.start()

        print("✅ Worker запущен. Ждем 15 секунд...")
        await asyncio.sleep(15)

        self.worker.stop()
        print("✅ Worker остановлен")

        # 5. Проверяем результаты
        print("\n📊 РЕЗУЛЬТАТЫ ТЕСТА:")
        await self._check_results(test_notification.id)

        print("\n🎉 ИНТЕГРАЦИОННЫЙ ТЕСТ ЗАВЕРШЕН")

    async def _create_test_client(self):
        """Создать тестового клиента"""
        session = self.session_factory()
        try:
            # Проверяем, есть ли уже тестовый клиент
            client = session.query(Client).filter(Client.phone == "79990000000").first()
            if not client:
                client = Client(
                    full_name="Тестовый Клиент",
                    phone="79990000000",
                    telegram_chat_id=123456789,  # test chat_id
                    created_at=datetime.now(),
                    updated_at=datetime.now(),
                )
                session.add(client)
                session.commit()
                session.refresh(client)
                print(f"✅ Создан тестовый клиент: {client.id}")
            else:
                print(f"✅ Используем существующего клиента: {client.id}")

            return client
        finally:
            session.close()

    async def _create_test_appointment(self, client):
        """Создать тестовую запись"""
        session = self.session_factory()
        try:
            appointment = Appointment(
                client_id=client.id,
                datetime=datetime.now() + timedelta(hours=2),
                status="scheduled",
                created_at=datetime.now(),
                updated_at=datetime.now(),
            )
            session.add(appointment)
            session.commit()
            session.refresh(appointment)
            print(f"✅ Создана тестовая запись: {appointment.id}")
            return appointment
        finally:
            session.close()

    async def _create_test_notification(self, client, appointment):
        """Создать тестовое уведомление"""
        session = self.session_factory()
        try:
            notification = Notification(
                type=NotificationType.appointment_reminder,
                recipient_type="client",
                appointment_id=appointment.id,
                client_id=client.id,
                telegram_chat_id=client.telegram_chat_id,
                scheduled_at=datetime.now(),  # Для немедленной отправки
                title="Тестовое уведомление",
                message="🔔 Это тестовое уведомление для интеграционного теста!",
                status=NotificationStatus.scheduled,
                attempts=0,
                max_attempts=3,
                created_at=datetime.now(),
                updated_at=datetime.now(),
            )
            session.add(notification)
            session.commit()
            session.refresh(notification)
            print(f"✅ Создано тестовое уведомление: {notification.id}")
            return notification
        finally:
            session.close()

    async def _check_results(self, notification_id):
        """Проверить результаты теста"""
        session = self.session_factory()
        try:
            # Проверяем уведомление
            notification = session.query(Notification).get(notification_id)
            if notification:
                print(f"📨 Уведомление {notification_id}:")
                print(f"   Статус: {notification.status}")
                print(f"   Попытки: {notification.attempts}")
                print(f"   Отправлено: {notification.sent_at}")
            else:
                print("❌ Уведомление не найдено")

            # Проверяем действия
            from models import NotificationAction

            actions = (
                session.query(NotificationAction)
                .filter(NotificationAction.notification_id == notification_id)
                .all()
            )
            print(f"📝 Действия: {len(actions)} записей")

        finally:
            session.close()


# Запуск теста
async def main():
    tester = TestNotificationSystem()
    await tester.test_whole_system()


if __name__ == "__main__":
    asyncio.run(main())

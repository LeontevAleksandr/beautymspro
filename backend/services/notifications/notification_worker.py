import asyncio
import logging
import threading
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)


class NotificationWorker:
    """
    Фоновый воркер для отправки уведомлений по расписанию.

    Каждые 30 секунд проверяет таблицу уведомлений и отправляет те,
    которые готовы к отправке.
    """

    def __init__(self, func_logic, check_interval: int = 30):
        """
        Args:
            check_interval: Интервал проверки в секундах (по умолчанию 30)
        """
        self.func_logic = func_logic
        self.check_interval = check_interval
        self._is_running = False
        self._thread: Optional[threading.Thread] = None

    def start(self):
        """Запустить воркер в фоновом режиме"""

        if self._is_running:
            return False

        self._is_running = True

        def run_worker():
            """Функция которая запускается в отдельном потоке"""
            # Создаем свой event loop для этого потока
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            try:
                loop.run_until_complete(self._worker_loop())
            except Exception as e:
                logger.error(f"Критическая ошибка воркера уведомлений: {e}")
            finally:
                loop.close()
                self._is_running = False
                logger.info("Воркер уведомлений остановлен")

        # Запускаем в отдельном потоке (daemon=True - завершится с главным потоком)
        self._thread = threading.Thread(target=run_worker, daemon=True)
        self._thread.start()

        logger.info("✅ Воркер уведомлений успешно запущен")
        return True

    async def _worker_loop(self):
        """Основной цикл работы воркера"""
        while self._is_running:
            try:
                logger.info("Выполняется отправка уведомлений")
                await self.func_logic()  # Вызов функции логики
                await asyncio.sleep(self.check_interval)  # Усыпляем поток
            except Exception as e:
                logger.error(f"Ошибка в цикле воркера: {e}")
                # При ошибке ждем дольше перед повторной попыткой
                await asyncio.sleep(60)

    def stop(self):
        """Остановить воркер"""
        if not self._is_running:
            return

        self._is_running = False

        if self._thread and self._thread.is_alive():
            # Ждем завершения потока (максимум 5 секунд)
            self._thread.join(timeout=5)
            if self._thread.is_alive():
                logger.warning("Воркер не завершился за отведенное время")

        logger.info("🛑 Воркер уведомлений остановлен")

    def is_running(self) -> bool:
        """Проверить, работает ли воркер"""
        return self._is_running and self._thread and self._thread.is_alive()

    def get_status(self) -> dict:
        """Получить статус воркера"""
        return {
            "is_running": self.is_running(),
            "check_interval": self.check_interval,
            "thread_alive": self._thread.is_alive() if self._thread else False,
        }

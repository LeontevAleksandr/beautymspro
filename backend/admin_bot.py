import asyncio
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import aiohttp
from aiohttp import ClientTimeout
from dataclasses import dataclass

import pytz

from aiogram import Bot, Dispatcher, types, F
from aiogram.filters.command import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage

# Загрузка переменных из .env файла
def load_env_file():
    """Загрузить переменные из .env файла"""
    env_file = '.env'
    if os.path.exists(env_file):
        print(f"📄 Загрузка {env_file}...")
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip().strip('"').strip("'")
                    os.environ[key] = value
                    print(f"   ✅ {key} = {'*' * min(10, len(value))}")
    else:
        print(f"⚠️  Файл {env_file} не найден")

# Загружаем .env при импорте
load_env_file()

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class Config:
    bot_token: str = os.getenv('ADMIN_BOT_TOKEN', 'YOUR_ADMIN_BOT_TOKEN_HERE')
    api_base_url: str = os.getenv('API_BASE_URL', 'http://localhost:8000')
    timezone: pytz.BaseTzInfo = pytz.timezone('Europe/Moscow')

@dataclass
class APIConfig:
    base_url: str
    timeout: int = 30

class APIClient:
    def __init__(self, config: APIConfig):
        self.config = config
        self.session = None
        
    async def __aenter__(self):
        timeout = ClientTimeout(total=self.config.timeout)
        self.session = aiohttp.ClientSession(timeout=timeout)
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def get(self, endpoint: str, params: Optional[Dict] = None) -> Optional[Dict]:
        """GET запрос к API"""
        try:
            url = f"{self.config.base_url}{endpoint}"
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    logger.error(f"API GET error: {response.status} for {endpoint}")
                    return None
        except Exception as e:
            logger.error(f"API GET exception for {endpoint}: {e}")
            return None

class AdminStates(StatesGroup):
    main_menu = State()
    viewing_notifications = State()
    notification_details = State()

class AdminBot:
    def __init__(self, config: Config):
        self.config = config
        self.bot = Bot(token=config.bot_token)
        self.dp = Dispatcher(storage=MemoryStorage())
        self.api_config = APIConfig(base_url=config.api_base_url)
        
        # Регистрируем хэндлеры
        self._register_handlers()
        
        # Кэш данных для уведомлений
        self.clients_cache = {}
        self.employees_cache = {}
        self.last_cache_update = None
        
    def _register_handlers(self):
        """Регистрация всех хэндлеров"""
        # Команды
        self.dp.message.register(self.cmd_start, Command("start"))
        self.dp.message.register(self.cmd_menu, Command("menu"))
        self.dp.message.register(self.cmd_notifications, Command("notifications"))
        
        # Callback кнопки
        self.dp.callback_query.register(self.handle_main_menu, F.data == "main_menu")
        self.dp.callback_query.register(self.handle_scheduled_notifications, F.data == "scheduled_notifications")
        self.dp.callback_query.register(self.handle_sent_notifications, F.data == "sent_notifications")
        self.dp.callback_query.register(self.handle_failed_notifications, F.data == "failed_notifications")
        self.dp.callback_query.register(self.handle_all_notifications, F.data == "all_notifications")

    async def cmd_start(self, message: types.Message, state: FSMContext):
        """Команда /start"""
        await state.set_state(AdminStates.main_menu)
        
        welcome_text = """🔔 Админ-панель уведомлений Beauty Room

Управление системой уведомлений:
• Просмотр запланированных уведомлений
• Мониторинг отправленных сообщений
• Управление неудачными отправками

Выберите категорию уведомлений:"""
        
        keyboard = self._get_main_menu_keyboard()
        await message.answer(welcome_text, reply_markup=keyboard)

    async def cmd_menu(self, message: types.Message, state: FSMContext):
        """Команда /menu"""
        await self.cmd_start(message, state)

    async def cmd_notifications(self, message: types.Message):
        """Команда /notifications"""
        await self._show_scheduled_notifications(message)

    def _get_main_menu_keyboard(self) -> InlineKeyboardMarkup:
        """Главное меню"""
        builder = InlineKeyboardBuilder()
        
        builder.button(text="🕐 Запланированные", callback_data="scheduled_notifications")
        builder.button(text="✅ Отправленные", callback_data="sent_notifications")
        builder.button(text="❌ Неудачные", callback_data="failed_notifications")
        builder.button(text="📋 Все уведомления", callback_data="all_notifications")
        
        builder.adjust(2, 2)
        return builder.as_markup()

    async def handle_main_menu(self, callback: types.CallbackQuery, state: FSMContext):
        """Обработка возврата в главное меню"""
        await state.set_state(AdminStates.main_menu)
        
        text = """🔔 Админ-панель уведомлений Beauty Room

Управление системой уведомлений:
• Просмотр запланированных уведомлений
• Мониторинг отправленных сообщений
• Управление неудачными отправками

Выберите категорию уведомлений:"""
        
        keyboard = self._get_main_menu_keyboard()
        
        await callback.message.edit_text(text, reply_markup=keyboard)
        await callback.answer()

    async def handle_scheduled_notifications(self, callback: types.CallbackQuery, state: FSMContext):
        """Запланированные уведомления"""
        await state.set_state(AdminStates.viewing_notifications)
        await self._show_scheduled_notifications(callback.message)
        await callback.answer()

    async def handle_sent_notifications(self, callback: types.CallbackQuery, state: FSMContext):
        """Отправленные уведомления"""
        await state.set_state(AdminStates.viewing_notifications)
        await self._show_notifications_by_status(callback.message, "sent", "✅ Отправленные уведомления")
        await callback.answer()

    async def handle_failed_notifications(self, callback: types.CallbackQuery, state: FSMContext):
        """Неудачные уведомления"""
        await state.set_state(AdminStates.viewing_notifications)
        await self._show_notifications_by_status(callback.message, "failed", "❌ Неудачные уведомления")
        await callback.answer()

    async def handle_all_notifications(self, callback: types.CallbackQuery, state: FSMContext):
        """Все уведомления"""
        await state.set_state(AdminStates.viewing_notifications)
        await self._show_all_notifications(callback.message)
        await callback.answer()

    async def _show_scheduled_notifications(self, message: types.Message):
        """Показать запланированные уведомления"""
        async with APIClient(self.api_config) as client:
            # Получаем запланированные уведомления
            notifications = await client.get('/api/notifications', {
                'status': 'scheduled',
                'limit': 20,
                'order_by': 'scheduled_at',
                'order_direction': 'asc'
            })
            
            await self._update_cache_if_needed(client)
            
            if not notifications:
                text = "🕐 Запланированных уведомлений нет"
                keyboard = self._get_back_keyboard()
            else:
                text = f"🕐 Запланированные уведомления ({len(notifications)}):\n\n"
                
                for i, notification in enumerate(notifications, 1):
                    scheduled_time = self._localize_datetime(notification['scheduled_at'])
                    time_str = scheduled_time.strftime('%d.%m %H:%M')
                    
                    type_icon = self._get_notification_type_icon(notification.get('type', 'reminder'))
                    recipient_name = self._get_recipient_name(notification)
                    
                    # Время до отправки
                    now = datetime.now(self.config.timezone)
                    if scheduled_time > now:
                        time_diff = scheduled_time - now
                        time_until = self._format_time_until(time_diff)
                        time_info = f"через {time_until}"
                    else:
                        time_info = "просрочено"
                    
                    text += f"{type_icon} {i}. {time_str} ({time_info})\n"
                    text += f"   👤 {recipient_name}\n"
                    text += f"   📝 {notification.get('title', 'Без заголовка')}\n"
                    
                    if notification.get('attempts', 0) > 0:
                        text += f"   🔄 Попыток: {notification['attempts']}\n"
                    
                    text += f"   📱 ID: {notification['id']}\n\n"
                
                keyboard = self._get_notifications_keyboard("scheduled")
            
            await message.edit_text(text, reply_markup=keyboard)

    async def _show_notifications_by_status(self, message: types.Message, status: str, title: str):
        """Показать уведомления по статусу"""
        async with APIClient(self.api_config) as client:
            notifications = await client.get('/api/notifications', {
                'status': status,
                'limit': 20,
                'order_by': 'updated_at',
                'order_direction': 'desc'
            })
            
            if not notifications:
                text = f"{title}\n\nУведомлений нет"
                keyboard = self._get_back_keyboard()
            else:
                text = f"{title} ({len(notifications)}):\n\n"
                
                for i, notification in enumerate(notifications, 1):
                    if status == "sent" and notification.get('sent_at'):
                        time_field = notification['sent_at']
                        time_label = "отправлено"
                    else:
                        time_field = notification['updated_at']
                        time_label = "обновлено"
                    
                    updated_time = self._localize_datetime(time_field)
                    time_str = updated_time.strftime('%d.%m %H:%M')
                    
                    type_icon = self._get_notification_type_icon(notification.get('type', 'reminder'))
                    recipient_name = self._get_recipient_name(notification)
                    
                    text += f"{type_icon} {i}. {time_str} ({time_label})\n"
                    text += f"   👤 {recipient_name}\n"
                    text += f"   📝 {notification.get('title', 'Без заголовка')}\n"
                    
                    if notification.get('attempts', 0) > 1:
                        text += f"   🔄 Попыток: {notification['attempts']}\n"
                    
                    text += f"   📱 ID: {notification['id']}\n\n"
                
                keyboard = self._get_notifications_keyboard(status)
            
            await message.edit_text(text, reply_markup=keyboard)

    async def _show_all_notifications(self, message: types.Message):
        """Показать все уведомления"""
        async with APIClient(self.api_config) as client:
            notifications = await client.get('/api/notifications', {
                'limit': 20,
                'order_by': 'created_at',
                'order_direction': 'desc'
            })
            
            if not notifications:
                text = "📋 Уведомлений нет"
                keyboard = self._get_back_keyboard()
            else:
                text = f"📋 Все уведомления ({len(notifications)}):\n\n"
                
                for i, notification in enumerate(notifications, 1):
                    created_time = self._localize_datetime(notification['created_at'])
                    time_str = created_time.strftime('%d.%m %H:%M')
                    
                    status_icon = self._get_notification_status_icon(notification.get('status', 'scheduled'))
                    type_icon = self._get_notification_type_icon(notification.get('type', 'reminder'))
                    recipient_name = self._get_recipient_name(notification)
                    
                    text += f"{status_icon} {type_icon} {i}. {time_str}\n"
                    text += f"   👤 {recipient_name}\n"
                    text += f"   📝 {notification.get('title', 'Без заголовка')}\n"
                    
                    if notification.get('attempts', 0) > 1:
                        text += f"   🔄 Попыток: {notification['attempts']}\n"
                    
                    text += f"   📱 ID: {notification['id']}\n\n"
                
                keyboard = self._get_notifications_keyboard("all")
            
            await message.edit_text(text, reply_markup=keyboard)

    def _get_notifications_keyboard(self, notification_type: str) -> InlineKeyboardMarkup:
        """Клавиатура для управления уведомлениями"""
        builder = InlineKeyboardBuilder()
        
        if notification_type == "scheduled":
            builder.button(text="🔄 Обновить", callback_data="scheduled_notifications")
        elif notification_type == "sent":
            builder.button(text="🔄 Обновить", callback_data="sent_notifications")
        elif notification_type == "failed":
            builder.button(text="🔄 Обновить", callback_data="failed_notifications")
        else:
            builder.button(text="🔄 Обновить", callback_data="all_notifications")
        
        builder.button(text="🏠 Главное меню", callback_data="main_menu")
        builder.adjust(2)
        return builder.as_markup()

    def _get_back_keyboard(self) -> InlineKeyboardMarkup:
        """Клавиатура возврата"""
        return InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(text="🏠 Главное меню", callback_data="main_menu")
        ]])

    def _get_notification_status_icon(self, status: str) -> str:
        """Получить иконку статуса уведомления"""
        icons = {
            'scheduled': '🕐',
            'sent': '✅',
            'failed': '❌',
            'cancelled': '🚫'
        }
        return icons.get(status, '🕐')

    def _get_notification_type_icon(self, notification_type: str) -> str:
        """Получить иконку типа уведомления"""
        icons = {
            'appointment_reminder': '⏰',
            'appointment_created': '📝',
            'appointment_cancelled': '❌',
            'system': '🔧'
        }
        return icons.get(notification_type, '🔔')

    def _get_recipient_name(self, notification: Dict) -> str:
        """Получить имя получателя уведомления"""
        # Сначала проверяем кэш клиентов
        if notification.get('client_id') and notification['client_id'] in self.clients_cache:
            return self.clients_cache[notification['client_id']].get('full_name', 'Клиент')
        
        # Затем проверяем кэш сотрудников
        if notification.get('employee_id') and notification['employee_id'] in self.employees_cache:
            return self.employees_cache[notification['employee_id']].get('full_name', 'Сотрудник')
        
        # Если ничего не найдено
        recipient_type = notification.get('recipient_type', 'unknown')
        if recipient_type == 'client':
            return 'Клиент'
        elif recipient_type == 'employee':
            return 'Сотрудник'
        else:
            return 'Получатель'

    def _format_time_until(self, time_diff: timedelta) -> str:
        """Форматировать время до события"""
        total_seconds = int(time_diff.total_seconds())
        
        if total_seconds < 60:
            return f"{total_seconds} сек"
        elif total_seconds < 3600:
            minutes = total_seconds // 60
            return f"{minutes} мин"
        elif total_seconds < 86400:
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            if minutes > 0:
                return f"{hours} ч {minutes} мин"
            else:
                return f"{hours} ч"
        else:
            days = total_seconds // 86400
            hours = (total_seconds % 86400) // 3600
            if hours > 0:
                return f"{days} д {hours} ч"
            else:
                return f"{days} д"

    def _localize_datetime(self, dt_str: str) -> datetime:
        """Конвертировать datetime в локальную временную зону"""
        try:
            # Парсим ISO datetime
            dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
            # Конвертируем в UTC, затем в локальную зону
            if dt.tzinfo is None:
                dt = pytz.UTC.localize(dt)
            return dt.astimezone(self.config.timezone)
        except Exception as e:
            logger.error(f"Error parsing datetime {dt_str}: {e}")
            return datetime.now(self.config.timezone)

    async def _update_cache_if_needed(self, client: APIClient):
        """Обновить кэш справочников при необходимости"""
        now = datetime.now()
        
        # Обновляем кэш каждые 10 минут
        if (self.last_cache_update is None or 
            now - self.last_cache_update > timedelta(minutes=10)):
            
            # Загружаем клиентов
            clients = await client.get('/api/clients')
            if clients:
                self.clients_cache = {cli['id']: cli for cli in clients}
            
            # Загружаем сотрудников
            employees = await client.get('/api/employees')
            if employees:
                self.employees_cache = {emp['id']: emp for emp in employees}
            
            self.last_cache_update = now
            logger.info("Cache updated successfully")

    async def start_polling(self):
        """Запуск бота"""
        logger.info("Starting admin notifications bot...")
        await self.dp.start_polling(self.bot)

    async def stop(self):
        """Остановка бота"""
        logger.info("Stopping admin notifications bot...")
        await self.bot.session.close()

async def main():
    """Главная функция"""
    print("🚀 Запуск админ бота...")
    
    # Создание конфигурации
    config = Config()
    
    print(f"📋 Конфигурация:")
    print(f"   BOT_TOKEN: {'✅ Установлен' if config.bot_token != 'YOUR_ADMIN_BOT_TOKEN_HERE' else '❌ Не установлен'}")
    print(f"   API_URL: {config.api_base_url}")
    print(f"   TIMEZONE: {config.timezone}")
    
    # Проверяем токен
    if config.bot_token == 'YOUR_ADMIN_BOT_TOKEN_HERE':
        print("❌ ОШИБКА: Не установлена переменная окружения ADMIN_BOT_TOKEN")
        print("💡 Решение:")
        print("   1. Создайте файл .env в корне проекта")
        print("   2. Добавьте строку: ADMIN_BOT_TOKEN=your_token_here")
        print("   3. Или установите переменную: set ADMIN_BOT_TOKEN=your_token_here")
        return
    
    # Создание и запуск бота
    try:
        print("🤖 Инициализация бота...")
        admin_bot = AdminBot(config)
        
        print("🔗 Тестирование соединения с API...")
        # Простой тест API
        async with APIClient(admin_bot.api_config) as client:
            test_result = await client.get('/api/notifications', {'limit': 1})
            if test_result is not None:
                print("✅ API доступен")
            else:
                print("⚠️  API недоступен, но бот все равно запустится")
        
        print("▶️  Запуск polling...")
        logger.info(f"Starting admin bot with API: {config.api_base_url}")
        await admin_bot.start_polling()
        
    except KeyboardInterrupt:
        print("⏹️  Бот остановлен пользователем")
        logger.info("Bot stopped by user")
    except Exception as e:
        print(f"💥 Ошибка запуска бота: {e}")
        logger.error(f"Bot error: {e}", exc_info=True)
    finally:
        print("🧹 Завершение работы...")
        try:
            await admin_bot.stop()
        except:
            pass

if __name__ == "__main__":
    print("🎯 Beauty Room Admin Bot")
    print("=" * 40)
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"💥 Критическая ошибка: {e}")
        import traceback
        traceback.print_exc()
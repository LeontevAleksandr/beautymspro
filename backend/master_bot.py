import os
import re
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any
from dataclasses import dataclass

import aiohttp
import pytz
from dotenv import load_dotenv

from aiogram import Bot, Dispatcher, F
from aiogram.types import (
    Message, CallbackQuery, ReplyKeyboardMarkup, KeyboardButton,
    InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardRemove
)
from aiogram.filters import Command, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
import logging

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Загрузка конфигурации
load_dotenv()

@dataclass
class Config:
    bot_token: str = os.getenv('MASTER_BOT_TOKEN', 'YOUR_MASTER_BOT_TOKEN_HERE')
    api_base_url: str = os.getenv('API_BASE_URL', 'http://localhost:5000')
    timezone: pytz.BaseTzInfo = pytz.timezone('Europe/Moscow')

config = Config()

# Состояния FSM
class AuthStates(StatesGroup):
    waiting_phone = State()
    waiting_password = State()

# Утилиты для работы с API
class APIClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=15),
            connector=aiohttp.TCPConnector(limit=100)
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def get(self, endpoint: str, params: Optional[Dict] = None) -> Optional[Dict[str, Any]]:
        """GET запрос к API"""
        if not self.session:
            raise RuntimeError("APIClient must be used as async context manager")
        
        url = f"{self.base_url}/api{endpoint}"
        try:
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    return await response.json()
                elif response.status == 404:
                    return None
                else:
                    logger.error(f"API GET {endpoint} failed: {response.status}")
                    return None
        except Exception as e:
            logger.error(f"API GET {endpoint} error: {e}")
            return None
    
    async def post(self, endpoint: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """POST запрос к API"""
        if not self.session:
            raise RuntimeError("APIClient must be used as async context manager")
        
        url = f"{self.base_url}/api{endpoint}"
        try:
            async with self.session.post(url, json=data) as response:
                if response.status in (200, 201):
                    return await response.json()
                else:
                    result = await response.json() if response.content_type == 'application/json' else {}
                    result['_status_code'] = response.status
                    return result
        except Exception as e:
            logger.error(f"API POST {endpoint} error: {e}")
            return None

# Утилиты
class PhoneValidator:
    @staticmethod
    def normalize_phone(phone_input: str) -> Optional[str]:
        """Нормализация номера телефона к формату +7XXXXXXXXXX для мастеров"""
        digits_only = re.sub(r'\D', '', phone_input)
        
        if digits_only.startswith('79') and len(digits_only) == 11:
            return '+' + digits_only
        elif digits_only.startswith('89') and len(digits_only) == 11:
            return '+7' + digits_only[1:]
        elif digits_only.startswith('9') and len(digits_only) == 10:
            return '+7' + digits_only
        elif digits_only.startswith('7') and len(digits_only) == 11:
            return '+' + digits_only
        elif len(digits_only) == 10 and not digits_only.startswith(('7', '8')):
            return '+7' + digits_only
        elif digits_only.startswith('8') and len(digits_only) == 11:
            return '+7' + digits_only[1:]
        
        return None

class ScheduleManager:
    @staticmethod
    def parse_datetime(datetime_str: str) -> Optional[datetime]:
        """Парсинг различных форматов datetime"""
        if not datetime_str:
            return None
        
        formats = [
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d %H:%M:%S",
        ]
        
        # Убираем 'Z' если есть
        clean_str = datetime_str.replace('Z', '')
        
        for fmt in formats:
            try:
                return datetime.strptime(clean_str, fmt)
            except ValueError:
                continue
        
        # Fallback - пробуем fromisoformat
        try:
            return datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
        except ValueError:
            return None
    
    @staticmethod
    def get_working_days_sync(schedules: List[Dict], master_id: int, 
                            start_date: datetime, end_date: datetime) -> List[datetime]:
        """Синхронное получение рабочих дней"""
        working_days = []
        current_date = start_date
        
        while current_date <= end_date:
            is_working = False
            
            for schedule in schedules:
                if schedule.get('employee_id') != master_id:
                    continue
                
                schedule_date = schedule.get('date')
                if schedule_date:
                    # Конкретная дата
                    if schedule_date == current_date.strftime('%Y-%m-%d'):
                        if schedule.get('start_time') and schedule.get('end_time'):
                            is_working = True
                            break
                else:
                    # Регулярное расписание
                    weekday = current_date.weekday()
                    schedule_weekday = schedule.get('weekday')
                    
                    if schedule_weekday is not None:
                        api_weekday = 6 if schedule_weekday == 0 else schedule_weekday - 1
                        if api_weekday == weekday:
                            if schedule.get('start_time') and schedule.get('end_time'):
                                is_working = True
                                break
            
            if is_working:
                working_days.append(current_date)
            
            current_date += timedelta(days=1)
        
        return working_days

class UIHelper:
    @staticmethod
    def get_master_keyboard(is_authorized: bool = False) -> ReplyKeyboardMarkup:
        """Получить клавиатуру для мастера"""
        if is_authorized:
            buttons = [
                [KeyboardButton(text='📅 Расписание на сегодня'), KeyboardButton(text='📅 Расписание на завтра')],
                [KeyboardButton(text='📆 Выбрать дату'), KeyboardButton(text='❓ Помощь')]
            ]
        else:
            buttons = [[KeyboardButton(text='❓ Помощь')]]
        
        return ReplyKeyboardMarkup(keyboard=buttons, resize_keyboard=True)
    
    @staticmethod
    def split_long_message(message: str, max_length: int = 4000) -> List[str]:
        """Разбивает длинное сообщение на части"""
        if len(message) <= max_length:
            return [message]
        
        parts = []
        lines = message.split('\n')
        current_part = ""
        
        for line in lines:
            if len(current_part + line + '\n') > max_length:
                if current_part:
                    parts.append(current_part.rstrip())
                current_part = line + '\n'
            else:
                current_part += line + '\n'
        
        if current_part:
            parts.append(current_part.rstrip())
        
        return parts if parts else [message]

# Основной класс бота для мастеров
class MasterBot:
    def __init__(self):
        self.bot = Bot(
            token=config.bot_token,
            default=DefaultBotProperties(parse_mode=ParseMode.HTML)
        )
        self.dp = Dispatcher(storage=MemoryStorage())
        self.api_client = APIClient(config.api_base_url)
        self._setup_handlers()
    
    def _setup_handlers(self):
        """Настройка обработчиков"""
        # Команды
        self.dp.message.register(self.cmd_start, Command("start"))
        self.dp.message.register(self.cmd_help, Command("help"))
        self.dp.message.register(self.cmd_today, Command("today"))
        self.dp.message.register(self.cmd_tomorrow, Command("tomorrow"))
        self.dp.message.register(self.cmd_schedule, Command("schedule"))
        
        # Авторизация
        self.dp.message.register(
            self.get_phone,
            StateFilter(AuthStates.waiting_phone)
        )
        self.dp.message.register(
            self.get_password,
            StateFilter(AuthStates.waiting_password)
        )
        
        # Кнопки меню
        self.dp.message.register(
            self.cmd_today,
            F.text == "📅 Расписание на сегодня"
        )
        self.dp.message.register(
            self.cmd_tomorrow,
            F.text == "📅 Расписание на завтра"
        )
        self.dp.message.register(
            self.cmd_schedule,
            F.text == "📆 Выбрать дату"
        )
        self.dp.message.register(
            self.cmd_help,
            F.text == "❓ Помощь"
        )
        
        # Callback queries
        self.dp.callback_query.register(self.handle_date_selection)
        
        # Отмена операций
        self.dp.message.register(self.cancel_operation, Command("cancel"))
        
        # Остальные сообщения
        self.dp.message.register(self.handle_unknown_message)
    
    async def _get_master_by_chat_id(self, chat_id: int) -> Optional[Dict[str, Any]]:
        """Получить данные мастера по chat_id"""
        async with self.api_client as client:
            return await client.get(f"/telegram/master/{chat_id}")
    
    async def _check_authorization(self, chat_id: int) -> bool:
        """Проверить авторизацию мастера"""
        master_data = await self._get_master_by_chat_id(chat_id)
        return master_data is not None
    
    # Команды
    async def cmd_start(self, message: Message, state: FSMContext):
        """Начало работы и авторизация"""
        await state.clear()
        chat_id = message.chat.id
        user_name = message.from_user.first_name
        
        # Проверяем авторизацию
        master_data = await self._get_master_by_chat_id(chat_id)
        
        if master_data:
            spec_text = ""
            qual_text = ""
            
            if master_data.get('specialization'):
                spec_text = f"\n👩‍💼 Специализация: {master_data['specialization']['name']}"
            if master_data.get('qualification'):
                qual_text = f"\n🏆 Квалификация: {master_data['qualification']['name']}"
            
            await message.answer(
                f"Здравствуйте, {master_data['full_name']}! Вы уже авторизованы.{spec_text}{qual_text}\n\n"
                f"Используйте команды для просмотра расписания:",
                reply_markup=UIHelper.get_master_keyboard(is_authorized=True)
            )
            return
        
        await state.set_state(AuthStates.waiting_phone)
        await message.answer(
            f"Здравствуйте, {user_name}! 👋\n\n"
            f"Для авторизации в системе Beauty Room, пожалуйста, введите ваш номер телефона:",
            reply_markup=ReplyKeyboardRemove()
        )
    
    async def cmd_help(self, message: Message, state: FSMContext):
        """Справка по командам"""
        await state.clear()
        chat_id = message.chat.id
        is_authorized = await self._check_authorization(chat_id)
        
        help_text = "🤖 О боте Beauty Room для мастеров:\n\n" \
                   "Я помогу вам просматривать ваше расписание и записи клиентов.\n\n"
        
        if is_authorized:
            help_text += """🎯 Основные возможности:
• Просмотр расписания на любую дату
• Просмотр записей клиентов
• Информация о клиентах и услугах
• Отображение только рабочих дней

💇‍♀️ Доступные команды:
/schedule - Выбрать рабочий день
/today - Расписание на сегодня
/tomorrow - Расписание на завтра
/help - Получить помощь

📅 Особенности:
• Календарь показывает только ваши рабочие дни
• Записи отфильтрованы по вашему ID
• Учитываются исключения в расписании"""
        else:
            help_text += "Для начала работы используйте /start и пройдите авторизацию."
        
        await message.answer(
            help_text,
            reply_markup=UIHelper.get_master_keyboard(is_authorized)
        )
    
    async def cmd_today(self, message: Message, state: FSMContext):
        """Расписание на сегодня"""
        await state.clear()
        chat_id = message.chat.id
        
        master_data = await self._get_master_by_chat_id(chat_id)
        if not master_data:
            await message.answer(
                "❌ Не удалось получить данные мастера. Авторизуйтесь командой /start",
                reply_markup=UIHelper.get_master_keyboard(False)
            )
            return
        
        today = datetime.now(config.timezone).date()
        await self._show_schedule(message, master_data, today)
    
    async def cmd_tomorrow(self, message: Message, state: FSMContext):
        """Расписание на завтра"""
        await state.clear()
        chat_id = message.chat.id
        
        master_data = await self._get_master_by_chat_id(chat_id)
        if not master_data:
            await message.answer(
                "❌ Не удалось получить данные мастера. Авторизуйтесь командой /start",
                reply_markup=UIHelper.get_master_keyboard(False)
            )
            return
        
        tomorrow = datetime.now(config.timezone).date() + timedelta(days=1)
        await self._show_schedule(message, master_data, tomorrow)
    
    async def cmd_schedule(self, message: Message, state: FSMContext):
        """Выбор даты для просмотра расписания"""
        await state.clear()
        chat_id = message.chat.id
        
        master_data = await self._get_master_by_chat_id(chat_id)
        if not master_data:
            await message.answer(
                "❌ Не удалось получить данные мастера. Авторизуйтесь командой /start",
                reply_markup=UIHelper.get_master_keyboard(False)
            )
            return
        
        await self._show_date_selection(message, master_data)
    
    async def cancel_operation(self, message: Message, state: FSMContext):
        """Отмена операции"""
        await state.clear()
        chat_id = message.chat.id
        is_authorized = await self._check_authorization(chat_id)
        
        await message.answer(
            "Операция отменена.",
            reply_markup=UIHelper.get_master_keyboard(is_authorized)
        )
    
    # Авторизация
    async def get_phone(self, message: Message, state: FSMContext):
        """Получение номера телефона"""
        phone_input = message.text.strip()
        normalized_phone = PhoneValidator.normalize_phone(phone_input)
        
        if not normalized_phone:
            await message.answer(
                "❌ Неверный формат номера телефона.\n\n"
                "Пожалуйста, введите номер в одном из форматов:\n"
                "• +79123456789\n"
                "• 89123456789\n"
                "• 9123456789"
            )
            return
        
        await state.update_data(phone=normalized_phone)
        await state.set_state(AuthStates.waiting_password)
        await message.answer("Теперь введите ваш пароль:")
    
    async def get_password(self, message: Message, state: FSMContext):
        """Проверка пароля и авторизация"""
        password = message.text.strip()
        data = await state.get_data()
        phone = data.get('phone')
        chat_id = message.chat.id
        
        # Удаляем сообщение с паролем
        try:
            await message.delete()
        except:
            pass
        
        if not phone:
            await state.clear()
            await message.answer(
                "❌ Сессия истекла. Начните заново с /start",
                reply_markup=UIHelper.get_master_keyboard(False)
            )
            return
        
        # Авторизация
        auth_data = {
            'phone': phone,
            'password': password,
            'telegram_chat_id': chat_id
        }
        
        async with self.api_client as client:
            response = await client.post("/telegram/master/auth", auth_data)
            
            if not response:
                await message.answer(
                    "❌ Ошибка соединения с сервером. Попробуйте позже.",
                    reply_markup=UIHelper.get_master_keyboard(False)
                )
                await state.clear()
                return
            
            status_code = response.get('_status_code', 200)
            
            if status_code == 200:
                master_data = response.get('master', response)
                
                spec_text = ""
                qual_text = ""
                if master_data.get('specialization'):
                    spec_text = f"\n👩‍💼 Специализация: {master_data['specialization']['name']}"
                if master_data.get('qualification'):
                    qual_text = f"\n🏆 Квалификация: {master_data['qualification']['name']}"
                
                await message.answer(
                    f"✅ Авторизация успешна!\n\n"
                    f"Добро пожаловать, {master_data['full_name']}!{spec_text}{qual_text}\n\n"
                    f"Теперь вы можете просматривать ваше расписание и записи клиентов.",
                    reply_markup=UIHelper.get_master_keyboard(True)
                )
                await state.clear()
            else:
                error_message = response.get('error', 'Неизвестная ошибка')
                
                if 'already linked to another master' in error_message:
                    await message.answer(
                        f"❌ Этот Telegram аккаунт уже привязан к другому мастеру.\n"
                        f"Обратитесь к администратору.",
                        reply_markup=UIHelper.get_master_keyboard(False)
                    )
                    await state.clear()
                elif 'already linked to another Telegram account' in error_message:
                    await message.answer(
                        f"❌ Ваш аккаунт уже привязан к другому Telegram.\n"
                        f"Обратитесь к администратору для отвязки.",
                        reply_markup=UIHelper.get_master_keyboard(False)
                    )
                    await state.clear()
                elif 'Master not found' in error_message:
                    await message.answer(
                        f"❌ Мастер с номером {phone} не найден в системе.\n"
                        f"Убедитесь, что номер зарегистрирован как сотрудник.",
                        reply_markup=UIHelper.get_master_keyboard(False)
                    )
                    await state.clear()
                elif 'Invalid password' in error_message:
                    await message.answer(
                        f"❌ Неверный пароль. Попробуйте снова или /cancel для отмены:"
                    )
                else:
                    await message.answer(
                        f"❌ Ошибка авторизации: {error_message}",
                        reply_markup=UIHelper.get_master_keyboard(False)
                    )
                    await state.clear()
    
    # Работа с расписанием
    async def _show_date_selection(self, message: Message, master_data: Dict):
        """Показать календарь для выбора даты"""
        master_id = master_data['id']
        
        # Получаем рабочие дни
        async with self.api_client as client:
            schedules = await client.get("/schedules") or []
        
        today = datetime.now(config.timezone).date()
        end_date = today + timedelta(days=13)
        
        working_days = ScheduleManager.get_working_days_sync(
            schedules, master_id, today, end_date
        )
        
        if not working_days:
            await message.answer(
                "📅 На ближайшие 14 дней не найдено рабочих дней.\n"
                "Обратитесь к администратору для настройки расписания.",
                reply_markup=UIHelper.get_master_keyboard(True)
            )
            return
        
        # Создаем календарь
        keyboard = []
        row = []
        
        weekday_names = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
        
        for working_date in working_days[:14]:
            date_str = working_date.strftime("%d.%m.%Y")
            display_str = working_date.strftime("%d.%m")
            weekday = weekday_names[working_date.weekday()]
            display_str = f"{display_str} ({weekday})"
            
            row.append(InlineKeyboardButton(
                text=display_str,
                callback_data=f"date_{date_str}"
            ))
            
            if len(row) == 2:
                keyboard.append(row)
                row = []
        
        if row:
            keyboard.append(row)
        
        await message.answer(
            "📆 Выберите рабочий день для просмотра расписания:",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=keyboard)
        )
    
    async def handle_date_selection(self, callback: CallbackQuery, state: FSMContext):
        """Обработка выбора даты"""
        await callback.answer()
        
        if not callback.data.startswith("date_"):
            return
        
        date_str = callback.data.replace("date_", "")
        selected_date = datetime.strptime(date_str, "%d.%m.%Y").date()
        
        chat_id = callback.message.chat.id
        master_data = await self._get_master_by_chat_id(chat_id)
        
        if not master_data:
            await callback.message.answer(
                "❌ Не удалось получить данные мастера. Авторизуйтесь командой /start",
                reply_markup=UIHelper.get_master_keyboard(False)
            )
            return
        
        await self._show_schedule(callback.message, master_data, selected_date)
    
    async def _show_schedule(self, message: Message, master_data: Dict, selected_date: datetime):
        """Показать расписание на выбранную дату"""
        master_id = master_data['id']
        master_name = master_data['full_name']
        date_str = selected_date.strftime("%Y-%m-%d")
        
        async with self.api_client as client:
            # Получаем все данные параллельно
            appointments_data, schedules_data, clients_data, services_data = await asyncio.gather(
                client.get("/appointments"),
                client.get("/schedules"),
                client.get("/clients"),
                client.get("/services"),
                return_exceptions=True
            )
            
            # Фильтруем записи мастера на выбранную дату
            master_appointments = []
            if isinstance(appointments_data, list):
                for apt in appointments_data:
                    if apt.get('employee_id') == master_id:
                        apt_dt = ScheduleManager.parse_datetime(apt.get('datetime', ''))
                        if apt_dt and apt_dt.strftime("%Y-%m-%d") == date_str:
                            master_appointments.append(apt)
            
            # Создаем словари для быстрого поиска
            clients_dict = {c['id']: c for c in (clients_data or [])} if isinstance(clients_data, list) else {}
            services_dict = {s['id']: s for s in (services_data or [])} if isinstance(services_data, list) else {}
        
        # Формируем сообщение
        weekday_names = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье']
        weekday = weekday_names[selected_date.weekday()]
        
        message_text = f"📅 Расписание {master_name}\n" \
                      f"на {selected_date.strftime('%d.%m.%Y')} ({weekday}):\n\n"
        
        # Рабочие часы
        working_hours = self._get_working_hours(schedules_data or [], master_id, selected_date, date_str)
        message_text += f"🕒 Рабочие часы: {working_hours}\n\n"
        
        # Записи
        message_text += "📋 Записи клиентов:\n\n"
        
        if not master_appointments:
            message_text += "📭 На эту дату нет записей.\n"
        else:
            # Сортируем по времени
            master_appointments.sort(key=lambda x: x.get('datetime', ''))
            
            for idx, apt in enumerate(master_appointments, 1):
                appointment_info = self._format_appointment(apt, clients_dict, services_dict, idx)
                message_text += appointment_info + "\n"
        
        # Отправляем сообщение (разбиваем если длинное)
        message_parts = UIHelper.split_long_message(message_text)
        
        for i, part in enumerate(message_parts):
            keyboard = UIHelper.get_master_keyboard(True) if i == len(message_parts) - 1 else None
            await message.answer(part, reply_markup=keyboard)
    
    def _get_working_hours(self, schedules: List[Dict], master_id: int, 
                          selected_date: datetime, date_str: str) -> str:
        """Получить рабочие часы мастера на дату"""
        for schedule in schedules:
            if schedule.get('employee_id') != master_id:
                continue
            
            schedule_date = schedule.get('date')
            
            # Точная дата
            if schedule_date and schedule_date == date_str:
                start_time = schedule.get('start_time', '')[:5] if schedule.get('start_time') else "Не указано"
                end_time = schedule.get('end_time', '')[:5] if schedule.get('end_time') else "Не указано"
                return f"{start_time} - {end_time}"
            
            # Регулярное расписание
            elif not schedule_date:
                weekday_num = selected_date.weekday()
                schedule_weekday = schedule.get('weekday')
                
                if schedule_weekday is not None:
                    api_weekday = 6 if schedule_weekday == 0 else schedule_weekday - 1
                    if api_weekday == weekday_num:
                        start_time = schedule.get('start_time', '')[:5] if schedule.get('start_time') else "Не указано"
                        end_time = schedule.get('end_time', '')[:5] if schedule.get('end_time') else "Не указано"
                        return f"{start_time} - {end_time}"
        
        return "не указаны или выходной день"
    
    def _format_appointment(self, apt: Dict, clients_dict: Dict, 
                           services_dict: Dict, idx: int) -> str:
        """Форматировать информацию о записи"""
        # Клиент
        client_name = "Клиент не указан"
        if apt.get('client_id') and apt['client_id'] in clients_dict:
            client_name = clients_dict[apt['client_id']].get('full_name', 'Имя не указано')
        
        # Услуга
        service_name = "Услуга не указана"
        duration = 60
        
        if apt.get('service_id') and apt['service_id'] in services_dict:
            service_data = services_dict[apt['service_id']]
            service_name = service_data.get('name', 'Услуга не указана')
            duration = service_data.get('duration', 60)
        
        # Пользовательская продолжительность имеет приоритет
        if apt.get('custom_duration'):
            duration = apt['custom_duration']
        
        # Время
        appointment_time = "Не указано"
        end_time = "Не указано"
        
        if apt.get('datetime'):
            apt_dt = ScheduleManager.parse_datetime(apt['datetime'])
            if apt_dt:
                # Конвертируем в локальное время
                if apt_dt.tzinfo:
                    apt_dt = apt_dt.astimezone(config.timezone)
                else:
                    apt_dt = config.timezone.localize(apt_dt)
                
                appointment_time = apt_dt.strftime("%H:%M")
                end_dt = apt_dt + timedelta(minutes=duration)
                end_time = end_dt.strftime("%H:%M")
        
        # Статус записи
        status_icons = {
            'created': '🆕 Создана',
            'confirmed': '✅ Подтверждена',
            'completed': '🏁 Завершена',
            'cancelled': '❌ Отменена'
        }
        
        if apt.get('is_completed'):
            status_display = '🏁 Завершена'
        else:
            appointment_status = apt.get('status', 'created').lower()
            status_display = status_icons.get(appointment_status, f'❓ {appointment_status.capitalize()}')
        
        # Оплата
        paid = "💰 Оплачена" if apt.get('is_paid') else "💸 Не оплачена"
        
        # Стоимость
        final_price = apt.get('final_price')
        price_str = f"{final_price} руб." if final_price else "Не указана"
        
        # Заметки
        notes = apt.get('notes', '').strip()
        notes_str = f"\n📝 Заметки: {notes}" if notes else ""
        
        return f"""{idx}. 🕒 {appointment_time}-{end_time} ({duration} мин)
👤 {client_name}
💇‍♀️ {service_name}
💲 Стоимость: {price_str}
📊 {status_display}, {paid}{notes_str}"""
    
    async def handle_unknown_message(self, message: Message, state: FSMContext):
        """Обработчик неизвестных сообщений"""
        await state.clear()
        text = message.text.lower()
        chat_id = message.chat.id
        
        is_authorized = await self._check_authorization(chat_id)
        
        if any(phrase in text for phrase in ['расписание', 'график', 'записи']):
            if is_authorized:
                if 'сегодня' in text:
                    await self.cmd_today(message, state)
                elif 'завтра' in text:
                    await self.cmd_tomorrow(message, state)
                else:
                    await self.cmd_schedule(message, state)
            else:
                await message.answer(
                    "Для просмотра расписания необходимо авторизоваться. Используйте /start.",
                    reply_markup=UIHelper.get_master_keyboard(False)
                )
        elif any(word in text for word in ['помощь', 'help', 'команды']):
            await self.cmd_help(message, state)
        else:
            await message.answer(
                "Выберите действие из меню:",
                reply_markup=UIHelper.get_master_keyboard(is_authorized)
            )
    
    async def run(self):
        """Запуск бота"""
        logger.info("Starting Beauty Room Master Telegram Bot with aiogram v3...")
        await self.dp.start_polling(self.bot)

# Основная функция
async def main():
    if config.bot_token == 'YOUR_MASTER_BOT_TOKEN_HERE':
        print("Пожалуйста, установите MASTER_BOT_TOKEN в переменных окружения")
        return
    
    bot = MasterBot()
    await bot.run()

if __name__ == '__main__':
    asyncio.run(main())
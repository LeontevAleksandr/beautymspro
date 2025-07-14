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
    bot_token: str = os.getenv('TELEGRAM_BOT_TOKEN', 'YOUR_BOT_TOKEN_HERE')
    api_base_url: str = os.getenv('API_BASE_URL', 'http://localhost:5000')
    timezone: pytz.BaseTzInfo = pytz.timezone('Europe/Moscow')

config = Config()

# Состояния FSM
class RegistrationStates(StatesGroup):
    waiting_name = State()
    waiting_phone = State()
    confirming_data = State()

class BookingStates(StatesGroup):
    choosing_specialization = State()
    choosing_service = State()
    choosing_employee = State()
    choosing_date = State()
    choosing_time = State()
    confirming_appointment = State()
    setting_reminder = State()

# Утилиты для работы с API
class APIClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=10),
            connector=aiohttp.TCPConnector(limit=100)
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def get(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """GET запрос к API"""
        if not self.session:
            raise RuntimeError("APIClient must be used as async context manager")
        
        url = f"{self.base_url}/api{endpoint}"
        async with self.session.get(url, params=params) as response:
            if response.status == 200:
                return await response.json()
            elif response.status == 404:
                return None
            else:
                response.raise_for_status()
    
    async def post(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """POST запрос к API"""
        if not self.session:
            raise RuntimeError("APIClient must be used as async context manager")
        
        url = f"{self.base_url}/api{endpoint}"
        async with self.session.post(url, json=data) as response:
            if response.status in (200, 201):
                return await response.json()
            else:
                response.raise_for_status()
    
    async def put(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """PUT запрос к API"""
        if not self.session:
            raise RuntimeError("APIClient must be used as async context manager")
        
        url = f"{self.base_url}/api{endpoint}"
        async with self.session.put(url, json=data) as response:
            if response.status == 200:
                return await response.json()
            else:
                response.raise_for_status()

# Утилиты
class PhoneValidator:
    @staticmethod
    def normalize_phone(phone: str) -> Optional[str]:
        """Нормализация номера телефона к формату 89010010101"""
        digits_only = re.sub(r'\D', '', phone)
        
        if digits_only.startswith('79') and len(digits_only) == 11:
            return '8' + digits_only[1:]
        elif digits_only.startswith('89') and len(digits_only) == 11:
            return digits_only
        elif digits_only.startswith('9') and len(digits_only) == 10:
            return '8' + digits_only
        elif len(digits_only) == 10 and not digits_only.startswith('8'):
            return '8' + digits_only
        
        return None

class TimeSlotManager:
    @staticmethod
    def categorize_time_slot(time_str: str) -> str:
        """Категоризация времени на утро, день, вечер"""
        hour = int(time_str.split(':')[0])
        if 6 <= hour < 12:
            return "morning"
        elif 12 <= hour < 18:
            return "afternoon"
        else:
            return "evening"
    
    @staticmethod
    def get_category_emoji(category: str) -> str:
        """Получение эмодзи для категории времени"""
        return {
            "morning": "🌅",
            "afternoon": "☀️",
            "evening": "🌙"
        }.get(category, "🕐")
    
    @staticmethod
    def get_category_name(category: str) -> str:
        """Получение названия категории времени"""
        return {
            "morning": "УТРО",
            "afternoon": "ДЕНЬ", 
            "evening": "ВЕЧЕР"
        }.get(category, "")

class UIHelper:
    @staticmethod
    def get_specialization_emoji(name: str) -> str:
        """Получение эмодзи для специализации"""
        emojis = {
            'Парикмахер': '💇‍♀️',
            'Маникюр': '💅',
            'Педикюр': '👣',
            'Косметолог': '✨',
            'Массажист': '💆‍♀️',
            'Визажист': '💄',
            'Брови и ресницы': '👁️',
            'Эпиляция': '🌟'
        }
        return emojis.get(name, '💎')
    
    @staticmethod
    def get_qualification_name(qualification_id: int) -> str:
        """Получение названия квалификации"""
        qualifications = {
            1: "Младший",
            2: "Средний", 
            3: "Старший",
            4: "Эксперт",
            5: "Мастер"
        }
        return qualifications.get(qualification_id, "")
    
    @staticmethod
    def get_main_keyboard(is_registered: bool = True) -> ReplyKeyboardMarkup:
        """Получить основную клавиатуру"""
        if is_registered:
            buttons = [
                [KeyboardButton(text='💇‍♀️ Записаться на услугу')],
                [KeyboardButton(text='📅 Мои записи'), KeyboardButton(text='📋 Мой профиль')],
                [KeyboardButton(text='❓ Помощь')]
            ]
        else:
            buttons = [
                [KeyboardButton(text='📝 Регистрация')],
                [KeyboardButton(text='❓ Помощь')]
            ]
        return ReplyKeyboardMarkup(keyboard=buttons, resize_keyboard=True)

# Основной класс бота
class BeautyRoomBot:
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
        
        # Регистрация
        self.dp.message.register(
            self.start_registration,
            F.text == "📝 Регистрация"
        )
        self.dp.message.register(
            self.get_name,
            StateFilter(RegistrationStates.waiting_name)
        )
        self.dp.message.register(
            self.get_phone,
            StateFilter(RegistrationStates.waiting_phone)
        )
        self.dp.message.register(
            self.confirm_registration_data,
            StateFilter(RegistrationStates.confirming_data)
        )
        
        # Запись на услугу
        self.dp.message.register(
            self.start_booking,
            F.text == "💇‍♀️ Записаться на услугу"
        )
        self.dp.callback_query.register(
            self.choose_specialization,
            StateFilter(BookingStates.choosing_specialization)
        )
        self.dp.callback_query.register(
            self.choose_service,
            StateFilter(BookingStates.choosing_service)
        )
        self.dp.callback_query.register(
            self.choose_employee,
            StateFilter(BookingStates.choosing_employee)
        )
        self.dp.callback_query.register(
            self.choose_date,
            StateFilter(BookingStates.choosing_date)
        )
        self.dp.callback_query.register(
            self.choose_time,
            StateFilter(BookingStates.choosing_time)
        )
        self.dp.callback_query.register(
            self.confirm_appointment,
            StateFilter(BookingStates.confirming_appointment)
        )
        self.dp.callback_query.register(
            self.set_reminder,
            StateFilter(BookingStates.setting_reminder)
        )
        
        # Основные функции
        self.dp.message.register(
            self.my_appointments,
            F.text == "📅 Мои записи"
        )
        self.dp.message.register(
            self.check_status,
            F.text == "📋 Мой профиль"
        )
        self.dp.message.register(
            self.cmd_help,
            F.text == "❓ Помощь"
        )
        
        # Обработчик отмены
        self.dp.message.register(self.cancel_operation, Command("cancel"))
        
        # Обработчик всех остальных сообщений
        self.dp.message.register(self.handle_unknown_message)
    
    async def _get_client_by_chat_id(self, chat_id: int) -> Optional[Dict[str, Any]]:
        """Получить клиента по chat_id"""
        async with self.api_client as client:
            return await client.get(f"/telegram/client/{chat_id}")
    
    async def _check_registration(self, chat_id: int) -> bool:
        """Проверить, зарегистрирован ли пользователь"""
        client_data = await self._get_client_by_chat_id(chat_id)
        return client_data is not None
    
    # Команды
    async def cmd_start(self, message: Message, state: FSMContext):
        """Обработчик команды /start"""
        await state.clear()
        chat_id = message.chat.id
        user_name = message.from_user.first_name
        
        is_registered = await self._check_registration(chat_id)
        
        if is_registered:
            client_data = await self._get_client_by_chat_id(chat_id)
            text = (f"Добро пожаловать обратно, {client_data['full_name']}! 👋\n\n"
                   f"Ваш аккаунт уже связан с нашей системой BeautyMSPro.\n\n"
                   f"Выберите действие из меню ниже:")
        else:
            text = (f"Добро пожаловать в бьюти-студию Beauty Room 38, {user_name}! 👋\n\n"
                   f"Я помогу вам зарегистрироваться в нашей системе BeautyMSPro.\n\n"
                   f"Выберите действие из меню ниже:")
        
        await message.answer(
            text,
            reply_markup=UIHelper.get_main_keyboard(is_registered)
        )
    
    async def cmd_help(self, message: Message, state: FSMContext):
        """Обработчик команды /help"""
        await state.clear()
        chat_id = message.chat.id
        is_registered = await self._check_registration(chat_id)
        
        help_text = """🤖 О боте BeautyMSPro:

Я помогу вам записаться на услуги нашей студии красоты и буду напоминать о предстоящих визитах.

🎯 Основные возможности:
• Запись на любые услуги студии
• Выбор удобного времени и мастера
• Просмотр ваших записей
• Получение напоминаний о визитах

💇‍♀️ Процесс записи:
1. Нажмите "Записаться на услугу"
2. Выберите направление услуг
3. Выберите конкретную услугу
4. Выберите мастера или "Любой мастер"
5. Выберите дату и время
6. Подтвердите запись
7. Установите напоминание (опционально)

📞 Если возникли сложности, вы можете позвонить администратору салона:
+7(950)136-58-23"""
        
        await message.answer(
            help_text,
            reply_markup=UIHelper.get_main_keyboard(is_registered)
        )
    
    async def cancel_operation(self, message: Message, state: FSMContext):
        """Отмена текущей операции"""
        await state.clear()
        chat_id = message.chat.id
        is_registered = await self._check_registration(chat_id)
        
        await message.answer(
            "Операция отменена. Выберите действие из меню:",
            reply_markup=UIHelper.get_main_keyboard(is_registered)
        )
    
    # Регистрация
    async def start_registration(self, message: Message, state: FSMContext):
        """Начало регистрации"""
        chat_id = message.chat.id
        
        if await self._check_registration(chat_id):
            client_data = await self._get_client_by_chat_id(chat_id)
            await message.answer(
                f"Вы уже зарегистрированы как {client_data['full_name']}!\n"
                f"Телефон: {client_data['phone']}\n\n"
                f"Выберите действие из меню:",
                reply_markup=UIHelper.get_main_keyboard(True)
            )
            return
        
        await state.set_state(RegistrationStates.waiting_name)
        await message.answer(
            "Давайте зарегистрируем вас в нашей системе! 📝\n\n"
            "Пожалуйста, введите ваше имя (или полное ФИО):",
            reply_markup=ReplyKeyboardRemove()
        )
    
    async def get_name(self, message: Message, state: FSMContext):
        """Получение имени"""
        name = message.text.strip()
        
        if len(name) < 2:
            await message.answer("Имя должно содержать минимум 2 символа. Попробуйте еще раз:")
            return
        
        await state.update_data(name=name)
        await state.set_state(RegistrationStates.waiting_phone)
        
        await message.answer(
            f"Отлично, {name}! 👍\n\n"
            "Теперь введите ваш номер телефона в любом удобном формате:\n"
            "• +79123456789\n"
            "• 89123456789\n"
            "• 9123456789"
        )
    
    async def get_phone(self, message: Message, state: FSMContext):
        """Получение и валидация телефона"""
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
        
        data = await state.get_data()
        name = data['name']
        
        await state.update_data(phone=normalized_phone)
        await state.set_state(RegistrationStates.confirming_data)
        
        keyboard = ReplyKeyboardMarkup(
            keyboard=[
                [KeyboardButton(text='✅ Подтвердить'), KeyboardButton(text='❌ Отменить')]
            ],
            resize_keyboard=True,
            one_time_keyboard=True
        )
        
        await message.answer(
            f"Проверьте введенные данные:\n\n"
            f"👤 Имя: {name}\n"
            f"📱 Телефон: {normalized_phone}\n\n"
            f"Все верно?",
            reply_markup=keyboard
        )
    
    async def confirm_registration_data(self, message: Message, state: FSMContext):
        """Подтверждение данных регистрации"""
        if message.text == '✅ Подтвердить':
            await self._register_client(message, state)
        elif message.text == '❌ Отменить':
            await state.clear()
            await message.answer(
                "Регистрация отменена. Выберите действие из меню:",
                reply_markup=UIHelper.get_main_keyboard(False)
            )
        else:
            await message.answer("Пожалуйста, выберите один из предложенных вариантов:")
    
    async def _register_client(self, message: Message, state: FSMContext):
        """Регистрация клиента"""
        data = await state.get_data()
        chat_id = message.chat.id
        
        try:
            async with self.api_client as client:
                # Проверяем существующих клиентов
                clients = await client.get("/clients")
                existing_client = None
                
                if clients:
                    for c in clients:
                        if c['phone'] == data['phone']:
                            existing_client = c
                            break
                
                if existing_client:
                    # Обновляем существующего клиента
                    if existing_client.get('telegram_chat_id') and existing_client['telegram_chat_id'] != chat_id:
                        await message.answer(
                            f"❌ Клиент с номером {existing_client['phone']} уже привязан к другому Telegram аккаунту.",
                            reply_markup=UIHelper.get_main_keyboard(False)
                        )
                        await state.clear()
                        return
                    
                    update_data = {
                        'full_name': data['name'],
                        'phone': existing_client['phone'],
                        'email': existing_client.get('email'),
                        'telegram_chat_id': chat_id
                    }
                    
                    await client.put(f"/clients/{existing_client['id']}", update_data)
                    
                    name_changed = existing_client['full_name'] != data['name']
                    if name_changed:
                        success_text = (
                            f"✅ Добро пожаловать, {data['name']}!\n\n"
                            f"Ваш аккаунт обновлен и привязан к Telegram.\n"
                            f"Имя изменено с '{existing_client['full_name']}' на '{data['name']}'.\n\n"
                            f"Выберите действие из меню:"
                        )
                    else:
                        success_text = (
                            f"✅ Добро пожаловать обратно, {data['name']}!\n\n"
                            f"Ваш аккаунт успешно привязан к Telegram.\n\n"
                            f"Выберите действие из меню:"
                        )
                else:
                    # Создаем нового клиента
                    new_client_data = {
                        'full_name': data['name'],
                        'phone': data['phone'],
                        'telegram_chat_id': chat_id
                    }
                    
                    await client.post("/clients", new_client_data)
                    
                    success_text = (
                        f"✅ Добро пожаловать в бьюти-студию Beauty Room 38, {data['name']}!\n\n"
                        f"Ваш аккаунт создан и привязан к Telegram.\n"
                        f"Теперь вы будете получать уведомления о записях.\n\n"
                        f"Выберите действие из меню:"
                    )
                
                await message.answer(
                    success_text,
                    reply_markup=UIHelper.get_main_keyboard(True)
                )
                
        except Exception as e:
            logger.error(f"Error during registration: {e}")
            await message.answer(
                "❌ Произошла ошибка при регистрации. Попробуйте позже.",
                reply_markup=UIHelper.get_main_keyboard(False)
            )
        
        await state.clear()
    
    # Запись на услугу
    async def start_booking(self, message: Message, state: FSMContext):
        """Начало записи на услугу"""
        chat_id = message.chat.id
        
        if not await self._check_registration(chat_id):
            await message.answer(
                "❌ Вы не зарегистрированы в системе.\n\nВыберите действие из меню:",
                reply_markup=UIHelper.get_main_keyboard(False)
            )
            return
        
        try:
            client_data = await self._get_client_by_chat_id(chat_id)
            
            async with self.api_client as client:
                specializations = await client.get("/specializations")
                
                if not specializations:
                    await message.answer("❌ Ошибка при загрузке специализаций.")
                    return
                
                keyboard = []
                for spec in specializations:
                    emoji = UIHelper.get_specialization_emoji(spec['name'])
                    keyboard.append([InlineKeyboardButton(
                        text=f"{emoji} {spec['name']}",
                        callback_data=f"spec_{spec['id']}"
                    )])
                
                keyboard.append([InlineKeyboardButton(
                    text="❌ Отменить",
                    callback_data="cancel_booking"
                )])
                
                await state.set_state(BookingStates.choosing_specialization)
                await state.update_data(
                    client_id=client_data['id'],
                    client_name=client_data['full_name']
                )
                
                await message.answer(
                    "💇‍♀️ Выберите направление услуг:",
                    reply_markup=InlineKeyboardMarkup(inline_keyboard=keyboard)
                )
        except Exception as e:
            logger.error(f"Error starting booking: {e}")
            await message.answer("❌ Произошла ошибка. Попробуйте позже.")
    
    async def choose_specialization(self, callback: CallbackQuery, state: FSMContext):
        """Выбор специализации"""
        await callback.answer()
        
        if callback.data == "cancel_booking":
            await callback.message.edit_text("❌ Запись отменена.")
            await state.clear()
            return
        
        spec_id = int(callback.data.split('_')[1])
        await state.update_data(specialization_id=spec_id)
        
        try:
            async with self.api_client as client:
                all_services = await client.get("/services")
                
                if not all_services:
                    await callback.message.edit_text("❌ Ошибка при загрузке услуг.")
                    return
                
                # Фильтруем услуги по специализации
                services = [s for s in all_services if s.get('specialization_id') == spec_id]
                if not services:
                    services = all_services
                
                keyboard = []
                for service in services:
                    price = int(float(service['base_price']))
                    duration = service['duration']
                    button_text = f"{service['name']} • {price}₽ • {duration} мин"
                    keyboard.append([InlineKeyboardButton(
                        text=button_text,
                        callback_data=f"srv_{service['id']}"
                    )])
                
                keyboard.append([InlineKeyboardButton(
                    text="◀️ Назад",
                    callback_data="back_to_spec"
                )])
                
                await state.set_state(BookingStates.choosing_service)
                await callback.message.edit_text(
                    "💅 Выберите услугу:",
                    reply_markup=InlineKeyboardMarkup(inline_keyboard=keyboard)
                )
        except Exception as e:
            logger.error(f"Error choosing specialization: {e}")
            await callback.message.edit_text("❌ Произошла ошибка.")
    
    async def choose_service(self, callback: CallbackQuery, state: FSMContext):
        """Выбор услуги"""
        await callback.answer()
        
        if callback.data == "back_to_spec":
            # Возвращаемся к выбору специализации
            async with self.api_client as client:
                specializations = await client.get("/specializations")
                
                keyboard = []
                for spec in specializations:
                    emoji = UIHelper.get_specialization_emoji(spec['name'])
                    keyboard.append([InlineKeyboardButton(
                        text=f"{emoji} {spec['name']}",
                        callback_data=f"spec_{spec['id']}"
                    )])
                
                keyboard.append([InlineKeyboardButton(
                    text="❌ Отменить",
                    callback_data="cancel_booking"
                )])
                
                await state.set_state(BookingStates.choosing_specialization)
                await callback.message.edit_text(
                    "💇‍♀️ Выберите направление услуг:",
                    reply_markup=InlineKeyboardMarkup(inline_keyboard=keyboard)
                )
            return
        
        service_id = int(callback.data.split('_')[1])
        
        try:
            async with self.api_client as client:
                service = await client.get(f"/services/{service_id}")
                
                if not service:
                    await callback.message.edit_text("❌ Ошибка при загрузке информации об услуге.")
                    return
                
                await state.update_data(
                    service_id=service_id,
                    service_name=service['name'],
                    service_duration=service['duration'],
                    service_price=service['base_price']
                )
                
                data = await state.get_data()
                spec_id = data['specialization_id']
                
                all_employees = await client.get("/employees")
                employees = [e for e in all_employees if e.get('specialization_id') == spec_id]
                if not employees:
                    employees = all_employees
                
                keyboard = []
                keyboard.append([InlineKeyboardButton(
                    text="🎲 Любой мастер",
                    callback_data="emp_any"
                )])
                
                for employee in employees:
                    qualification = UIHelper.get_qualification_name(employee.get('qualification_id', 0))
                    name_text = f"👤 {employee['full_name']}"
                    if qualification:
                        name_text += f" ({qualification})"
                    
                    keyboard.append([InlineKeyboardButton(
                        text=name_text,
                        callback_data=f"emp_{employee['id']}"
                    )])
                
                keyboard.append([InlineKeyboardButton(
                    text="◀️ Назад",
                    callback_data="back_to_services"
                )])
                
                await state.set_state(BookingStates.choosing_employee)
                await callback.message.edit_text(
                    f"👥 Выберите мастера для услуги:\n{service['name']}",
                    reply_markup=InlineKeyboardMarkup(inline_keyboard=keyboard)
                )
        except Exception as e:
            logger.error(f"Error choosing service: {e}")
            await callback.message.edit_text("❌ Произошла ошибка.")
    
    async def choose_employee(self, callback: CallbackQuery, state: FSMContext):
        """Выбор мастера"""
        await callback.answer()
        
        if callback.data == "back_to_services":
            return await self.choose_specialization(callback, state)
        
        if callback.data == "emp_any":
            await state.update_data(employee_id=None, employee_name="Любой мастер")
        else:
            employee_id = int(callback.data.split('_')[1])
            
            try:
                async with self.api_client as client:
                    employee = await client.get(f"/employees/{employee_id}")
                    if employee:
                        qualification = UIHelper.get_qualification_name(employee.get('qualification_id', 0))
                        employee_name = employee['full_name']
                        if qualification:
                            employee_name += f" ({qualification})"
                        await state.update_data(employee_id=employee_id, employee_name=employee_name)
            except Exception:
                await state.update_data(employee_id=employee_id, employee_name="Мастер")
        
        await callback.message.edit_text("⏳ Проверяю доступные даты...")
        
        # Получаем доступные даты
        data = await state.get_data()
        today = datetime.now(config.timezone).date()
        available_dates = []
        
        for i in range(14):
            check_date = today + timedelta(days=i)
            date_str = check_date.strftime("%Y-%m-%d")
            
            has_slots = await self._check_date_availability(
                date_str,
                data['service_id'],
                data.get('employee_id'),
                data['specialization_id']
            )
            
            if has_slots:
                available_dates.append((check_date, date_str))
                if len(available_dates) >= 7:
                    break
        
        if not available_dates:
            keyboard = [[InlineKeyboardButton(
                text="◀️ Назад",
                callback_data="back_to_employees"
            )]]
            
            await callback.message.edit_text(
                "❌ К сожалению, в ближайшие дни нет свободных окон для записи.\n"
                "Попробуйте выбрать другого мастера или услугу. Или обратитесь к администратору по номеру +7(950)136-58-23.",
                reply_markup=InlineKeyboardMarkup(inline_keyboard=keyboard)
            )
            return
        
        keyboard = []
        for date, date_str in available_dates:
            if date == today:
                button_text = f"📅 Сегодня ({date.strftime('%d.%m')})"
            elif date == today + timedelta(days=1):
                button_text = f"📅 Завтра ({date.strftime('%d.%m')})"
            else:
                weekday = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][date.weekday()]
                button_text = f"📅 {weekday} ({date.strftime('%d.%m')})"
            
            keyboard.append([InlineKeyboardButton(
                text=button_text,
                callback_data=f"date_{date_str}"
            )])
        
        keyboard.append([InlineKeyboardButton(
            text="◀️ Назад",
            callback_data="back_to_employees"
        )])
        
        await state.set_state(BookingStates.choosing_date)
        await callback.message.edit_text(
            "📆 Выберите дату записи:",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=keyboard)
        )
    
    async def _check_date_availability(self, date_str: str, service_id: int, 
                                     employee_id: Optional[int], specialization_id: int) -> bool:
        """Проверка доступности даты"""
        try:
            async with self.api_client as client:
                if employee_id:
                    params = {
                        'date': date_str,
                        'service_id': service_id,
                        'employee_id': employee_id
                    }
                    
                    data = await client.get("/available_slots", params)
                    if data:
                        available_slots = data.get('available_slots', [])
                        return self._filter_slots_by_time(available_slots, date_str)
                else:
                    # Для "любой мастер" проверяем всех мастеров специализации
                    all_employees = await client.get("/employees")
                    employees = [e for e in all_employees if e.get('specialization_id') == specialization_id]
                    
                    for employee in employees:
                        params = {
                            'date': date_str,
                            'service_id': service_id,
                            'employee_id': employee['id']
                        }
                        
                        data = await client.get("/available_slots", params)
                        if data:
                            available_slots = data.get('available_slots', [])
                            if self._filter_slots_by_time(available_slots, date_str):
                                return True
                
                return False
        except Exception as e:
            logger.error(f"Error checking date availability: {e}")
            return False
    
    def _filter_slots_by_time(self, slots: List[Dict], date_str: str) -> bool:
        """Фильтрация слотов по времени (не раньше чем через 30 минут)"""
        current_time = datetime.now(config.timezone)
        min_time = current_time + timedelta(minutes=30)
        
        for slot in slots:
            slot_datetime = datetime.strptime(
                f"{date_str} {slot['start']}", 
                "%Y-%m-%d %H:%M"
            ).replace(tzinfo=config.timezone)
            
            if slot_datetime >= min_time:
                return True
        
        return False
    
    async def choose_date(self, callback: CallbackQuery, state: FSMContext):
        """Выбор даты"""
        await callback.answer()
        
        if callback.data == "back_to_employees":
            return await self.choose_service(callback, state)
        
        date_str = callback.data.split('_')[1]
        await state.update_data(date=date_str)
        
        await callback.message.edit_text("⏳ Загружаю доступное время...")
        
        data = await state.get_data()
        
        try:
            all_slots_by_time = {}
            
            async with self.api_client as client:
                if not data.get('employee_id'):
                    # Для "любой мастер"
                    all_employees = await client.get("/employees")
                    employees = [e for e in all_employees if e.get('specialization_id') == data['specialization_id']]
                    
                    for employee in employees:
                        params = {
                            'date': date_str,
                            'service_id': data['service_id'],
                            'employee_id': employee['id']
                        }
                        
                        slot_data = await client.get("/available_slots", params)
                        if slot_data:
                            for slot in slot_data.get('available_slots', []):
                                time = slot['start']
                                if time not in all_slots_by_time:
                                    all_slots_by_time[time] = []
                                all_slots_by_time[time].append({
                                    'employee_id': employee['id'],
                                    'employee_name': employee['full_name']
                                })
                else:
                    # Для конкретного мастера
                    params = {
                        'date': date_str,
                        'service_id': data['service_id'],
                        'employee_id': data['employee_id']
                    }
                    
                    slot_data = await client.get("/available_slots", params)
                    if slot_data:
                        for slot in slot_data.get('available_slots', []):
                            time = slot['start']
                            all_slots_by_time[time] = [{
                                'employee_id': data['employee_id'],
                                'employee_name': data['employee_name']
                            }]
            
            # Фильтруем слоты по времени
            current_time = datetime.now(config.timezone)
            min_time = current_time + timedelta(minutes=30)
            
            filtered_slots = {}
            for time, employees in all_slots_by_time.items():
                slot_datetime = datetime.strptime(
                    f"{date_str} {time}", 
                    "%Y-%m-%d %H:%M"
                ).replace(tzinfo=config.timezone)
                
                if slot_datetime >= min_time:
                    filtered_slots[time] = employees
            
            if not filtered_slots:
                keyboard = [[InlineKeyboardButton(
                    text="◀️ Назад",
                    callback_data="back_to_dates"
                )]]
                
                await callback.message.edit_text(
                    "❌ К сожалению, на выбранную дату нет свободного времени.\n"
                    "Попробуйте выбрать другую дату.",
                    reply_markup=InlineKeyboardMarkup(inline_keyboard=keyboard)
                )
                return
            
            # Группируем слоты по времени суток
            morning_slots = []
            afternoon_slots = []
            evening_slots = []
            
            for time in sorted(filtered_slots.keys()):
                category = TimeSlotManager.categorize_time_slot(time)
                employee_info = filtered_slots[time][0]
                
                slot_data = {
                    'time': time,
                    'employee_id': employee_info['employee_id'],
                    'callback': f"time_{time}_emp_{employee_info['employee_id']}"
                }
                
                if category == "morning":
                    morning_slots.append(slot_data)
                elif category == "afternoon":
                    afternoon_slots.append(slot_data)
                else:
                    evening_slots.append(slot_data)
            
            # Создаем клавиатуру
            keyboard = []
            
            # Утренние слоты
            if morning_slots:
                keyboard.append([InlineKeyboardButton(
                    text=f"🌅 УТРО ({len(morning_slots)} слотов)",
                    callback_data="header_morning"
                )])
                
                for i in range(0, len(morning_slots), 3):
                    row = []
                    for j in range(3):
                        if i + j < len(morning_slots):
                            slot = morning_slots[i + j]
                            row.append(InlineKeyboardButton(
                                text=slot['time'],
                                callback_data=slot['callback']
                            ))
                    keyboard.append(row)
            
            # Дневные слоты
            if afternoon_slots:
                if morning_slots:
                    keyboard.append([InlineKeyboardButton(
                        text="─────────",
                        callback_data="separator"
                    )])
                
                keyboard.append([InlineKeyboardButton(
                    text=f"☀️ ДЕНЬ ({len(afternoon_slots)} слотов)",
                    callback_data="header_afternoon"
                )])
                
                for i in range(0, len(afternoon_slots), 3):
                    row = []
                    for j in range(3):
                        if i + j < len(afternoon_slots):
                            slot = afternoon_slots[i + j]
                            row.append(InlineKeyboardButton(
                                text=slot['time'],
                                callback_data=slot['callback']
                            ))
                    keyboard.append(row)
            
            # Вечерние слоты
            if evening_slots:
                if morning_slots or afternoon_slots:
                    keyboard.append([InlineKeyboardButton(
                        text="─────────",
                        callback_data="separator"
                    )])
                
                keyboard.append([InlineKeyboardButton(
                    text=f"🌙 ВЕЧЕР ({len(evening_slots)} слотов)",
                    callback_data="header_evening"
                )])
                
                for i in range(0, len(evening_slots), 3):
                    row = []
                    for j in range(3):
                        if i + j < len(evening_slots):
                            slot = evening_slots[i + j]
                            row.append(InlineKeyboardButton(
                                text=slot['time'],
                                callback_data=slot['callback']
                            ))
                    keyboard.append(row)
            
            keyboard.append([InlineKeyboardButton(
                text="◀️ Назад",
                callback_data="back_to_dates"
            )])
            
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
            date_display = date_obj.strftime("%d.%m.%Y")
            
            total_slots = len(morning_slots) + len(afternoon_slots) + len(evening_slots)
            
            await state.set_state(BookingStates.choosing_time)
            await callback.message.edit_text(
                f"⏰ Выберите время записи на {date_display}\n"
                f"Доступно {total_slots} окон для записи:",
                reply_markup=InlineKeyboardMarkup(inline_keyboard=keyboard)
            )
            
        except Exception as e:
            logger.error(f"Error choosing date: {e}")
            await callback.message.edit_text("❌ Произошла ошибка при загрузке доступного времени.")
    
    async def choose_time(self, callback: CallbackQuery, state: FSMContext):
        """Выбор времени"""
        # Игнорируем клики по заголовкам и разделителям
        if callback.data in ["header_morning", "header_afternoon", "header_evening", "separator"]:
            await callback.answer("Выберите конкретное время из списка ниже")
            return
        
        await callback.answer()
        
        if callback.data == "back_to_dates":
            return await self.choose_employee(callback, state)
        
        # Парсим время и ID мастера
        parts = callback.data.split('_')
        time_str = parts[1]
        
        data = await state.get_data()
        
        # Если был выбор "любой мастер" и в колбэке есть ID мастера
        if len(parts) > 3 and parts[2] == 'emp':
            selected_employee_id = int(parts[3])
            if not data.get('employee_id'):
                try:
                    async with self.api_client as client:
                        employee = await client.get(f"/employees/{selected_employee_id}")
                        if employee:
                            qualification = UIHelper.get_qualification_name(employee.get('qualification_id', 0))
                            employee_name = employee['full_name']
                            if qualification:
                                employee_name += f" ({qualification})"
                            await state.update_data(employee_id=selected_employee_id, employee_name=employee_name)
                except Exception:
                    await state.update_data(employee_id=selected_employee_id, employee_name="Мастер")
        
        await state.update_data(time=time_str)
        
        # Обновляем данные
        data = await state.get_data()
        
        # Вычисляем время окончания
        date_str = data['date']
        datetime_str = f"{date_str} {time_str}"
        start_datetime = datetime.strptime(datetime_str, "%Y-%m-%d %H:%M")
        duration = data['service_duration']
        end_datetime = start_datetime + timedelta(minutes=duration)
        
        # Форматируем данные для отображения
        date_display = start_datetime.strftime("%d.%m.%Y")
        time_display = start_datetime.strftime("%H:%M")
        end_time_display = end_datetime.strftime("%H:%M")
        
        details = f"""📋 Подтвердите запись:

        👤 Клиент: {data['client_name']}
        💅 Услуга: {data['service_name']}
        👨‍💼 Мастер: {data['employee_name']}
        📅 Дата: {date_display}
        ⏰ Время: {time_display} - {end_time_display}
        💰 Стоимость: {int(float(data['service_price']))} ₽
        ⏱️ Длительность: {duration} минут"""
        
        keyboard = [
            [InlineKeyboardButton(text="✅ Подтвердить", callback_data="confirm_yes")],
            [InlineKeyboardButton(text="❌ Отменить", callback_data="confirm_no")]
        ]
        
        await state.set_state(BookingStates.confirming_appointment)
        await callback.message.edit_text(
            details,
            reply_markup=InlineKeyboardMarkup(inline_keyboard=keyboard)
        )
    
    async def confirm_appointment(self, callback: CallbackQuery, state: FSMContext):
        """Подтверждение записи"""
        await callback.answer()
        
        if callback.data == "confirm_no":
            await callback.message.edit_text("❌ Запись отменена.")
            await callback.message.answer(
                "Что вы хотите сделать?",
                reply_markup=UIHelper.get_main_keyboard(True)
            )
            await state.clear()
            return
        
        data = await state.get_data()
        
        try:
            appointment_data = {
                'client_id': data['client_id'],
                'employee_id': data['employee_id'],
                'service_id': data['service_id'],
                'datetime': f"{data['date']}T{data['time']}:00",
                'final_price': data['service_price']
            }
            
            async with self.api_client as client:
                appointment_response = await client.post("/appointments", appointment_data)
                
                await state.update_data(appointment_id=appointment_response['id'])
                
                keyboard = [
                    [InlineKeyboardButton(text="⏰ За 1 час", callback_data="reminder_1h")],
                    [InlineKeyboardButton(text="⏰ За 2 часа", callback_data="reminder_2h")],
                    [InlineKeyboardButton(text="⏰ За день", callback_data="reminder_24h")],
                    [InlineKeyboardButton(text="❌ Не нужно", callback_data="reminder_no")]
                ]
                
                await state.set_state(BookingStates.setting_reminder)
                await callback.message.edit_text(
                    "✅ Запись успешно создана!\n\n"
                    "Хотите установить напоминание о визите?",
                    reply_markup=InlineKeyboardMarkup(inline_keyboard=keyboard)
                )
        except Exception as e:
            logger.error(f"Error creating appointment: {e}")
            await callback.message.edit_text(
                "❌ Произошла ошибка при создании записи.\n"
                "Попробуйте позже."
            )
            await callback.message.answer(
                "Выберите действие из меню:",
                reply_markup=UIHelper.get_main_keyboard(True)
            )
            await state.clear()
    
    async def set_reminder(self, callback: CallbackQuery, state: FSMContext):
        """Установка напоминания"""
        await callback.answer()
        
        data = await state.get_data()
        success_msg = "✅ Запись создана!\n\n"
        
        if callback.data != "reminder_no":
            appointment_datetime = datetime.strptime(
                f"{data['date']} {data['time']}", 
                "%Y-%m-%d %H:%M"
            )
            
            if callback.data == "reminder_1h":
                reminder_time = appointment_datetime - timedelta(hours=1)
                reminder_text = "за 1 час"
            elif callback.data == "reminder_2h":
                reminder_time = appointment_datetime - timedelta(hours=2)
                reminder_text = "за 2 часа"
            else:  # reminder_24h
                reminder_time = appointment_datetime - timedelta(days=1)
                reminder_text = "за день"
            
            try:
                notification_data = {
                    'appointment_id': data['appointment_id'],
                    'scheduled_at': reminder_time.isoformat(),
                    'status': 'pending'
                }
                
                async with self.api_client as client:
                    await client.post("/notifications", notification_data)
                    success_msg = f"✅ Отлично! Напоминание установлено {reminder_text} до визита.\n\n"
            except Exception as e:
                logger.error(f"Error creating notification: {e}")
        
        # Формируем финальное сообщение
        date_str = data['date']
        time_str = data['time']
        start_datetime = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
        duration = data['service_duration']
        end_datetime = start_datetime + timedelta(minutes=duration)
        
        date_display = start_datetime.strftime("%d.%m.%Y")
        time_display = start_datetime.strftime("%H:%M")
        end_time_display = end_datetime.strftime("%H:%M")
        
        final_message = success_msg + f"""📋 Детали вашей записи:
👤 Клиент: {data['client_name']}
💅 Услуга: {data['service_name']}
👨‍💼 Мастер: {data['employee_name']}
📅 Дата: {date_display}
⏰ Время: {time_display} - {end_time_display}

Ждем вас в Beauty Room 38! ✨"""
        
        await callback.message.edit_text(final_message)
        await callback.message.answer(
            "Что вы хотите сделать дальше?",
            reply_markup=UIHelper.get_main_keyboard(True)
        )
        
        await state.clear()
    
    # Основные функции
    async def my_appointments(self, message: Message, state: FSMContext):
        """Показать записи пользователя"""
        await state.clear()
        chat_id = message.chat.id
        
        try:
            client_data = await self._get_client_by_chat_id(chat_id)
            
            if not client_data:
                await message.answer(
                    "❌ Вы не зарегистрированы в системе.\n\nВыберите действие из меню:",
                    reply_markup=UIHelper.get_main_keyboard(False)
                )
                return
            
            async with self.api_client as client:
                all_appointments = await client.get("/appointments")
                
                if not all_appointments:
                    await message.answer(
                        "📅 У вас пока нет предстоящих записей.\n\nВыберите действие из меню:",
                        reply_markup=UIHelper.get_main_keyboard(True)
                    )
                    return
                
                # Фильтруем записи текущего клиента и будущие
                now = datetime.now()
                client_appointments = []
                
                for apt in all_appointments:
                    if apt['client_id'] == client_data['id']:
                        apt_datetime = datetime.fromisoformat(apt['datetime'].replace('Z', '+00:00'))
                        if apt_datetime.replace(tzinfo=None) > now:
                            client_appointments.append(apt)
                
                if not client_appointments:
                    await message.answer(
                        "📅 У вас пока нет предстоящих записей.\n\nВыберите действие из меню:",
                        reply_markup=UIHelper.get_main_keyboard(True)
                    )
                    return
                
                # Сортируем по дате
                client_appointments.sort(key=lambda x: x['datetime'])
                
                # Формируем сообщение
                msg = "📅 Ваши предстоящие записи:\n\n"
                
                for i, apt in enumerate(client_appointments[:5], 1):
                    apt_datetime = datetime.fromisoformat(apt['datetime'].replace('Z', '+00:00'))
                    date_display = apt_datetime.strftime("%d.%m.%Y")
                    time_display = apt_datetime.strftime("%H:%M")
                    
                    service_name = "Услуга"
                    employee_name = "Мастер"
                    
                    try:
                        if apt.get('service_id'):
                            service = await client.get(f"/services/{apt['service_id']}")
                            if service:
                                service_name = service['name']
                        
                        if apt.get('employee_id'):
                            employee = await client.get(f"/employees/{apt['employee_id']}")
                            if employee:
                                employee_name = employee['full_name']
                    except Exception:
                        pass
                    
                    status = "✅" if apt.get('is_completed') else "⏳"
                    
                    msg += f"{i}. {status} {date_display} в {time_display}\n"
                    msg += f"   💅 {service_name}\n"
                    msg += f"   👤 {employee_name}\n\n"
                
                await message.answer(msg, reply_markup=UIHelper.get_main_keyboard(True))
                
        except Exception as e:
            logger.error(f"Error getting appointments: {e}")
            await message.answer(
                "❌ Произошла ошибка.",
                reply_markup=UIHelper.get_main_keyboard(True)
            )
    
    async def check_status(self, message: Message, state: FSMContext):
        """Проверка статуса аккаунта"""
        await state.clear()
        chat_id = message.chat.id
        
        try:
            client_data = await self._get_client_by_chat_id(chat_id)
            
            if client_data:
                text = (f"📋 Информация о вашем аккаунте:\n\n"
                       f"👤 Имя: {client_data['full_name']}\n"
                       f"📱 Телефон: {client_data['phone']}\n"
                       f"📧 Email: {client_data.get('email', 'Не указан')}\n")
                await message.answer(text, reply_markup=UIHelper.get_main_keyboard(True))
            else:
                await message.answer(
                    "❌ Ваш аккаунт не найден.\n\nВыберите действие из меню:",
                    reply_markup=UIHelper.get_main_keyboard(False)
                )
        except Exception as e:
            logger.error(f"Error checking status: {e}")
            await message.answer(
                "❌ Ошибка при проверке статуса аккаунта.",
                reply_markup=UIHelper.get_main_keyboard(True)
            )
    
    async def handle_unknown_message(self, message: Message, state: FSMContext):
        """Обработчик неизвестных сообщений"""
        await state.clear()
        text = message.text.lower()
        chat_id = message.chat.id
        
        is_registered = await self._check_registration(chat_id)
        
        if any(word in text for word in ['записаться', 'запись', 'записать']):
            if is_registered:
                await message.answer(
                    "Хотите записаться на услугу? Нажмите кнопку ниже:",
                    reply_markup=UIHelper.get_main_keyboard(True)
                )
            else:
                await message.answer(
                    "Для записи необходимо сначала зарегистрироваться:",
                    reply_markup=UIHelper.get_main_keyboard(False)
                )
        elif any(word in text for word in ['помощь', 'help', 'команды']):
            await self.cmd_help(message, state)
        else:
            await message.answer(
                "Выберите действие из меню:",
                reply_markup=UIHelper.get_main_keyboard(is_registered)
            )
    
    async def run(self):
        """Запуск бота"""
        logger.info("Starting Beauty Room Telegram Bot with aiogram v3...")
        await self.dp.start_polling(self.bot)

# Основная функция
async def main():
    if config.bot_token == 'YOUR_BOT_TOKEN_HERE':
        print("Пожалуйста, установите TELEGRAM_BOT_TOKEN в переменных окружения")
        return
    
    bot = BeautyRoomBot()
    await bot.run()

if __name__ == '__main__':
    asyncio.run(main())
import os
import re
import requests
from datetime import datetime, timedelta, date
from dotenv import load_dotenv
from telegram import Update, ReplyKeyboardMarkup, ReplyKeyboardRemove, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, ConversationHandler, CallbackQueryHandler
import logging
import pytz

# Загрузка переменных окружения из .env файла
load_dotenv()

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO
)
logger = logging.getLogger(__name__)

# Конфигурация
BOT_TOKEN = os.environ.get('MASTER_BOT_TOKEN', 'YOUR_MASTER_BOT_TOKEN_HERE')
API_BASE_URL = os.environ.get('API_BASE_URL', 'http://localhost:5000')
TIMEZONE = pytz.timezone('Europe/Moscow')  # Временная зона салона

# Состояния для ConversationHandler авторизации
WAITING_PHONE, WAITING_PASSWORD, AUTHORIZED = range(3)

# Состояния для просмотра расписания
CHOOSING_DATE, VIEWING_SCHEDULE = range(2)

class MasterBot:
    def __init__(self):
        self.application = Application.builder().token(BOT_TOKEN).build()
        self.user_data = {}  # Временное хранение данных пользователей
        self.setup_handlers()
    
    def setup_handlers(self):
        """Настройка обработчиков команд"""
        # Conversation handler для авторизации
        auth_handler = ConversationHandler(
            entry_points=[CommandHandler('start', self.start)],
            states={
                WAITING_PHONE: [MessageHandler(filters.TEXT & ~filters.COMMAND, self.get_phone)],
                WAITING_PASSWORD: [MessageHandler(filters.TEXT & ~filters.COMMAND, self.get_password)],
            },
            fallbacks=[CommandHandler('cancel', self.cancel_auth)]
        )
        
        # Обработчики для авторизованных пользователей
        self.application.add_handler(auth_handler)
        self.application.add_handler(CommandHandler('schedule', self.show_schedule_dates))
        self.application.add_handler(CommandHandler('today', self.show_today_schedule))
        self.application.add_handler(CommandHandler('tomorrow', self.show_tomorrow_schedule))
        self.application.add_handler(CommandHandler('help', self.help_command))
        self.application.add_handler(CallbackQueryHandler(self.handle_callback))
        self.application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message))
    
    def get_master_keyboard(self, is_authorized=False):
        """Возвращает клавиатуру в зависимости от статуса авторизации"""
        if is_authorized:
            keyboard = [
                ['📅 Расписание на сегодня', '📅 Расписание на завтра'],
                ['📆 Выбрать дату', '❓ Помощь']
            ]
        else:
            keyboard = [['❓ Помощь']]
        
        return ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
    
    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Начало работы с ботом и авторизация"""
        chat_id = update.effective_chat.id
        user = update.effective_user
        
        # Проверяем, авторизован ли уже мастер
        try:
            response = requests.get(
                f"{API_BASE_URL}/api/telegram/master/{chat_id}",
                timeout=10
            )
            
            if response.status_code == 200:
                master_data = response.json()
                await update.message.reply_text(
                    f"Здравствуйте, {master_data['full_name']}! Вы уже авторизованы.\n\n"
                    f"Используйте команды для просмотра расписания:",
                    reply_markup=self.get_master_keyboard(is_authorized=True)
                )
                return ConversationHandler.END
                
        except Exception as e:
            logger.error(f"Error checking master status: {e}")
        
        # Инициализируем данные пользователя
        self.user_data[chat_id] = {}
        
        await update.message.reply_text(
            f"Здравствуйте, {user.first_name}! 👋\n\n"
            f"Для авторизации в системе Beauty Room, пожалуйста, введите ваш номер телефона в любом формате:",
            reply_markup=ReplyKeyboardRemove()
        )
        
        return WAITING_PHONE
    
    async def get_phone(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Получение и валидация номера телефона"""
        chat_id = update.effective_chat.id
        phone_input = update.message.text.strip()
        
        normalized_phone = self.normalize_phone(phone_input)
        
        if not normalized_phone:
            await update.message.reply_text(
                "❌ Неверный формат номера телефона.\n\n"
                "Пожалуйста, введите номер в одном из форматов:\n"
                "• +79123456789\n"
                "• 89123456789\n"
                "• 9123456789"
            )
            return WAITING_PHONE
        
        self.user_data[chat_id]['phone'] = normalized_phone
        
        await update.message.reply_text(
            "Теперь введите ваш пароль:"
        )
        
        return WAITING_PASSWORD
    
    async def get_password(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Проверка пароля и авторизация"""
        chat_id = update.effective_chat.id
        password = update.message.text.strip()
        
        if chat_id not in self.user_data:
            await update.message.reply_text(
                "❌ Сессия истекла. Пожалуйста, начните заново с команды /start",
                reply_markup=self.get_master_keyboard(is_authorized=False)
            )
            return ConversationHandler.END
        
        phone = self.user_data[chat_id]['phone']
        
        # Удаляем сообщение с паролем из соображений безопасности
        try:
            await update.message.delete()
        except:
            pass  # Игнорируем ошибки удаления
        
        try:
            # Проверяем авторизацию мастера
            auth_data = {
                'phone': phone,
                'password': password,
                'telegram_chat_id': chat_id
            }
            
            response = requests.post(
                f"{API_BASE_URL}/api/telegram/master/auth",
                json=auth_data,
                timeout=15
            )
            
            if response.status_code == 200:
                response_data = response.json()
                master_data = response_data.get('master', response_data)
                
                specialization = ""
                if 'specialization' in master_data and master_data['specialization']:
                    specialization = f"\n👩‍💼 Специализация: {master_data['specialization']['name']}"
                
                qualification = ""
                if 'qualification' in master_data and master_data['qualification']:
                    qualification = f"\n🏆 Квалификация: {master_data['qualification']['name']}"
                
                await update.message.reply_text(
                    f"✅ Авторизация успешна!\n\n"
                    f"Добро пожаловать, {master_data['full_name']}!{specialization}{qualification}\n\n"
                    f"Теперь вы можете просматривать ваше расписание и записи клиентов.",
                    reply_markup=self.get_master_keyboard(is_authorized=True)
                )
                
                # Очищаем временные данные
                if chat_id in self.user_data:
                    del self.user_data[chat_id]
                
                return ConversationHandler.END
                
            else:
                error_data = response.json() if response.content else {}
                error_message = error_data.get('error', 'Неверный номер телефона или пароль')
                
                # Специальные сообщения для конкретных ошибок
                if 'already linked to another master' in error_message:
                    await update.message.reply_text(
                        f"❌ Этот Telegram аккаунт уже привязан к другому мастеру: {error_data.get('linked_master', 'неизвестно')}\n\n"
                        f"Обратитесь к администратору для решения проблемы.",
                        reply_markup=self.get_master_keyboard(is_authorized=False)
                    )
                    return ConversationHandler.END
                elif 'already linked to another Telegram account' in error_message:
                    await update.message.reply_text(
                        f"❌ Ваш аккаунт уже привязан к другому Telegram.\n\n"
                        f"Обратитесь к администратору для отвязки старого аккаунта.",
                        reply_markup=self.get_master_keyboard(is_authorized=False)
                    )
                    return ConversationHandler.END
                elif 'Master not found' in error_message:
                    await update.message.reply_text(
                        f"❌ Мастер с номером {phone} не найден в системе.\n\n"
                        f"Убедитесь, что вы вводите номер телефона, зарегистрированный в системе как сотрудник.\n"
                        f"Обратитесь к администратору, если проблема не решается.",
                        reply_markup=self.get_master_keyboard(is_authorized=False)
                    )
                    return ConversationHandler.END
                elif 'Invalid password' in error_message:
                    await update.message.reply_text(
                        f"❌ Неверный пароль.\n\n"
                        f"Пожалуйста, введите правильный пароль или используйте /cancel для отмены:"
                    )
                    return WAITING_PASSWORD
                else:
                    await update.message.reply_text(
                        f"❌ Ошибка авторизации: {error_message}\n\n"
                        f"Попробуйте снова или используйте /cancel для отмены."
                    )
                    return WAITING_PHONE
                    
        except requests.exceptions.Timeout:
            await update.message.reply_text(
                "❌ Превышено время ожидания ответа сервера. Попробуйте позже.",
                reply_markup=self.get_master_keyboard(is_authorized=False)
            )
            return ConversationHandler.END
        except requests.exceptions.ConnectionError:
            await update.message.reply_text(
                "❌ Ошибка соединения с сервером. Проверьте интернет-соединение.",
                reply_markup=self.get_master_keyboard(is_authorized=False)
            )
            return ConversationHandler.END
        except Exception as e:
            logger.error(f"Error during master authentication: {e}")
            await update.message.reply_text(
                "❌ Произошла неожиданная ошибка. Пожалуйста, попробуйте позже.",
                reply_markup=self.get_master_keyboard(is_authorized=False)
            )
            return ConversationHandler.END
    
    async def cancel_auth(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Отмена авторизации"""
        chat_id = update.effective_chat.id
        
        if chat_id in self.user_data:
            del self.user_data[chat_id]
        
        await update.message.reply_text(
            "Авторизация отменена. Используйте /start для повторной попытки.",
            reply_markup=self.get_master_keyboard(is_authorized=False)
        )
        
        return ConversationHandler.END
    
    async def get_working_days(self, master_id, start_date, end_date):
        """Получить рабочие дни сотрудника за период"""
        try:
            # Получаем все расписания сотрудника
            response = requests.get(
                f"{API_BASE_URL}/api/schedules",
                timeout=10
            )
            
            if response.status_code != 200:
                logger.error(f"Failed to get schedules: {response.status_code}")
                return []
            
            all_schedules = response.json()
            # Фильтруем расписания для нашего мастера
            schedules = [s for s in all_schedules if s.get('employee_id') == master_id]
            
            if not schedules:
                logger.warning(f"No schedules found for master {master_id}")
                return []
            
            working_days = []
            current_date = start_date
            
            while current_date <= end_date:
                is_working_day = False
                
                # Проверяем каждое расписание
                for schedule in schedules:
                    schedule_date = schedule.get('date')
                    
                    if schedule_date:
                        # Если указана конкретная дата
                        if schedule_date == current_date.strftime('%Y-%m-%d'):
                            if schedule.get('start_time') and schedule.get('end_time'):
                                is_working_day = True
                                break
                    else:
                        # Если это регулярное расписание по дням недели
                        weekday = current_date.weekday()  # 0=Понедельник, 6=Воскресенье
                        schedule_weekday = schedule.get('weekday')
                        
                        if schedule_weekday is not None:
                            # Приводим к одному формату (0=Понедельник, 6=Воскресенье)
                            # Если в API воскресенье = 0, а понедельник = 1, то:
                            if schedule_weekday == 0:  # Воскресенье в API
                                api_weekday = 6  # Воскресенье в Python
                            else:  # Понедельник-Суббота в API (1-6)
                                api_weekday = schedule_weekday - 1  # Приводим к Python формату (0-5)
                            
                            if api_weekday == weekday:
                                if schedule.get('start_time') and schedule.get('end_time'):
                                    is_working_day = True
                                    break
                
                if is_working_day:
                    # Проверяем исключения в расписании
                    try:
                        exceptions_response = requests.get(
                            f"{API_BASE_URL}/api/schedule_exceptions",
                            timeout=10
                        )
                        
                        has_exception = False
                        if exceptions_response.status_code == 200:
                            all_exceptions = exceptions_response.json()
                            # Фильтруем исключения для нашего мастера и даты
                            for exception in all_exceptions:
                                if (exception.get('employee_id') == master_id and 
                                    exception.get('date') == current_date.strftime('%Y-%m-%d')):
                                    has_exception = True
                                    break
                        
                        if not has_exception:
                            working_days.append(current_date)
                    except Exception as e:
                        logger.error(f"Error checking exceptions: {e}")
                        # Если не удалось проверить исключения, все равно добавляем день
                        working_days.append(current_date)
                
                current_date += timedelta(days=1)
            
            logger.info(f"Found {len(working_days)} working days for master {master_id}")
            return working_days
            
        except Exception as e:
            logger.error(f"Error getting working days: {e}")
            return []
    
    async def show_schedule_dates(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Показать календарь для выбора даты (только рабочие дни)"""
        chat_id = update.effective_chat.id
        
        # Проверяем авторизацию и получаем данные мастера
        master_data = await self.get_master_data(update, chat_id)
        if not master_data:
            return
        
        master_id = master_data['id']
        
        # Получаем рабочие дни на ближайшие 14 дней
        today = datetime.now(TIMEZONE).date()
        end_date = today + timedelta(days=13)
        
        working_days = await self.get_working_days(master_id, today, end_date)
        
        if not working_days:
            await update.message.reply_text(
                "📅 На ближайшие 14 дней не найдено рабочих дней.\n"
                "Обратитесь к администратору для настройки расписания.",
                reply_markup=self.get_master_keyboard(is_authorized=True)
            )
            return
        
        # Создаем календарь только для рабочих дней
        keyboard = []
        row = []
        
        for working_date in working_days[:14]:  # Максимум 14 дней
            date_str = working_date.strftime("%d.%m.%Y")
            display_str = working_date.strftime("%d.%m")
            
            # Добавляем день недели для удобства
            weekday_names = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
            weekday = weekday_names[working_date.weekday()]
            display_str = f"{display_str} ({weekday})"
            
            callback_data = f"date_{date_str}"
            row.append(InlineKeyboardButton(display_str, callback_data=callback_data))
            
            if len(row) == 2:  # По 2 кнопки в ряду для лучшего отображения
                keyboard.append(row)
                row = []
        
        # Добавляем последний ряд, если есть
        if row:
            keyboard.append(row)
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            "📆 Выберите рабочий день для просмотра расписания:",
            reply_markup=reply_markup
        )
    
    async def show_today_schedule(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Показать расписание на сегодня"""
        chat_id = update.effective_chat.id
        
        # Проверяем авторизацию и получаем данные мастера
        master_data = await self.get_master_data(update, chat_id)
        if not master_data:
            return
        
        today = datetime.now(TIMEZONE).date()
        await self.fetch_and_show_schedule(update, master_data, today)
    
    async def show_tomorrow_schedule(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Показать расписание на завтра"""
        chat_id = update.effective_chat.id
        
        # Проверяем авторизацию и получаем данные мастера
        master_data = await self.get_master_data(update, chat_id)
        if not master_data:
            return
        
        tomorrow = datetime.now(TIMEZONE).date() + timedelta(days=1)
        await self.fetch_and_show_schedule(update, master_data, tomorrow)
    
    async def get_master_data(self, update, chat_id):
        """Получить данные мастера с проверкой авторизации"""
        try:
            response = requests.get(
                f"{API_BASE_URL}/api/telegram/master/{chat_id}",
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                await update.message.reply_text(
                    "❌ Не удалось получить данные о мастере. Пожалуйста, авторизуйтесь снова командой /start",
                    reply_markup=self.get_master_keyboard(is_authorized=False)
                )
                return None
                
        except Exception as e:
            logger.error(f"Error getting master data: {e}")
            await update.message.reply_text(
                "❌ Ошибка при получении данных мастера. Попробуйте позже.",
                reply_markup=self.get_master_keyboard(is_authorized=False)
            )
            return None
    
    async def fetch_and_show_schedule(self, update, master_data, selected_date):
        """Получить и показать расписание на выбранную дату"""
        try:
            master_id = master_data['id']
            master_name = master_data['full_name']
            date_str = selected_date.strftime("%Y-%m-%d")
            
            # Получаем все записи и фильтруем по мастеру и дате
            appointments_response = requests.get(
                f"{API_BASE_URL}/api/appointments",
                timeout=10
            )
            
            appointments_data = []
            if appointments_response.status_code == 200:
                all_appointments = appointments_response.json()
                # Фильтруем записи по мастеру и дате
                for appointment in all_appointments:
                    if appointment.get('employee_id') == master_id:
                        # Улучшенный парсинг datetime
                        datetime_str = appointment.get('datetime', '')
                        
                        try:
                            # Пробуем разные форматы
                            appointment_date = None
                            
                            # Формат 1: ISO с T и секундами (2024-05-25T14:30:00)
                            if 'T' in datetime_str and not datetime_str.endswith('Z'):
                                try:
                                    appointment_dt = datetime.strptime(datetime_str, "%Y-%m-%dT%H:%M:%S")
                                    appointment_date = appointment_dt.strftime("%Y-%m-%d")
                                except:
                                    pass
                            
                            # Формат 2: ISO с T, секундами и Z (2024-05-25T14:30:00Z)
                            if not appointment_date and datetime_str.endswith('Z'):
                                try:
                                    appointment_dt = datetime.strptime(datetime_str[:-1], "%Y-%m-%dT%H:%M:%S")
                                    appointment_date = appointment_dt.strftime("%Y-%m-%d")
                                except:
                                    pass
                            
                            # Формат 3: Простой с пробелом (2024-05-25 14:30:00)
                            if not appointment_date and ' ' in datetime_str:
                                try:
                                    appointment_dt = datetime.strptime(datetime_str, "%Y-%m-%d %H:%M:%S")
                                    appointment_date = appointment_dt.strftime("%Y-%m-%d")
                                except:
                                    pass
                            
                            # Формат 4: ISO полный с timezone
                            if not appointment_date:
                                try:
                                    appointment_dt = datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
                                    appointment_date = appointment_dt.strftime("%Y-%m-%d")
                                except:
                                    pass
                            
                            # Формат 5: Простой fallback - берем первые 10 символов
                            if not appointment_date:
                                appointment_date = datetime_str[:10]
                            
                            # Сравниваем с выбранной датой
                            if appointment_date == date_str:
                                appointments_data.append(appointment)
                                logger.info(f"Found appointment for {date_str}: {appointment}")
                                
                        except Exception as e:
                            logger.error(f"Error parsing appointment datetime '{datetime_str}': {e}")
                            # Fallback - пробуем старый метод
                            if datetime_str[:10] == date_str:
                                appointments_data.append(appointment)
            else:
                logger.error(f"Failed to get appointments: {appointments_response.status_code}")
            
            # Получаем дополнительные данные
            clients_dict = {}
            services_dict = {}
            complexes_dict = {}
            client_preferences = {}
            client_statuses = {}
            
            if appointments_data:
                # Получаем всех клиентов
                try:
                    clients_response = requests.get(f"{API_BASE_URL}/api/clients", timeout=10)
                    if clients_response.status_code == 200:
                        all_clients = clients_response.json()
                        clients_dict = {client['id']: client for client in all_clients}
                except Exception as e:
                    logger.error(f"Error getting clients: {e}")
                
                # Получаем все услуги
                try:
                    services_response = requests.get(f"{API_BASE_URL}/api/services", timeout=10)
                    if services_response.status_code == 200:
                        all_services = services_response.json()
                        services_dict = {service['id']: service for service in all_services}
                except Exception as e:
                    logger.error(f"Error getting services: {e}")
                
                # Получаем все комплексы
                try:
                    complexes_response = requests.get(f"{API_BASE_URL}/api/service_complexes", timeout=10)
                    if complexes_response.status_code == 200:
                        all_complexes = complexes_response.json()
                        complexes_dict = {complex_item['id']: complex_item for complex_item in all_complexes}
                except Exception as e:
                    logger.error(f"Error getting service complexes: {e}")
                
                # Получаем предпочтения клиентов
                try:
                    preferences_response = requests.get(f"{API_BASE_URL}/api/client_preferences", timeout=10)
                    if preferences_response.status_code == 200:
                        all_preferences = preferences_response.json()
                        client_preferences = {pref['client_id']: pref for pref in all_preferences}
                        logger.info(f"Loaded {len(client_preferences)} client preferences")
                except Exception as e:
                    logger.error(f"Error getting client preferences: {e}")
                
                # Получаем статусы клиентов - пробуем разные эндпоинты
                try:
                    # Сначала пробуем основной эндпоинт
                    statuses_response = requests.get(f"{API_BASE_URL}/api/client_statuses", timeout=10)
                    logger.info(f"client_statuses endpoint response: {statuses_response.status_code}")
                    
                    if statuses_response.status_code == 404:
                        # Если не найден, пробуем альтернативные варианты
                        logger.info("Trying alternative endpoints for client statuses")
                        
                        # Пробуем разные варианты названий
                        alt_endpoints = [
                            "clientstatuses", 
                            "client-statuses",
                            "statuses",
                            "client_status"
                        ]
                        
                        for endpoint in alt_endpoints:
                            try:
                                alt_response = requests.get(f"{API_BASE_URL}/api/{endpoint}", timeout=5)
                                logger.info(f"Endpoint /api/{endpoint}: {alt_response.status_code}")
                                if alt_response.status_code == 200:
                                    statuses_response = alt_response
                                    break
                            except:
                                continue
                    
                    if statuses_response.status_code == 200:
                        all_statuses = statuses_response.json()
                        if all_statuses:
                            client_statuses = {status['id']: status for status in all_statuses}
                            logger.info(f"Loaded {len(client_statuses)} client statuses: {list(client_statuses.keys())}")
                            # Логируем первые несколько статусов для отладки
                            for i, (status_id, status) in enumerate(client_statuses.items()):
                                if i < 3:  # Первые 3 статуса
                                    logger.info(f"Status {status_id} (type: {type(status_id)}): {status}")
                        else:
                            logger.warning("Client statuses response is empty")
                    else:
                        logger.error(f"Failed to get client statuses from all endpoints: {statuses_response.status_code}")
                        if statuses_response.text:
                            logger.error(f"Response: {statuses_response.text[:200]}")
                        
                        # Создаем базовые статусы как fallback
                        client_statuses = {
                            1: {"id": 1, "name": "Обычный"},
                            2: {"id": 2, "name": "VIP"},
                            3: {"id": 3, "name": "Постоянный"},
                            9: {"id": 9, "name": "Особый"}  # Добавляем статус с ID 9, который был в примере
                        }
                        logger.info("Using fallback client statuses")
                        
                except Exception as e:
                    logger.error(f"Error getting client statuses: {e}")
                    # Fallback статусы
                    client_statuses = {
                        1: {"id": 1, "name": "Обычный"},
                        2: {"id": 2, "name": "VIP"},
                        3: {"id": 3, "name": "Постоянный"},
                        9: {"id": 9, "name": "Особый"}
                    }
            
            # Получаем все расписания и фильтруем по мастеру
            schedule_response = requests.get(
                f"{API_BASE_URL}/api/schedules",
                timeout=10
            )
            
            # Формируем сообщение с расписанием и записями
            weekday_names = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье']
            weekday = weekday_names[selected_date.weekday()]
            
            message = f"📅 Расписание {master_name}\n"
            message += f"на {selected_date.strftime('%d.%m.%Y')} ({weekday}):\n\n"
            
            # Проверяем рабочие часы мастера
            working_hours_found = False
            if schedule_response.status_code == 200:
                all_schedules = schedule_response.json()
                # Фильтруем расписания для нашего мастера
                master_schedules = [s for s in all_schedules if s.get('employee_id') == master_id]
                
                for schedule in master_schedules:
                    schedule_date = schedule.get('date')
                    
                    # Проверяем точную дату
                    if schedule_date and schedule_date == date_str:
                        start_time = schedule.get('start_time', '')[:5] if schedule.get('start_time') else "Не указано"
                        end_time = schedule.get('end_time', '')[:5] if schedule.get('end_time') else "Не указано"
                        message += f"🕒 Рабочие часы: {start_time} - {end_time}\n"
                        working_hours_found = True
                        break
                    # Проверяем регулярное расписание по дням недели
                    elif not schedule_date:
                        weekday_num = selected_date.weekday()
                        schedule_weekday = schedule.get('weekday')
                        
                        if schedule_weekday is not None:
                            # Приводим к одному формату
                            if schedule_weekday == 0:  # Воскресенье в API
                                api_weekday = 6
                            else:
                                api_weekday = schedule_weekday - 1
                            
                            if api_weekday == weekday_num:
                                start_time = schedule.get('start_time', '')[:5] if schedule.get('start_time') else "Не указано"
                                end_time = schedule.get('end_time', '')[:5] if schedule.get('end_time') else "Не указано"
                                message += f"🕒 Рабочие часы: {start_time} - {end_time}\n"
                                working_hours_found = True
                                break
            
            if not working_hours_found:
                message += "🕒 Рабочие часы: не указаны или выходной день\n"
            
            # Проверяем исключения в расписании
            try:
                exceptions_response = requests.get(
                    f"{API_BASE_URL}/api/schedule_exceptions",
                    timeout=10
                )
                
                if exceptions_response.status_code == 200:
                    all_exceptions = exceptions_response.json()
                    for exception in all_exceptions:
                        if (exception.get('employee_id') == master_id and 
                            exception.get('date') == date_str):
                            exception_type = exception.get('exception_type', 'исключение')
                            reason = exception.get('reason', '')
                            message += f"⚠️ {exception_type.capitalize()}"
                            if reason:
                                message += f": {reason}"
                            message += "\n"
            except Exception as e:
                logger.error(f"Error getting exceptions: {e}")
            
            message += "\n📋 Записи клиентов:\n\n"
            
            if not appointments_data:
                message += "📭 На эту дату нет записей.\n"
            else:
                # Сортируем записи по времени
                appointments_data.sort(key=lambda x: x.get('datetime', ''))
                
                for idx, appointment in enumerate(appointments_data, 1):
                    client_id = appointment.get('client_id')
                    service_id = appointment.get('service_id')
                    complex_id = appointment.get('complex_id')
                    
                    logger.info(f"Processing appointment {idx}: client_id={client_id}, service_id={service_id}, complex_id={complex_id}")
                    
                    # Получаем информацию о клиенте
                    client_name = "Клиент не указан"
                    if client_id and client_id in clients_dict:
                        client_data = clients_dict[client_id]
                        client_name = client_data.get('full_name', 'Имя не указано')
                        logger.info(f"Found client: {client_name}")
                    elif client_id:
                        logger.warning(f"Client {client_id} not found in clients_dict")
                    
                    # Получаем информацию об услуге/комплексе
                    service_name = "Услуга не указана"
                    duration = 60  # По умолчанию
                    
                    if service_id and service_id in services_dict:
                        service_data = services_dict[service_id]
                        service_name = service_data.get('name', 'Услуга не указана')
                        duration = service_data.get('duration', 60)
                        logger.info(f"Found service: {service_name}")
                    elif complex_id and complex_id in complexes_dict:
                        complex_data = complexes_dict[complex_id]
                        service_name = f"Комплекс: {complex_data.get('name', 'Комплекс не указан')}"
                        duration = complex_data.get('duration', 60)
                        logger.info(f"Found complex: {service_name}")
                    elif service_id:
                        logger.warning(f"Service {service_id} not found in services_dict")
                    elif complex_id:
                        logger.warning(f"Complex {complex_id} not found in complexes_dict")
                    
                    # Пользовательская продолжительность имеет приоритет
                    if appointment.get('custom_duration'):
                        duration = appointment['custom_duration']
                    
                    appointment_time = "Не указано"
                    end_time = "Не указано"
                    
                    if appointment.get('datetime'):
                        try:
                            # Обрабатываем разные форматы даты
                            dt_str = appointment['datetime']
                            if dt_str.endswith('Z'):
                                dt_str = dt_str[:-1] + '+00:00'
                            
                            appointment_datetime = datetime.fromisoformat(dt_str)
                            
                            # Конвертируем в локальное время
                            if appointment_datetime.tzinfo:
                                appointment_datetime = appointment_datetime.astimezone(TIMEZONE)
                            else:
                                appointment_datetime = TIMEZONE.localize(appointment_datetime)
                            
                            appointment_time = appointment_datetime.strftime("%H:%M")
                            end_datetime = appointment_datetime + timedelta(minutes=duration)
                            end_time = end_datetime.strftime("%H:%M")
                        except Exception as e:
                            logger.error(f"Error parsing datetime: {e}")
                    
                    # Определяем статус записи
                    appointment_status = appointment.get('status', 'created').lower()
                    status_icons = {
                        'created': '🆕 Создана',
                        'confirmed': '✅ Подтверждена', 
                        'completed': '🏁 Завершена',
                        'cancelled': '❌ Отменена'
                    }
                    
                    # Если запись завершена, проверяем флаг is_completed
                    if appointment.get('is_completed'):
                        status_display = '🏁 Завершена'
                    else:
                        status_display = status_icons.get(appointment_status, f'❓ {appointment_status.capitalize()}')
                    
                    paid = "💰 Оплачена" if appointment.get('is_paid') else "💸 Не оплачена"
                    
                    final_price = appointment.get('final_price')
                    if final_price:
                        price_str = f"{final_price} руб."
                    else:
                        price_str = "Не указана"
                    
                    message += f"{idx}. 🕒 {appointment_time}-{end_time} ({duration} мин)\n"
                    message += f"👤 {client_name}\n"
                    message += f"💇‍♀️ {service_name}\n"
                    message += f"💲 Стоимость: {price_str}\n"
                    message += f"📊 {status_display}, {paid}\n"
                    
                    # Добавляем информацию о статусе клиента и предпочтениях
                    if client_id:
                        # Ищем предпочтения клиента
                        client_pref = client_preferences.get(client_id)
                        if client_pref:
                            logger.info(f"Found client preferences for client {client_id}: {client_pref}")
                            
                            # Отображаем статус клиента
                            client_status_id = client_pref.get('client_status_id')
                            if client_status_id:
                                logger.info(f"Looking for status ID {client_status_id} in available statuses: {list(client_statuses.keys())}")
                                if client_status_id in client_statuses:
                                    status_name = client_statuses[client_status_id].get('name', 'Неизвестный статус')
                                    message += f"🏷️ Статус клиента: {status_name}\n"
                                    logger.info(f"Client status: {status_name}")
                                else:
                                    # Попробуем найти статус по-другому - возможно API возвращает строку вместо числа
                                    found_status = None
                                    for status_key, status_data in client_statuses.items():
                                        if str(status_key) == str(client_status_id):
                                            found_status = status_data
                                            break
                                    
                                    if found_status:
                                        status_name = found_status.get('name', 'Неизвестный статус')
                                        message += f"🏷️ Статус клиента: {status_name}\n"
                                        logger.info(f"Client status (string match): {status_name}")
                                    else:
                                        message += f"🏷️ Статус клиента: Статус #{client_status_id} (не найден)\n"
                                        logger.warning(f"Client status {client_status_id} (type: {type(client_status_id)}) not found in statuses")
                            else:
                                logger.info(f"No client_status_id found in preferences")
                            
                            # Отображаем предпочтения/заметки клиента
                            preferences = client_pref.get('preferences', '').strip()
                            if preferences:
                                message += f"📋 Заметки по клиенту: {preferences}\n"
                                logger.info(f"Client preferences: {preferences}")
                        else:
                            logger.info(f"No preferences found for client {client_id}")
                    
                    # Добавляем заметки по записи
                    appointment_notes = appointment.get('notes', '').strip()
                    if appointment_notes:
                        message += f"📝 Заметки к записи: {appointment_notes}\n"
                    
                    message += "\n"
            
            # Разбиваем длинные сообщения
            if len(message) > 4000:
                parts = self.split_long_message(message)
                for i, part in enumerate(parts):
                    keyboard = self.get_master_keyboard(is_authorized=True) if i == len(parts) - 1 else None
                    await update.message.reply_text(part, reply_markup=keyboard)
            else:
                await update.message.reply_text(
                    message,
                    reply_markup=self.get_master_keyboard(is_authorized=True)
                )
                
        except Exception as e:
            logger.error(f"Error fetching schedule: {e}")
            await update.message.reply_text(
                f"❌ Произошла ошибка при получении расписания на {selected_date.strftime('%d.%m.%Y')}.\n"
                f"Попробуйте позже или обратитесь к администратору.",
                reply_markup=self.get_master_keyboard(is_authorized=True)
            )
    
    def split_long_message(self, message):
        """Разбивает длинное сообщение на части"""
        parts = []
        lines = message.split('\n')
        current_part = ""
        
        for line in lines:
            if len(current_part + line + '\n') > 4000:
                if current_part:
                    parts.append(current_part.rstrip())
                current_part = line + '\n'
            else:
                current_part += line + '\n'
        
        if current_part:
            parts.append(current_part.rstrip())
        
        return parts if parts else [message]
    
    def format_phone_display(self, phone):
        """Форматирует телефон для красивого отображения"""
        if not phone:
            return ""
        
        # Убираем все нецифровые символы
        digits = re.sub(r'\D', '', phone)
        
        if len(digits) == 11 and digits.startswith('7'):
            return f"+7 ({digits[1:4]}) {digits[4:7]}-{digits[7:9]}-{digits[9:11]}"
        elif len(digits) == 10:
            return f"+7 ({digits[0:3]}) {digits[3:6]}-{digits[6:8]}-{digits[8:10]}"
        
        return phone
    
    async def handle_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработка callback-запросов от инлайн-кнопок"""
        query = update.callback_query
        await query.answer()
        
        chat_id = query.message.chat_id
        callback_data = query.data
        
        # Обработка выбора даты
        if callback_data.startswith("date_"):
            date_str = callback_data.replace("date_", "")
            selected_date = datetime.strptime(date_str, "%d.%m.%Y").date()
            
            # Получаем данные мастера
            master_data = await self.get_master_data(query, chat_id)
            if not master_data:
                return
            
            await self.fetch_and_show_schedule(query, master_data, selected_date)
    
    async def check_master_auth(self, update, chat_id):
        """Проверка авторизации мастера"""
        try:
            response = requests.get(
                f"{API_BASE_URL}/api/telegram/master/{chat_id}",
                timeout=10
            )
            
            if response.status_code == 200:
                return True
            else:
                await update.message.reply_text(
                    "❌ Вы не авторизованы. Пожалуйста, используйте /start для авторизации.",
                    reply_markup=self.get_master_keyboard(is_authorized=False)
                )
                return False
                
        except Exception as e:
            logger.error(f"Error checking master auth: {e}")
            await update.message.reply_text(
                "❌ Ошибка проверки авторизации. Пожалуйста, используйте /start для авторизации.",
                reply_markup=self.get_master_keyboard(is_authorized=False)
            )
            return False
    
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Показать справку по командам"""
        chat_id = update.effective_chat.id
        
        # Проверяем, авторизован ли мастер
        is_authorized = False
        try:
            response = requests.get(f"{API_BASE_URL}/api/telegram/master/{chat_id}", timeout=10)
            if response.status_code == 200:
                is_authorized = True
        except:
            pass
        
        help_text = """🤖 О боте Beauty Room для мастеров:\n\nЯ помогу вам просматривать ваше расписание и записи клиентов.\n\n"""
        
        if is_authorized:
            help_text += """🎯 Основные возможности:\n• Просмотр расписания на любую дату\n• Просмотр записей клиентов\n• Информация о клиентах и услугах\n• Отображение только рабочих дней\n\n💇‍♀️ Доступные команды:\n/schedule - Выбрать рабочий день для просмотра расписания\n/today - Показать расписание на сегодня\n/tomorrow - Показать расписание на завтра\n/help - Получить помощь\n\n📅 Особенности:\n• Календарь показывает только ваши рабочие дни\n• Записи отфильтрованы по вашему ID\n• Учитываются исключения в расписании (отпуска, больничные)"""
        else:
            help_text += """Для начала работы используйте команду /start и пройдите авторизацию, указав ваш номер телефона и пароль."""
        
        await update.message.reply_text(
            help_text,
            reply_markup=self.get_master_keyboard(is_authorized=is_authorized)
        )
    
    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик обычных сообщений"""
        text = update.message.text.lower()
        chat_id = update.effective_chat.id
        
        # Проверяем, авторизован ли мастер
        is_authorized = False
        try:
            response = requests.get(f"{API_BASE_URL}/api/telegram/master/{chat_id}", timeout=10)
            if response.status_code == 200:
                is_authorized = True
        except:
            pass
        
        if "расписание на сегодня" in text:
            if is_authorized:
                await self.show_today_schedule(update, context)
            else:
                await update.message.reply_text(
                    "Для просмотра расписания необходимо авторизоваться. Используйте /start.",
                    reply_markup=self.get_master_keyboard(is_authorized=False)
                )
        elif "расписание на завтра" in text:
            if is_authorized:
                await self.show_tomorrow_schedule(update, context)
            else:
                await update.message.reply_text(
                    "Для просмотра расписания необходимо авторизоваться. Используйте /start.",
                    reply_markup=self.get_master_keyboard(is_authorized=False)
                )
        elif "выбрать дату" in text:
            if is_authorized:
                await self.show_schedule_dates(update, context)
            else:
                await update.message.reply_text(
                    "Для просмотра расписания необходимо авторизоваться. Используйте /start.",
                    reply_markup=self.get_master_keyboard(is_authorized=False)
                )
        elif "помощь" in text:
            await self.help_command(update, context)
        else:
            await update.message.reply_text(
                "Выберите действие из меню:",
                reply_markup=self.get_master_keyboard(is_authorized=is_authorized)
            )
    
    def normalize_phone(self, phone_input):
        """Нормализация номера телефона к формату +7XXXXXXXXXX для совместимости с базой сотрудников"""
        import re
        digits_only = re.sub(r'\D', '', phone_input)
        
        # Приводим все форматы к +7XXXXXXXXXX для сотрудников
        if digits_only.startswith('79') and len(digits_only) == 11:
            return '+' + digits_only  # 79010010101 -> +79010010101
        elif digits_only.startswith('89') and len(digits_only) == 11:
            return '+7' + digits_only[1:]  # 89010010101 -> +79010010101
        elif digits_only.startswith('9') and len(digits_only) == 10:
            return '+7' + digits_only  # 9010010101 -> +79010010101
        elif digits_only.startswith('7') and len(digits_only) == 11:
            return '+' + digits_only  # 79010010101 -> +79010010101
        elif len(digits_only) == 10 and not digits_only.startswith(('7', '8')):
            return '+7' + digits_only  # 9010010101 -> +79010010101
        elif digits_only.startswith('8') and len(digits_only) == 11:
            return '+7' + digits_only[1:]  # 89010010101 -> +79010010101
        elif len(digits_only) == 11 and digits_only.startswith('7'):
            return '+' + digits_only  # 79010010101 -> +79010010101
        
        return None
    
    def run(self):
        """Запуск бота"""
        logger.info("Starting Beauty Room Master Telegram Bot...")
        self.application.run_polling()

if __name__ == '__main__':
    if BOT_TOKEN == 'YOUR_MASTER_BOT_TOKEN_HERE':
        print("Пожалуйста, установите MASTER_BOT_TOKEN в переменных окружения")
        exit(1)
    
    bot = MasterBot()
    bot.run()
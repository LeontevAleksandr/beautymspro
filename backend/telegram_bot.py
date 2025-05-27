
import os
import re
import requests
from datetime import datetime, timedelta, time
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
BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', 'YOUR_BOT_TOKEN_HERE')
API_BASE_URL = os.environ.get('API_BASE_URL', 'http://localhost:5000')
TIMEZONE = pytz.timezone('Europe/Moscow')  # Временная зона салона

# Состояния для ConversationHandler регистрации
WAITING_NAME, WAITING_PHONE, CONFIRMING_DATA = range(3)

# Состояния для ConversationHandler записи
(CHOOSING_SPECIALIZATION, CHOOSING_SERVICE, CHOOSING_EMPLOYEE, 
 CHOOSING_DATE, CHOOSING_TIME, CONFIRMING_APPOINTMENT, SETTING_REMINDER) = range(7)

class BeautyRoomBot:
    def __init__(self):
        self.application = Application.builder().token(BOT_TOKEN).build()
        self.user_data = {}  # Временное хранение данных пользователей
        self.appointment_data = {}  # Временное хранение данных записи
        self.setup_handlers()
    
    def setup_handlers(self):
        """Настройка обработчиков команд"""
        # Conversation handler для регистрации
        registration_handler = ConversationHandler(
            entry_points=[
                CommandHandler('register', self.start_registration),
                MessageHandler(filters.Regex('^📝 Регистрация$'), self.start_registration)
            ],
            states={
                WAITING_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, self.get_name)],
                WAITING_PHONE: [MessageHandler(filters.TEXT & ~filters.COMMAND, self.get_phone)],
                CONFIRMING_DATA: [MessageHandler(filters.TEXT & ~filters.COMMAND, self.confirm_data)],
            },
            fallbacks=[CommandHandler('cancel', self.cancel_registration)],
            name="registration",
            persistent=False
        )
        
        # Conversation handler для записи на услугу
        appointment_handler = ConversationHandler(
            entry_points=[
                CommandHandler('book', self.start_booking),
                MessageHandler(filters.Regex('^💇‍♀️ Записаться на услугу$'), self.start_booking)
            ],
            states={
                CHOOSING_SPECIALIZATION: [CallbackQueryHandler(self.choose_specialization)],
                CHOOSING_SERVICE: [CallbackQueryHandler(self.choose_service)],
                CHOOSING_EMPLOYEE: [CallbackQueryHandler(self.choose_employee)],
                CHOOSING_DATE: [CallbackQueryHandler(self.choose_date)],
                CHOOSING_TIME: [CallbackQueryHandler(self.choose_time)],
                CONFIRMING_APPOINTMENT: [CallbackQueryHandler(self.confirm_appointment)],
                SETTING_REMINDER: [CallbackQueryHandler(self.set_reminder)],
            },
            fallbacks=[CommandHandler('cancel', self.cancel_booking)],
            name="appointment",
            persistent=False
        )
        
        # ВАЖНО: Добавляем ConversationHandler ПЕРВЫМИ
        self.application.add_handler(registration_handler)
        self.application.add_handler(appointment_handler)
        
        # Затем добавляем остальные обработчики
        self.application.add_handler(CommandHandler("start", self.start))
        self.application.add_handler(CommandHandler("help", self.help_command))
        self.application.add_handler(CommandHandler("status", self.check_status))
        self.application.add_handler(CommandHandler("my_appointments", self.my_appointments))
        
        # Обработчики кнопок меню (НЕ входящие в ConversationHandler)
        self.application.add_handler(MessageHandler(filters.Regex('^📅 Мои записи$'), self.my_appointments))
        self.application.add_handler(MessageHandler(filters.Regex('^📋 Мой профиль$'), self.check_status))
        self.application.add_handler(MessageHandler(filters.Regex('^❓ Помощь$'), self.help_command))
        
        # Обработчик обычных сообщений ДОБАВЛЯЕМ ПОСЛЕДНИМ
        self.application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message))
    
    def get_main_keyboard(self, is_registered=True):
        """Получить основную клавиатуру в зависимости от статуса регистрации"""
        if is_registered:
            keyboard = [
                ['💇‍♀️ Записаться на услугу'],
                ['📅 Мои записи', '📋 Мой профиль'],
                ['❓ Помощь']
            ]
        else:
            keyboard = [
                ['📝 Регистрация'],
                ['❓ Помощь']
            ]
        return ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
    
    def normalize_phone(self, phone):
        """Нормализация номера телефона к формату 89010010101"""
        # Удаляем все символы кроме цифр
        digits_only = re.sub(r'\D', '', phone)
        
        # Различные варианты ввода номера
        if digits_only.startswith('79') and len(digits_only) == 11:
            # +79123456789 -> 89123456789
            return '8' + digits_only[1:]
        elif digits_only.startswith('89') and len(digits_only) == 11:
            # 89123456789 -> 89123456789
            return digits_only
        elif digits_only.startswith('9') and len(digits_only) == 10:
            # 9123456789 -> 89123456789
            return '8' + digits_only
        elif len(digits_only) == 10 and not digits_only.startswith('8'):
            # 9123456789 -> 89123456789
            return '8' + digits_only
        
        return None  # Неверный формат
    
    def validate_phone(self, phone):
        """Валидация номера телефона"""
        normalized = self.normalize_phone(phone)
        if normalized and len(normalized) == 11 and normalized.startswith('8'):
            return normalized
        return None
    
    def categorize_time_slot(self, time_str):
        """Категоризация времени на утро, день, вечер"""
        hour = int(time_str.split(':')[0])
        if 6 <= hour < 12:
            return "morning"
        elif 12 <= hour < 18:
            return "afternoon"
        else:
            return "evening"
    
    def get_time_category_emoji(self, category):
        """Получение эмодзи для категории времени"""
        emojis = {
            "morning": "🌅",
            "afternoon": "☀️",
            "evening": "🌙"
        }
        return emojis.get(category, "🕐")
    
    def get_time_category_name(self, category):
        """Получение названия категории времени"""
        names = {
            "morning": "Утро",
            "afternoon": "День",
            "evening": "Вечер"
        }
        return names.get(category, "")
    
    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик команды /start"""
        chat_id = update.effective_chat.id
        user = update.effective_user
        
        # Проверяем, связан ли уже пользователь
        try:
            response = requests.get(
                f"{API_BASE_URL}/api/telegram/client/{chat_id}",
                timeout=10
            )
            
            if response.status_code == 200:
                client_data = response.json()
                welcome_message = f"""Добро пожаловать обратно, {client_data['full_name']}! 👋

Ваш аккаунт уже связан с нашей системой BeautyMSPro.

Выберите действие из меню ниже:"""
                reply_markup = self.get_main_keyboard(is_registered=True)
            else:
                welcome_message = f"""Добро пожаловать в бьюти-студию Beauty Room 38, {user.first_name}! 👋

Я помогу вам зарегистрироваться в нашей системе BeautyMSPro.

Выберите действие из меню ниже:"""
                reply_markup = self.get_main_keyboard(is_registered=False)
                
        except Exception as e:
            logger.error(f"Error checking client status: {e}")
            welcome_message = f"""Добро пожаловать в бьюти-студию Beauty Room 38, {user.first_name}! 👋

Выберите действие из меню ниже:"""
            reply_markup = self.get_main_keyboard(is_registered=False)
        
        await update.message.reply_text(welcome_message, reply_markup=reply_markup)
    
    async def start_registration(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Начало процесса регистрации"""
        chat_id = update.effective_chat.id
        
        logger.info(f"Starting registration for chat_id: {chat_id}")
        
        # Проверяем, не зарегистрирован ли уже пользователь
        try:
            response = requests.get(
                f"{API_BASE_URL}/api/telegram/client/{chat_id}",
                timeout=10
            )
            
            if response.status_code == 200:
                client_data = response.json()
                await update.message.reply_text(
                    f"Вы уже зарегистрированы как {client_data['full_name']}!\n"
                    f"Телефон: {client_data['phone']}\n\n"
                    f"Выберите действие из меню:",
                    reply_markup=self.get_main_keyboard(is_registered=True)
                )
                return ConversationHandler.END
                
        except Exception as e:
            logger.error(f"Error checking registration status: {e}")
        
        # Инициализируем данные пользователя
        self.user_data[chat_id] = {}
        
        await update.message.reply_text(
            "Давайте зарегистрируем вас в нашей системе! 📝\n\n"
            "Пожалуйста, введите ваше имя (или полное ФИО):",
            reply_markup=ReplyKeyboardRemove()
        )
        
        logger.info(f"Moving to WAITING_NAME state for chat_id: {chat_id}")
        return WAITING_NAME
    
    async def get_name(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Получение имени пользователя"""
        chat_id = update.effective_chat.id
        name = update.message.text.strip()
        
        logger.info(f"Got name '{name}' from chat_id: {chat_id}")
        
        if len(name) < 2:
            await update.message.reply_text(
                "Имя должно содержать минимум 2 символа. Попробуйте еще раз:"
            )
            return WAITING_NAME
        
        self.user_data[chat_id]['name'] = name
        
        await update.message.reply_text(
            f"Отлично, {name}! 👍\n\n"
            "Теперь введите ваш номер телефона в любом удобном формате:\n"
            "• +79123456789\n"
            "• 89123456789\n"
            "• 9123456789"
        )
        
        logger.info(f"Moving to WAITING_PHONE state for chat_id: {chat_id}")
        return WAITING_PHONE
    
    async def get_phone(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Получение и валидация номера телефона"""
        chat_id = update.effective_chat.id
        phone_input = update.message.text.strip()
        
        logger.info(f"Got phone '{phone_input}' from chat_id: {chat_id}")
        
        normalized_phone = self.validate_phone(phone_input)
        
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
        
        # Показываем данные для подтверждения
        name = self.user_data[chat_id]['name']
        
        keyboard = [['✅ Подтвердить', '❌ Отменить']]
        reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True, resize_keyboard=True)
        
        await update.message.reply_text(
            f"Проверьте введенные данные:\n\n"
            f"👤 Имя: {name}\n"
            f"📱 Телефон: {normalized_phone}\n\n"
            f"Все верно?",
            reply_markup=reply_markup
        )
        
        logger.info(f"Moving to CONFIRMING_DATA state for chat_id: {chat_id}")
        return CONFIRMING_DATA
    
    async def confirm_data(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Подтверждение данных и регистрация"""
        chat_id = update.effective_chat.id
        response_text = update.message.text.strip()
        
        logger.info(f"Got confirmation '{response_text}' from chat_id: {chat_id}")
        
        if response_text == '✅ Подтвердить':
            await self.register_or_update_client(update, context)
        elif response_text == '❌ Отменить':
            await update.message.reply_text(
                "Регистрация отменена. Выберите действие из меню:",
                reply_markup=self.get_main_keyboard(is_registered=False)
            )
            if chat_id in self.user_data:
                del self.user_data[chat_id]
            return ConversationHandler.END
        else:
            await update.message.reply_text(
                "Пожалуйста, выберите один из предложенных вариантов:"
            )
            return CONFIRMING_DATA
        
        return ConversationHandler.END
    
    async def register_or_update_client(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Регистрация нового клиента или обновление существующего"""
        chat_id = update.effective_chat.id
        user_data = self.user_data.get(chat_id, {})
        
        name = user_data.get('name')
        phone = user_data.get('phone')
        
        logger.info(f"Registering client: name='{name}', phone='{phone}', chat_id={chat_id}")
        
        try:
            # Сначала проверяем, существует ли клиент с таким номером
            clients_response = requests.get(
                f"{API_BASE_URL}/api/clients",
                timeout=10
            )
            
            if clients_response.status_code == 200:
                clients = clients_response.json()
                existing_client = None
                
                for client in clients:
                    if client['phone'] == phone:
                        existing_client = client
                        break
                
                if existing_client:
                    # Клиент существует - обновляем его данные
                    await self.update_existing_client(update, existing_client, name, chat_id)
                else:
                    # Клиент не существует - создаем нового
                    await self.create_new_client(update, name, phone, chat_id)
            else:
                await update.message.reply_text(
                    "❌ Ошибка при проверке данных клиента. Попробуйте позже.",
                    reply_markup=self.get_main_keyboard(is_registered=False)
                )
                
        except Exception as e:
            logger.error(f"Error during registration: {e}")
            await update.message.reply_text(
                "❌ Произошла ошибка при регистрации. Попробуйте позже.",
                reply_markup=self.get_main_keyboard(is_registered=False)
            )
        
        # Очищаем временные данные
        if chat_id in self.user_data:
            del self.user_data[chat_id]
    
    async def update_existing_client(self, update, existing_client, new_name, chat_id):
        """Обновление существующего клиента"""
        try:
            # Проверяем, изменилось ли имя
            name_changed = existing_client['full_name'] != new_name
            
            # Проверяем, не привязан ли уже к другому Telegram аккаунту
            if existing_client.get('telegram_chat_id') and existing_client['telegram_chat_id'] != chat_id:
                await update.message.reply_text(
                    f"❌ Клиент с номером {existing_client['phone']} уже привязан к другому Telegram аккаунту.",
                    reply_markup=self.get_main_keyboard(is_registered=False)
                )
                return
            
            # Обновляем данные клиента
            update_data = {
                'full_name': new_name,
                'phone': existing_client['phone'],
                'email': existing_client.get('email'),
                'telegram_chat_id': chat_id
            }
            
            response = requests.put(
                f"{API_BASE_URL}/api/clients/{existing_client['id']}",
                json=update_data,
                timeout=10
            )
            
            if response.status_code == 200:
                if name_changed:
                    await update.message.reply_text(
                        f"✅ Добро пожаловать, {new_name}!\n\n"
                        f"Ваш аккаунт обновлен и привязан к Telegram.\n"
                        f"Имя изменено с '{existing_client['full_name']}' на '{new_name}'.\n\n"
                        f"Выберите действие из меню:",
                        reply_markup=self.get_main_keyboard(is_registered=True)
                    )
                else:
                    await update.message.reply_text(
                        f"✅ Добро пожаловать обратно, {new_name}!\n\n"
                        f"Ваш аккаунт успешно привязан к Telegram.\n\n"
                        f"Выберите действие из меню:",
                        reply_markup=self.get_main_keyboard(is_registered=True)
                    )
            else:
                await update.message.reply_text(
                    "❌ Ошибка при обновлении данных клиента.",
                    reply_markup=self.get_main_keyboard(is_registered=False)
                )
                
        except Exception as e:
            logger.error(f"Error updating existing client: {e}")
            await update.message.reply_text(
                "❌ Ошибка при обновлении данных.",
                reply_markup=self.get_main_keyboard(is_registered=False)
            )
    
    async def create_new_client(self, update, name, phone, chat_id):
        """Создание нового клиента"""
        try:
            new_client_data = {
                'full_name': name,
                'phone': phone,
                'telegram_chat_id': chat_id
            }
            
            response = requests.post(
                f"{API_BASE_URL}/api/clients",
                json=new_client_data,
                timeout=10
            )
            
            if response.status_code == 201:
                await update.message.reply_text(
                    f"✅ Добро пожаловать в бьюти-студию Beauty Room 38, {name}!\n\n"
                    f"Ваш аккаунт создан и привязан к Telegram.\n"
                    f"Теперь вы будете получать уведомления о записях.\n\n"
                    f"Выберите действие из меню:",
                    reply_markup=self.get_main_keyboard(is_registered=True)
                )
            else:
                error_data = response.json() if response.content else {}
                await update.message.reply_text(
                    f"❌ Ошибка при создании аккаунта: {error_data.get('error', 'Неизвестная ошибка')}",
                    reply_markup=self.get_main_keyboard(is_registered=False)
                )
                
        except Exception as e:
            logger.error(f"Error creating new client: {e}")
            await update.message.reply_text(
                "❌ Ошибка при создании аккаунта.",
                reply_markup=self.get_main_keyboard(is_registered=False)
            )
    
    async def cancel_registration(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Отмена регистрации"""
        chat_id = update.effective_chat.id
        
        if chat_id in self.user_data:
            del self.user_data[chat_id]
        
        await update.message.reply_text(
            "Регистрация отменена. Выберите действие из меню:",
            reply_markup=self.get_main_keyboard(is_registered=False)
        )
        
        return ConversationHandler.END
    
    async def start_booking(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Начало процесса записи на услугу"""
        chat_id = update.effective_chat.id if update.message else update.callback_query.message.chat_id
        
        # Проверяем, зарегистрирован ли пользователь
        try:
            response = requests.get(
                f"{API_BASE_URL}/api/telegram/client/{chat_id}",
                timeout=10
            )
            
            if response.status_code != 200:
                text = "❌ Вы не зарегистрированы в системе.\n\nВыберите действие из меню:"
                if update.message:
                    await update.message.reply_text(text, reply_markup=self.get_main_keyboard(is_registered=False))
                else:
                    await update.callback_query.message.reply_text(text, reply_markup=self.get_main_keyboard(is_registered=False))
                return ConversationHandler.END
            
            client_data = response.json()
            
            # Инициализируем данные записи
            self.appointment_data[chat_id] = {
                'client_id': client_data['id'],
                'client_name': client_data['full_name']
            }
            
            # Получаем список специализаций
            spec_response = requests.get(f"{API_BASE_URL}/api/specializations", timeout=10)
            
            if spec_response.status_code == 200:
                specializations = spec_response.json()
                
                # Создаем inline клавиатуру со специализациями
                keyboard = []
                for spec in specializations:
                    emoji = self.get_specialization_emoji(spec['name'])
                    keyboard.append([InlineKeyboardButton(
                        f"{emoji} {spec['name']}", 
                        callback_data=f"spec_{spec['id']}"
                    )])
                
                keyboard.append([InlineKeyboardButton("❌ Отменить", callback_data="cancel_booking")])
                reply_markup = InlineKeyboardMarkup(keyboard)
                
                text = "💇‍♀️ Выберите направление услуг:"
                if update.message:
                    await update.message.reply_text(text, reply_markup=reply_markup)
                else:
                    await update.callback_query.message.reply_text(text, reply_markup=reply_markup)
                
                return CHOOSING_SPECIALIZATION
            else:
                text = "❌ Ошибка при загрузке специализаций."
                if update.message:
                    await update.message.reply_text(text)
                else:
                    await update.callback_query.message.reply_text(text)
                return ConversationHandler.END
                
        except Exception as e:
            logger.error(f"Error starting booking: {e}")
            text = "❌ Произошла ошибка. Попробуйте позже."
            if update.message:
                await update.message.reply_text(text)
            else:
                await update.callback_query.message.reply_text(text)
            return ConversationHandler.END
    
    def get_specialization_emoji(self, name):
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
    
    def get_qualification_name(self, qualification_id):
        """Получение названия квалификации"""
        qualifications = {
            1: "Младший",
            2: "Средний", 
            3: "Старший",
            4: "Эксперт",
            5: "Мастер"
        }
        return qualifications.get(qualification_id, "")
    
    async def choose_specialization(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Выбор специализации и показ услуг"""
        query = update.callback_query
        await query.answer()
        
        if query.data == "cancel_booking":
            await query.edit_message_text("❌ Запись отменена.")
            chat_id = query.message.chat_id
            if chat_id in self.appointment_data:
                del self.appointment_data[chat_id]
            return ConversationHandler.END
        
        chat_id = query.message.chat_id
        spec_id = int(query.data.split('_')[1])
        
        self.appointment_data[chat_id]['specialization_id'] = spec_id
        
        try:
            # Получаем услуги для выбранной специализации
            services_response = requests.get(f"{API_BASE_URL}/api/services", timeout=10)
            
            if services_response.status_code == 200:
                all_services = services_response.json()
                
                # Фильтруем услуги по специализации
                # Предполагаем, что у услуги есть поле specialization_id
                services = [s for s in all_services if s.get('specialization_id') == spec_id]
                
                if not services:
                    # Если нет прямой связи, показываем все услуги
                    services = all_services
                
                # Создаем клавиатуру с услугами
                keyboard = []
                for service in services:
                    price = int(float(service['base_price']))
                    duration = service['duration']
                    button_text = f"{service['name']} • {price}₽ • {duration} мин"
                    keyboard.append([InlineKeyboardButton(
                        button_text,
                        callback_data=f"srv_{service['id']}"
                    )])
                
                keyboard.append([InlineKeyboardButton("◀️ Назад", callback_data="back_to_spec")])
                reply_markup = InlineKeyboardMarkup(keyboard)
                
                await query.edit_message_text(
                    "💅 Выберите услугу:",
                    reply_markup=reply_markup
                )
                
                return CHOOSING_SERVICE
            else:
                await query.edit_message_text("❌ Ошибка при загрузке услуг.")
                return ConversationHandler.END
                
        except Exception as e:
            logger.error(f"Error choosing specialization: {e}")
            await query.edit_message_text("❌ Произошла ошибка.")
            return ConversationHandler.END
    
    async def choose_service(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Выбор услуги и показ мастеров"""
        query = update.callback_query
        await query.answer()
        
        chat_id = query.message.chat_id
        
        if query.data == "back_to_spec":
            # Возвращаемся к выбору специализации
            spec_response = requests.get(f"{API_BASE_URL}/api/specializations", timeout=10)
            
            if spec_response.status_code == 200:
                specializations = spec_response.json()
                
                keyboard = []
                for spec in specializations:
                    emoji = self.get_specialization_emoji(spec['name'])
                    keyboard.append([InlineKeyboardButton(
                        f"{emoji} {spec['name']}", 
                        callback_data=f"spec_{spec['id']}"
                    )])
                
                keyboard.append([InlineKeyboardButton("❌ Отменить", callback_data="cancel_booking")])
                reply_markup = InlineKeyboardMarkup(keyboard)
                
                await query.edit_message_text(
                    "💇‍♀️ Выберите направление услуг:",
                    reply_markup=reply_markup
                )
                
                return CHOOSING_SPECIALIZATION
        
        service_id = int(query.data.split('_')[1])
        self.appointment_data[chat_id]['service_id'] = service_id
        
        try:
            # Получаем информацию об услуге
            service_response = requests.get(f"{API_BASE_URL}/api/services/{service_id}", timeout=10)
            
            if service_response.status_code == 200:
                service = service_response.json()
                self.appointment_data[chat_id]['service_name'] = service['name']
                self.appointment_data[chat_id]['service_duration'] = service['duration']
                self.appointment_data[chat_id]['service_price'] = service['base_price']
                
                # Получаем мастеров для этой услуги
                employees_response = requests.get(f"{API_BASE_URL}/api/employees", timeout=10)
                
                if employees_response.status_code == 200:
                    all_employees = employees_response.json()
                    
                    # Фильтруем мастеров по специализации
                    spec_id = self.appointment_data[chat_id]['specialization_id']
                    employees = [e for e in all_employees if e.get('specialization_id') == spec_id]
                    
                    if not employees:
                        employees = all_employees
                    
                    # Создаем клавиатуру с мастерами
                    keyboard = []
                    
                    # Добавляем опцию "Любой мастер"
                    keyboard.append([InlineKeyboardButton(
                        "🎲 Любой мастер",
                        callback_data="emp_any"
                    )])
                    
                    for employee in employees:
                        qualification = self.get_qualification_name(employee.get('qualification_id', 0))
                        name_text = f"👤 {employee['full_name']}"
                        if qualification:
                            name_text += f" ({qualification})"
                        
                        keyboard.append([InlineKeyboardButton(
                            name_text,
                            callback_data=f"emp_{employee['id']}"
                        )])
                    
                    keyboard.append([InlineKeyboardButton("◀️ Назад", callback_data="back_to_services")])
                    reply_markup = InlineKeyboardMarkup(keyboard)
                    
                    await query.edit_message_text(
                        f"👥 Выберите мастера для услуги:\n{service['name']}",
                        reply_markup=reply_markup
                    )
                    
                    return CHOOSING_EMPLOYEE
                else:
                    await query.edit_message_text("❌ Ошибка при загрузке мастеров.")
                    return ConversationHandler.END
            else:
                await query.edit_message_text("❌ Ошибка при загрузке информации об услуге.")
                return ConversationHandler.END
                
        except Exception as e:
            logger.error(f"Error choosing service: {e}")
            await query.edit_message_text("❌ Произошла ошибка.")
            return ConversationHandler.END
    
    async def choose_employee(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Выбор мастера и показ доступных дат"""
        query = update.callback_query
        await query.answer()
        
        chat_id = query.message.chat_id
        
        if query.data == "back_to_services":
            # Возвращаемся к выбору услуг
            return await self.choose_specialization(update, context)
        
        if query.data == "emp_any":
            self.appointment_data[chat_id]['employee_id'] = None
            self.appointment_data[chat_id]['employee_name'] = "Любой мастер"
        else:
            employee_id = int(query.data.split('_')[1])
            self.appointment_data[chat_id]['employee_id'] = employee_id
            
            # Получаем информацию о мастере
            try:
                emp_response = requests.get(f"{API_BASE_URL}/api/employees/{employee_id}", timeout=10)
                if emp_response.status_code == 200:
                    employee = emp_response.json()
                    qualification = self.get_qualification_name(employee.get('qualification_id', 0))
                    employee_name = employee['full_name']
                    if qualification:
                        employee_name += f" ({qualification})"
                    self.appointment_data[chat_id]['employee_name'] = employee_name
            except:
                pass
        
        # Теперь проверяем доступные даты с учетом свободных слотов
        await query.edit_message_text("⏳ Проверяю доступные даты...")
        
        # Получаем список доступных дат
        keyboard = []
        today = datetime.now(TIMEZONE).date()
        available_dates = []
        
        # Проверяем ближайшие 14 дней
        for i in range(14):
            check_date = today + timedelta(days=i)
            date_str = check_date.strftime("%Y-%m-%d")
            
            # Проверяем есть ли свободные слоты в этот день
            has_slots = await self.check_date_availability(
                date_str,
                self.appointment_data[chat_id]['service_id'],
                self.appointment_data[chat_id]['employee_id'],
                self.appointment_data[chat_id]['specialization_id']
            )
            
            if has_slots:
                available_dates.append((check_date, date_str))
                
                # Ограничиваем количество отображаемых дат
                if len(available_dates) >= 7:
                    break
        
        if not available_dates:
            await query.edit_message_text(
                "❌ К сожалению, в ближайшие дни нет свободных окон для записи.\n"
                "Попробуйте выбрать другого мастера или услугу.",
                reply_markup=InlineKeyboardMarkup([[
                    InlineKeyboardButton("◀️ Назад", callback_data="back_to_employees")
                ]])
            )
            return CHOOSING_EMPLOYEE
        
        # Формируем кнопки с датами
        for date, date_str in available_dates:
            if date == today:
                button_text = f"📅 Сегодня ({date.strftime('%d.%m')})"
            elif date == today + timedelta(days=1):
                button_text = f"📅 Завтра ({date.strftime('%d.%m')})"
            else:
                weekday = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][date.weekday()]
                button_text = f"📅 {weekday} ({date.strftime('%d.%m')})"
            
            keyboard.append([InlineKeyboardButton(
                button_text,
                callback_data=f"date_{date_str}"
            )])
        
        keyboard.append([InlineKeyboardButton("◀️ Назад", callback_data="back_to_employees")])
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(
            "📆 Выберите дату записи:",
            reply_markup=reply_markup
        )
        
        return CHOOSING_DATE
    
    async def check_date_availability(self, date_str, service_id, employee_id, specialization_id):
        """Проверка доступности даты"""
        try:
            # Если указан конкретный мастер
            if employee_id:
                params = {
                    'date': date_str,
                    'service_id': service_id,
                    'employee_id': employee_id
                }
                
                response = requests.get(
                    f"{API_BASE_URL}/api/available_slots",
                    params=params,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    available_slots = data.get('available_slots', [])
                    
                    # Фильтруем слоты по времени (не раньше чем через 30 минут)
                    current_time = datetime.now(TIMEZONE)
                    min_time = current_time + timedelta(minutes=30)
                    
                    valid_slots = []
                    for slot in available_slots:
                        slot_datetime = datetime.strptime(
                            f"{date_str} {slot['start']}", 
                            "%Y-%m-%d %H:%M"
                        ).replace(tzinfo=TIMEZONE)
                        
                        if slot_datetime >= min_time:
                            valid_slots.append(slot)
                    
                    return len(valid_slots) > 0
            else:
                # Для "любой мастер" проверяем всех мастеров специализации
                employees_response = requests.get(f"{API_BASE_URL}/api/employees", timeout=10)
                
                if employees_response.status_code == 200:
                    all_employees = employees_response.json()
                    employees = [e for e in all_employees if e.get('specialization_id') == specialization_id]
                    
                    for employee in employees:
                        params = {
                            'date': date_str,
                            'service_id': service_id,
                            'employee_id': employee['id']
                        }
                        
                        response = requests.get(
                            f"{API_BASE_URL}/api/available_slots",
                            params=params,
                            timeout=5
                        )
                        
                        if response.status_code == 200:
                            data = response.json()
                            available_slots = data.get('available_slots', [])
                            
                            # Фильтруем слоты по времени
                            current_time = datetime.now(TIMEZONE)
                            min_time = current_time + timedelta(minutes=30)
                            
                            for slot in available_slots:
                                slot_datetime = datetime.strptime(
                                    f"{date_str} {slot['start']}", 
                                    "%Y-%m-%d %H:%M"
                                ).replace(tzinfo=TIMEZONE)
                                
                                if slot_datetime >= min_time:
                                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error checking date availability: {e}")
            return False
    
    async def choose_date(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Выбор даты и показ доступного времени"""
        query = update.callback_query
        await query.answer()
        
        chat_id = query.message.chat_id
        
        if query.data == "back_to_employees":
            # Возвращаемся к выбору мастера
            return await self.choose_service(update, context)
        
        date_str = query.data.split('_')[1]
        self.appointment_data[chat_id]['date'] = date_str
        
        await query.edit_message_text("⏳ Загружаю доступное время...")
        
        try:
            # Собираем все доступные слоты
            all_slots_by_time = {}
            
            # Для "любой мастер" получаем список всех мастеров специализации
            if not self.appointment_data[chat_id]['employee_id']:
                spec_id = self.appointment_data[chat_id]['specialization_id']
                employees_response = requests.get(f"{API_BASE_URL}/api/employees", timeout=10)
                
                if employees_response.status_code == 200:
                    all_employees = employees_response.json()
                    employees = [e for e in all_employees if e.get('specialization_id') == spec_id]
                    
                    for employee in employees:
                        params = {
                            'date': date_str,
                            'service_id': self.appointment_data[chat_id]['service_id'],
                            'employee_id': employee['id']
                        }
                        
                        slots_response = requests.get(
                            f"{API_BASE_URL}/api/available_slots",
                            params=params,
                            timeout=10
                        )
                        
                        if slots_response.status_code == 200:
                            data = slots_response.json()
                            available_slots = data.get('available_slots', [])
                            
                            for slot in available_slots:
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
                    'service_id': self.appointment_data[chat_id]['service_id'],
                    'employee_id': self.appointment_data[chat_id]['employee_id']
                }
                
                slots_response = requests.get(
                    f"{API_BASE_URL}/api/available_slots",
                    params=params,
                    timeout=10
                )
                
                if slots_response.status_code == 200:
                    data = slots_response.json()
                    available_slots = data.get('available_slots', [])
                    
                    for slot in available_slots:
                        time = slot['start']
                        all_slots_by_time[time] = [{
                            'employee_id': self.appointment_data[chat_id]['employee_id'],
                            'employee_name': self.appointment_data[chat_id]['employee_name']
                        }]
            
            # Фильтруем слоты по времени (не раньше чем через 30 минут)
            current_time = datetime.now(TIMEZONE)
            min_time = current_time + timedelta(minutes=30)
            
            filtered_slots = {}
            for time, employees in all_slots_by_time.items():
                slot_datetime = datetime.strptime(
                    f"{date_str} {time}", 
                    "%Y-%m-%d %H:%M"
                ).replace(tzinfo=TIMEZONE)
                
                if slot_datetime >= min_time:
                    filtered_slots[time] = employees
            
            if not filtered_slots:
                await query.edit_message_text(
                    "❌ К сожалению, на выбранную дату нет свободного времени.\n"
                    "Попробуйте выбрать другую дату.",
                    reply_markup=InlineKeyboardMarkup([[
                        InlineKeyboardButton("◀️ Назад", callback_data="back_to_dates")
                    ]])
                )
                return CHOOSING_DATE
            
            # Группируем слоты по времени суток
            morning_slots = []
            afternoon_slots = []
            evening_slots = []
            
            for time in sorted(filtered_slots.keys()):
                category = self.categorize_time_slot(time)
                employee_info = filtered_slots[time][0]  # Берем первого доступного мастера
                
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
            
            # Создаем клавиатуру с временными слотами в виде таблицы
            keyboard = []
            
            # Утренние слоты
            if morning_slots:
                keyboard.append([InlineKeyboardButton(
                    f"🌅 УТРО ({len(morning_slots)} слотов)",
                    callback_data="header_morning"
                )])
                
                # Группируем по 3 кнопки в ряд
                for i in range(0, len(morning_slots), 3):
                    row = []
                    for j in range(3):
                        if i + j < len(morning_slots):
                            slot = morning_slots[i + j]
                            row.append(InlineKeyboardButton(
                                slot['time'],
                                callback_data=slot['callback']
                            ))
                    keyboard.append(row)
            
            # Дневные слоты
            if afternoon_slots:
                if morning_slots:  # Добавляем разделитель
                    keyboard.append([InlineKeyboardButton("─────────", callback_data="separator")])
                
                keyboard.append([InlineKeyboardButton(
                    f"☀️ ДЕНЬ ({len(afternoon_slots)} слотов)",
                    callback_data="header_afternoon"
                )])
                
                for i in range(0, len(afternoon_slots), 3):
                    row = []
                    for j in range(3):
                        if i + j < len(afternoon_slots):
                            slot = afternoon_slots[i + j]
                            row.append(InlineKeyboardButton(
                                slot['time'],
                                callback_data=slot['callback']
                            ))
                    keyboard.append(row)
            
            # Вечерние слоты
            if evening_slots:
                if morning_slots or afternoon_slots:  # Добавляем разделитель
                    keyboard.append([InlineKeyboardButton("─────────", callback_data="separator")])
                
                keyboard.append([InlineKeyboardButton(
                    f"🌙 ВЕЧЕР ({len(evening_slots)} слотов)",
                    callback_data="header_evening"
                )])
                
                for i in range(0, len(evening_slots), 3):
                    row = []
                    for j in range(3):
                        if i + j < len(evening_slots):
                            slot = evening_slots[i + j]
                            row.append(InlineKeyboardButton(
                                slot['time'],
                                callback_data=slot['callback']
                            ))
                    keyboard.append(row)
            
            keyboard.append([InlineKeyboardButton("◀️ Назад", callback_data="back_to_dates")])
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
            date_display = date_obj.strftime("%d.%m.%Y")
            
            total_slots = len(morning_slots) + len(afternoon_slots) + len(evening_slots)
            
            await query.edit_message_text(
                f"⏰ Выберите время записи на {date_display}\n"
                f"Доступно {total_slots} окон для записи:",
                reply_markup=reply_markup
            )
            
            return CHOOSING_TIME
            
        except Exception as e:
            logger.error(f"Error choosing date: {e}")
            await query.edit_message_text("❌ Произошла ошибка при загрузке доступного времени.")
            return ConversationHandler.END
    
    async def choose_time(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Выбор времени и подтверждение записи"""
        query = update.callback_query
        
        # Игнорируем клики по заголовкам и разделителям
        if query.data in ["header_morning", "header_afternoon", "header_evening", "separator"]:
            await query.answer("Выберите конкретное время из списка ниже")
            return CHOOSING_TIME
        
        await query.answer()
        
        chat_id = query.message.chat_id
        
        if query.data == "back_to_dates":
            # Возвращаемся к выбору даты
            return await self.choose_employee(update, context)
        
        # Парсим время и (опционально) ID мастера
        parts = query.data.split('_')
        time_str = parts[1]
        
        # Если был выбор "любой мастер" и в колбэке есть ID мастера
        if len(parts) > 3 and parts[2] == 'emp':
            selected_employee_id = int(parts[3])
            if not self.appointment_data[chat_id]['employee_id']:
                self.appointment_data[chat_id]['employee_id'] = selected_employee_id
                # Получаем имя мастера
                try:
                    emp_response = requests.get(f"{API_BASE_URL}/api/employees/{selected_employee_id}", timeout=10)
                    if emp_response.status_code == 200:
                        employee = emp_response.json()
                        qualification = self.get_qualification_name(employee.get('qualification_id', 0))
                        employee_name = employee['full_name']
                        if qualification:
                            employee_name += f" ({qualification})"
                        self.appointment_data[chat_id]['employee_name'] = employee_name
                except:
                    pass
        
        self.appointment_data[chat_id]['time'] = time_str
        
        # Вычисляем время окончания
        date_str = self.appointment_data[chat_id]['date']
        datetime_str = f"{date_str} {time_str}"
        start_datetime = datetime.strptime(datetime_str, "%Y-%m-%d %H:%M")
        duration = self.appointment_data[chat_id]['service_duration']
        end_datetime = start_datetime + timedelta(minutes=duration)
        
        # Форматируем данные для отображения
        date_display = start_datetime.strftime("%d.%m.%Y")
        time_display = start_datetime.strftime("%H:%M")
        end_time_display = end_datetime.strftime("%H:%M")
        
        # Создаем сообщение с деталями записи
        details = f"""📋 Подтвердите запись:

👤 Клиент: {self.appointment_data[chat_id]['client_name']}
💅 Услуга: {self.appointment_data[chat_id]['service_name']}
👨‍💼 Мастер: {self.appointment_data[chat_id]['employee_name']}
📅 Дата: {date_display}
⏰ Время: {time_display} - {end_time_display}
💰 Стоимость: {int(float(self.appointment_data[chat_id]['service_price']))} ₽
⏱️ Длительность: {duration} минут"""
        
        keyboard = [
            [InlineKeyboardButton("✅ Подтвердить", callback_data="confirm_yes")],
            [InlineKeyboardButton("❌ Отменить", callback_data="confirm_no")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(
            details,
            reply_markup=reply_markup
        )
        
        return CONFIRMING_APPOINTMENT
    
    async def confirm_appointment(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Подтверждение и создание записи"""
        query = update.callback_query
        await query.answer()
        
        chat_id = query.message.chat_id
        
        if query.data == "confirm_no":
            await query.edit_message_text(
                "❌ Запись отменена.\n\n"
                "Выберите действие из меню:"
            )
            await query.message.reply_text(
                "Что вы хотите сделать?",
                reply_markup=self.get_main_keyboard(is_registered=True)
            )
            if chat_id in self.appointment_data:
                del self.appointment_data[chat_id]
            return ConversationHandler.END
        
        # Создаем запись
        try:
            appointment_data = {
                'client_id': self.appointment_data[chat_id]['client_id'],
                'employee_id': self.appointment_data[chat_id]['employee_id'],
                'service_id': self.appointment_data[chat_id]['service_id'],
                'datetime': f"{self.appointment_data[chat_id]['date']}T{self.appointment_data[chat_id]['time']}:00",  # ИЗМЕНЕНО
                'final_price': self.appointment_data[chat_id]['service_price']
            }
            
            response = requests.post(
                f"{API_BASE_URL}/api/appointments",
                json=appointment_data,
                timeout=10
            )
            
            if response.status_code == 201:
                appointment_response = response.json()
                self.appointment_data[chat_id]['appointment_id'] = appointment_response['id']
                
                # Спрашиваем о напоминании
                keyboard = [
                    [InlineKeyboardButton("⏰ За 1 час", callback_data="reminder_1h")],
                    [InlineKeyboardButton("⏰ За 2 часа", callback_data="reminder_2h")],
                    [InlineKeyboardButton("⏰ За день", callback_data="reminder_24h")],
                    [InlineKeyboardButton("❌ Не нужно", callback_data="reminder_no")]
                ]
                reply_markup = InlineKeyboardMarkup(keyboard)
                
                await query.edit_message_text(
                    "✅ Запись успешно создана!\n\n"
                    "Хотите установить напоминание о визите?",
                    reply_markup=reply_markup
                )
                
                return SETTING_REMINDER
            else:
                error_data = response.json() if response.content else {}
                error_msg = error_data.get('error', 'Неизвестная ошибка')
                await query.edit_message_text(
                    f"❌ Ошибка при создании записи:\n{error_msg}\n\n"
                    f"Попробуйте записаться позже или выберите другое время."
                )
                await query.message.reply_text(
                    "Выберите действие из меню:",
                    reply_markup=self.get_main_keyboard(is_registered=True)
                )
                
        except Exception as e:
            logger.error(f"Error creating appointment: {e}")
            await query.edit_message_text(
                "❌ Произошла ошибка при создании записи.\n"
                "Попробуйте позже."
            )
            await query.message.reply_text(
                "Выберите действие из меню:",
                reply_markup=self.get_main_keyboard(is_registered=True)
            )
        
        return ConversationHandler.END
    
    async def set_reminder(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Установка напоминания о записи"""
        query = update.callback_query
        await query.answer()
        
        chat_id = query.message.chat_id
        
        if query.data != "reminder_no":
            # Определяем время напоминания
            appointment_datetime = datetime.strptime(
                f"{self.appointment_data[chat_id]['date']} {self.appointment_data[chat_id]['time']}", 
                "%Y-%m-%d %H:%M"
            )
            
            if query.data == "reminder_1h":
                reminder_time = appointment_datetime - timedelta(hours=1)
                reminder_text = "за 1 час"
            elif query.data == "reminder_2h":
                reminder_time = appointment_datetime - timedelta(hours=2)
                reminder_text = "за 2 часа"
            else:  # reminder_24h
                reminder_time = appointment_datetime - timedelta(days=1)
                reminder_text = "за день"
            
            # Создаем напоминание через API
            try:
                notification_data = {
                    'appointment_id': self.appointment_data[chat_id]['appointment_id'],
                    'scheduled_at': reminder_time.isoformat(),
                    'status': 'pending'
                }
                
                response = requests.post(
                    f"{API_BASE_URL}/api/notifications",
                    json=notification_data,
                    timeout=10
                )
                
                if response.status_code == 201:
                    success_msg = f"✅ Отлично! Напоминание установлено {reminder_text} до визита.\n\n"
                else:
                    success_msg = "✅ Запись создана!\n\n"
            except Exception as e:
                logger.error(f"Error creating notification: {e}")
                success_msg = "✅ Запись создана!\n\n"
        else:
            success_msg = "✅ Запись создана!\n\n"
        
        # Показываем финальное сообщение с деталями записи
        date_str = self.appointment_data[chat_id]['date']
        time_str = self.appointment_data[chat_id]['time']
        start_datetime = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
        duration = self.appointment_data[chat_id]['service_duration']
        end_datetime = start_datetime + timedelta(minutes=duration)
        
        date_display = start_datetime.strftime("%d.%m.%Y")
        time_display = start_datetime.strftime("%H:%M")
        end_time_display = end_datetime.strftime("%H:%M")
        
        final_message = success_msg + f"""📋 Детали вашей записи:
👤 Клиент: {self.appointment_data[chat_id]['client_name']}
💅 Услуга: {self.appointment_data[chat_id]['service_name']}
👨‍💼 Мастер: {self.appointment_data[chat_id]['employee_name']}
📅 Дата: {date_display}
⏰ Время: {time_display} - {end_time_display}

Ждем вас в Beauty Room 38! ✨"""
        
        await query.edit_message_text(final_message)
        await query.message.reply_text(
            "Что вы хотите сделать дальше?",
            reply_markup=self.get_main_keyboard(is_registered=True)
        )
        
        # Очищаем временные данные
        if chat_id in self.appointment_data:
            del self.appointment_data[chat_id]
        
        return ConversationHandler.END
    
    async def cancel_booking(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Отмена процесса записи"""
        chat_id = update.effective_chat.id
        
        if chat_id in self.appointment_data:
            del self.appointment_data[chat_id]
        
        await update.message.reply_text(
            "Запись отменена. Выберите действие из меню:",
            reply_markup=self.get_main_keyboard(is_registered=True)
        )
        
        return ConversationHandler.END
    
    async def my_appointments(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Показать записи пользователя"""
        chat_id = update.effective_chat.id if update.message else update.callback_query.message.chat_id
        
        try:
            # Получаем клиента
            client_response = requests.get(
                f"{API_BASE_URL}/api/telegram/client/{chat_id}",
                timeout=10
            )
            
            if client_response.status_code != 200:
                text = "❌ Вы не зарегистрированы в системе.\n\nВыберите действие из меню:"
                if update.message:
                    await update.message.reply_text(text, reply_markup=self.get_main_keyboard(is_registered=False))
                else:
                    await update.callback_query.message.reply_text(text, reply_markup=self.get_main_keyboard(is_registered=False))
                return
            
            client_data = client_response.json()
            client_id = client_data['id']
            
            # Получаем записи клиента
            appointments_response = requests.get(
                f"{API_BASE_URL}/api/appointments",
                timeout=10
            )
            
            if appointments_response.status_code == 200:
                all_appointments = appointments_response.json()
                
                # Фильтруем записи текущего клиента и будущие
                now = datetime.now()
                client_appointments = []
                
                for apt in all_appointments:
                    if apt['client_id'] == client_id:
                        apt_datetime = datetime.fromisoformat(apt['datetime'].replace('Z', '+00:00'))
                        if apt_datetime.replace(tzinfo=None) > now:
                            client_appointments.append(apt)
                
                if not client_appointments:
                    text = "📅 У вас пока нет предстоящих записей.\n\nВыберите действие из меню:"
                    if update.message:
                        await update.message.reply_text(text, reply_markup=self.get_main_keyboard(is_registered=True))
                    else:
                        await update.callback_query.message.reply_text(text, reply_markup=self.get_main_keyboard(is_registered=True))
                    return
                
                # Сортируем по дате
                client_appointments.sort(key=lambda x: x['datetime'])
                
                # Формируем сообщение
                message = "📅 Ваши предстоящие записи:\n\n"
                
                for i, apt in enumerate(client_appointments[:5], 1):  # Показываем максимум 5
                    apt_datetime = datetime.fromisoformat(apt['datetime'].replace('Z', '+00:00'))
                    date_display = apt_datetime.strftime("%d.%m.%Y")
                    time_display = apt_datetime.strftime("%H:%M")
                    
                    # Получаем информацию об услуге и мастере
                    service_name = "Услуга"
                    employee_name = "Мастер"
                    
                    try:
                        if apt.get('service_id'):
                            service_resp = requests.get(f"{API_BASE_URL}/api/services/{apt['service_id']}", timeout=5)
                            if service_resp.status_code == 200:
                                service_name = service_resp.json()['name']
                        
                        if apt.get('employee_id'):
                            emp_resp = requests.get(f"{API_BASE_URL}/api/employees/{apt['employee_id']}", timeout=5)
                            if emp_resp.status_code == 200:
                                employee_name = emp_resp.json()['full_name']
                    except:
                        pass
                    
                    status = "✅" if apt.get('is_completed') else "⏳"
                    
                    message += f"{i}. {status} {date_display} в {time_display}\n"
                    message += f"   💅 {service_name}\n"
                    message += f"   👤 {employee_name}\n\n"
                
                if update.message:
                    await update.message.reply_text(message, reply_markup=self.get_main_keyboard(is_registered=True))
                else:
                    await update.callback_query.message.reply_text(message, reply_markup=self.get_main_keyboard(is_registered=True))
            else:
                text = "❌ Ошибка при загрузке записей."
                if update.message:
                    await update.message.reply_text(text, reply_markup=self.get_main_keyboard(is_registered=True))
                else:
                    await update.callback_query.message.reply_text(text, reply_markup=self.get_main_keyboard(is_registered=True))
                    
        except Exception as e:
            logger.error(f"Error getting appointments: {e}")
            text = "❌ Произошла ошибка."
            if update.message:
                await update.message.reply_text(text, reply_markup=self.get_main_keyboard(is_registered=True))
            else:
                await update.callback_query.message.reply_text(text, reply_markup=self.get_main_keyboard(is_registered=True))
    
    async def check_status(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Проверка статуса аккаунта"""
        chat_id = update.effective_chat.id if update.message else update.callback_query.message.chat_id
        
        try:
            response = requests.get(
                f"{API_BASE_URL}/api/telegram/client/{chat_id}",
                timeout=10
            )
            
            if response.status_code == 200:
                client_data = response.json()
                text = (f"📋 Информация о вашем аккаунте:\n\n"
                       f"👤 Имя: {client_data['full_name']}\n"
                       f"📱 Телефон: {client_data['phone']}\n"
                       f"📧 Email: {client_data.get('email', 'Не указан')}\n")
                if update.message:
                    await update.message.reply_text(text, reply_markup=self.get_main_keyboard(is_registered=True))
                else:
                    await update.callback_query.message.reply_text(text, reply_markup=self.get_main_keyboard(is_registered=True))
            else:
                text = "❌ Ваш аккаунт не найден.\n\nВыберите действие из меню:"
                if update.message:
                    await update.message.reply_text(text, reply_markup=self.get_main_keyboard(is_registered=False))
                else:
                    await update.callback_query.message.reply_text(text, reply_markup=self.get_main_keyboard(is_registered=False))
                    
        except Exception as e:
            logger.error(f"Error checking status: {e}")
            text = "❌ Ошибка при проверке статуса аккаунта."
            if update.message:
                await update.message.reply_text(text, reply_markup=self.get_main_keyboard(is_registered=True))
            else:
                await update.callback_query.message.reply_text(text, reply_markup=self.get_main_keyboard(is_registered=True))
    
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик команды /help"""
        chat_id = update.effective_chat.id if update.message else update.callback_query.message.chat_id
        
        # Проверяем, зарегистрирован ли пользователь
        is_registered = False
        try:
            response = requests.get(f"{API_BASE_URL}/api/telegram/client/{chat_id}", timeout=10)
            if response.status_code == 200:
                is_registered = True
        except:
            pass
        
        help_text = """🤖 О боте Beauty Room 38:

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
+7 (950) 123-23-23"""
        
        if update.message:
            await update.message.reply_text(help_text, reply_markup=self.get_main_keyboard(is_registered=is_registered))
        else:
            await update.callback_query.message.reply_text(help_text, reply_markup=self.get_main_keyboard(is_registered=is_registered))
    
    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик обычных сообщений"""
        text = update.message.text.lower()
        chat_id = update.effective_chat.id
        
        # Проверяем, зарегистрирован ли пользователь
        is_registered = False
        try:
            response = requests.get(f"{API_BASE_URL}/api/telegram/client/{chat_id}", timeout=10)
            if response.status_code == 200:
                is_registered = True
        except:
            pass
        
        if any(word in text for word in ['записаться', 'запись', 'записать']):
            if is_registered:
                await update.message.reply_text(
                    "Хотите записаться на услугу? Нажмите кнопку ниже:",
                    reply_markup=self.get_main_keyboard(is_registered=True)
                )
            else:
                await update.message.reply_text(
                    "Для записи необходимо сначала зарегистрироваться:",
                    reply_markup=self.get_main_keyboard(is_registered=False)
                )
        elif any(word in text for word in ['помощь', 'help', 'команды']):
            await self.help_command(update, context)
        else:
            await update.message.reply_text(
                "Выберите действие из меню:",
                reply_markup=self.get_main_keyboard(is_registered=is_registered)
            )
    
    def run(self):
        """Запуск бота"""
        logger.info("Starting Beauty Room Telegram Bot...")
        self.application.run_polling()

if __name__ == '__main__':
    if BOT_TOKEN == 'YOUR_BOT_TOKEN_HERE':
        print("Пожалуйста, установите TELEGRAM_BOT_TOKEN в переменных окружения")
        exit(1)
    
    bot = BeautyRoomBot()
    bot.run()
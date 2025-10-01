from flask import Flask

import os
from flask_cors import CORS
from database import SessionLocal
from models import (
    Service, ServicePopularity, Employee, Schedule, 
    EmployeeWorkload, Appointment
)
from notification_service import NotificationService, NotificationConfig
from app_analytics import register_analytics_routes
from api.config import create_database_if_not_exists
from api.routes.basic import register_basic_routes, register_client_routes, register_client_preferences_routes
from api.routes.employees import register_specialization_routes, register_employee_routes
from api.routes.services import register_service_complex_routes, register_service_routes
from api.routes.appointments import register_appointment_routes
from api.routes.schedules import register_schedule_routes, register_schedule_exception_routes
from api.routes.notifications import register_notification_routes
from api.routes.analytics import register_basic_analytics_routes
from api.routes.pivots import register_pivot_routes, register_specialization_helper_routes
from api.routes.slots import register_slots_routes
from api.routes.telegram import register_telegram_routes, register_telegram_master_routes
from api.routes.notifications_extended import register_extended_notification_routes

# Создание приложения Flask
app = Flask(__name__)
CORS(app)

# Создание базы данных если не существует
create_database_if_not_exists()

# Регистрация аналитических маршрутов
register_analytics_routes(
    app, 
    SessionLocal, 
    Service, 
    ServicePopularity, 
    Employee, 
    Schedule, 
    EmployeeWorkload, 
    Appointment
)

# Настройка сервиса уведомлений
notification_config = NotificationConfig(
    telegram_bot_token=os.environ.get('TELEGRAM_BOT_TOKEN', 'YOUR_BOT_TOKEN')
)
notification_service = NotificationService(notification_config, SessionLocal)

# Регистрация всех маршрутов
register_basic_routes(app)
register_client_routes(app)
register_client_preferences_routes(app)
register_specialization_routes(app)
register_employee_routes(app)
register_service_complex_routes(app)
register_service_routes(app)
register_appointment_routes(app, notification_service)
register_schedule_routes(app)
register_schedule_exception_routes(app)
register_notification_routes(app)
register_basic_analytics_routes(app)
register_pivot_routes(app)
register_specialization_helper_routes(app)
register_slots_routes(app)
register_telegram_routes(app)
register_telegram_master_routes(app)
register_extended_notification_routes(app, notification_service)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
import os
import logging
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from database import engine
from models import Base

# Настройка логирования
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_database_if_not_exists():
    """Функция для создания базы данных, если она не существует"""
    # Получаем параметры подключения из переменных окружения или используем значения по умолчанию
    DB_USER = os.environ.get('DB_USER', 'postgres')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', 'postgres')
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_PORT = os.environ.get('DB_PORT', '5432')
    DB_NAME = os.environ.get('DB_NAME', 'db_beauty_room_38')
    
    try:
        # Подключаемся к серверу PostgreSQL
        conn = psycopg2.connect(
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT,
            database='postgres'  # Подключаемся к системной базе postgres
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Проверяем, существует ли база данных
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (DB_NAME,))
        exists = cursor.fetchone()
        
        if not exists:
            logger.info(f"База данных {DB_NAME} не существует. Создаем...")
            # Создаем базу данных
            cursor.execute(f'CREATE DATABASE {DB_NAME}')
            logger.info(f"База данных {DB_NAME} успешно создана!")
        else:
            logger.info(f"База данных {DB_NAME} уже существует.")
        
        cursor.close()
        conn.close()
        
        # Создаем таблицы в базе данных
        Base.metadata.create_all(bind=engine)
        logger.info("Таблицы успешно созданы или уже существуют.")
        
        return True
    except Exception as e:
        logger.error(f"Ошибка при создании базы данных: {str(e)}")
        return False
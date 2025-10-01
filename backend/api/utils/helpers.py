from datetime import datetime, date, time
import enum

def serialize(model_instance):
    """Сериализация модели в JSON-совместимый словарь"""
    if not model_instance:
        return None
    result = {}
    for c in model_instance.__table__.columns:
        value = getattr(model_instance, c.name)
        # Обработка типов, которые не сериализуются в JSON напрямую
        if isinstance(value, (datetime, date)):
            result[c.name] = value.isoformat()
        elif isinstance(value, time):
            result[c.name] = value.strftime('%H:%M:%S')
        elif isinstance(value, enum.Enum):
            result[c.name] = value.value
        else:
            result[c.name] = value
    return result

def get_or_404(session, model, id):
    """Получить объект по ID или вернуть None если не найден"""
    instance = session.query(model).get(id)
    if not instance:
        return None
    return instance
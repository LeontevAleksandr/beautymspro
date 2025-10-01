from flask import jsonify, request
from database import SessionLocal
from api.services.slots_service import SlotsService

def register_slots_routes(app):
    """Регистрация маршрутов для работы с доступными слотами"""
    
    @app.route('/api/available_slots', methods=['GET'])
    def available_slots():
        """
        Получение доступных временных слотов для записи к определенному сотруднику на определенную дату
        Параметры запроса:
        - employee_id: ID сотрудника
        - date: дата (YYYY-MM-DD)
        - service_id: ID услуги (опционально)
        - complex_id: ID комплекса услуг (опционально)
        - duration: продолжительность в минутах (опционально, если указаны service_id или complex_id)
        - slot_interval: интервал слотов в минутах (по умолчанию 30)
        """
        session = SessionLocal()
        try:
            # Получаем параметры запроса
            employee_id = request.args.get('employee_id')
            date_str = request.args.get('date')
            service_id = request.args.get('service_id')
            complex_id = request.args.get('complex_id')
            custom_duration = request.args.get('duration')
            slot_interval = int(request.args.get('slot_interval', 30))
            
            # Используем сервис для получения доступных слотов
            result = SlotsService.get_available_slots(
                session=session,
                employee_id=employee_id,
                date_str=date_str,
                service_id=service_id,
                complex_id=complex_id,
                custom_duration=custom_duration,
                slot_interval=slot_interval
            )
            
            return jsonify(result)
            
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            return jsonify({'error': str(e)}), 400
        finally:
            session.close()
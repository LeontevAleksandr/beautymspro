from flask import jsonify, request
from datetime import datetime, date, time
from sqlalchemy.exc import IntegrityError
from database import SessionLocal
from models import Schedule, ScheduleException
from api.utils.helpers import serialize, get_or_404

def register_schedule_routes(app):
    """Регистрация маршрутов для работы с расписанием"""
    
    # Schedule
    @app.route('/api/schedules', methods=['GET', 'POST'])
    @app.route('/api/schedules/<int:id>', methods=['GET', 'PUT', 'DELETE'])
    def schedules(id=None):
        session = SessionLocal()
        try:
            if request.method == 'GET':
                if id:
                    schedule = get_or_404(session, Schedule, id)
                    if not schedule:
                        return jsonify({'error': 'Not found'}), 404
                    return jsonify(serialize(schedule))
                else:
                    schedules = session.query(Schedule).all()
                    return jsonify([serialize(s) for s in schedules])
                    
            elif request.method == 'POST':
                data = request.json
                schedule = Schedule(
                    employee_id=data['employee_id'],
                    date=date.fromisoformat(data['date']),
                    start_time=time.fromisoformat(data['start_time']),
                    end_time=time.fromisoformat(data['end_time']),
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                session.add(schedule)
                session.commit()
                return jsonify(serialize(schedule)), 201
                
            elif request.method == 'PUT':
                schedule = get_or_404(session, Schedule, id)
                if not schedule:
                    return jsonify({'error': 'Not found'}), 404
                data = request.json
                schedule.employee_id = data.get('employee_id', schedule.employee_id)
                if 'date' in data:
                    schedule.date = date.fromisoformat(data['date'])
                if 'start_time' in data:
                    schedule.start_time = time.fromisoformat(data['start_time'])
                if 'end_time' in data:
                    schedule.end_time = time.fromisoformat(data['end_time'])
                schedule.updated_at = datetime.now()
                session.commit()
                return jsonify(serialize(schedule))
                
            elif request.method == 'DELETE':
                schedule = get_or_404(session, Schedule, id)
                if not schedule:
                    return jsonify({'error': 'Not found'}), 404
                session.delete(schedule)
                session.commit()
                return jsonify({'message': 'Deleted successfully'}), 200
                
        except IntegrityError as e:
            session.rollback()
            return jsonify({'error': 'Integrity error', 'details': str(e)}), 400
        except Exception as e:
            session.rollback()
            return jsonify({'error': str(e)}), 400
        finally:
            session.close()

def register_schedule_exception_routes(app):
    """Регистрация маршрутов для работы с исключениями в расписании"""
    
    # ScheduleException
    @app.route('/api/schedule_exceptions', methods=['GET', 'POST'])
    @app.route('/api/schedule_exceptions/<int:id>', methods=['GET', 'PUT', 'DELETE'])
    def schedule_exceptions(id=None):
        session = SessionLocal()
        try:
            if request.method == 'GET':
                if id:
                    exc = get_or_404(session, ScheduleException, id)
                    if not exc:
                        return jsonify({'error': 'Not found'}), 404
                    return jsonify(serialize(exc))
                else:
                    exceptions = session.query(ScheduleException).all()
                    return jsonify([serialize(e) for e in exceptions])
                    
            elif request.method == 'POST':
                data = request.json
                exc = ScheduleException(
                    schedule_id=data['schedule_id'],
                    start_time=time.fromisoformat(data['start_time']),
                    end_time=time.fromisoformat(data['end_time']),
                    reason=data['reason'],
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                session.add(exc)
                session.commit()
                return jsonify(serialize(exc)), 201
                
            elif request.method == 'PUT':
                exc = get_or_404(session, ScheduleException, id)
                if not exc:
                    return jsonify({'error': 'Not found'}), 404
                data = request.json
                exc.schedule_id = data.get('schedule_id', exc.schedule_id)
                if 'start_time' in data:
                    exc.start_time = time.fromisoformat(data['start_time'])
                if 'end_time' in data:
                    exc.end_time = time.fromisoformat(data['end_time'])
                exc.reason = data.get('reason', exc.reason)
                exc.updated_at = datetime.now()
                session.commit()
                return jsonify(serialize(exc))
                
            elif request.method == 'DELETE':
                exc = get_or_404(session, ScheduleException, id)
                if not exc:
                    return jsonify({'error': 'Not found'}), 404
                session.delete(exc)
                session.commit()
                return jsonify({'message': 'Deleted successfully'}), 200
                
        except IntegrityError as e:
            session.rollback()
            return jsonify({'error': 'Integrity error', 'details': str(e)}), 400
        except Exception as e:
            session.rollback()
            return jsonify({'error': str(e)}), 400
        finally:
            session.close()
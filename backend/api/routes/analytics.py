from flask import jsonify, request
from datetime import date
from sqlalchemy.exc import IntegrityError
from database import SessionLocal
from models import EmployeeWorkload, ServicePopularity
from api.utils.helpers import serialize, get_or_404

def register_basic_analytics_routes(app):
    """Регистрация маршрутов для аналитических данных"""
    
    # EmployeeWorkload
    @app.route('/api/employee_workload', methods=['GET', 'POST'])
    @app.route('/api/employee_workload/<int:schedule_id>', methods=['GET', 'PUT', 'DELETE'])
    def employee_workload(schedule_id=None):
        session = SessionLocal()
        try:
            if request.method == 'GET':
                if schedule_id:
                    workload = get_or_404(session, EmployeeWorkload, schedule_id)
                    if not workload:
                        return jsonify({'error': 'Not found'}), 404
                    return jsonify(serialize(workload))
                else:
                    workloads = session.query(EmployeeWorkload).all()
                    return jsonify([serialize(w) for w in workloads])
                    
            elif request.method == 'POST':
                data = request.json
                booked_slots = data['booked_slots']
                total_slots = data['total_slots']
                
                # Расчет процента загруженности
                workload_percent = round((booked_slots / total_slots) * 100, 2) if total_slots > 0 else 0
                
                workload = EmployeeWorkload(
                    schedule_id=data['schedule_id'],
                    booked_slots=booked_slots,
                    total_slots=total_slots,
                    workload_percent=workload_percent
                )
                session.add(workload)
                session.commit()
                return jsonify(serialize(workload)), 201
                
            elif request.method == 'PUT':
                workload = get_or_404(session, EmployeeWorkload, schedule_id)
                if not workload:
                    return jsonify({'error': 'Not found'}), 404
                data = request.json
                workload.schedule_id = data.get('schedule_id', workload.schedule_id)
                workload.booked_slots = data.get('booked_slots', workload.booked_slots)
                workload.total_slots = data.get('total_slots', workload.total_slots)
                
                # Пересчет процента загруженности при обновлении
                workload.workload_percent = round((workload.booked_slots / workload.total_slots) * 100, 2) if workload.total_slots > 0 else 0
                
                session.commit()
                return jsonify(serialize(workload))
                
            elif request.method == 'DELETE':
                workload = get_or_404(session, EmployeeWorkload, schedule_id)
                if not workload:
                    return jsonify({'error': 'Not found'}), 404
                session.delete(workload)
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

    # ServicePopularity
    @app.route('/api/service_popularity', methods=['GET', 'POST'])
    @app.route('/api/service_popularity/<int:service_id>/<string:month>', methods=['GET', 'PUT', 'DELETE'])
    def service_popularity(service_id=None, month=None):
        session = SessionLocal()
        try:
            if request.method == 'GET':
                if service_id and month:
                    popularity = session.query(ServicePopularity).filter_by(
                        service_id=service_id,
                        month=date.fromisoformat(month)
                    ).first()
                    if not popularity:
                        return jsonify({'error': 'Not found'}), 404
                    return jsonify(serialize(popularity))
                else:
                    popularities = session.query(ServicePopularity).all()
                    return jsonify([serialize(p) for p in popularities])
                    
            elif request.method == 'POST':
                data = request.json
                popularity = ServicePopularity(
                    service_id=data['service_id'],
                    month=date.fromisoformat(data['month']),
                    total_bookings=data['total_bookings']
                )
                session.add(popularity)
                session.commit()
                return jsonify(serialize(popularity)), 201
                
            elif request.method == 'PUT':
                if not service_id or not month:
                    return jsonify({'error': 'service_id and month are required'}), 400
                popularity = session.query(ServicePopularity).filter_by(
                    service_id=service_id,
                    month=date.fromisoformat(month)
                ).first()
                if not popularity:
                    return jsonify({'error': 'Not found'}), 404
                data = request.json
                popularity.service_id = data.get('service_id', popularity.service_id)
                if 'month' in data:
                    popularity.month = date.fromisoformat(data['month'])
                popularity.total_bookings = data.get('total_bookings', popularity.total_bookings)
                session.commit()
                return jsonify(serialize(popularity))
                
            elif request.method == 'DELETE':
                if not service_id or not month:
                    return jsonify({'error': 'service_id and month are required'}), 400
                popularity = session.query(ServicePopularity).filter_by(
                    service_id=service_id,
                    month=date.fromisoformat(month)
                ).first()
                if not popularity:
                    return jsonify({'error': 'Not found'}), 404
                session.delete(popularity)
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
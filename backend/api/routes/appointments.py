from flask import jsonify, request
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from database import SessionLocal
from models import Appointment, AppointmentServicePivot
from api.utils.helpers import serialize, get_or_404
from api.services.appointment_service import AppointmentService
import logging

logger = logging.getLogger(__name__)

def register_appointment_routes(app, notification_service):
    """Регистрация маршрутов для работы с записями"""

    # Appointment
    @app.route('/api/appointments', methods=['GET', 'POST'])
    @app.route('/api/appointments/<int:id>', methods=['GET', 'PUT', 'DELETE'])
    def appointments(id=None):
        session = SessionLocal()
        try:
            if request.method == 'GET':
                if id:
                    appointment = get_or_404(session, Appointment, id)
                    if not appointment:
                        return jsonify({'error': 'Not found'}), 404
                    return jsonify(serialize(appointment))
                else:
                    appointments = session.query(Appointment).all()
                    return jsonify([serialize(a) for a in appointments])

            elif request.method == 'POST':
                data = request.json

                # Получаем данные из запроса
                client_id = data['client_id']
                employee_id = data['employee_id']
                service_id = data.get('service_id')
                complex_id = data.get('complex_id')
                appointment_datetime = datetime.fromisoformat(data['datetime'])
                status = data.get('status', 'scheduled')
                custom_duration = data.get('custom_duration')
                final_price = data.get('final_price')

                # Проверяем, что указана хотя бы одна услуга или комплекс
                if not service_id and not complex_id:
                    return jsonify({'error': 'Необходимо указать услугу или комплекс услуг'}), 400

                try:
                    # Вычисляем продолжительность
                    total_duration = AppointmentService.calculate_duration(
                        session, service_id, complex_id, custom_duration
                    )

                    # Проверяем доступность в расписании
                    AppointmentService.check_schedule_availability(
                        session, employee_id, appointment_datetime, total_duration
                    )

                    # Проверяем конфликты с другими записями
                    AppointmentService.check_time_conflicts(
                        session, employee_id, appointment_datetime, total_duration
                    )

                    # Проверяем исключения в расписании
                    AppointmentService.check_schedule_exceptions(
                        session, employee_id, appointment_datetime, total_duration
                    )

                except ValueError as e:
                    return jsonify({'error': str(e)}), 400

                # Создаем запись
                appointment = Appointment(
                    client_id=client_id,
                    employee_id=employee_id,
                    datetime=appointment_datetime,
                    status=status,
                    service_id=service_id,
                    complex_id=complex_id,
                    custom_duration=custom_duration,
                    final_price=final_price,
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )

                session.add(appointment)
                session.flush()  # Получаем ID созданной записи

                # Создаем связи с услугами и комплексами
                AppointmentService.create_appointment_relations(
                    session, appointment, service_id, complex_id
                )

                session.commit()

                # Отправляем уведомления
                AppointmentService.send_appointment_notification(
                    notification_service, session, appointment.id
                )

                return jsonify(serialize(appointment)), 201

            elif request.method == 'PUT':
                appointment = get_or_404(session, Appointment, id)
                if not appointment:
                    return jsonify({'error': 'Not found'}), 404

                data = request.json
                custom_duration = data.get('custom_duration')

                # Проверяем возможность обновления записи, только если изменяется дата/время, услуга или сотрудник
                if ('datetime' in data and data['datetime'] != appointment.datetime) or \
                   ('service_id' in data and data['service_id'] != appointment.service_id) or \
                   ('employee_id' in data and data['employee_id'] != appointment.employee_id) or \
                   ('custom_duration' in data):

                    appointment_datetime = datetime.fromisoformat(
                        data.get('datetime', appointment.datetime).replace('Z', '+00:00')
                        if isinstance(data.get('datetime', appointment.datetime), str)
                        else data.get('datetime', appointment.datetime).isoformat()
                    )
                    employee_id = data.get('employee_id', appointment.employee_id)
                    service_id = data.get('service_id')

                    try:
                        # Вычисляем продолжительность
                        if custom_duration is not None:
                            total_duration = custom_duration
                        elif service_id:
                            total_duration = AppointmentService.calculate_duration(
                                session, service_id=service_id
                            )
                        elif appointment.custom_duration:
                            total_duration = appointment.custom_duration
                        else:
                            total_duration = AppointmentService.get_appointment_duration(session, appointment)

                        # Проверяем конфликты с другими записями (исключая текущую)
                        AppointmentService.check_time_conflicts(
                            session, employee_id, appointment_datetime, total_duration, id
                        )

                        # Проверяем расписание работы сотрудника
                        AppointmentService.check_schedule_availability(
                            session, employee_id, appointment_datetime, total_duration
                        )

                        # Проверяем исключения в расписании
                        AppointmentService.check_schedule_exceptions(
                            session, employee_id, appointment_datetime, total_duration
                        )

                    except ValueError as e:
                        return jsonify({'error': str(e)}), 409

                # Обновляем запись
                appointment.client_id = data.get('client_id', appointment.client_id)
                appointment.employee_id = data.get('employee_id', appointment.employee_id)
                appointment.datetime = data.get('datetime', appointment.datetime)
                appointment.status = data.get('status', appointment.status)
                appointment.service_id = data.get('service_id', appointment.service_id)
                appointment.complex_id = data.get('complex_id', appointment.complex_id)
                appointment.custom_duration = data.get('custom_duration', appointment.custom_duration)
                appointment.is_paid = data.get('is_paid', appointment.is_paid)
                appointment.is_completed = data.get('is_completed', appointment.is_completed)
                appointment.notes = data.get('notes', appointment.notes)
                appointment.final_price = data.get('final_price', appointment.final_price)
                appointment.updated_at = datetime.now()

                # Обновляем связь с услугой, если она указана
                if 'service_id' in data:
                    service_id = data.get('service_id')

                    # Получаем текущую связь с услугой
                    service_pivot = session.query(AppointmentServicePivot).filter_by(
                        appointment_id=appointment.id
                    ).first()

                    if service_pivot and service_id:
                        # Обновляем существующую связь
                        service_pivot.service_id = service_id
                    elif service_id:
                        # Создаем новую связь
                        new_pivot = AppointmentServicePivot(
                            appointment_id=appointment.id,
                            service_id=service_id
                        )
                        session.add(new_pivot)

                session.commit()
                return jsonify(serialize(appointment))

            elif request.method == 'DELETE':
                appointment = get_or_404(session, Appointment, id)
                if not appointment:
                    return jsonify({'error': 'Not found'}), 404
                session.delete(appointment)
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

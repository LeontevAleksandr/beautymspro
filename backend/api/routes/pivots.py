from flask import jsonify, request
from sqlalchemy.exc import IntegrityError
from database import SessionLocal
from models import (
    ServiceComplexPivot, ScheduleAppointment, 
    AppointmentServicePivot, AppointmentComplexPivot,
    SpecializationQualificationPivot, ServiceQualificationPivot
)
from api.utils.helpers import serialize

def register_pivot_routes(app):
    """Регистрация маршрутов для связующих таблиц (многие-ко-многим)"""
    
    # ServiceComplexPivot
    @app.route('/api/service_complex_pivot', methods=['GET', 'POST'])
    @app.route('/api/service_complex_pivot/<int:service_id>/<int:complex_id>', methods=['DELETE'])
    def service_complex_pivot(service_id=None, complex_id=None):
        session = SessionLocal()
        try:
            if request.method == 'GET':
                pivots = session.query(ServiceComplexPivot).all()
                return jsonify([{'service_id': p.service_id, 'complex_id': p.complex_id} for p in pivots])
                    
            elif request.method == 'POST':
                data = request.json
                pivot = ServiceComplexPivot(
                    service_id=data['service_id'],
                    complex_id=data['complex_id']
                )
                session.add(pivot)
                session.commit()
                return jsonify({'service_id': pivot.service_id, 'complex_id': pivot.complex_id}), 201
                
            elif request.method == 'DELETE':
                if not service_id or not complex_id:
                    return jsonify({'error': 'service_id and complex_id are required'}), 400
                pivot = session.query(ServiceComplexPivot).filter_by(
                    service_id=service_id,
                    complex_id=complex_id
                ).first()
                if not pivot:
                    return jsonify({'error': 'Not found'}), 404
                session.delete(pivot)
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

    # ScheduleAppointment
    @app.route('/api/schedule_appointment', methods=['GET', 'POST'])
    @app.route('/api/schedule_appointment/<int:schedule_id>/<int:appointment_id>', methods=['DELETE'])
    def schedule_appointment(schedule_id=None, appointment_id=None):
        session = SessionLocal()
        try:
            if request.method == 'GET':
                pivots = session.query(ScheduleAppointment).all()
                return jsonify([{'schedule_id': p.schedule_id, 'appointment_id': p.appointment_id} for p in pivots])
                        
            elif request.method == 'POST':
                data = request.json
                pivot = ScheduleAppointment(
                    schedule_id=data['schedule_id'],
                    appointment_id=data['appointment_id']
                )
                session.add(pivot)
                session.commit()
                return jsonify({'schedule_id': pivot.schedule_id, 'appointment_id': pivot.appointment_id}), 201
                
            elif request.method == 'DELETE':
                if not schedule_id or not appointment_id:
                    return jsonify({'error': 'schedule_id and appointment_id are required'}), 400
                pivot = session.query(ScheduleAppointment).filter_by(
                    schedule_id=schedule_id,
                    appointment_id=appointment_id
                ).first()
                if not pivot:
                    return jsonify({'error': 'Not found'}), 404
                session.delete(pivot)
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

    # AppointmentServicePivot
    @app.route('/api/appointment_service_pivot', methods=['GET', 'POST'])
    @app.route('/api/appointment_service_pivot/<int:service_id>/<int:appointment_id>', methods=['GET', 'PUT', 'DELETE'])
    def appointment_service_pivot(service_id=None, appointment_id=None):
        session = SessionLocal()
        try:
            if request.method == 'GET':
                if service_id and appointment_id:
                    pivot = session.query(AppointmentServicePivot).filter_by(
                        service_id=service_id, appointment_id=appointment_id
                    ).first()
                    if not pivot:
                        return jsonify({'error': 'Not found'}), 404
                    return jsonify(serialize(pivot))
                else:
                    pivots = session.query(AppointmentServicePivot).all()
                    return jsonify([serialize(p) for p in pivots])
                    
            elif request.method == 'POST':
                data = request.json
                pivot = AppointmentServicePivot(
                    service_id=data['service_id'],
                    appointment_id=data['appointment_id'],
                    custom_duration=data.get('custom_duration')  # Опциональный параметр
                )
                session.add(pivot)
                session.commit()
                return jsonify(serialize(pivot)), 201
                
            elif request.method == 'PUT':
                pivot = session.query(AppointmentServicePivot).filter_by(
                    service_id=service_id, appointment_id=appointment_id
                ).first()
                if not pivot:
                    return jsonify({'error': 'Not found'}), 404
                data = request.json
                if 'custom_duration' in data:
                    pivot.custom_duration = data['custom_duration']
                session.commit()
                return jsonify(serialize(pivot))
                
            elif request.method == 'DELETE':
                pivot = session.query(AppointmentServicePivot).filter_by(
                    service_id=service_id, appointment_id=appointment_id
                ).first()
                if not pivot:
                    return jsonify({'error': 'Not found'}), 404
                session.delete(pivot)
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

    # AppointmentComplexPivot
    @app.route('/api/appointment_complex_pivot', methods=['GET', 'POST'])
    @app.route('/api/appointment_complex_pivot/<int:complex_id>/<int:appointment_id>', methods=['DELETE'])
    def appointment_complex_pivot(complex_id=None, appointment_id=None):
        session = SessionLocal()
        try:
            if request.method == 'GET':
                pivots = session.query(AppointmentComplexPivot).all()
                return jsonify([{'complex_id': p.complex_id, 'appointment_id': p.appointment_id} for p in pivots])
                    
            elif request.method == 'POST':
                data = request.json
                pivot = AppointmentComplexPivot(
                    complex_id=data['complex_id'],
                    appointment_id=data['appointment_id']
                )
                session.add(pivot)
                session.commit()
                return jsonify({'complex_id': pivot.complex_id, 'appointment_id': pivot.appointment_id}), 201
                
            elif request.method == 'DELETE':
                if not complex_id or not appointment_id:
                    return jsonify({'error': 'complex_id and appointment_id are required'}), 400
                pivot = session.query(AppointmentComplexPivot).filter_by(
                    complex_id=complex_id,
                    appointment_id=appointment_id
                ).first()
                if not pivot:
                    return jsonify({'error': 'Not found'}), 404
                session.delete(pivot)
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

    # SpecializationQualificationPivot
    @app.route('/api/specialization_qualifications', methods=['GET', 'POST'])
    @app.route('/api/specialization_qualifications/<int:specialization_id>/<int:qualification_id>', methods=['GET', 'PUT', 'DELETE'])
    def specialization_qualifications(specialization_id=None, qualification_id=None):
        session = SessionLocal()
        try:
            if request.method == 'GET':
                if specialization_id is not None and qualification_id is not None:
                    spec_qual = session.query(SpecializationQualificationPivot).filter_by(
                        specialization_id=specialization_id, 
                        qualification_id=qualification_id
                    ).first()
                    if not spec_qual:
                        return jsonify({'error': 'Not found'}), 404
                    
                    result = serialize(spec_qual)
                    result['specialization'] = serialize(spec_qual.specialization_qualifications) if hasattr(spec_qual, 'specialization_qualifications') else None
                    result['qualification'] = serialize(spec_qual.qualification) if hasattr(spec_qual, 'qualification') else None
                    return jsonify(result)
                else:
                    spec_quals = session.query(SpecializationQualificationPivot).all()
                    result = []
                    for sq in spec_quals:
                        item = serialize(sq)
                        item['specialization'] = serialize(sq.specialization_qualifications) if hasattr(sq, 'specialization_qualifications') else None
                        item['qualification'] = serialize(sq.qualification) if hasattr(sq, 'qualification') else None
                        result.append(item)
                    return jsonify(result)
                    
            elif request.method == 'POST':
                data = request.json
                spec_qual = SpecializationQualificationPivot(
                    specialization_id=data['specialization_id'],
                    qualification_id=data['qualification_id'],
                    description=data.get('description')
                )
                session.add(spec_qual)
                session.commit()
                return jsonify(serialize(spec_qual)), 201
                
            elif request.method == 'PUT':
                spec_qual = session.query(SpecializationQualificationPivot).filter_by(
                    specialization_id=specialization_id, 
                    qualification_id=qualification_id
                ).first()
                if not spec_qual:
                    return jsonify({'error': 'Not found'}), 404
                    
                data = request.json
                spec_qual.description = data.get('description', spec_qual.description)
                session.commit()
                return jsonify(serialize(spec_qual))
                
            elif request.method == 'DELETE':
                spec_qual = session.query(SpecializationQualificationPivot).filter_by(
                    specialization_id=specialization_id, 
                    qualification_id=qualification_id
                ).first()
                if not spec_qual:
                    return jsonify({'error': 'Not found'}), 404
                    
                session.delete(spec_qual)
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

    # ServiceQualificationPivot
    @app.route('/api/service_qualifications', methods=['GET', 'POST'])
    @app.route('/api/service_qualifications/<int:service_id>/<int:qualification_id>', methods=['GET', 'PUT', 'DELETE'])
    @app.route('/api/service_qualifications/<int:service_id>', methods=['DELETE'])
    def service_qualifications(service_id=None, qualification_id=None):
        session = SessionLocal()
        try:
            if request.method == 'GET':
                if service_id is not None and qualification_id is not None:
                    service_qual = session.query(ServiceQualificationPivot).filter_by(
                        service_id=service_id, 
                        qualification_id=qualification_id
                    ).first()
                    if not service_qual:
                        return jsonify({'error': 'Not found'}), 404
                    
                    result = serialize(service_qual)
                    result['service'] = serialize(service_qual.service) if hasattr(service_qual, 'service') else None
                    result['qualification'] = serialize(service_qual.qualification) if hasattr(service_qual, 'qualification') else None
                    return jsonify(result)
                else:
                    service_quals = session.query(ServiceQualificationPivot).all()
                    result = []
                    for sq in service_quals:
                        item = serialize(sq)
                        item['service'] = serialize(sq.service) if hasattr(sq, 'service') else None
                        item['qualification'] = serialize(sq.qualification) if hasattr(sq, 'qualification') else None
                        result.append(item)
                    return jsonify(result)
                    
            elif request.method == 'POST':
                data = request.json
                service_qual = ServiceQualificationPivot(
                    service_id=data['service_id'],
                    qualification_id=data['qualification_id'],
                    price_modified=data.get('price_modified', 0.0),
                    is_allowed=data.get('is_allowed', True)
                )
                session.add(service_qual)
                session.commit()
                return jsonify(serialize(service_qual)), 201
                
            elif request.method == 'PUT':
                service_qual = session.query(ServiceQualificationPivot).filter_by(
                    service_id=service_id, 
                    qualification_id=qualification_id
                ).first()
                if not service_qual:
                    return jsonify({'error': 'Not found'}), 404
                    
                data = request.json
                service_qual.price_modified = data.get('price_modified', service_qual.price_modified)
                service_qual.is_allowed = data.get('is_allowed', service_qual.is_allowed)
                session.commit()
                return jsonify(serialize(service_qual))
                
            elif request.method == 'DELETE':
                if service_id is not None and qualification_id is not None:
                    # Удаление конкретной связи
                    service_qual = session.query(ServiceQualificationPivot).filter_by(
                        service_id=service_id, 
                        qualification_id=qualification_id
                    ).first()
                    if not service_qual:
                        return jsonify({'error': 'Not found'}), 404
                        
                    session.delete(service_qual)
                    session.commit()
                    return jsonify({'message': 'Deleted successfully'}), 200
                elif service_id is not None:
                    # Удаление всех связей для услуги
                    service_quals = session.query(ServiceQualificationPivot).filter_by(
                        service_id=service_id
                    ).all()
                    
                    for sq in service_quals:
                        session.delete(sq)
                    
                    session.commit()
                    return jsonify({'message': 'All qualifications for service deleted successfully'}), 200
                
        except IntegrityError as e:
            session.rollback()
            return jsonify({'error': 'Integrity error', 'details': str(e)}), 400
        except Exception as e:
            session.rollback()
            return jsonify({'error': str(e)}), 400
        finally:
            session.close()

def register_specialization_helper_routes(app):
    """Регистрация вспомогательных маршрутов для специализаций"""
    
    # Get qualifications for a specific specialization
    @app.route('/api/specializations/<int:specialization_id>/qualifications', methods=['GET'])
    def get_specialization_qualifications(specialization_id):
        session = SessionLocal()
        try:
            spec_quals = session.query(SpecializationQualificationPivot).filter_by(
                specialization_id=specialization_id
            ).all()
            
            result = []
            for sq in spec_quals:
                item = serialize(sq)
                item['qualification'] = serialize(sq.qualification) if hasattr(sq, 'qualification') else None
                result.append(item)
                
            return jsonify(result)
        except Exception as e:
            return jsonify({'error': str(e)}), 400
        finally:
            session.close()
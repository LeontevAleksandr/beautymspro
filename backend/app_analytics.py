from flask import Flask, jsonify, request
from datetime import datetime, date, time, timedelta
import enum
from .database import engine
from .models import Base

from .models import (
    ClientStatus, Client, Specialization, Employee, 
    ServiceComplex, Service, Appointment, Schedule,
    ClientPreferences, ScheduleException, Notification,
    EmployeeWorkload, ServicePopularity, Qualification,
    ServiceComplexPivot, ScheduleAppointment,
    AppointmentServicePivot, AppointmentComplexPivot, 
    SpecializationQualificationPivot, ServiceQualificationPivot
)

from .database import SessionLocal
from sqlalchemy.exc import IntegrityError
import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import logging
from flask_cors import CORS

from sqlalchemy import func, extract, case, and_, or_, desc, distinct, text, Integer
from sqlalchemy.sql import label

def register_analytics_routes(app, SessionLocal, Service, ServicePopularity, Employee, Schedule, EmployeeWorkload, Appointment):
    @app.route('/api/analytics/service_popularity', methods=['GET'])
    def analytics_service_popularity():
        """
        Получение данных о популярности услуг
        Параметры запроса:
        - start_date: начальная дата (YYYY-MM-DD)
        - end_date: конечная дата (YYYY-MM-DD)
        - limit: ограничение количества результатов (по умолчанию 10)
        """
        session = SessionLocal()
        try:
            # Получаем параметры запроса
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')
            limit = int(request.args.get('limit', 10))
            
            # Базовый запрос
            query = session.query(
                Service.id,
                Service.name,
                ServicePopularity.month,
                ServicePopularity.total_bookings
            ).join(
                ServicePopularity, 
                Service.id == ServicePopularity.service_id
            )
            
            # Применяем фильтры по датам, если они указаны
            if start_date:
                query = query.filter(ServicePopularity.month >= date.fromisoformat(start_date))
            if end_date:
                query = query.filter(ServicePopularity.month <= date.fromisoformat(end_date))
                
            # Выполняем запрос и форматируем результат
            results = query.all()
            
            # Группируем данные по услугам и месяцам
            services_data = {}
            months = set()
            
            for service_id, service_name, month, bookings in results:
                month_str = month.strftime('%Y-%m')
                months.add(month_str)
                
                if service_id not in services_data:
                    services_data[service_id] = {
                        'service_id': service_id,
                        'service_name': service_name,
                        'months': {},
                        'total_bookings': 0
                    }
                
                services_data[service_id]['months'][month_str] = bookings
                services_data[service_id]['total_bookings'] += bookings
            
            # Сортируем услуги по общему количеству бронирований
            sorted_services = sorted(
                services_data.values(), 
                key=lambda x: x['total_bookings'], 
                reverse=True
            )[:limit]
            
            # Формируем ответ
            response = {
                'services': sorted_services,
                'months': sorted(list(months))
            }
            
            return jsonify(response)
        except Exception as e:
            return jsonify({'error': str(e)}), 400
        finally:
            session.close()

    @app.route('/api/analytics/service_popularity_comparison', methods=['GET'])
    def analytics_service_popularity_comparison():
        """
        Сравнение популярности услуг в разные периоды
        Параметры запроса:
        - period1_start: начало первого периода (YYYY-MM-DD)
        - period1_end: конец первого периода (YYYY-MM-DD)
        - period2_start: начало второго периода (YYYY-MM-DD)
        - period2_end: конец второго периода (YYYY-MM-DD)
        - limit: ограничение количества услуг (по умолчанию 10)
        """
        session = SessionLocal()
        try:
            # Получаем параметры запроса
            period1_start = request.args.get('period1_start')
            period1_end = request.args.get('period1_end')
            period2_start = request.args.get('period2_start')
            period2_end = request.args.get('period2_end')
            limit = int(request.args.get('limit', 10))
            
            if not all([period1_start, period1_end, period2_start, period2_end]):
                return jsonify({'error': 'Необходимо указать все периоды'}), 400
            
            # Запрос для первого периода
            period1_query = session.query(
                Service.id,
                Service.name,
                func.sum(ServicePopularity.total_bookings).label('period1_bookings')
            ).join(
                ServicePopularity, 
                Service.id == ServicePopularity.service_id
            ).filter(
                ServicePopularity.month >= date.fromisoformat(period1_start),
                ServicePopularity.month <= date.fromisoformat(period1_end)
            ).group_by(
                Service.id,
                Service.name
            ).subquery()
            
            # Запрос для второго периода
            period2_query = session.query(
                Service.id,
                Service.name,
                func.sum(ServicePopularity.total_bookings).label('period2_bookings')
            ).join(
                ServicePopularity, 
                Service.id == ServicePopularity.service_id
            ).filter(
                ServicePopularity.month >= date.fromisoformat(period2_start),
                ServicePopularity.month <= date.fromisoformat(period2_end)
            ).group_by(
                Service.id,
                Service.name
            ).subquery()
            
            # Объединяем результаты
            result_query = session.query(
                Service.id,
                Service.name,
                func.coalesce(period1_query.c.period1_bookings, 0).label('period1_bookings'),
                func.coalesce(period2_query.c.period2_bookings, 0).label('period2_bookings')
            ).outerjoin(
                period1_query,
                Service.id == period1_query.c.id
            ).outerjoin(
                period2_query,
                Service.id == period2_query.c.id
            ).filter(
                or_(
                    period1_query.c.period1_bookings > 0,
                    period2_query.c.period2_bookings > 0
                )
            ).order_by(
                desc(func.coalesce(period1_query.c.period1_bookings, 0) + 
                    func.coalesce(period2_query.c.period2_bookings, 0))
            ).limit(limit)
            
            results = result_query.all()
            
            # Формируем ответ
            response = {
                'period1': {
                    'start': period1_start,
                    'end': period1_end
                },
                'period2': {
                    'start': period2_start,
                    'end': period2_end
                },
                'services': [
                    {
                        'service_id': service_id,
                        'service_name': service_name,
                        'period1_bookings': int(period1_bookings),
                        'period2_bookings': int(period2_bookings),
                        'change_percent': round(((period2_bookings - period1_bookings) / period1_bookings * 100) 
                                            if period1_bookings > 0 else 0, 2)
                    }
                    for service_id, service_name, period1_bookings, period2_bookings in results
                ]
            }
            
            return jsonify(response)
        except Exception as e:
            return jsonify({'error': str(e)}), 400
        finally:
            session.close()

    @app.route('/api/analytics/employee_workload', methods=['GET'])
    def analytics_employee_workload():
        """
        Получение данных о загруженности сотрудников
        Параметры запроса:
        - start_date: начальная дата (YYYY-MM-DD)
        - end_date: конечная дата (YYYY-MM-DD)
        - group_by: группировка (day, week, month) - по умолчанию day
        """
        session = SessionLocal()
        try:
            # Получаем параметры запроса
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')
            group_by = request.args.get('group_by', 'day')
            
            if not all([start_date, end_date]):
                return jsonify({'error': 'Необходимо указать начальную и конечную даты'}), 400
            
            # Преобразуем строки в объекты date
            start_date_obj = date.fromisoformat(start_date)
            end_date_obj = date.fromisoformat(end_date)
            
            # Базовый запрос - изменен для получения данных напрямую из расписаний и записей
            query = session.query(
                Employee.id,
                Employee.full_name,
                Schedule.date,
                # Подсчитываем количество записей для каждого сотрудника на эту дату
                func.count(distinct(case(
                    (and_(
                        Appointment.employee_id == Employee.id,
                        func.date(Appointment.datetime) == Schedule.date,
                        Appointment.status != 'cancelled'
                    ), Appointment.id),
                    else_=None
                ))).label('booked_slots'),
                # Вычисляем общее количество слотов на основе времени начала и окончания
                func.cast(
                    (extract('epoch', Schedule.end_time) - extract('epoch', Schedule.start_time)) / 3600,
                    Integer
                ).label('total_slots')
            ).join(
                Schedule, 
                Employee.id == Schedule.employee_id
            ).outerjoin(
                Appointment,
                and_(
                    Appointment.employee_id == Employee.id,
                    func.date(Appointment.datetime) == Schedule.date
                )
            ).filter(
                Schedule.date >= start_date_obj,
                Schedule.date <= end_date_obj
            ).group_by(
                Employee.id,
                Employee.full_name,
                Schedule.date,
                Schedule.start_time,
                Schedule.end_time
            )
            
            # Выполняем запрос
            results = query.all()
            
            # Группируем данные по сотрудникам и периодам
            employees_data = {}
            
            for emp_id, emp_name, schedule_date, booked_slots, total_slots in results:
                if emp_id not in employees_data:
                    employees_data[emp_id] = {
                        'employee_id': emp_id,
                        'employee_name': emp_name,
                        'workload': []
                    }
                
                # Определяем период в зависимости от группировки
                if group_by == 'day':
                    period = schedule_date.isoformat()
                elif group_by == 'week':
                    # Получаем номер недели и год
                    year, week, _ = schedule_date.isocalendar()
                    period = f"{year}-W{week:02d}"
                elif group_by == 'month':
                    period = schedule_date.strftime('%Y-%m')
                
                # Ищем существующий период или создаем новый
                period_data = next((p for p in employees_data[emp_id]['workload'] if p['period'] == period), None)
                
                if period_data is None:
                    period_data = {
                        'period': period,
                        'booked_slots': 0,
                        'total_slots': 0
                    }
                    employees_data[emp_id]['workload'].append(period_data)
                
                period_data['booked_slots'] += booked_slots
                period_data['total_slots'] += total_slots
            
            # Вычисляем процент загруженности для каждого периода
            for emp_data in employees_data.values():
                for period in emp_data['workload']:
                    period['workload_percent'] = round(period['booked_slots'] / period['total_slots'] * 100, 2) if period['total_slots'] > 0 else 0
            
            # Формируем ответ
            response = {
                'start_date': start_date,
                'end_date': end_date,
                'group_by': group_by,
                'employees': list(employees_data.values())
            }
            
            return jsonify(response)
        except Exception as e:
            return jsonify({'error': str(e)}), 400
        finally:
            session.close()

    @app.route('/api/analytics/employee_workload_by_weekday', methods=['GET'])
    def analytics_employee_workload_by_weekday():
        """
        Анализ загруженности сотрудников по дням недели
        Параметры запроса:
        - start_date: начальная дата (YYYY-MM-DD)
        - end_date: конечная дата (YYYY-MM-DD)
        - employee_id: ID сотрудника (опционально)
        """
        session = SessionLocal()
        try:
            # Получаем параметры запроса
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')
            employee_id = request.args.get('employee_id')
            
            if not all([start_date, end_date]):
                return jsonify({'error': 'Необходимо указать начальную и конечную даты'}), 400
            
            # Базовый запрос
            query = session.query(
                Employee.id,
                Employee.full_name,
                extract('dow', Schedule.date).label('weekday'),
                func.sum(EmployeeWorkload.booked_slots).label('booked_slots'),
                func.sum(EmployeeWorkload.total_slots).label('total_slots')
            ).join(
                Schedule, 
                EmployeeWorkload.schedule_id == Schedule.id
            ).join(
                Employee,
                Schedule.employee_id == Employee.id
            ).filter(
                Schedule.date >= date.fromisoformat(start_date),
                Schedule.date <= date.fromisoformat(end_date)
            )
            
            # Фильтруем по сотруднику, если указан
            if employee_id:
                query = query.filter(Employee.id == employee_id)
            
            # Группируем по сотруднику и дню недели
            query = query.group_by(
                Employee.id,
                Employee.full_name,
                'weekday'
            ).order_by(
                Employee.id,
                'weekday'
            )
            
            results = query.all()
            
            # Группируем данные по сотрудникам
            employees_data = {}
            
            weekday_names = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
            
            for emp_id, emp_name, weekday, booked_slots, total_slots in results:
                if emp_id not in employees_data:
                    employees_data[emp_id] = {
                        'employee_id': emp_id,
                        'employee_name': emp_name,
                        'weekdays': []
                    }
                
                workload_percent = round(booked_slots / total_slots * 100, 2) if total_slots > 0 else 0
                
                employees_data[emp_id]['weekdays'].append({
                    'weekday': int(weekday),
                    'weekday_name': weekday_names[int(weekday)],
                    'booked_slots': int(booked_slots),
                    'total_slots': int(total_slots),
                    'workload_percent': workload_percent
                })
            
            # Формируем ответ
            response = {
                'start_date': start_date,
                'end_date': end_date,
                'employees': list(employees_data.values())
            }
            
            return jsonify(response)
        except Exception as e:
            return jsonify({'error': str(e)}), 400
        finally:
            session.close()

    @app.route('/api/analytics/financial', methods=['GET'])
    def analytics_financial():
        """
        Финансовая аналитика
        Параметры запроса:
        - start_date: начальная дата (YYYY-MM-DD)
        - end_date: конечная дата (YYYY-MM-DD)
        - group_by: группировка (day, week, month) - по умолчанию month
        """
        session = SessionLocal()
        try:
            # Получаем параметры запроса
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')
            group_by = request.args.get('group_by', 'month')
            
            if not all([start_date, end_date]):
                return jsonify({'error': 'Необходимо указать начальную и конечную даты'}), 400
            
            start_datetime = datetime.combine(date.fromisoformat(start_date), time.min)
            end_datetime = datetime.combine(date.fromisoformat(end_date), time.max)
            
            # Базовый запрос для получения данных о доходах
            query = session.query(
                Appointment.id,
                Appointment.datetime,
                Appointment.final_price,
                Service.id.label('service_id'),
                Service.name.label('service_name'),
                Employee.id.label('employee_id'),
                Employee.full_name.label('employee_name')
            ).join(
                Service, 
                Appointment.service_id == Service.id
            ).join(
                Employee,
                Appointment.employee_id == Employee.id
            ).filter(
                Appointment.is_paid == True,
                Appointment.datetime >= start_datetime,
                Appointment.datetime <= end_datetime
            )
            
            appointments = query.all()
            
            # Группируем данные по периодам
            periods_data = {}
            service_revenue = {}
            employee_revenue = {}
            
            for app_id, app_datetime, price, service_id, service_name, employee_id, employee_name in appointments:
                # Определяем период в зависимости от группировки
                if group_by == 'day':
                    period = app_datetime.date().isoformat()
                elif group_by == 'week':
                    # Получаем номер недели и год
                    year, week, _ = app_datetime.date().isocalendar()
                    period = f"{year}-W{week:02d}"
                elif group_by == 'month':
                    period = app_datetime.strftime('%Y-%m')
                
                # Добавляем данные по периоду
                if period not in periods_data:
                    periods_data[period] = {
                        'period': period,
                        'revenue': 0,
                        'appointments_count': 0
                    }
                
                periods_data[period]['revenue'] += price
                periods_data[period]['appointments_count'] += 1
                
                # Добавляем данные по услуге
                if service_id not in service_revenue:
                    service_revenue[service_id] = {
                        'service_id': service_id,
                        'service_name': service_name,
                        'revenue': 0,
                        'appointments_count': 0
                    }
                
                service_revenue[service_id]['revenue'] += price
                service_revenue[service_id]['appointments_count'] += 1
                
                # Добавляем данные по сотруднику
                if employee_id not in employee_revenue:
                    employee_revenue[employee_id] = {
                        'employee_id': employee_id,
                        'employee_name': employee_name,
                        'revenue': 0,
                        'appointments_count': 0
                    }
                
                employee_revenue[employee_id]['revenue'] += price
                employee_revenue[employee_id]['appointments_count'] += 1
            
            # Вычисляем средний чек
            total_revenue = sum(period['revenue'] for period in periods_data.values())
            total_appointments = sum(period['appointments_count'] for period in periods_data.values())
            average_check = round(total_revenue / total_appointments, 2) if total_appointments > 0 else 0
            
            # Сортируем данные
            sorted_periods = sorted(periods_data.values(), key=lambda x: x['period'])
            sorted_services = sorted(service_revenue.values(), key=lambda x: x['revenue'], reverse=True)
            sorted_employees = sorted(employee_revenue.values(), key=lambda x: x['revenue'], reverse=True)
            
            # Формируем ответ
            response = {
                'start_date': start_date,
                'end_date': end_date,
                'group_by': group_by,
                'total_revenue': total_revenue,
                'total_appointments': total_appointments,
                'average_check': average_check,
                'periods': sorted_periods,
                'services': sorted_services,
                'employees': sorted_employees
            }
            
            return jsonify(response)
        except Exception as e:
            return jsonify({'error': str(e)}), 400
        finally:
            session.close()

    @app.route('/api/analytics/clients', methods=['GET'])
    def analytics_clients():
        """
        Клиентская аналитика
        Параметры запроса:
        - start_date: начальная дата (YYYY-MM-DD)
        - end_date: конечная дата (YYYY-MM-DD)
        - group_by: группировка для новых клиентов (day, week, month) - по умолчанию month
        """
        session = SessionLocal()
        try:
            # Получаем параметры запроса
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')
            group_by = request.args.get('group_by', 'month')
            
            if not all([start_date, end_date]):
                return jsonify({'error': 'Необходимо указать начальную и конечную даты'}), 400
            
            start_datetime = datetime.combine(date.fromisoformat(start_date), time.min)
            end_datetime = datetime.combine(date.fromisoformat(end_date), time.max)
            
            # Получаем общее количество клиентов
            total_clients = session.query(Client).count()
            
            # Получаем новых клиентов за период с группировкой
            if group_by == 'day':
                date_format = func.date_trunc('day', Client.created_at)
            elif group_by == 'week':
                date_format = func.date_trunc('week', Client.created_at)
            else:  # month
                date_format = func.date_trunc('month', Client.created_at)
            
            new_clients_query = session.query(
                date_format.label('period'),
                func.count(Client.id).label('new_clients')
            ).filter(
                Client.created_at >= start_datetime,
                Client.created_at <= end_datetime
            ).group_by('period').order_by('period')
            
            new_clients_data = []
            for period, count in new_clients_query:
                if group_by == 'day':
                    period_str = period.date().isoformat()
                elif group_by == 'week':
                    year, week, _ = period.date().isocalendar()
                    period_str = f"{year}-W{week:02d}"
                else:  # month
                    period_str = period.strftime('%Y-%m')
                    
                new_clients_data.append({
                    'period': period_str,
                    'new_clients': count
                })
            
            # Получаем распределение клиентов по статусам
            status_distribution = session.query(
                ClientStatus.id,
                ClientStatus.status,
                func.count(ClientPreferences.client_id).label('count')
            ).join(
                ClientPreferences,
                ClientStatus.id == ClientPreferences.client_status_id
            ).group_by(
                ClientStatus.id,
                ClientStatus.status
            ).all()
            
            # Получаем частоту повторных посещений
            repeat_visits_query = session.query(
                Client.id,
                Client.full_name,
                func.count(Appointment.id).label('visits_count')
            ).join(
                Appointment,
                Client.id == Appointment.client_id
            ).filter(
                Appointment.datetime >= start_datetime,
                Appointment.datetime <= end_datetime
            ).group_by(
                Client.id,
                Client.full_name
            ).order_by(desc('visits_count'))
            
            repeat_visits = []
            for client_id, client_name, visits_count in repeat_visits_query:
                repeat_visits.append({
                    'client_id': client_id,
                    'client_name': client_name,
                    'visits_count': visits_count
                })
            
            # Получаем предпочтения клиентов по услугам
            client_preferences_query = session.query(
                Service.id,
                Service.name,
                func.count(Appointment.id).label('bookings_count')
            ).join(
                Appointment,
                Service.id == Appointment.service_id
            ).filter(
                Appointment.datetime >= start_datetime,
                Appointment.datetime <= end_datetime
            ).group_by(
                Service.id,
                Service.name
            ).order_by(desc('bookings_count'))
            
            client_preferences = []
            for service_id, service_name, bookings_count in client_preferences_query:
                client_preferences.append({
                    'service_id': service_id,
                    'service_name': service_name,
                    'bookings_count': bookings_count
                })
            
            # Формируем ответ
            response = {
                'start_date': start_date,
                'end_date': end_date,
                'total_clients': total_clients,
                'new_clients': {
                    'group_by': group_by,
                    'data': new_clients_data
                },
                'status_distribution': [
                    {
                        'status_id': status_id,
                        'status': status,
                        'count': count
                    }
                    for status_id, status, count in status_distribution
                ],
                'repeat_visits': repeat_visits,
                'service_preferences': client_preferences
            }
            
            return jsonify(response)
        except Exception as e:
            return jsonify({'error': str(e)}), 400
        finally:
            session.close()

    @app.route('/api/analytics/service_seasonal', methods=['GET'])
    def analytics_service_seasonal():
        """
        Сезонный анализ популярности услуг
        Параметры запроса:
        - years: список годов для анализа (например, 2022,2023)
        - limit: ограничение количества услуг (по умолчанию 10)
        """
        session = SessionLocal()
        try:
            # Получаем параметры запроса
            years_param = request.args.get('years', '')
            limit = int(request.args.get('limit', 10))
            
            years = [int(year) for year in years_param.split(',')] if years_param else [datetime.now().year]
            
            # Базовый запрос для получения данных о популярности услуг по месяцам
            query = session.query(
                Service.id,
                Service.name,
                extract('year', ServicePopularity.month).label('year'),
                extract('month', ServicePopularity.month).label('month'),
                func.sum(ServicePopularity.total_bookings).label('bookings')
            ).join(
                ServicePopularity, 
                Service.id == ServicePopularity.service_id
            ).filter(
                extract('year', ServicePopularity.month).in_(years)
            ).group_by(
                Service.id,
                Service.name,
                'year',
                'month'
            ).order_by(
                Service.id,
                'year',
                'month'
            )
            
            results = query.all()
            
            # Группируем данные по услугам и месяцам
            services_data = {}
            
            for service_id, service_name, year, month, bookings in results:
                if service_id not in services_data:
                    services_data[service_id] = {
                        'service_id': service_id,
                        'service_name': service_name,
                        'years': {}
                    }
                
                year_int = int(year)
                month_int = int(month)
                
                if year_int not in services_data[service_id]['years']:
                    services_data[service_id]['years'][year_int] = {
                        'months': [0] * 12,
                        'total': 0
                    }
                
                services_data[service_id]['years'][year_int]['months'][month_int - 1] = int(bookings)
                services_data[service_id]['years'][year_int]['total'] += int(bookings)
            
            # Вычисляем общую популярность для сортировки
            for service_id in services_data:
                services_data[service_id]['total_bookings'] = sum(
                    year_data['total'] for year_data in services_data[service_id]['years'].values()
                )
            
            # Сортируем услуги по общему количеству бронирований
            sorted_services = sorted(
                services_data.values(), 
                key=lambda x: x['total_bookings'], 
                reverse=True
            )[:limit]
            
            # Формируем ответ
            response = {
                'years': years,
                'services': sorted_services
            }
            
            return jsonify(response)
        except Exception as e:
            return jsonify({'error': str(e)}), 400
        finally:
            session.close()

    @app.route('/api/analytics/service_correlation', methods=['GET'])
    def analytics_service_correlation():
        """
        Анализ корреляции между услугами (какие услуги часто заказывают вместе)
        Параметры запроса:
        - start_date: начальная дата (YYYY-MM-DD)
        - end_date: конечная дата (YYYY-MM-DD)
        - min_correlation: минимальный коэффициент корреляции (0-100, по умолчанию 20)
        """
        session = SessionLocal()
        try:
            # Получаем параметры запроса
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')
            min_correlation = int(request.args.get('min_correlation', 20))
            
            if not all([start_date, end_date]):
                return jsonify({'error': 'Необходимо указать начальную и конечную даты'}), 400
            
            start_datetime = datetime.combine(date.fromisoformat(start_date), time.min)
            end_datetime = datetime.combine(date.fromisoformat(end_date), time.max)
            
            # Получаем все записи за указанный период
            appointments = session.query(Appointment).filter(
                Appointment.datetime >= start_datetime,
                Appointment.datetime <= end_datetime
            ).all()
            
            # Собираем данные о том, какие услуги были в каждой записи
            appointment_services = {}
            service_counts = {}
            
            for appointment in appointments:
                # Получаем все услуги для данной записи
                services = session.query(Service).join(
                    AppointmentServicePivot,
                    Service.id == AppointmentServicePivot.service_id
                ).filter(
                    AppointmentServicePivot.appointment_id == appointment.id
                ).all()
                
                # Если запись содержит только одну услугу, добавляем основную услугу
                if len(services) == 0 and appointment.service_id:
                    service = session.query(Service).get(appointment.service_id)
                    if service:
                        services = [service]
                
                # Сохраняем услуги для данной записи
                service_ids = [service.id for service in services]
                if len(service_ids) > 1:  # Учитываем только записи с несколькими услугами
                    appointment_services[appointment.id] = service_ids
                    
                    # Обновляем счетчики услуг
                    for service_id in service_ids:
                        service_counts[service_id] = service_counts.get(service_id, 0) + 1
            
            # Вычисляем корреляцию между услугами
            service_pairs = {}
            
            for app_id, service_ids in appointment_services.items():
                # Создаем все возможные пары услуг
                for i in range(len(service_ids)):
                    for j in range(i + 1, len(service_ids)):
                        service_pair = tuple(sorted([service_ids[i], service_ids[j]]))
                        service_pairs[service_pair] = service_pairs.get(service_pair, 0) + 1
            
            # Формируем результат
            correlation_data = []
            
            for (service1_id, service2_id), pair_count in service_pairs.items():
                service1_count = service_counts.get(service1_id, 0)
                service2_count = service_counts.get(service2_id, 0)
                
                if service1_count > 0 and service2_count > 0:
                    # Вычисляем коэффициент корреляции (в процентах)
                    correlation = (pair_count / min(service1_count, service2_count)) * 100
                    
                    if correlation >= min_correlation:
                        service1 = session.query(Service).get(service1_id)
                        service2 = session.query(Service).get(service2_id)
                        
                        if service1 and service2:
                            correlation_data.append({
                                'service1': {
                                    'id': service1_id,
                                    'name': service1.name
                                },
                                'service2': {
                                    'id': service2_id,
                                    'name': service2.name
                                },
                                'correlation_percent': round(correlation, 2),
                                'pair_count': pair_count,
                                'service1_count': service1_count,
                                'service2_count': service2_count
                            })
            
            # Сортируем по убыванию коэффициента корреляции
            correlation_data.sort(key=lambda x: x['correlation_percent'], reverse=True)
            
            return jsonify({
                'start_date': start_date,
                'end_date': end_date,
                'correlations': correlation_data
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 400
        finally:
            session.close()

    @app.route('/api/analytics/employee_efficiency', methods=['GET'])
    def analytics_employee_efficiency():
        """
        Анализ эффективности сотрудников (выручка на час работы)
        Параметры запроса:
        - start_date: начальная дата (YYYY-MM-DD)
        - end_date: конечная дата (YYYY-MM-DD)
        """
        session = SessionLocal()
        try:
            # Получаем параметры запроса
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')
            
            if not all([start_date, end_date]):
                return jsonify({'error': 'Необходимо указать начальную и конечную даты'}), 400
            
            start_datetime = datetime.combine(date.fromisoformat(start_date), time.min)
            end_datetime = datetime.combine(date.fromisoformat(end_date), time.max)
            
            # Получаем данные о выручке по сотрудникам
            revenue_query = session.query(
                Employee.id,
                Employee.full_name,
                func.sum(Appointment.final_price).label('total_revenue')
            ).join(
                Appointment,
                Employee.id == Appointment.employee_id
            ).filter(
                Appointment.is_paid == True,
                Appointment.datetime >= start_datetime,
                Appointment.datetime <= end_datetime
            ).group_by(
                Employee.id,
                Employee.full_name
            )
            
            revenue_results = revenue_query.all()
            
            # Получаем данные о рабочих часах сотрудников
            hours_query = session.query(
                Employee.id,
                func.sum(
                    extract('epoch', Schedule.end_time) - extract('epoch', Schedule.start_time)
                ).label('total_seconds')
            ).join(
                Schedule,
                Employee.id == Schedule.employee_id
            ).filter(
                Schedule.date >= date.fromisoformat(start_date),
                Schedule.date <= date.fromisoformat(end_date)
            ).group_by(
                Employee.id
            )
            
            hours_results = {emp_id: total_seconds for emp_id, total_seconds in hours_query.all()}
            
            # Формируем результат
            efficiency_data = []
            
            for emp_id, emp_name, total_revenue in revenue_results:
                total_seconds = hours_results.get(emp_id, 0)
                total_hours = total_seconds / 3600 if total_seconds > 0 else 0
                
                revenue_per_hour = total_revenue / total_hours if total_hours > 0 else 0
                
                efficiency_data.append({
                    'employee_id': emp_id,
                    'employee_name': emp_name,
                    'total_revenue': total_revenue,
                    'total_hours': round(total_hours, 2),
                    'revenue_per_hour': round(revenue_per_hour, 2)
                })
            
            # Сортируем по убыванию выручки в час
            efficiency_data.sort(key=lambda x: x['revenue_per_hour'], reverse=True)
            
            return jsonify({
                'start_date': start_date,
                'end_date': end_date,
                'employees': efficiency_data
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 400
        finally:
            session.close()

    @app.route('/api/analytics/employee_specialization', methods=['GET'])
    def analytics_employee_specialization():
        """
        Анализ специализации сотрудников (какие услуги чаще всего выполняет каждый сотрудник)
        Параметры запроса:
        - start_date: начальная дата (YYYY-MM-DD)
        - end_date: конечная дата (YYYY-MM-DD)
        - employee_id: ID сотрудника (опционально)
        - limit: ограничение количества услуг для каждого сотрудника (по умолчанию 5)
        """
        session = SessionLocal()
        try:
            # Получаем параметры запроса
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')
            employee_id = request.args.get('employee_id')
            limit = int(request.args.get('limit', 5))
            
            if not all([start_date, end_date]):
                return jsonify({'error': 'Необходимо указать начальную и конечную даты'}), 400
            
            start_datetime = datetime.combine(date.fromisoformat(start_date), time.min)
            end_datetime = datetime.combine(date.fromisoformat(end_date), time.max)
            
            # Базовый запрос
            query = session.query(
                Employee.id,
                Employee.full_name,
                Service.id.label('service_id'),
                Service.name.label('service_name'),
                func.count(Appointment.id).label('service_count')
            ).join(
                Appointment,
                Employee.id == Appointment.employee_id
            ).join(
                Service,
                Appointment.service_id == Service.id
            ).filter(
                Appointment.datetime >= start_datetime,
                Appointment.datetime <= end_datetime
            )
            
            # Фильтруем по сотруднику, если указан
            if employee_id:
                query = query.filter(Employee.id == employee_id)
            
            # Группируем и сортируем
            query = query.group_by(
                Employee.id,
                Employee.full_name,
                Service.id,
                Service.name
            ).order_by(
                Employee.id,
                desc('service_count')
            )
            
            results = query.all()
            
            # Группируем данные по сотрудникам
            employees_data = {}
            
            for emp_id, emp_name, service_id, service_name, service_count in results:
                if emp_id not in employees_data:
                    employees_data[emp_id] = {
                        'employee_id': emp_id,
                        'employee_name': emp_name,
                        'services': []
                    }
                
                # Добавляем услугу, если еще не достигли лимита
                if len(employees_data[emp_id]['services']) < limit:
                    employees_data[emp_id]['services'].append({
                        'service_id': service_id,
                        'service_name': service_name,
                        'count': service_count
                    })
            
            # Формируем ответ
            response = {
                'start_date': start_date,
                'end_date': end_date,
                'employees': list(employees_data.values())
            }
            
            return jsonify(response)
        except Exception as e:
            return jsonify({'error': str(e)}), 400
        finally:
            session.close()

    @app.route('/api/analytics/revenue_forecast', methods=['GET'])
    def analytics_revenue_forecast():
        """
        Прогноз дохода на будущие периоды
        Параметры запроса:
        - history_months: количество месяцев для анализа (по умолчанию 6)
        - forecast_months: количество месяцев для прогноза (по умолчанию 3)
        - group_by: группировка (month, service, employee) - по умолчанию month
        """
        session = SessionLocal()
        try:
            # Получаем параметры запроса
            history_months = int(request.args.get('history_months', 6))
            forecast_months = int(request.args.get('forecast_months', 3))
            group_by = request.args.get('group_by', 'month')
            
            # Определяем период для анализа
            end_date = date.today().replace(day=1) - timedelta(days=1)  # Последний день предыдущего месяца
            start_date = (end_date.replace(day=1) - timedelta(days=1)).replace(day=1)  # Первый день месяца, который на history_months раньше
            for _ in range(history_months - 1):
                start_date = (start_date.replace(day=1) - timedelta(days=1)).replace(day=1)
            
            # Получаем исторические данные о доходах
            query = session.query(
                func.date_trunc('month', Appointment.datetime).label('month'),
                func.sum(Appointment.final_price).label('revenue')
            ).filter(
                Appointment.is_paid == True,
                Appointment.datetime >= datetime.combine(start_date, time.min),
                Appointment.datetime <= datetime.combine(end_date, time.max)
            )
            
            if group_by == 'service':
                query = query.add_columns(
                    Service.id.label('service_id'),
                    Service.name.label('service_name')
                ).join(
                    Service,
                    Appointment.service_id == Service.id
                ).group_by(
                    'month',
                    Service.id,
                    Service.name
                ).order_by(
                    'month',
                    Service.id
                )
            elif group_by == 'employee':
                query = query.add_columns(
                    Employee.id.label('employee_id'),
                    Employee.full_name.label('employee_name')
                ).join(
                    Employee,
                    Appointment.employee_id == Employee.id
                ).group_by(
                    'month',
                    Employee.id,
                    Employee.full_name
                ).order_by(
                    'month',
                    Employee.id
                )
            else:  # group_by == 'month'
                query = query.group_by('month').order_by('month')
            
            results = query.all()
            
            # Обрабатываем результаты в зависимости от группировки
            if group_by == 'month':
                # Формируем временной ряд по месяцам
                historical_data = []
                for month, revenue in results:
                    month_date = month.date()
                    historical_data.append({
                        'month': month_date.strftime('%Y-%m'),
                        'revenue': float(revenue)
                    })
                
                # Простой прогноз: среднее значение за последние месяцы
                if len(historical_data) > 0:
                    avg_revenue = sum(item['revenue'] for item in historical_data) / len(historical_data)
                    
                    # Создаем прогноз на будущие месяцы
                    forecast_data = []
                    next_month = (end_date.replace(day=1) + timedelta(days=32)).replace(day=1)  # Первый день следующего месяца
                    
                    for i in range(forecast_months):
                        forecast_month = (next_month.replace(day=1) + timedelta(days=32*i)).replace(day=1)
                        forecast_data.append({
                            'month': forecast_month.strftime('%Y-%m'),
                            'revenue': round(avg_revenue, 2),
                            'is_forecast': True
                        })
                    
                    # Добавляем флаг is_forecast=False к историческим данным
                    for item in historical_data:
                        item['is_forecast'] = False
                    
                    response = {
                        'history_months': history_months,
                        'forecast_months': forecast_months,
                        'data': historical_data + forecast_data
                    }
                else:
                    response = {
                        'error': 'Недостаточно исторических данных для прогноза'
                    }
            else:
                # Для группировки по услугам или сотрудникам
                # Здесь можно реализовать более сложную логику прогнозирования
                response = {
                    'error': 'Прогноз с группировкой по услугам или сотрудникам пока не реализован'
                }
            
            return jsonify(response)
        except Exception as e:
            return jsonify({'error': str(e)}), 400
        finally:
            session.close()

    @app.route('/api/analytics/client_churn', methods=['GET'])
    def analytics_client_churn():
        """
        Анализ оттока клиентов
        Параметры запроса:
        - inactive_days: количество дней неактивности для определения оттока (по умолчанию 90)
        - limit: ограничение количества результатов (по умолчанию 100)
        """
        session = SessionLocal()
        try:
            # Получаем параметры запроса
            inactive_days = int(request.args.get('inactive_days', 90))
            limit = int(request.args.get('limit', 100))
            
            # Определяем дату, после которой клиент считается неактивным
            churn_date = date.today() - timedelta(days=inactive_days)
            
            # Получаем клиентов с датой последнего визита
            query = session.query(
                Client.id,
                Client.full_name,
                Client.phone,
                Client.email,
                func.max(Appointment.datetime).label('last_visit'),
                func.count(Appointment.id).label('total_visits'),
                func.sum(Appointment.final_price).label('total_spent')
            ).join(
                Appointment,
                Client.id == Appointment.client_id
            ).filter(
                Appointment.is_completed == True
            ).group_by(
                Client.id,
                Client.full_name,
                Client.phone,
                Client.email
            ).having(
                func.max(Appointment.datetime) < datetime.combine(churn_date, time.min)
            ).order_by(
                desc('last_visit')
            ).limit(limit)
            
            results = query.all()
            
            # Формируем результат
            churn_data = []
            
            for client_id, full_name, phone, email, last_visit, total_visits, total_spent in results:
                days_since_last_visit = (date.today() - last_visit.date()).days
                
                churn_data.append({
                    'client_id': client_id,
                    'full_name': full_name,
                    'phone': phone,
                    'email': email,
                    'last_visit': last_visit.isoformat(),
                    'days_since_last_visit': days_since_last_visit,
                    'total_visits': total_visits,
                    'total_spent': float(total_spent) if total_spent else 0,
                    'avg_check': round(float(total_spent) / total_visits, 2) if total_visits > 0 and total_spent else 0
                })
            
            return jsonify({
                'inactive_days_threshold': inactive_days,
                'total_churned_clients': len(churn_data),
                'clients': churn_data
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 400
        finally:
            session.close()

    return app        
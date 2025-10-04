import { format, addMinutes, isWithinInterval } from 'date-fns';
import { formatTimeSlot } from './dateHelpers.js';
import { SLOT_DURATION } from './constants.js';

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
export const generateTimeSlots = (schedules, selectedDate) => {
    if (!schedules || schedules.length === 0) {
        return [];
    }
    
    let earliestStart = '23:59:59';
    let latestEnd = '00:00:00';
    
    schedules.forEach(schedule => {
        if (schedule.start_time < earliestStart) {
            earliestStart = schedule.start_time;
        }
        if (schedule.end_time > latestEnd) {
            latestEnd = schedule.end_time;
        }
    });
    
    const slots = [];
    const startDate = formatTimeSlot(selectedDate, earliestStart.slice(0, 5));
    const endDate = formatTimeSlot(selectedDate, latestEnd.slice(0, 5));
    
    let currentSlot = startDate;
    while (currentSlot < endDate) {
        slots.push(format(currentSlot, 'HH:mm'));
        currentSlot = addMinutes(currentSlot, SLOT_DURATION);
    }
    
    return slots;
};

export const getAppointmentForSlot = (employeeId, timeSlot, appointments, services, selectedDate) => {
    const slotStartTime = formatTimeSlot(selectedDate, timeSlot);
    const slotEndTime = addMinutes(slotStartTime, SLOT_DURATION);
    
    return appointments.find(appointment => {
        if (appointment.employee_id !== employeeId) return false;
        
        const appointmentDateTime = appointment.datetime ? new Date(appointment.datetime) : null;
        if (!appointmentDateTime) return false;
        
        const service = services.find(s => s.id === appointment.service_id);
        if (!service) return false;
        
        const duration = appointment.custom_duration || service.duration;
        const appointmentEndTime = addMinutes(appointmentDateTime, duration);
        
        return (
            (slotStartTime >= appointmentDateTime && slotStartTime < appointmentEndTime) ||
            (slotEndTime > appointmentDateTime && slotEndTime <= appointmentEndTime) ||
            (slotStartTime <= appointmentDateTime && slotEndTime >= appointmentEndTime)
        );
    });
};

export const isEmployeeWorking = (employeeId, timeSlot, schedules, scheduleExceptions, selectedDate) => {
    const schedule = schedules.find(s => s.employee_id === employeeId);
    if (!schedule) return false;
    
    const slotTime = formatTimeSlot(selectedDate, timeSlot);
    const startTime = formatTimeSlot(selectedDate, schedule.start_time.slice(0, 5));
    const endTime = formatTimeSlot(selectedDate, schedule.end_time.slice(0, 5));
    
    if (isInException(schedule.id, timeSlot, scheduleExceptions, selectedDate)) {
        return false;
    }
    
    return isWithinInterval(slotTime, { start: startTime, end: endTime });
};

export const isInException = (scheduleId, timeSlot, scheduleExceptions, selectedDate) => {
    const numericScheduleId = parseInt(scheduleId, 10);
    const exceptions = scheduleExceptions.filter(exc => 
        parseInt(exc.schedule_id, 10) === numericScheduleId
    );
    
    if (exceptions.length === 0) return false;
    
    const slotTime = formatTimeSlot(selectedDate, timeSlot);
    
    return exceptions.some(exc => {
        const exceptionStart = formatTimeSlot(selectedDate, exc.start_time.slice(0, 5));
        const exceptionEnd = formatTimeSlot(selectedDate, exc.end_time.slice(0, 5));
        
        return isWithinInterval(slotTime, { start: exceptionStart, end: exceptionEnd });
    });
};
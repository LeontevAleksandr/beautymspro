const API_BASE_URL = 'http://localhost:5000/api';

// ==================== ФУНКЦИИ НАПОМИНАНИЙ ====================
export const createNotification = async (appointmentId, appointmentDateTime, reminderMinutes) => {
    try {
        const appointmentDate = new Date(appointmentDateTime);
        const scheduledAt = new Date(appointmentDate.getTime() - (reminderMinutes * 60 * 1000));
        
        const notificationData = {
            appointment_id: appointmentId,
            scheduled_at: scheduledAt.toISOString(),
            status: 'scheduled',
            attempts: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const response = await fetch(`${API_BASE_URL}/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notificationData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Ошибка при создании напоминания:', error);
        throw error;
    }
};
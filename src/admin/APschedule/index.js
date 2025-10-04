import React from 'react';
import { Box } from '@mui/material';

// Hooks
import { useSnackbar } from './hooks/useSnackbar';
import { useEmployees } from './hooks/useEmployees';
import { useSchedules } from './hooks/useSchedules';
import { useScheduleExceptions } from './hooks/useScheduleExceptions';
import { useTimeDialog } from './hooks/useTimeDialog';
import { useSaveSchedule } from './hooks/useSaveSchedule';
import { useWeekNavigation } from './hooks/useWeekNavigation';
import { useAutoFillDialog } from './hooks/useAutoFillDialog';

// Components
import ScheduleHeader from './components/ScheduleHeader';
import WeekNavigation from './components/WeekNavigation';
import ScheduleTable from './components/ScheduleTable';
import TimeDialog from './components/TimeDialog';
import AutoFillDialog from './components/AutoFillDialog';
import NotificationSnackbar from './components/NotificationSnackbar';

// Utils
import { getEmployeeName, formatTimeRange } from './utils/helpers';
import { INITIAL_WORK_HOURS } from './utils/constants';

function APschedule() {
    // Snackbar
    const { snackbar, showSnackbar, handleClose } = useSnackbar();

    // Employees
    const { employees } = useEmployees(showSnackbar);

    // Schedules
    const { 
        schedules, 
        currentDate, 
        setCurrentDate,
        loadSchedules, 
        deleteWorkingDay,
        getSchedule
    } = useSchedules(showSnackbar);

    // Schedule Exceptions
    const { 
        scheduleExceptions,
        newException,
        loadAllExceptions,
        loadExceptionsBySchedule,
        handleExceptionChange,
        resetNewException,
        validateNewException
    } = useScheduleExceptions(showSnackbar);

    // Week Navigation
    const {
        getDaysInWeek,
        goToPreviousWeek,
        goToNextWeek,
        goToCurrentWeek
    } = useWeekNavigation(currentDate, setCurrentDate);

    // Time Dialog
    const {
        timeDialog,
        openDialog: openTimeDialog,
        closeDialog: closeTimeDialog,
        addException,
        deleteException,
        updateDialogField
    } = useTimeDialog(getSchedule, loadExceptionsBySchedule);

    // Save Schedule
    const { saveTimeDialog } = useSaveSchedule(schedules, showSnackbar);

    // Auto Fill Dialog
    const {
        autoFillDialog,
        openDialog: openAutoFillDialog,
        closeDialog: closeAutoFillDialog,
        handleChange: handleAutoFillChange,
        handleDateRangeSelect,
        saveAutoFill
    } = useAutoFillDialog(schedules, [], INITIAL_WORK_HOURS, showSnackbar);

    // Handlers
    const handleSaveTimeDialog = async () => {
        await saveTimeDialog(timeDialog, () => {
            loadSchedules();
            loadAllExceptions();
            closeTimeDialog();
        });
    };

    const handleDeleteDay = async (employeeId, day) => {
        await deleteWorkingDay(employeeId, day, () => {
            loadAllExceptions();
        });
    };

    const handleAddException = () => {
        const validation = validateNewException(
            timeDialog.startTime,
            timeDialog.endTime,
            timeDialog.exceptions
        );

        if (!validation.valid) {
            showSnackbar(validation.message, 'error');
            return;
        }

        addException(newException);
        resetNewException();
    };

    const handleSaveAutoFill = async () => {
        await saveAutoFill(() => {
            loadSchedules();
        });
    };

    const handleWorkHoursChange = (field, value) => {
        handleAutoFillChange('workHours', {
            ...autoFillDialog.workHours,
            [field]: value
        });
    };

    return (
        <Box sx={{ 
            p: 3, 
            backgroundColor: '#fafafa',
            minHeight: '100vh'
        }}>
            {/* Заголовок */}
            <ScheduleHeader
                employeeCount={employees.length}
                onAutoFillClick={openAutoFillDialog}
            />

            {/* Навигация по неделям */}
            <WeekNavigation
                currentDate={currentDate}
                onPreviousWeek={goToPreviousWeek}
                onNextWeek={goToNextWeek}
                onCurrentWeek={goToCurrentWeek}
            />

            {/* Таблица графика */}
            <ScheduleTable
                employees={employees}
                daysInWeek={getDaysInWeek()}
                getSchedule={getSchedule}
                formatTimeRange={formatTimeRange}
                onOpenTimeDialog={openTimeDialog}
                onDeleteDay={handleDeleteDay}
            />

            {/* Диалог редактирования времени */}
            <TimeDialog
                open={timeDialog.open}
                isEdit={timeDialog.isEdit}
                employeeName={getEmployeeName(employees, timeDialog.employeeId)}
                date={timeDialog.date}
                startTime={timeDialog.startTime}
                endTime={timeDialog.endTime}
                exceptions={timeDialog.exceptions}
                newException={newException}
                onClose={closeTimeDialog}
                onSave={handleSaveTimeDialog}
                onStartTimeChange={(value) => updateDialogField('startTime', value)}
                onEndTimeChange={(value) => updateDialogField('endTime', value)}
                onDeleteException={deleteException}
                onExceptionChange={handleExceptionChange}
                onAddException={handleAddException}
            />

            {/* Диалог автозаполнения */}
            <AutoFillDialog
                open={autoFillDialog.open}
                formula={autoFillDialog.formula}
                workHours={autoFillDialog.workHours}
                startDate={autoFillDialog.startDate}
                endDate={autoFillDialog.endDate}
                selectedRange={autoFillDialog.selectedRange}
                employees={employees}
                selectedEmployees={autoFillDialog.employees}
                onClose={closeAutoFillDialog}
                onSave={handleSaveAutoFill}
                onFormulaChange={(value) => handleAutoFillChange('formula', value)}
                onWorkHoursChange={handleWorkHoursChange}
                onDateRangeSelect={handleDateRangeSelect}
                onEmployeesChange={(value) => handleAutoFillChange('employees', value)}
            />

            {/* Уведомления */}
            <NotificationSnackbar
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={handleClose}
            />
        </Box>
    );
}

export default APschedule;
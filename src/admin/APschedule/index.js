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
import LoadingSpinner from './components/LoadingSpinner';

// Utils
import { getEmployeeName, formatTimeRange } from './utils/helpers';
import { INITIAL_WORK_HOURS } from './utils/constants';

function APschedule() {
    const { snackbar, showSnackbar, handleClose } = useSnackbar();
    const { employees } = useEmployees(showSnackbar);
    const { 
        schedules, 
        currentDate, 
        setCurrentDate,
        loading,
        loadSchedules, 
        deleteWorkingDay,
        getSchedule
    } = useSchedules(showSnackbar);

    const { 
        newException,
        loadAllExceptions,
        loadExceptionsBySchedule,
        handleExceptionChange,
        resetNewException,
        validateNewException
    } = useScheduleExceptions(showSnackbar);

    const {
        getDaysInWeek,
        goToPreviousWeek,
        goToNextWeek,
        goToCurrentWeek
    } = useWeekNavigation(currentDate, setCurrentDate);

    const {
        timeDialog,
        openDialog: openTimeDialog,
        closeDialog: closeTimeDialog,
        addException,
        deleteException,
        updateDialogField
    } = useTimeDialog(getSchedule, loadExceptionsBySchedule);

    const { saveTimeDialog } = useSaveSchedule(schedules, showSnackbar);

    const {
        autoFillDialog,
        openDialog: openAutoFillDialog,
        closeDialog: closeAutoFillDialog,
        handleChange: handleAutoFillChange,
        handleToggleMode,
        handleToggleDays,
        handleDateRangeSelect,
        saveAutoFill
    } = useAutoFillDialog(schedules, [], INITIAL_WORK_HOURS, showSnackbar);

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

    if (loading) {
        return (
            <Box sx={{ p: 3, backgroundColor: '#fafafa', minHeight: '100vh' }}>
                <LoadingSpinner />
            </Box>
        );
    }

    return (
        <Box sx={{ 
            p: 3, 
            backgroundColor: '#fafafa',
            minHeight: '100vh'
        }}>
            <ScheduleHeader
                employeeCount={employees.length}
                onAutoFillClick={openAutoFillDialog}
            />

            <WeekNavigation
                currentDate={currentDate}
                onPreviousWeek={goToPreviousWeek}
                onNextWeek={goToNextWeek}
                onCurrentWeek={goToCurrentWeek}
            />

            <ScheduleTable
                employees={employees}
                daysInWeek={getDaysInWeek()}
                getSchedule={getSchedule}
                formatTimeRange={formatTimeRange}
                onOpenTimeDialog={openTimeDialog}
                onDeleteDay={handleDeleteDay}
            />

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

            <AutoFillDialog
                open={autoFillDialog.open}
                formula={autoFillDialog.formula}
                workHours={autoFillDialog.workHours}
                startDate={autoFillDialog.startDate}
                endDate={autoFillDialog.endDate}
                selectedRange={autoFillDialog.selectedRange}
                employees={employees}
                selectedEmployees={autoFillDialog.employees}
                useCustom={autoFillDialog.useCustom}
                selectedDays={autoFillDialog.selectedDays}
                onClose={closeAutoFillDialog}
                onSave={handleSaveAutoFill}
                onFormulaChange={(value) => handleAutoFillChange('formula', value)}
                onToggleMode={handleToggleMode}
                onToggleDays={handleToggleDays}
                onWorkHoursChange={handleWorkHoursChange}
                onDateRangeSelect={handleDateRangeSelect}
                onEmployeesChange={(value) => handleAutoFillChange('employees', value)}
            />

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
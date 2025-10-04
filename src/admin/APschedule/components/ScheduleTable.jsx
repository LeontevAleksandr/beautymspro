import React from 'react';
import { Table, TableContainer, Paper } from '@mui/material';
import ScheduleTableHead from './ScheduleTableHead';
import ScheduleTableBody from './ScheduleTableBody';

const ScheduleTable = ({ 
    employees, 
    daysInWeek, 
    getSchedule,
    formatTimeRange,
    onOpenTimeDialog, 
    onDeleteDay 
}) => {
    return (
        <TableContainer 
            component={Paper} 
            sx={{ 
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)', 
                borderRadius: 3,
                border: '1px solid #e0e0e0',
                overflow: 'hidden',
                mb: 3
            }}
        >
            <Table size="small">
                <ScheduleTableHead daysInWeek={daysInWeek} />
                <ScheduleTableBody
                    employees={employees}
                    daysInWeek={daysInWeek}
                    getSchedule={getSchedule}
                    formatTimeRange={formatTimeRange}
                    onOpenTimeDialog={onOpenTimeDialog}
                    onDeleteDay={onDeleteDay}
                />
            </Table>
        </TableContainer>
    );
};

export default ScheduleTable;
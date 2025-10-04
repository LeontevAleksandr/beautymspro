import React, { useState, useEffect } from 'react';
import { Typography, Box, Tooltip } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import BuildIcon from '@mui/icons-material/Build';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';

// Импортируем компоненты разделов
import APhome from './APhome';
import APappointment from './APappointment/index';
//import APappointment from './OLD/OLD_APappointment';
import APclients from './APclients/index';
import APemployee from './APemployee/index';
import APservice from './APservice/index';
import APanalytic from './APanalytic/index';
import APspecialization from './APspecialization/index';
import APschedule from './APschedule/index';

function AdminPanel({ records }) {
    // Все useState идут в начале компонента
    const [activeSection, setActiveSection] = useState('records');
    const [clients, setClients] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [services, setServices] = useState([]);
    const [staffDropdownOpen, setStaffDropdownOpen] = useState(false);
    
    useEffect(() => {
        fetch('http://localhost:5000/api/clients').then(res => res.json()).then(setClients);
        fetch('http://localhost:5000/api/employees').then(res => res.json()).then(setEmployees);
        fetch('http://localhost:5000/api/services').then(res => res.json()).then(setServices);
    }, []);

    const renderSection = () => {
        switch (activeSection) {
            case 'home':
                return <APhome />;
            case 'records':
                return <APappointment 
                    records={records} 
                    clients={clients} 
                    setClients={setClients} 
                    employees={employees} 
                    services={services} 
                />;
            case 'clients':
                return <APclients />;
            case 'staff':
                return <APemployee />;
            case 'specializations':
                return <APspecialization />;
            case 'schedule':
                return <APschedule />;
            case 'services':
                return <APservice />;
            case 'analytics':
                return <APanalytic />;
            default:
                return <APhome />;
        }
    };

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            <Box sx={{ width: '60px', backgroundColor: '#343a40', color: 'white', padding: '20px 0' }}>
                <Tooltip title="Главная" placement="right">
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            padding: '10px 0',
                            cursor: 'pointer',
                            backgroundColor: activeSection === 'home' ? '#495057' : 'transparent'
                        }}
                        onClick={() => setActiveSection('home')}
                    >
                        <HomeIcon />
                    </Box>
                </Tooltip>
                <Tooltip title="Записи" placement="right">
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            padding: '10px 0',
                            cursor: 'pointer',
                            backgroundColor: activeSection === 'records' ? '#495057' : 'transparent'
                        }}
                        onClick={() => setActiveSection('records')}
                    >
                        <AssignmentIcon />
                    </Box>
                </Tooltip>
                <Tooltip title="Клиенты" placement="right">
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            padding: '10px 0',
                            cursor: 'pointer',
                            backgroundColor: activeSection === 'clients' ? '#495057' : 'transparent'
                        }}
                        onClick={() => setActiveSection('clients')}
                    >
                        <PeopleIcon />
                    </Box>
                </Tooltip>
                <Tooltip title="Сотрудники" placement="right">
                    <Box
                        sx={{
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                padding: '10px 0',
                                cursor: 'pointer',
                                backgroundColor: (activeSection === 'staff' || activeSection === 'specializations') ? '#495057' : 'transparent',
                                width: '100%'
                            }}
                            onClick={() => setStaffDropdownOpen(!staffDropdownOpen)}
                        >
                            <BuildIcon />
                        </Box>
                        
                        {staffDropdownOpen && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    left: '60px',
                                    top: '0',
                                    backgroundColor: '#343a40',
                                    width: '200px',
                                    zIndex: 1000,
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                                    borderRadius: '4px'
                                }}
                            >
                                <Box
                                    sx={{
                                        padding: '10px 15px',
                                        cursor: 'pointer',
                                        backgroundColor: activeSection === 'staff' ? '#495057' : 'transparent',
                                        '&:hover': { backgroundColor: '#495057' }
                                    }}
                                    onClick={() => {
                                        setActiveSection('staff');
                                        setStaffDropdownOpen(false);
                                    }}
                                >
                                    <Typography variant="body2">Управление сотрудниками</Typography>
                                </Box>
                                <Box
                                    sx={{
                                        padding: '10px 15px',
                                        cursor: 'pointer',
                                        backgroundColor: activeSection === 'specializations' ? '#495057' : 'transparent',
                                        '&:hover': { backgroundColor: '#495057' }
                                    }}
                                    onClick={() => {
                                        setActiveSection('specializations');
                                        setStaffDropdownOpen(false);
                                    }}
                                >
                                    <Typography variant="body2">Управление специализациями</Typography>
                                </Box>
                                <Box
                                    sx={{
                                        padding: '10px 15px',
                                        cursor: 'pointer',
                                        backgroundColor: activeSection === 'schedule' ? '#495057' : 'transparent',
                                        '&:hover': { backgroundColor: '#495057' }
                                    }}
                                    onClick={() => {
                                        setActiveSection('schedule');
                                        setStaffDropdownOpen(false);
                                    }}
                                >
                                    <Typography variant="body2">Управление расписанием</Typography>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Tooltip>
                <Tooltip title="Услуги" placement="right">
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            padding: '10px 0',
                            cursor: 'pointer',
                            backgroundColor: activeSection === 'services' ? '#495057' : 'transparent'
                        }}
                        onClick={() => setActiveSection('services')}
                    >
                        <CategoryIcon />
                    </Box>
                </Tooltip>
                <Tooltip title="Аналитика" placement="right">
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            padding: '10px 0',
                            cursor: 'pointer',
                            backgroundColor: activeSection === 'analytics' ? '#495057' : 'transparent'
                        }}
                        onClick={() => setActiveSection('analytics')}
                    >
                        <BarChartIcon />
                    </Box>
                </Tooltip>
            </Box>
            <Box sx={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                {renderSection()}
            </Box>
        </Box>
    );
}

export default AdminPanel;
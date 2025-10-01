import React, { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Typography } from '@mui/material';
import AdminPanel from './admin/AdminPanel';
import MasterPanel from './master/MasterPanel';
import APappointment from './admin/APappointment';

function App() {
  const [records, setRecords] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    // Загружаем все необходимые данные параллельно
    Promise.all([
      fetch('http://localhost:5000/api/appointments').then(res => res.json()),
      fetch('http://localhost:5000/api/clients').then(res => res.json()),
      fetch('http://localhost:5000/api/services').then(res => res.json()),
      fetch('http://localhost:5000/api/employees').then(res => res.json())
    ]).then(([appointments, clientsData, servicesData, employeesData]) => {
      setClients(clientsData);
      setServices(servicesData);
      setEmployees(employeesData);

      // Преобразуем данные для таблицы (для обратной совместимости с AdminPanel)
      const formatted = appointments.map(item => {
        const client = clientsData.find(c => c.id === item.client_id);
        const service = servicesData.find(s => s.id === item.service_id);
        const master = employeesData.find(e => e.id === item.employee_id);
        return {
          id: item.id,
          name: client ? client.full_name : item.client_id,
          service: service ? service.name : item.service_id,
          date: item.datetime ? item.datetime.split('T')[0] : '',
          time: item.datetime ? item.datetime.split('T')[1]?.slice(0,5) : '',
          master: master ? master.full_name : item.employee_id,
          status: item.status
        };
      });
      setRecords(formatted);
    }).catch(error => {
      console.error('Ошибка при загрузке данных:', error);
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/admin" 
          element={<AdminPanel records={records} />} 
        />
        <Route 
          path="/master" 
          element={<MasterPanel />} 
        />
        <Route 
          path="/appointments" 
          element={
            <APappointment 
              records={records}
              clients={clients}
              setClients={setClients}
              employees={employees}
              services={services}
            />
          } 
        />
        <Route 
          path="/" 
          element={<Home />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

function Home() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>
        Добро пожаловать в систему управления салоном красоты!
      </Typography>
      <Typography variant="h6" color="textSecondary">
        Выберите раздел:
      </Typography>
      <div style={{ marginTop: '20px' }}>
        <Typography variant="body1">
          • <a href="/admin">Админ панель</a> - управление записями
        </Typography>
        <Typography variant="body1">
          • <a href="/appointments">Расписание записей</a> - новый интерфейс
        </Typography>
        <Typography variant="body1">
          • <a href="/master">Панель мастера</a> - рабочее место мастера
        </Typography>
      </div>
    </div>
  );
}

export default App;
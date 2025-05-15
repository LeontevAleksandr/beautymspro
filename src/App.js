import React, { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Typography } from '@mui/material'; // Добавьте этот импорт
import AdminPanel from './admin/AdminPanel';
import MasterPanel from './master/MasterPanel';

function App() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    setRecords([
      { id: 1, name: 'Иванова А.', service: 'Маникюр', date: '2024-06-12', time: '12:00', master: 'Ольга', status: 'Запланировано' },
      { id: 2, name: 'Петров С.', service: 'Стрижка', date: '2024-06-13', time: '15:00', master: 'Анна', status: 'Выполнено' },
      // ... другие записи ...
    ]);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminPanel records={records} />} />
        <Route path="/master" element={<MasterPanel />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

function Home() {
  return <Typography variant="h6" align="center">Добро пожаловать в админ-панель!</Typography>;
}

export default App;

// File: src/App.js

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes'; // Đảm bảo import AppRoutes
import './index.css'; // Hoặc file CSS toàn cục khác nếu có

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
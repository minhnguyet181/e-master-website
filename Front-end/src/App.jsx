// File: src/App.js

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes'; // Đảm bảo import AppRoutes
import './index.css'; // Hoặc file CSS toàn cục khác nếu có

function App() {
  return (
    <BrowserRouter>
      {/* Full‑screen wrapper – removes inner glass frame */}
      <div className="full-screen">
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}


export default App;
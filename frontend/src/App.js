import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Objects from './pages/Objects';
import Users from './pages/Users';
import SpendingGroups from './pages/SpendingGroups';
import Bills from './pages/Bills';
import Checks from './pages/Checks';
import Deposits from './pages/Deposits';

// Пока страницы будут пустыми заглушками, наполним их позже
function App() {
  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header />
        <div style={{ display: 'flex', flex: 1 }}>
          <Sidebar />
          <main style={{ flex: 1, padding: '20px', background: '#f5f5f5' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/objects" element={<Objects />} />
              <Route path="/users" element={<Users />} />
              <Route path="/spending-groups" element={<SpendingGroups />} />
              <Route path="/bills" element={<Bills />} />
              <Route path="/checks" element={<Checks />} />
              <Route path="/deposits" element={<Deposits />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;

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
import CurrentRepairReport from './pages/CurrentRepairReport';
import './styles/global.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Header />
          <main className="page-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/objects" element={<Objects />} />
              <Route path="/users" element={<Users />} />
              <Route path="/spending-groups" element={<SpendingGroups />} />
              <Route path="/bills" element={<Bills />} />
              <Route path="/checks" element={<Checks />} />
              <Route path="/deposits" element={<Deposits />} />
              <Route path="/reports/current-repair" element={<CurrentRepairReport />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;

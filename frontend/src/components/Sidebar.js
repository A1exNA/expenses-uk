import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const menuItems = [
    { path: '/', label: 'Дашборд', icon: '📊' },
    { path: '/objects', label: 'Дома', icon: '🏠' },
    { path: '/users', label: 'Сотрудники', icon: '👥' },
    { path: '/spending-groups', label: 'Группы расходов', icon: '📁' },
    { path: '/bills', label: 'Счета', icon: '💰' },
    { path: '/checks', label: 'Чеки', icon: '🧾' },
    { path: '/deposits', label: 'Пополнения', icon: '💳' },
    { path: '/reports/current-repair', label: 'Отчёт по ремонту', icon: '📊' },
    { path: '/reports/subreport', label: 'Отчёт по подотчётным', icon: '📋' },
    { path: '/reports/house', label: 'Отчёт по домам', icon: '🏠' },
  ];

  const sidebarStyle = {
    width: 'var(--sidebar-width)',
    background: 'var(--bg-sidebar)',
    color: 'white',
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 1000
  };

  const logoStyle = {
    padding: 'var(--spacing-xl)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    marginBottom: 'var(--spacing-xl)'
  };

  const linkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-md)',
    padding: 'var(--spacing-md) var(--spacing-xl)',
    color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
    textDecoration: 'none',
    background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
    borderLeft: isActive ? '4px solid var(--primary)' : '4px solid transparent',
    transition: 'var(--transition)',
    fontSize: 'var(--font-size-md)',
    fontWeight: isActive ? 500 : 400
  });

  return (
    <nav style={sidebarStyle}>
      <div style={logoStyle}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', margin: 0, color: 'white' }}>
          УК Расходы
        </h2>
        <p style={{ fontSize: 'var(--font-size-xs)', opacity: 0.7, margin: 0 }}>
          Панель управления
        </p>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1 }}>
        {menuItems.map(item => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              style={linkStyle}
            >
              <span style={{ fontSize: 'var(--font-size-lg)' }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div style={{ 
        padding: 'var(--spacing-xl)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        fontSize: 'var(--font-size-xs)',
        opacity: 0.5
      }}>
        v1.0.0
      </div>
    </nav>
  );
};

export default Sidebar;

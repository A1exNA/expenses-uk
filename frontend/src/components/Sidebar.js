import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const menuItems = [
    { path: '/', label: 'Дашборд' },
    { path: '/objects', label: 'Дома' },
    { path: '/users', label: 'Сотрудники' },
    { path: '/spending-groups', label: 'Группы расходов' },
    { path: '/bills', label: 'Счета' },
    { path: '/checks', label: 'Чеки' },
    { path: '/deposits', label: 'Пополнения' },
  ];

  return (
    <nav style={{
      width: '220px',
      background: '#34495e',
      padding: '20px 0',
      color: 'white'
    }}>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {menuItems.map(item => (
          <li key={item.path} style={{ margin: '5px 0' }}>
            <NavLink
              to={item.path}
              style={({ isActive }) => ({
                display: 'block',
                padding: '10px 20px',
                color: 'white',
                textDecoration: 'none',
                background: isActive ? '#2c3e50' : 'transparent',
                borderLeft: isActive ? '4px solid #e74c3c' : 'none'
              })}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Sidebar;

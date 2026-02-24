import React from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from './ui';

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

  const sidebarStyle = {
    width: 'var(--sidebar-width)',
    background: 'var(--color-secondary)',
    padding: 'var(--spacing-md) 0',
    color: 'white'
  };

  const linkStyle = ({ isActive }) => ({
    display: 'block',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    color: 'white',
    textDecoration: 'none',
    background: isActive ? 'var(--color-primary)' : 'transparent',
    borderLeft: isActive ? '4px solid var(--color-danger)' : 'none',
    transition: 'background 0.2s'
  });

  return (
    <nav style={sidebarStyle}>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {menuItems.map(item => (
          <li key={item.path} style={{ margin: 'var(--spacing-xs) 0' }}>
            <NavLink
              to={item.path}
              style={linkStyle}
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

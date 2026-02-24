import React from 'react';
import { Badge } from './ui';

const Header = () => {
  const headerStyle = {
    background: 'var(--bg-header)',
    color: 'var(--dark)',
    padding: '0 var(--spacing-xl)',
    height: 'var(--header-height)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: 'var(--shadow-sm)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    marginLeft: 'var(--sidebar-width)'
  };

  return (
    <header style={headerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, color: 'var(--primary)' }}>
          Учёт расходов УК
        </h1>
        <Badge variant="primary">Демо-версия</Badge>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray)' }}>
          {new Date().toLocaleDateString('ru-RU', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </div>
        
        <div style={{ 
          width: 40, 
          height: 40, 
          borderRadius: '50%', 
          background: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 600,
          cursor: 'pointer'
        }}>
          А
        </div>
      </div>
    </header>
  );
};

export default Header;

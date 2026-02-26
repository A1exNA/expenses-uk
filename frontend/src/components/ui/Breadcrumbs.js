import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Breadcrumbs.css'; // создадим файл стилей

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  // Сопоставление путей с русскими названиями
  const routeNames = {
    '': 'Главная',
    'objects': 'Дома',
    'users': 'Сотрудники',
    'spending-groups': 'Группы расходов',
    'bills': 'Счета',
    'checks': 'Чеки',
    'deposits': 'Пополнения',
    'reports': 'Отчёты',
    'current-repair': 'Отчёт по текущему ремонту',
    'edit': 'Редактирование',
    'create': 'Создание'
  };

  // Если путь пустой (главная), не показываем крошки
  if (pathnames.length === 0) return null;

  return (
    <nav className="breadcrumbs">
      <ul className="breadcrumbs__list">
        <li className="breadcrumbs__item">
          <Link to="/" className="breadcrumbs__link">Главная</Link>
        </li>
        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const displayName = routeNames[name] || name;

          return (
            <li key={name} className="breadcrumbs__item">
              <span className="breadcrumbs__separator">/</span>
              {isLast ? (
                <span className="breadcrumbs__current">{displayName}</span>
              ) : (
                <Link to={routeTo} className="breadcrumbs__link">{displayName}</Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Breadcrumbs;

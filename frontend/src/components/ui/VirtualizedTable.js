import React from 'react';
import { List } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import './VirtualizedTable.css';

const VirtualizedTable = ({ columns, data, rowHeight = 40 }) => {
  // Если нет данных, показываем сообщение
  if (!data || data.length === 0) {
    return (
      <div className="virtualized-table__empty">
        Нет данных для отображения
      </div>
    );
  }

  // Компонент для рендеринга строки
  const Row = ({ index, style }) => {
    const row = data[index];
    
    return (
      <div className="virtualized-table__row" style={style}>
        {columns.map((column, colIndex) => {
          let content;
          
          if (column.render) {
            content = column.render(row);
          } else if (column.field) {
            content = row[column.field];
          } else {
            content = '';
          }
          
          return (
            <div
              key={colIndex}
              className={`virtualized-table__cell ${
                column.align === 'right' ? 'text-right' : 
                column.align === 'center' ? 'text-center' : ''
              }`}
              style={{ width: column.width || '100px' }}
            >
              {content}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="virtualized-table">
      {/* Заголовок таблицы */}
      <div className="virtualized-table__header">
        {columns.map((column, index) => (
          <div
            key={index}
            className={`virtualized-table__header-cell ${
              column.align === 'right' ? 'text-right' : 
              column.align === 'center' ? 'text-center' : ''
            }`}
            style={{ width: column.width || '100px' }}
          >
            {column.title}
          </div>
        ))}
      </div>

      {/* Виртуализированный список строк */}
      <div style={{ height: '500px', width: '100%' }}>
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              itemCount={data.length}
              itemSize={rowHeight}
              width={width}
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  );
};

export default VirtualizedTable;

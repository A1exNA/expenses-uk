import React from 'react';
import { List } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import './VirtualizedTable.css';

const VirtualizedTable = ({ columns, data, rowHeight = 40 }) => {
  const Row = ({ index, style }) => {
    const row = data[index];
    return (
      <div className="virtualized-table__row" style={style}>
        {columns.map((column, colIndex) => (
          <div
            key={colIndex}
            className={`virtualized-table__cell ${
              column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''
            }`}
            style={{ width: column.width || 'auto' }}
          >
            {column.render ? column.render(row) : row[column.field]}
          </div>
        ))}
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
              column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''
            }`}
            style={{ width: column.width || 'auto' }}
          >
            {column.title}
          </div>
        ))}
      </div>

      {/* Виртуализированный список строк */}
      <div style={{ height: '500px' }}>
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

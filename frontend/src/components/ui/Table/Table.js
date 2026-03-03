import React from 'react';
import styles from './Table.module.css';

const Table = ({ columns, data, emptyMessage = 'Нет данных', caption }) => {
  if (!data || data.length === 0) {
    return <div className={styles.emptyState} role="status">{emptyMessage}</div>;
  }

  return (
    <table className={styles.table} role="grid" aria-label={caption}>
      {caption && <caption className="visually-hidden">{caption}</caption>}
      <thead>
        <tr>
          {columns.map((column, index) => (
            <th 
              key={index} 
              className={styles[`text${column.align || 'Left'}`]}
              scope="col"
            >
              {column.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((column, colIndex) => (
              <td 
                key={colIndex} 
                className={styles[`text${column.align || 'Left'}`]}
                role="gridcell"
              >
                {column.render ? column.render(row) : row[column.field]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;

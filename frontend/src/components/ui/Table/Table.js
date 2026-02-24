import React from 'react';
import styles from './Table.module.css';

const Table = ({ columns, data, emptyMessage = 'Нет данных' }) => {
  if (!data || data.length === 0) {
    return <div className={styles.emptyState}>{emptyMessage}</div>;
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {columns.map((column, index) => (
            <th key={index} className={styles[`text${column.align || 'Left'}`]}>
              {column.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((column, colIndex) => (
              <td key={colIndex} className={styles[`text${column.align || 'Left'}`]}>
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
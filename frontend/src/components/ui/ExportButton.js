import React from 'react';
import ExcelJS from 'exceljs';
import Button from './Button/Button';

const ExportButton = ({ data, filename = 'export', headers, title, children }) => {
  const handleExport = async () => {
    if (!data || data.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }

    try {
      // Создаём новую рабочую книгу
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Учёт расходов УК';
      workbook.lastModifiedBy = 'Учёт расходов УК';
      workbook.created = new Date();
      workbook.modified = new Date();

      const worksheet = workbook.addWorksheet('Отчёт');

      // Добавляем заголовок таблицы, если он передан
      let startRow = 1;
      if (title) {
        const titleRow = worksheet.addRow([title]);
        worksheet.mergeCells(`A${startRow}:${String.fromCharCode(64 + headers.length)}${startRow}`);
        titleRow.getCell(1).font = {
          name: 'Arial',
          family: 2,
          size: 14,
          bold: true
        };
        titleRow.getCell(1).alignment = {
          horizontal: 'center',
          vertical: 'middle'
        };
        startRow = 2;
      }

      // Добавляем заголовки столбцов
      const headerRow = worksheet.addRow(headers.map(h => h.label));
      headerRow.eachCell((cell) => {
        cell.font = { 
          name: 'Arial', 
          family: 2, 
          size: 12, 
          bold: true 
        };
        cell.alignment = { 
          horizontal: 'center', 
          vertical: 'middle',
          wrapText: true
        };
      });

      // Добавляем данные с правильным форматированием
      data.forEach(row => {
        const rowData = headers.map(h => {
          const value = row[h.key];
          
          if (h.type === 'date' && typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = value.split('-').map(Number);
            return new Date(year, month - 1, day);
          }
          
          if (h.type === 'integer') {
            return parseInt(value, 10);
          }
          
          if (h.type === 'float') {
            return parseFloat(value);
          }
          
          if (h.type === 'number') {
            return Number(value);
          }
          
          return value !== undefined ? value : '';
        });
        
        const dataRow = worksheet.addRow(rowData);
        dataRow.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          
          cell.font = { 
            name: 'Arial', 
            family: 2, 
            size: 11 
          };
          
          if (header.type === 'integer') {
            cell.numFmt = '0';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          } 
          else if (header.type === 'float' || header.type === 'number') {
            cell.numFmt = '# ##0.00';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }
          else if (header.type === 'date') {
            cell.numFmt = 'DD.MM.YYYY';
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
          else {
            cell.alignment = { 
              horizontal: 'left', 
              vertical: 'middle',
              wrapText: true
            };
          }
        });
      });

      // Автоматическая ширина столбцов
      worksheet.columns.forEach((column, i) => {
        const allValues = [
          headers[i].label,
          ...data.map(row => row[headers[i].key]?.toString() || '')
        ];
        
        const maxLen = allValues.reduce((max, val) => {
          return Math.max(max, val.length);
        }, 0);

        column.width = Math.min(maxLen + 5, 60);
      });

      // Генерируем буфер и сохраняем файл
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Ошибка экспорта:', err);
      alert('Ошибка при создании Excel-файла');
    }
  };

  return (
    <Button variant="info" size="small" onClick={handleExport}>
      {children || 'Экспорт в Excel'}
    </Button>
  );
};

export default ExportButton;

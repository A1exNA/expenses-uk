import React, { useState, useEffect } from 'react';
import { Button, Input, Card } from '../components/ui';
import { apiGet } from '../services/api';
import '../styles/utils.css';

const CurrentRepairReport = () => {
  const [objects, setObjects] = useState([]);
  const [selectedObject, setSelectedObject] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Загрузка списка домов
  useEffect(() => {
    const fetchObjects = async () => {
      try {
        const data = await apiGet('/objects');
        setObjects(data);
      } catch (err) {
        console.error('Ошибка загрузки домов:', err);
      }
    };
    fetchObjects();
  }, []);

  const generateReport = async () => {
    if (!selectedObject || !selectedMonth) {
      alert('Выберите дом и месяц');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet(`/reports/current-repair?object_id=${selectedObject}&month=${selectedMonth}`);
      setReportData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU');
  };

  const getObjectName = () => {
    if (!reportData || !reportData.object) return '';
    return reportData.object.object_address;
  };

  const getMonthName = () => {
    if (!selectedMonth) return '';
    const [year, month] = selectedMonth.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  };

  const calculateTotal = (items) => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const calculateBillTotal = (bill) => {
    if (!bill || !bill.items) return 0;
    return calculateTotal(bill.items);
  };

  if (loading) return <div>Загрузка отчёта...</div>;

  return (
    <div className="fade-in">
      <div className="flex-between mb-3">
        <h2 style={{ fontSize: 'var(--font-size-2xl)' }}>Отчёт по текущему ремонту</h2>
      </div>

      <Card className="mb-3">
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Input
            type="select"
            label="Дом"
            value={selectedObject}
            onChange={(e) => setSelectedObject(e.target.value)}
            style={{ minWidth: '300px' }}
          >
            <option value="">Выберите дом</option>
            {objects.map(obj => (
              <option key={obj.id} value={obj.id}>{obj.object_address}</option>
            ))}
          </Input>
          <Input
            type="month"
            label="Месяц"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ width: '200px' }}
          />
          <Button variant="primary" onClick={generateReport}>Сформировать отчёт</Button>
        </div>
      </Card>

      {error && (
        <Card>
          <p style={{ color: 'var(--danger)' }}>Ошибка: {error}</p>
        </Card>
      )}

      {reportData && (
        <Card title={`Отчёт за ${getMonthName()} по дому: ${getObjectName()}`}>
          {/* Счета (безналичные расходы) */}
          <h3 style={{ margin: 'var(--spacing-lg) 0 var(--spacing-md) 0', color: 'var(--primary)' }}>
            Безналичные расходы (счета)
          </h3>
          {!reportData.bills || reportData.bills.length === 0 ? (
            <p style={{ color: 'var(--gray)' }}>Нет счетов за выбранный период</p>
          ) : (
            <>
              {reportData.bills.map(bill => (
                <div key={bill.bill_id} style={{ marginBottom: 'var(--spacing-md)' }}>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray)', marginBottom: 'var(--spacing-xs)' }}>
                    Счёт №{bill.bill_id} от {formatDate(bill.date)}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 'var(--spacing-md)' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--light)' }}>
                        <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)' }}>Наименование</th>
                        <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Цена</th>
                        <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Кол-во</th>
                        <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bill.items.map(item => (
                        <tr key={item.item_id} style={{ borderBottom: '1px solid var(--light)' }}>
                          <td style={{ padding: 'var(--spacing-sm)' }}>{item.text}</td>
                          <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{item.price.toFixed(2)}</td>
                          <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{item.quantity}</td>
                          <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr style={{ fontWeight: 'bold' }}>
                        <td colSpan="3" style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Итого по счёту:</td>
                        <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{calculateBillTotal(bill).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))}
            </>
          )}

          {/* Чеки (наличные расходы) */}
          <h3 style={{ margin: 'var(--spacing-lg) 0 var(--spacing-md) 0', color: 'var(--primary)' }}>
            Наличные расходы (чеки)
          </h3>
          {!reportData.checks || reportData.checks.length === 0 ? (
            <p style={{ color: 'var(--gray)' }}>Нет чеков за выбранный период</p>
          ) : (
            <>
              {reportData.checks.map(check => (
                <div key={check.check_id} style={{ marginBottom: 'var(--spacing-md)' }}>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray)', marginBottom: 'var(--spacing-xs)' }}>
                    Чек №{check.check_id} от {formatDate(check.date)}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 'var(--spacing-md)' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--light)' }}>
                        <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)' }}>Наименование</th>
                        <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Цена</th>
                        <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Кол-во</th>
                        <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      {check.items.map(item => (
                        <tr key={item.item_id} style={{ borderBottom: '1px solid var(--light)' }}>
                          <td style={{ padding: 'var(--spacing-sm)' }}>{item.text}</td>
                          <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{item.price.toFixed(2)}</td>
                          <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{item.quantity}</td>
                          <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr style={{ fontWeight: 'bold' }}>
                        <td colSpan="3" style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Итого по чеку:</td>
                        <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{calculateTotal(check.items).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))}
            </>
          )}

          {/* Общий итог */}
          <div style={{ marginTop: 'var(--spacing-lg)', padding: 'var(--spacing-md)', background: 'var(--light)', borderRadius: 'var(--border-radius)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Общая сумма расходов:</span>
              <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--primary)' }}>
                {(
                  (reportData.bills?.reduce((sum, bill) => sum + calculateBillTotal(bill), 0) || 0) +
                  (reportData.checks?.reduce((sum, check) => sum + calculateTotal(check.items), 0) || 0)
                ).toFixed(2)} ₽
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CurrentRepairReport;

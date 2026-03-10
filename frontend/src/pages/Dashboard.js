import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Card, Badge, Button, Input } from '../components/ui';
import { apiGet } from '../services/api';
import '../styles/utils.css';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [users, setUsers] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [checks, setChecks] = useState([]);
  const [expenseChecks, setExpenseChecks] = useState([]);
  const [bills, setBills] = useState([]);
  const [expenseBills, setExpenseBills] = useState([]);
  const [spendingGroups, setSpendingGroups] = useState([]);
  const [objects, setObjects] = useState([]);
  const [dataReady, setDataReady] = useState(false);

  const [period, setPeriod] = useState('month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setDataReady(false);
    try {
      const [
        usersData, depositsData, checksData, expenseChecksData,
        billsData, expenseBillsData, groupsData, objectsData
      ] = await Promise.all([
        apiGet('/users'),
        apiGet('/deposits'),
        apiGet('/checks'),
        apiGet('/expense-checks'),
        apiGet('/bills'),
        apiGet('/expense-bills'),
        apiGet('/spending-groups'),
        apiGet('/objects')
      ]);
      
      setUsers(usersData);
      setDeposits(depositsData);
      setChecks(checksData);
      setExpenseChecks(expenseChecksData);
      setBills(billsData);
      setExpenseBills(expenseBillsData);
      setSpendingGroups(groupsData);
      setObjects(objectsData);
      
      setDataReady(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getCashboxBalance = () => {
    const cashboxDeposits = deposits
      .filter(d => Number(d.user_id) === 1)
      .reduce((sum, d) => sum + Number(d.amount), 0);

    const cashboxChecks = checks
      .filter(c => Number(c.user_id) === 1)
      .map(c => c.id);
    const cashboxCheckTotal = expenseChecks
      .filter(ec => cashboxChecks.includes(Number(ec.check_id)))
      .reduce((sum, ec) => sum + Number(ec.price) * Number(ec.quantity), 0);

    const othersDeposits = deposits
      .filter(d => Number(d.user_id) !== 1)
      .reduce((sum, d) => sum + Number(d.amount), 0);

    return cashboxDeposits - cashboxCheckTotal - othersDeposits;
  };

  const getDateRange = () => {
    const now = new Date();
    let from, to;

    switch (period) {
      case 'today':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1);
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 8);
        break;
      case 'month':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'year':
        from = new Date(now.getFullYear(), 0, 1);
        to = new Date(now.getFullYear() + 1, 0, 1);
        break;
      case 'custom':
        from = customDateFrom ? new Date(customDateFrom) : null;
        to = customDateTo ? new Date(customDateTo) : null;
        break;
      default:
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    const format = (d) => d ? d.toISOString().split('T')[0] : null;
    return { from: format(from), to: format(to) };
  };

  const { from, to } = getDateRange();

  const filteredChecks = useMemo(() => {
    return checks.filter(c => {
      if (from && c.date < from) return false;
      if (to && c.date >= to) return false;
      return true;
    });
  }, [checks, from, to]);

  const filteredBills = useMemo(() => {
    return bills.filter(b => {
      if (from && b.date < from) return false;
      if (to && b.date >= to) return false;
      return true;
    });
  }, [bills, from, to]);

  const totalCheckExpenses = useMemo(() => {
    const checkIds = filteredChecks.map(c => c.id);
    console.log('Check IDs for period:', checkIds);
    
    const relevantChecks = expenseChecks.filter(ec => 
      checkIds.some(id => Number(id) === Number(ec.check_id))
    );
    console.log('Relevant expense checks:', relevantChecks);
    
    const total = relevantChecks.reduce((sum, ec) => sum + Number(ec.price) * Number(ec.quantity), 0);
    console.log('Total check expenses:', total);
    
    return total;
  }, [filteredChecks, expenseChecks]);

  const totalBillExpenses = useMemo(() => {
    const billIds = filteredBills.map(b => b.id);
    console.log('Bill IDs for period:', billIds);
    
    // Покажем все счета за период и их позиции
    filteredBills.forEach(bill => {
      const positions = expenseBills.filter(eb => Number(eb.bills_id) === Number(bill.id));
      console.log(`Bill ${bill.id} (${bill.text}) has ${positions.length} positions`);
    });
    
    // Важно: преобразуем оба значения к Number для сравнения
    const relevantBills = expenseBills.filter(eb => 
      billIds.some(id => Number(id) === Number(eb.bills_id))
    );
    
    console.log('Relevant expense bills:', relevantBills);
    
    const total = relevantBills.reduce((sum, eb) => sum + Number(eb.price) * Number(eb.quantity), 0);
    console.log('Total bill expenses:', total);
    
    return total;
  }, [filteredBills, expenseBills]);

  const totalExpenses = totalCheckExpenses + totalBillExpenses;
  const operationsCount = filteredChecks.length + filteredBills.length;

  // Расходы по месяцам (счета + чеки) - ИСПРАВЛЕННАЯ ВЕРСИЯ
  const monthlyExpenses = useMemo(() => {
    if (!dataReady) {
      return [];
    }

    // Собираем все позиции чеков с датами
    const checkItems = [];
    expenseChecks.forEach(ec => {
      if (!ec || !ec.check_id) return;
      const check = checks.find(c => c && Number(c.id) === Number(ec.check_id));
      if (!check || !check.date) return;
      checkItems.push({
        date: check.date,
        amount: Number(ec.price) * Number(ec.quantity)
      });
    });

    // Собираем все позиции счетов с датами
    const billItems = [];
    expenseBills.forEach(eb => {
      if (!eb || !eb.bills_id) return;
      const bill = bills.find(b => b && Number(b.id) === Number(eb.bills_id));
      if (!bill || !bill.date) return;
      billItems.push({
        date: bill.date,
        amount: Number(eb.price) * Number(eb.quantity)
      });
    });

    const allItems = [...checkItems, ...billItems];

    // Группируем по году-месяцу
    const months = {};
    allItems.forEach(item => {
      if (!item || !item.date) return;
      const monthKey = item.date.substring(0, 7);
      if (!months[monthKey]) months[monthKey] = 0;
      months[monthKey] += item.amount;
    });

    // Преобразуем в массив для графика и сортируем по дате
    const result = Object.entries(months)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return result;
  }, [checks, bills, expenseChecks, expenseBills, dataReady]);

  const topGroups = useMemo(() => {
    const groupTotals = {};

    checks.forEach(check => {
      const groupId = check.spending_group_id;
      if (!groupId) return;
      const checkItems = expenseChecks.filter(ec => Number(ec.check_id) === Number(check.id));
      const total = checkItems.reduce((sum, ec) => sum + Number(ec.price) * Number(ec.quantity), 0);
      if (!groupTotals[groupId]) groupTotals[groupId] = 0;
      groupTotals[groupId] += total;
    });

    bills.forEach(bill => {
      const groupId = bill.spending_group_id;
      if (!groupId) return;
      const billItems = expenseBills.filter(eb => Number(eb.bills_id) === Number(bill.id));
      const total = billItems.reduce((sum, eb) => sum + Number(eb.price) * Number(eb.quantity), 0);
      if (!groupTotals[groupId]) groupTotals[groupId] = 0;
      groupTotals[groupId] += total;
    });

    const result = Object.entries(groupTotals).map(([groupId, total]) => {
      const group = spendingGroups.find(g => Number(g.id) === Number(groupId));
      const obj = objects.find(o => Number(o.id) === Number(group?.object_id));
      const address = obj ? obj.object_address : '';
      const name = group ? `${group.text} (${address})` : 'Неизвестная группа';
      return { name, total };
    });

    return result.sort((a, b) => b.total - a.total).slice(0, 5);
  }, [checks, bills, expenseChecks, expenseBills, spendingGroups, objects]);

  const recentOperations = useMemo(() => {
    const checkOps = filteredChecks.map(c => ({ ...c, type: 'check' }));
    const billOps = filteredBills.map(b => ({ ...b, type: 'bill' }));
    const allOps = [...checkOps, ...billOps];
    return allOps.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [filteredChecks, filteredBills]);

  const formatDate = (dateStr) => dateStr.split('-').reverse().join('.');

  if (loading) return <div>Загрузка дашборда...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div className="fade-in">
      <div className="flex-between mb-3">
        <h2 style={{ fontSize: 'var(--font-size-2xl)' }}>Дашборд</h2>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--font-size-sm)' }}>Период:</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input"
            style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', width: 'auto' }}
          >
            <option value="today">Сегодня</option>
            <option value="week">Текущая неделя</option>
            <option value="month">Текущий месяц</option>
            <option value="year">Текущий год</option>
            <option value="custom">Произвольный</option>
          </select>
          {period === 'custom' && (
            <>
              <Input
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                style={{ width: '150px' }}
                placeholder="с"
              />
              <Input
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                style={{ width: '150px' }}
                placeholder="по"
              />
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
        <Card>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray)' }}>Баланс кассы</div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600, color: 'var(--primary)' }}>
            {getCashboxBalance().toFixed(2)} ₽
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray)' }}>Расходы за период</div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600, color: 'var(--success)' }}>
            {totalExpenses.toFixed(2)} ₽
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray)' }}>
            чеки: {totalCheckExpenses.toFixed(2)} ₽, счета: {totalBillExpenses.toFixed(2)} ₽
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray)' }}>Количество операций</div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600, color: 'var(--info)' }}>
            {operationsCount}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray)' }}>
            чеков: {filteredChecks.length}, счетов: {filteredBills.length}
          </div>
        </Card>
      </div>

      {/* График расходов по месяцам */}
      <Card title="Расходы по месяцам" className="mb-3">
        {!dataReady ? (
          <p style={{ textAlign: 'center', color: 'var(--gray)', padding: '40px' }}>
            Загрузка данных...
          </p>
        ) : monthlyExpenses.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--gray)', padding: '40px' }}>
            Нет данных для отображения
          </p>
        ) : (
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyExpenses}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#666', fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: '#666', fontSize: 12 }}
                  tickFormatter={(value) => value.toLocaleString('ru-RU')}
                />
                <Tooltip 
                  formatter={(value) => [`${Number(value).toFixed(2)} ₽`, 'Расходы']}
                  labelFormatter={(label) => {
                    const [year, month] = label.split('-');
                    return `${month}.${year}`;
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#4361ee" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Расходы"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
        <Card title="Топ-5 групп расходов">
          {topGroups.length === 0 ? (
            <p style={{ color: 'var(--gray)', textAlign: 'center' }}>Нет данных</p>
          ) : (
            <table style={{ width: '100%' }}>
              <tbody>
                {topGroups.map((group, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: 'var(--spacing-sm) 0' }}>{group.name}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{group.total.toFixed(2)} ₽</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Последние операции">
          {recentOperations.length === 0 ? (
            <p style={{ color: 'var(--gray)', textAlign: 'center' }}>Нет операций за период</p>
          ) : (
            <table style={{ width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--light)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--spacing-sm) 0' }}>Тип</th>
                  <th style={{ textAlign: 'left', padding: 'var(--spacing-sm) 0' }}>Описание</th>
                  <th style={{ textAlign: 'right', padding: 'var(--spacing-sm) 0' }}>Дата</th>
                </tr>
              </thead>
              <tbody>
                {recentOperations.map(op => (
                  <tr key={`${op.type}-${op.id}`}>
                    <td style={{ padding: 'var(--spacing-sm) 0' }}>
                      <Badge variant={op.type === 'check' ? 'warning' : 'info'}>
                        {op.type === 'check' ? 'Чек' : 'Счёт'}
                      </Badge>
                    </td>
                    <td style={{ padding: 'var(--spacing-sm) 0' }}>{op.text}</td>
                    <td style={{ textAlign: 'right', padding: 'var(--spacing-sm) 0' }}>{formatDate(op.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

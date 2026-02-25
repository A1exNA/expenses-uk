import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Card, Badge, Button, Input } from '../components/ui';
import { apiGet } from '../services/api';
import '../styles/utils.css';

const Dashboard = () => {
  // Состояния для загрузки данных
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Данные
  const [users, setUsers] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [checks, setChecks] = useState([]);
  const [expenseChecks, setExpenseChecks] = useState([]);
  const [bills, setBills] = useState([]);
  const [expenseBills, setExpenseBills] = useState([]);
  const [spendingGroups, setSpendingGroups] = useState([]);
  const [objects, setObjects] = useState([]);

  // Фильтр периода
  const [period, setPeriod] = useState('month'); // 'today', 'week', 'month', 'year', 'custom'
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  // Загрузка всех данных (аналогично другим страницам)
  const fetchData = async () => {
    setLoading(true);
    setError(null);
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Вычисление баланса кассы (пользователь id=1)
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

  // Функция для получения дат в зависимости от выбранного периода
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

    // Преобразуем в строки YYYY-MM-DD для сравнения
    const format = (d) => d ? d.toISOString().split('T')[0] : null;
    return { from: format(from), to: format(to) };
  };

  // Фильтрация чеков и счетов по периоду
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

  // Суммы расходов
  const totalCheckExpenses = useMemo(() => {
    const checkIds = filteredChecks.map(c => c.id);
    return expenseChecks
      .filter(ec => checkIds.includes(Number(ec.check_id)))
      .reduce((sum, ec) => sum + Number(ec.price) * Number(ec.quantity), 0);
  }, [filteredChecks, expenseChecks]);

  const totalBillExpenses = useMemo(() => {
    const billIds = filteredBills.map(b => b.id);
    return expenseBills
      .filter(eb => billIds.includes(Number(eb.bills_id)))
      .reduce((sum, eb) => sum + Number(eb.price) * Number(eb.quantity), 0);
  }, [filteredBills, expenseBills]);

  const totalExpenses = totalCheckExpenses + totalBillExpenses;

  // Количество операций
  const operationsCount = filteredChecks.length + filteredBills.length;

  // Расходы по месяцам (для графика)
  const monthlyExpenses = useMemo(() => {
    // Собираем все позиции чеков и счетов с датами
    const checkItems = expenseChecks.map(ec => {
      const check = checks.find(c => c.id === ec.check_id);
      return { date: check?.date, amount: Number(ec.price) * Number(ec.quantity) };
    }).filter(item => item.date);

    const billItems = expenseBills.map(eb => {
      const bill = bills.find(b => b.id === eb.bills_id);
      return { date: bill?.date, amount: Number(eb.price) * Number(eb.quantity) };
    }).filter(item => item.date);

    const allItems = [...checkItems, ...billItems];

    // Группируем по году-месяцу
    const months = {};
    allItems.forEach(item => {
      if (!item.date) return;
      const monthKey = item.date.substring(0, 7); // YYYY-MM
      if (!months[monthKey]) months[monthKey] = 0;
      months[monthKey] += item.amount;
    });

    // Преобразуем в массив для графика
    return Object.entries(months)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [checks, bills, expenseChecks, expenseBills]);

  // Топ-5 групп расходов по сумме
  const topGroups = useMemo(() => {
    // Собираем все позиции с привязкой к группе (через check/bill -> spending_group)
    const groupTotals = {};

    // Чеки
    checks.forEach(check => {
      const groupId = check.spending_group_id;
      if (!groupId) return;
      const checkItems = expenseChecks.filter(ec => Number(ec.check_id) === Number(check.id));
      const total = checkItems.reduce((sum, ec) => sum + Number(ec.price) * Number(ec.quantity), 0);
      if (!groupTotals[groupId]) groupTotals[groupId] = 0;
      groupTotals[groupId] += total;
    });

    // Счета
    bills.forEach(bill => {
      const groupId = bill.spending_group_id;
      if (!groupId) return;
      const billItems = expenseBills.filter(eb => Number(eb.bills_id) === Number(bill.id));
      const total = billItems.reduce((sum, eb) => sum + Number(eb.price) * Number(eb.quantity), 0);
      if (!groupTotals[groupId]) groupTotals[groupId] = 0;
      groupTotals[groupId] += total;
    });

    // Преобразуем в массив, добавим название группы
    const result = Object.entries(groupTotals).map(([groupId, total]) => {
      const group = spendingGroups.find(g => Number(g.id) === Number(groupId));
      const obj = objects.find(o => Number(o.id) === Number(group?.object_id));
      const address = obj ? obj.object_address : '';
      const name = group ? `${group.text} (${address})` : 'Неизвестная группа';
      return { name, total };
    });

    // Сортируем по убыванию и берём топ-5
    return result.sort((a, b) => b.total - a.total).slice(0, 5);
  }, [checks, bills, expenseChecks, expenseBills, spendingGroups, objects]);

  // Последние операции (объединяем чеки и счета, сортируем по дате, берём 5)
  const recentOperations = useMemo(() => {
    const checkOps = filteredChecks.map(c => ({ ...c, type: 'check' }));
    const billOps = filteredBills.map(b => ({ ...b, type: 'bill' }));
    const allOps = [...checkOps, ...billOps];
    return allOps.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [filteredChecks, filteredBills]);

  // Форматирование даты
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

      {/* Карточки с ключевыми показателями */}
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
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyExpenses} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `${value.toFixed(2)} ₽`} />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="var(--primary)" name="Расходы" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
        {/* Топ-5 групп расходов */}
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

        {/* Последние операции */}
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

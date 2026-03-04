import React, { useState, useEffect, useMemo } from 'react';
import { Button, Input, Card, Badge } from '../../components/ui';
import { apiGet } from '../../services/api';
import ExportButton from '../../components/ui/ExportButton';
import { showError, showInfo } from '../../components/ui/Toast';
import '../../styles/utils.css';

const SubreportReport = () => {
  const [users, setUsers] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [checks, setChecks] = useState([]);
  const [expenseChecks, setExpenseChecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Параметры отчёта
  const [selectedUser, setSelectedUser] = useState('');
  const [period, setPeriod] = useState('month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [reportData, setReportData] = useState(null);
  const [showReport, setShowReport] = useState(false);

  // Загрузка данных
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, depositsData, checksData, expenseChecksData] = await Promise.all([
        apiGet('/users'),
        apiGet('/deposits'),
        apiGet('/checks'),
        apiGet('/expense-checks')
      ]);
      setUsers(usersData);
      setDeposits(depositsData);
      setChecks(checksData);
      setExpenseChecks(expenseChecksData);
    } catch (err) {
      setError(err.message);
      showError('Ошибка загрузки данных: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

    const format = (d) => d ? d.toISOString().split('T')[0] : null;
    return { from: format(from), to: format(to) };
  };

  const generateReport = () => {
    if (!selectedUser) {
      showInfo('Выберите сотрудника');
      return;
    }

    const { from, to } = getDateRange();

    // Получаем данные пользователя
    const user = users.find(u => Number(u.id) === Number(selectedUser));
    if (!user) return;

    // Фильтруем пополнения за период
    const userDeposits = deposits
      .filter(d => Number(d.user_id) === Number(selectedUser))
      .filter(d => {
        if (from && d.date < from) return false;
        if (to && d.date >= to) return false;
        return true;
      })
      .map(d => ({
        id: d.id,
        date: d.date,
        amount: Number(d.amount),
        type: 'deposit'
      }));

    // Получаем все чеки пользователя за период
    const userChecks = checks
      .filter(c => Number(c.user_id) === Number(selectedUser))
      .filter(c => {
        if (from && c.date < from) return false;
        if (to && c.date >= to) return false;
        return true;
      });

    // Для каждого чека получаем позиции и считаем общую сумму
    const checkDetails = userChecks.map(check => {
      const checkItems = expenseChecks
        .filter(ec => Number(ec.check_id) === Number(check.id))
        .map(ec => ({
          id: ec.id,
          text: ec.text,
          price: Number(ec.price),
          quantity: Number(ec.quantity),
          total: Number(ec.price) * Number(ec.quantity)
        }));

      const total = checkItems.reduce((sum, item) => sum + item.total, 0);

      return {
        id: check.id,
        date: check.date,
        text: check.text,
        items: checkItems,
        total: total
      };
    });

    // Считаем остаток на начало периода (все операции до начала периода)
    const previousDeposits = deposits
      .filter(d => Number(d.user_id) === Number(selectedUser))
      .filter(d => from && d.date < from)
      .reduce((sum, d) => sum + Number(d.amount), 0);

    const previousChecks = checks
      .filter(c => Number(c.user_id) === Number(selectedUser))
      .filter(c => from && c.date < from)
      .map(c => c.id);
    
    const previousCheckTotal = expenseChecks
      .filter(ec => previousChecks.includes(Number(ec.check_id)))
      .reduce((sum, ec) => sum + Number(ec.price) * Number(ec.quantity), 0);

    const startBalance = previousDeposits - previousCheckTotal;

    // Сумма пополнений за период
    const depositsTotal = userDeposits.reduce((sum, d) => sum + d.amount, 0);

    // Сумма чеков за период
    const checksTotal = checkDetails.reduce((sum, c) => sum + c.total, 0);

    // Остаток на конец периода
    const endBalance = startBalance + depositsTotal - checksTotal;

    setReportData({
      user,
      from,
      to,
      startBalance,
      deposits: userDeposits,
      depositsTotal,
      checks: checkDetails,
      checksTotal,
      endBalance
    });

    setShowReport(true);
  };

  const formatDate = (dateStr) => dateStr.split('-').reverse().join('.');
  const formatCurrency = (value) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2 }).format(value);

  const getUserName = (userId) => {
    const user = users.find(u => Number(u.id) === Number(userId));
    return user ? user.user_name : 'Неизвестный сотрудник';
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div className="fade-in">
      <div className="flex-between mb-3">
        <h2 style={{ fontSize: 'var(--font-size-2xl)' }}>Отчёт по подотчётным лицам</h2>
      </div>

      <Card className="mb-3">
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Input
            type="select"
            label="Сотрудник"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            style={{ minWidth: '250px' }}
          >
            <option value="">Выберите сотрудника</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.user_name} {user.id === 1 ? '(Касса)' : ''}
              </option>
            ))}
          </Input>

          <Input
            type="select"
            label="Период"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{ width: '200px' }}
          >
            <option value="today">Сегодня</option>
            <option value="week">Текущая неделя</option>
            <option value="month">Текущий месяц</option>
            <option value="year">Текущий год</option>
            <option value="custom">Произвольный</option>
          </Input>

          {period === 'custom' && (
            <>
              <Input
                type="date"
                label="Дата с"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                style={{ width: '180px' }}
              />
              <Input
                type="date"
                label="Дата по"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                style={{ width: '180px' }}
              />
            </>
          )}

          <Button variant="primary" onClick={generateReport}>
            Сформировать отчёт
          </Button>
        </div>
      </Card>

      {showReport && reportData && (
        <>
          {/* Итоговая карточка */}
          <Card className="mb-3">
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>
              Отчёт по сотруднику: {reportData.user.user_name}
              {reportData.user.id === 1 && <Badge variant="info" style={{ marginLeft: 'var(--spacing-sm)' }}>Касса</Badge>}
            </h3>
            <p style={{ marginBottom: 'var(--spacing-md)' }}>
              Период: {reportData.from ? formatDate(reportData.from) : 'начало'} — {reportData.to ? formatDate(reportData.to) : 'настоящее время'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray)' }}>Остаток на начало</div>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, color: 'var(--primary)' }}>
                  {formatCurrency(reportData.startBalance)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray)' }}>Получено за период</div>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, color: 'var(--success)' }}>
                  +{formatCurrency(reportData.depositsTotal)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray)' }}>Потрачено за период</div>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, color: 'var(--danger)' }}>
                  -{formatCurrency(reportData.checksTotal)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray)' }}>Остаток на конец</div>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, color: reportData.endBalance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {formatCurrency(reportData.endBalance)}
                </div>
              </div>
            </div>
          </Card>

          {/* Пополнения за период */}
          <Card className="mb-3">
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Пополнения за период</h3>
            {reportData.deposits.length === 0 ? (
              <p style={{ color: 'var(--gray)' }}>Нет пополнений за выбранный период</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--light)' }}>
                    <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)' }}>Дата</th>
                    <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.deposits.map(dep => (
                    <tr key={dep.id} style={{ borderBottom: '1px solid var(--light)' }}>
                      <td style={{ padding: 'var(--spacing-sm)' }}>{formatDate(dep.date)}</td>
                      <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)', fontWeight: 500 }}>
                        +{formatCurrency(dep.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 'bold', borderTop: '2px solid var(--light)' }}>
                    <td style={{ padding: 'var(--spacing-sm)' }}>ИТОГО:</td>
                    <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>
                      +{formatCurrency(reportData.depositsTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </Card>

          {/* Чеки за период */}
          <Card className="mb-3">
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Расходы (чеки) за период</h3>
            {reportData.checks.length === 0 ? (
              <p style={{ color: 'var(--gray)' }}>Нет чеков за выбранный период</p>
            ) : (
              <>
                {reportData.checks.map(check => (
                  <div key={check.id} style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <p style={{ fontWeight: 500 }}>
                      Чек от {formatDate(check.date)}: {check.text}
                    </p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginLeft: 'var(--spacing-md)' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--light)' }}>
                          <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)' }}>Наименование</th>
                          <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Цена</th>
                          <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Кол-во</th>
                          <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Сумма</th>
                        </tr>
                      </thead>
                      <tbody>
                        {check.items.map(item => (
                          <tr key={item.id}>
                            <td style={{ padding: 'var(--spacing-sm)' }}>{item.text}</td>
                            <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{formatCurrency(item.price)}</td>
                            <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                        <tr style={{ fontWeight: 'bold' }}>
                          <td colSpan="3" style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Итого по чеку:</td>
                          <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{formatCurrency(check.total)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
                <div style={{ fontWeight: 'bold', borderTop: '2px solid var(--light)', padding: 'var(--spacing-md)', textAlign: 'right' }}>
                  ВСЕГО РАСХОДОВ: {formatCurrency(reportData.checksTotal)}
                </div>
              </>
            )}
          </Card>

          {/* Кнопка экспорта */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <ExportButton
              data={[
                {
                  'Сотрудник': reportData.user.user_name,
                  'Период с': reportData.from ? formatDate(reportData.from) : 'начало',
                  'Период по': reportData.to ? formatDate(reportData.to) : 'настоящее время',
                  'Остаток на начало': reportData.startBalance,
                  'Получено': reportData.depositsTotal,
                  'Потрачено': reportData.checksTotal,
                  'Остаток на конец': reportData.endBalance
                }
              ]}
              headers={[
                { key: 'Сотрудник', label: 'Сотрудник', type: 'string' },
                { key: 'Период с', label: 'Период с', type: 'string' },
                { key: 'Период по', label: 'Период по', type: 'string' },
                { key: 'Остаток на начало', label: 'Остаток на начало', type: 'float' },
                { key: 'Получено', label: 'Получено', type: 'float' },
                { key: 'Потрачено', label: 'Потрачено', type: 'float' },
                { key: 'Остаток на конец', label: 'Остаток на конец', type: 'float' }
              ]}
              filename={`subreport_${reportData.user.id}_${reportData.from || 'start'}_${reportData.to || 'end'}`}
            >
              Экспорт в Excel
            </ExportButton>
          </div>
        </>
      )}
    </div>
  );
};

export default SubreportReport;

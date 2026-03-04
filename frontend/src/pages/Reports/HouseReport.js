import React, { useState, useEffect, useMemo } from 'react';
import { Button, Input, Card } from '../../components/ui';
import { apiGet } from '../../services/api';
import ExportButton from '../../components/ui/ExportButton';
import { showError, showInfo } from '../../components/ui/Toast';
import '../../styles/utils.css';

const HouseReport = () => {
  const [objects, setObjects] = useState([]);
  const [spendingGroups, setSpendingGroups] = useState([]);
  const [bills, setBills] = useState([]);
  const [expenseBills, setExpenseBills] = useState([]);
  const [checks, setChecks] = useState([]);
  const [expenseChecks, setExpenseChecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Параметры отчёта
  const [selectedObject, setSelectedObject] = useState('');
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
      const [objectsData, groupsData, billsData, expenseBillsData, checksData, expenseChecksData] = await Promise.all([
        apiGet('/objects'),
        apiGet('/spending-groups'),
        apiGet('/bills'),
        apiGet('/expense-bills'),
        apiGet('/checks'),
        apiGet('/expense-checks')
      ]);
      
      console.log('Objects:', objectsData);
      console.log('Groups:', groupsData);
      console.log('Bills:', billsData);
      console.log('Expense Bills:', expenseBillsData);
      console.log('Checks:', checksData);
      console.log('Expense Checks:', expenseChecksData);
      
      setObjects(objectsData);
      setSpendingGroups(groupsData);
      setBills(billsData);
      setExpenseBills(expenseBillsData);
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
        const firstDay = now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1);
        from = new Date(now.getFullYear(), now.getMonth(), firstDay);
        to = new Date(now.getFullYear(), now.getMonth(), firstDay + 7);
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
        if (to) {
          to.setDate(to.getDate() + 1);
        }
        break;
      default:
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    const format = (d) => d ? d.toISOString().split('T')[0] : null;
    return { from: format(from), to: format(to) };
  };

  // Расчёт начислений за прошедшие месяцы в периоде
  const getAccrualsForPeriod = (object, from, to) => {
    if (!from || !to) {
      // Если даты не заданы, берём текущий месяц
      const monthlyManagement = Number(object.object_area) * Number(object.management_fee);
      const monthlyRepair = Number(object.object_area) * Number(object.current_repair_rate);
      return {
        management: monthlyManagement,
        repair: monthlyRepair,
        total: monthlyManagement + monthlyRepair
      };
    }

    const startDate = new Date(from);
    const endDate = new Date(to);
    const today = new Date();
    
    // Ограничиваем конечную дату сегодняшним днём
    const actualEndDate = endDate > today ? today : endDate;
    
    // Если начальная дата позже сегодня, начислений нет
    if (startDate > today) {
      return {
        management: 0,
        repair: 0,
        total: 0
      };
    }
    
    // Количество полных месяцев в периоде (с учётом сегодняшней даты)
    const monthsDiff = (actualEndDate.getFullYear() - startDate.getFullYear()) * 12 + 
                       (actualEndDate.getMonth() - startDate.getMonth());
    
    // Начисления за месяц
    const monthlyManagement = Number(object.object_area) * Number(object.management_fee);
    const monthlyRepair = Number(object.object_area) * Number(object.current_repair_rate);
    
    // Если период меньше месяца, начисляем пропорционально
    if (monthsDiff === 0) {
      const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
      const daysPassed = Math.min(
        actualEndDate.getDate() - startDate.getDate(),
        daysInMonth
      );
      const ratio = Math.max(0, daysPassed / daysInMonth);
      
      return {
        management: monthlyManagement * ratio,
        repair: monthlyRepair * ratio,
        total: (monthlyManagement + monthlyRepair) * ratio
      };
    }
    
    return {
      management: monthlyManagement * monthsDiff,
      repair: monthlyRepair * monthsDiff,
      total: (monthlyManagement + monthlyRepair) * monthsDiff
    };
  };

  const generateReport = () => {
    if (!selectedObject) {
      showInfo('Выберите дом');
      return;
    }

    const { from, to } = getDateRange();
    console.log('Date range:', { from, to });

    // Получаем данные дома
    const object = objects.find(o => Number(o.id) === Number(selectedObject));
    if (!object) {
      showError('Дом не найден');
      return;
    }

    // Получаем группы расходов для этого дома
    const houseGroups = spendingGroups.filter(g => Number(g.object_id) === Number(selectedObject));
    console.log('House groups:', houseGroups);
    
    const groupIds = houseGroups.map(g => g.id);
    console.log('Group IDs:', groupIds);

    if (groupIds.length === 0) {
      showInfo('У этого дома нет групп расходов');
    }

    // Расчёт начислений за прошедшие месяцы
    const accruals = getAccrualsForPeriod(object, from, to);
    console.log('Accruals for period (past months only):', accruals);

    // Получаем все счета для групп дома
    const allHouseBills = bills.filter(b => {
      const matches = groupIds.some(gid => String(gid) === String(b.spending_group_id));
      return matches;
    });
    console.log('All house bills (no date filter):', allHouseBills);

    // Счета за период с фильтром по дате
    const periodBills = allHouseBills.filter(b => {
      if (from && b.date < from) return false;
      if (to && b.date >= to) return false;
      return true;
    });
    console.log('Period bills:', periodBills);

    // Детализация счетов
    const billDetails = periodBills.map(bill => {
      const billItems = expenseBills
        .filter(eb => Number(eb.bills_id) === Number(bill.id))
        .map(eb => ({
          id: eb.id,
          text: eb.text,
          price: Number(eb.price),
          quantity: Number(eb.quantity),
          total: Number(eb.price) * Number(eb.quantity)
        }));
      
      const total = billItems.reduce((sum, item) => sum + item.total, 0);

      return {
        id: bill.id,
        date: bill.date,
        text: bill.text,
        groupId: bill.spending_group_id,
        groupName: spendingGroups.find(g => Number(g.id) === Number(bill.spending_group_id))?.text || 'Неизвестная группа',
        items: billItems,
        total
      };
    });

    // Получаем все чеки для групп дома
    const allHouseChecks = checks.filter(c => {
      const matches = groupIds.some(gid => String(gid) === String(c.spending_group_id));
      return matches;
    });
    console.log('All house checks (no date filter):', allHouseChecks);

    // Чеки за период с фильтром по дате
    const periodChecks = allHouseChecks.filter(c => {
      if (from && c.date < from) return false;
      if (to && c.date >= to) return false;
      return true;
    });
    console.log('Period checks:', periodChecks);

    // Детализация чеков с коэффициентом 1.1
    const checkDetails = periodChecks.map(check => {
      const checkItems = expenseChecks
        .filter(ec => Number(ec.check_id) === Number(check.id))
        .map(ec => ({
          id: ec.id,
          text: ec.text,
          price: Number(ec.price),
          quantity: Number(ec.quantity),
          total: Number(ec.price) * Number(ec.quantity) * 1.1 // коэффициент 110%
        }));
      
      const total = checkItems.reduce((sum, item) => sum + item.total, 0);

      return {
        id: check.id,
        date: check.date,
        text: check.text,
        groupId: check.spending_group_id,
        groupName: spendingGroups.find(g => Number(g.id) === Number(check.spending_group_id))?.text || 'Неизвестная группа',
        items: checkItems,
        total
      };
    });

    // Итоги по группам
    const groupsSummary = houseGroups.map(group => {
      const groupBills = billDetails.filter(b => Number(b.groupId) === Number(group.id));
      const groupChecks = checkDetails.filter(c => Number(c.groupId) === Number(group.id));
      
      const billsTotal = groupBills.reduce((sum, b) => sum + b.total, 0);
      const checksTotal = groupChecks.reduce((sum, c) => sum + c.total, 0);

      return {
        id: group.id,
        name: group.text,
        billsTotal,
        checksTotal,
        total: billsTotal + checksTotal
      };
    });

    // Общие итоги
    const totalBills = billDetails.reduce((sum, b) => sum + b.total, 0);
    const totalChecks = checkDetails.reduce((sum, c) => sum + c.total, 0);
    const totalExpenses = totalBills + totalChecks;

    console.log('Total bills:', totalBills);
    console.log('Total checks:', totalChecks);
    console.log('Total expenses:', totalExpenses);

    setReportData({
      object,
      from,
      to,
      accruals,
      groupsSummary,
      bills: billDetails,
      checks: checkDetails,
      totalBills,
      totalChecks,
      totalExpenses
    });

    setShowReport(true);
  };

  const formatDate = (dateStr) => dateStr.split('-').reverse().join('.');
  const formatCurrency = (value) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2 }).format(value);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div className="fade-in">
      <div className="flex-between mb-3">
        <h2 style={{ fontSize: 'var(--font-size-2xl)' }}>Отчёт по дому (план/факт)</h2>
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
          {/* Шапка отчёта */}
          <Card className="mb-3">
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>
              Отчёт по дому: {reportData.object.object_address}
            </h3>
            <p style={{ marginBottom: 'var(--spacing-md)' }}>
              Период: {reportData.from ? formatDate(reportData.from) : 'начало'} — {reportData.to ? formatDate(reportData.to) : 'настоящее время'}
            </p>
          </Card>

          {/* План/факт */}
          <Card className="mb-3">
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>План/факт</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--light)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)' }}>Показатель</th>
                  <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>План (начисления)</th>
                  <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Факт (расходы)</th>
                  <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Отклонение</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: 'var(--spacing-sm)' }}>Управление</td>
                  <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{formatCurrency(reportData.accruals.management)}</td>
                  <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>0.00</td>
                  <td style={{ 
                    textAlign: 'right', 
                    padding: 'var(--spacing-sm)',
                    color: 'var(--success)'
                  }}>
                    +{formatCurrency(reportData.accruals.management)}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 'var(--spacing-sm)' }}>Ремонт</td>
                  <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{formatCurrency(reportData.accruals.repair)}</td>
                  <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{formatCurrency(reportData.totalExpenses)}</td>
                  <td style={{ 
                    textAlign: 'right', 
                    padding: 'var(--spacing-sm)',
                    color: (reportData.accruals.repair - reportData.totalExpenses) >= 0 ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {formatCurrency(reportData.accruals.repair - reportData.totalExpenses)}
                  </td>
                </tr>
                <tr style={{ fontWeight: 'bold', borderTop: '2px solid var(--light)' }}>
                  <td style={{ padding: 'var(--spacing-sm)' }}>ИТОГО</td>
                  <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{formatCurrency(reportData.accruals.total)}</td>
                  <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{formatCurrency(reportData.totalExpenses)}</td>
                  <td style={{ 
                    textAlign: 'right', 
                    padding: 'var(--spacing-sm)',
                    color: (reportData.accruals.total - reportData.totalExpenses) >= 0 ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {formatCurrency(reportData.accruals.total - reportData.totalExpenses)}
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>

          {/* Сводка по группам */}
          <Card className="mb-3">
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Расходы по группам</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--light)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)' }}>Группа расходов</th>
                  <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Счета</th>
                  <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Чеки</th>
                  <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Всего</th>
                </tr>
              </thead>
              <tbody>
                {reportData.groupsSummary.map(group => (
                  <tr key={group.id}>
                    <td style={{ padding: 'var(--spacing-sm)' }}>{group.name}</td>
                    <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{formatCurrency(group.billsTotal)}</td>
                    <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{formatCurrency(group.checksTotal)}</td>
                    <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)', fontWeight: 500 }}>{formatCurrency(group.total)}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', borderTop: '2px solid var(--light)' }}>
                  <td style={{ padding: 'var(--spacing-sm)' }}>ИТОГО</td>
                  <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{formatCurrency(reportData.totalBills)}</td>
                  <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{formatCurrency(reportData.totalChecks)}</td>
                  <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{formatCurrency(reportData.totalExpenses)}</td>
                </tr>
              </tbody>
            </table>
          </Card>

          {/* Детализация счетов */}
          {reportData.bills.length > 0 && (
            <Card className="mb-3">
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Детализация счетов</h3>
              {reportData.bills.map(bill => (
                <div key={bill.id} style={{ marginBottom: 'var(--spacing-lg)' }}>
                  <p style={{ fontWeight: 500 }}>
                    Счёт от {formatDate(bill.date)}: {bill.text} (группа: {bill.groupName})
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
                      {bill.items.map(item => (
                        <tr key={item.id}>
                          <td style={{ padding: 'var(--spacing-sm)' }}>{item.text}</td>
                          <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{formatCurrency(item.price)}</td>
                          <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{item.quantity}</td>
                          <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                      <tr style={{ fontWeight: 'bold' }}>
                        <td colSpan="3" style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Итого по счёту:</td>
                        <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{formatCurrency(bill.total)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))}
            </Card>
          )}

          {/* Детализация чеков */}
          {reportData.checks.length > 0 && (
            <Card className="mb-3">
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Детализация чеков</h3>
              {reportData.checks.map(check => (
                <div key={check.id} style={{ marginBottom: 'var(--spacing-lg)' }}>
                  <p style={{ fontWeight: 500 }}>
                    Чек от {formatDate(check.date)}: {check.text} (группа: {check.groupName})
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
            </Card>
          )}

          {/* Кнопка экспорта */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <ExportButton
              data={[
                {
                  'Дом': reportData.object.object_address,
                  'Период с': reportData.from ? formatDate(reportData.from) : 'начало',
                  'Период по': reportData.to ? formatDate(reportData.to) : 'настоящее время',
                  'Начисления (упр.)': reportData.accruals.management,
                  'Начисления (рем.)': reportData.accruals.repair,
                  'Начисления (всего)': reportData.accruals.total,
                  'Расходы (счета)': reportData.totalBills,
                  'Расходы (чеки)': reportData.totalChecks,
                  'Расходы (всего)': reportData.totalExpenses,
                  'Отклонение': reportData.accruals.total - reportData.totalExpenses
                }
              ]}
              headers={[
                { key: 'Дом', label: 'Дом', type: 'string' },
                { key: 'Период с', label: 'Период с', type: 'string' },
                { key: 'Период по', label: 'Период по', type: 'string' },
                { key: 'Начисления (упр.)', label: 'Начисления (упр.)', type: 'float' },
                { key: 'Начисления (рем.)', label: 'Начисления (рем.)', type: 'float' },
                { key: 'Начисления (всего)', label: 'Начисления (всего)', type: 'float' },
                { key: 'Расходы (счета)', label: 'Расходы (счета)', type: 'float' },
                { key: 'Расходы (чеки)', label: 'Расходы (чеки)', type: 'float' },
                { key: 'Расходы (всего)', label: 'Расходы (всего)', type: 'float' },
                { key: 'Отклонение', label: 'Отклонение', type: 'float' }
              ]}
              filename={`house_report_${reportData.object.id}_${reportData.from || 'start'}_${reportData.to || 'end'}`}
            >
              Экспорт в Excel
            </ExportButton>
          </div>
        </>
      )}
    </div>
  );
};

export default HouseReport;

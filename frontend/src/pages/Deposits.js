import React, { useState, useEffect, useMemo } from 'react';
import { Button, Modal, Input, Card, Badge } from '../components/ui';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import ExportButton from '../components/ui/ExportButton';
import '../styles/utils.css';

const Deposits = () => {
  const [deposits, setDeposits] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState(null);
  const [viewMode, setViewMode] = useState('cards');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  // Состояние для фильтров
  const [filters, setFilters] = useState({
    userId: '',
    amountMin: '',
    amountMax: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState({
    user_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [depositsData, usersData] = await Promise.all([
          apiGet('/deposits'),
          apiGet('/users')
        ]);
        setDeposits(depositsData);
        setUsers(usersData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getUserName = (userId) => {
    const user = users.find(u => Number(u.id) === Number(userId));
    return user ? user.user_name : 'Неизвестный сотрудник';
  };

  const formatDate = (dateStr) => dateStr.split('-').reverse().join('.');

  // Фильтрация пополнений
  const filteredDeposits = useMemo(() => {
    return deposits.filter(dep => {
      if (filters.userId && Number(dep.user_id) !== Number(filters.userId)) {
        return false;
      }

      if (filters.amountMin !== '' && Number(dep.amount) < parseFloat(filters.amountMin)) {
        return false;
      }

      if (filters.amountMax !== '' && Number(dep.amount) > parseFloat(filters.amountMax)) {
        return false;
      }

      if (filters.dateFrom && dep.date < filters.dateFrom) return false;
      if (filters.dateTo && dep.date > filters.dateTo) return false;

      return true;
    });
  }, [deposits, filters]);

  // Сортировка
  const sortedDeposits = useMemo(() => {
    const sortableItems = [...filteredDeposits];
    sortableItems.sort((a, b) => {
      let aVal, bVal;

      switch (sortConfig.key) {
        case 'date':
          aVal = a.date;
          bVal = b.date;
          break;
        case 'user':
          aVal = getUserName(a.user_id);
          bVal = getUserName(b.user_id);
          break;
        case 'amount':
          aVal = Number(a.amount);
          bVal = Number(b.amount);
          break;
        default:
          aVal = a.id;
          bVal = b.id;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortableItems;
  }, [filteredDeposits, users, sortConfig]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdd = () => {
    setEditingDeposit(null);
    setFormData({
      user_id: '',
      amount: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleEdit = (deposit) => {
    setEditingDeposit(deposit);
    setFormData({
      user_id: deposit.user_id.toString(),
      amount: deposit.amount.toString(),
      date: deposit.date
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить запись о пополнении?')) return;
    try {
      await apiDelete(`/deposits/${id}`);
      setDeposits(deposits.filter(d => d.id !== id));
    } catch (err) {
      alert('Ошибка удаления: ' + err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.user_id || !formData.amount || !formData.date) {
      alert('Заполните все поля');
      return;
    }
    try {
      const payload = {
        user_id: parseInt(formData.user_id),
        amount: parseFloat(formData.amount),
        date: formData.date
      };
      if (editingDeposit) {
        await apiPut(`/deposits/${editingDeposit.id}`, payload);
      } else {
        await apiPost('/deposits', payload);
      }
      const updated = await apiGet('/deposits');
      setDeposits(updated);
      setShowModal(false);
    } catch (err) {
      alert('Ошибка сохранения: ' + err.message);
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSortChange = (e) => {
    const [key, direction] = e.target.value.split('-');
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      userId: '',
      amountMin: '',
      amountMax: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div className="fade-in">
      <div className="flex-between mb-3">
        <h2 style={{ fontSize: 'var(--font-size-2xl)' }}>Пополнения (выдача подотчётных)</h2>
        <div className="flex gap-1">
          <Button variant={viewMode === 'cards' ? 'primary' : 'outline'} size="small" onClick={() => setViewMode('cards')}>
            Карточки
          </Button>
          <Button variant={viewMode === 'table' ? 'primary' : 'outline'} size="small" onClick={() => setViewMode('table')}>
            Таблица
          </Button>
          <Button variant="primary" onClick={handleAdd}>+ Добавить</Button>
          <ExportButton 
            data={sortedDeposits.map(dep => ({
              id: dep.id,
              user: getUserName(dep.user_id),
              amount: parseFloat(dep.amount),
              date: dep.date
            }))}
            headers={[
              { key: 'id', label: 'ID', type: 'integer' },
              { key: 'user', label: 'Сотрудник', type: 'string' },
              { key: 'amount', label: 'Сумма (₽)', type: 'float' },
              { key: 'date', label: 'Дата', type: 'date' }
            ]}
            title="Отчёт по пополнениям"
            filename="deposits_export"
          >
            Экспорт Excel
          </ExportButton>
        </div>
      </div>

      {/* Кнопка показа/скрытия фильтров */}
      <div className="mb-3">
        <Button variant="info" size="small" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
        </Button>
      </div>

      {/* Панель фильтров */}
      {showFilters && (
        <Card className="mb-3">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
            <Input
              type="select"
              label="Сотрудник"
              name="userId"
              value={filters.userId}
              onChange={handleFilterChange}
            >
              <option value="">Все сотрудники</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.user_name}</option>
              ))}
            </Input>
            <Input
              label="Сумма от"
              type="number"
              step="0.01"
              name="amountMin"
              value={filters.amountMin}
              onChange={handleFilterChange}
              placeholder="Мин. сумма"
            />
            <Input
              label="Сумма до"
              type="number"
              step="0.01"
              name="amountMax"
              value={filters.amountMax}
              onChange={handleFilterChange}
              placeholder="Макс. сумма"
            />
            <Input
              label="Дата с"
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
            />
            <Input
              label="Дата по"
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-md)' }}>
            <Button variant="neutral" size="small" onClick={resetFilters}>Сбросить фильтры</Button>
          </div>
        </Card>
      )}

      {viewMode === 'cards' && (
        <div className="flex-between mb-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray)' }}>Сортировать:</span>
            <select onChange={handleSortChange} value={`${sortConfig.key}-${sortConfig.direction}`} className="input" style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', borderRadius: 'var(--border-radius)', fontSize: 'var(--font-size-sm)', minWidth: '220px' }}>
              <option value="date-desc">Дата (сначала новые)</option>
              <option value="date-asc">Дата (сначала старые)</option>
              <option value="user-asc">Сотрудник (А-Я)</option>
              <option value="user-desc">Сотрудник (Я-А)</option>
              <option value="amount-desc">Сумма (по убыванию)</option>
              <option value="amount-asc">Сумма (по возрастанию)</option>
            </select>
          </div>
        </div>
      )}

      {sortedDeposits.length === 0 ? (
        <Card><p style={{ textAlign: 'center', color: 'var(--gray)' }}>Нет пополнений, соответствующих фильтрам.</p></Card>
      ) : viewMode === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: 'var(--spacing-lg)' }}>
          {sortedDeposits.map(dep => (
            <Card key={dep.id} className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-md)' }}>
                <h3 style={{ fontSize: 'var(--font-size-lg)', margin: 0, color: 'var(--primary)' }}>
                  {getUserName(dep.user_id)}
                </h3>
                <Badge variant="neutral">ID: {dep.id}</Badge>
              </div>
              <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray)' }}>Сумма</div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--success)' }}>
                  {Number(dep.amount).toFixed(2)} ₽
                </div>
              </div>
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray)' }}>Дата</div>
                <div>{formatDate(dep.date)}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
                <Button variant="warning" size="small" onClick={() => handleEdit(dep)}>✎ Ред.</Button>
                <Button variant="danger" size="small" onClick={() => handleDelete(dep.id)}>× Удал.</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--light)' }}>
                <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)', cursor: 'pointer' }} onClick={() => requestSort('user')}>
                  Сотрудник {sortConfig.key === 'user' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)', cursor: 'pointer' }} onClick={() => requestSort('amount')}>
                  Сумма {sortConfig.key === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)', cursor: 'pointer' }} onClick={() => requestSort('date')}>
                  Дата {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ textAlign: 'center', padding: 'var(--spacing-sm)' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {sortedDeposits.map(dep => (
                <tr key={dep.id} style={{ borderBottom: '1px solid var(--light)' }}>
                  <td style={{ padding: 'var(--spacing-sm)' }}>{getUserName(dep.user_id)}</td>
                  <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)', fontWeight: 500 }}>
                    {Number(dep.amount).toFixed(2)} ₽
                  </td>
                  <td style={{ padding: 'var(--spacing-sm)' }}>{formatDate(dep.date)}</td>
                  <td style={{ textAlign: 'center', padding: 'var(--spacing-sm)' }}>
                    <Button variant="warning" size="small" onClick={() => handleEdit(dep)}>Ред.</Button>
                    <Button variant="danger" size="small" onClick={() => handleDelete(dep.id)}>Удал.</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingDeposit ? 'Редактировать пополнение' : 'Новое пополнение'}
        footer={
          <>
            <Button variant="neutral" onClick={() => setShowModal(false)}>Отмена</Button>
            <Button variant="success" type="submit" form="depositForm">Сохранить</Button>
          </>
        }
      >
        <form id="depositForm" onSubmit={handleSave}>
          <Input
            type="select"
            label="Сотрудник"
            name="user_id"
            value={formData.user_id}
            onChange={handleInputChange}
            required
          >
            <option value="">Выберите сотрудника</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.user_name} ({user.user_post})</option>
            ))}
          </Input>
          <Input
            label="Сумма"
            type="number"
            step="0.01"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Дата"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            required
          />
        </form>
      </Modal>
    </div>
  );
};

export default Deposits;

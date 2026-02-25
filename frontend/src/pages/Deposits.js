import React, { useState, useEffect, useMemo } from 'react';
import { Button, Modal, Input, Card, Badge } from '../components/ui';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import '../styles/utils.css';

const Deposits = () => {
  const [deposits, setDeposits] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('cards');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  const [showModal, setShowModal] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
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

  useEffect(() => {
    fetchData();
  }, []);

  const getUserName = (userId) => {
    const user = users.find(u => Number(u.id) === Number(userId));
    return user ? user.user_name : 'Неизвестный сотрудник';
  };

  const sortedDeposits = useMemo(() => {
    const sortableItems = [...deposits];
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
          aVal = parseFloat(a.amount);
          bVal = parseFloat(b.amount);
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
  }, [deposits, users, sortConfig]);

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
      await fetchData();
    } catch (err) {
      alert('Ошибка удаления: ' + err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.user_id || !formData.amount) {
      alert('Выберите сотрудника и укажите сумму');
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
      await fetchData();
      setShowModal(false);
    } catch (err) {
      alert('Ошибка сохранения: ' + err.message);
    }
  };

  const formatDate = (dateStr) => dateStr.split('-').reverse().join('.');
  const formatCurrency = (value) => Number(value).toFixed(2) + ' ₽';

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

  if (loading && deposits.length === 0) return <div>Загрузка...</div>;
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
        </div>
      </div>

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
        <Card><p style={{ textAlign: 'center', color: 'var(--gray)' }}>Нет записей о пополнениях.</p></Card>
      ) : viewMode === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--spacing-lg)' }}>
          {sortedDeposits.map(deposit => (
            <Card key={deposit.id} className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-md)' }}>
                <h3 style={{ fontSize: 'var(--font-size-lg)', margin: 0, color: 'var(--primary)' }}>
                  {getUserName(deposit.user_id)}
                </h3>
                <Badge variant="neutral">ID: {deposit.id}</Badge>
              </div>
              <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray)' }}>Дата</div>
                <div>{formatDate(deposit.date)}</div>
              </div>
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray)' }}>Сумма</div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--success)' }}>
                  {formatCurrency(deposit.amount)}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
                <Button variant="warning" size="small" onClick={() => handleEdit(deposit)}>✎ Ред.</Button>
                <Button variant="danger" size="small" onClick={() => handleDelete(deposit.id)}>× Удал.</Button>
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
              {sortedDeposits.map(deposit => (
                <tr key={deposit.id} style={{ borderBottom: '1px solid var(--light)' }}>
                  <td style={{ padding: 'var(--spacing-sm)' }}>{getUserName(deposit.user_id)}</td>
                  <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)', fontWeight: 500 }}>
                    {formatCurrency(deposit.amount)}
                  </td>
                  <td style={{ padding: 'var(--spacing-sm)' }}>{formatDate(deposit.date)}</td>
                  <td style={{ textAlign: 'center', padding: 'var(--spacing-sm)' }}>
                    <Button variant="warning" size="small" onClick={() => handleEdit(deposit)}>Ред.</Button>
                    <Button variant="danger" size="small" onClick={() => handleDelete(deposit.id)}>Удал.</Button>
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
              <option key={user.id} value={user.id}>
                {user.user_name} ({user.user_post})
              </option>
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

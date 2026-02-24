import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';

const Deposits = () => {
  const [deposits, setDeposits] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState(null);
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

  const getUserName = (userId) => {
    const user = users.find(u => Number(u.id) === Number(userId));
    return user ? user.user_name : 'Неизвестный сотрудник';
  };

  const formatDate = (dateStr) => dateStr.split('-').reverse().join('.');

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Пополнения (выдача подотчётных)</h2>
        <button onClick={handleAdd} style={{ padding: '8px 16px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Добавить пополнение
        </button>
      </div>

      {deposits.length === 0 ? (
        <p>Нет записей о пополнениях.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
          <thead>
            <tr style={{ background: '#34495e', color: 'white' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Сотрудник</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Сумма</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Дата</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {deposits.map(deposit => (
              <tr key={deposit.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>{getUserName(deposit.user_id)}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>{Number(deposit.amount).toFixed(2)} ₽</td>
                <td style={{ padding: '10px' }}>{formatDate(deposit.date)}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <button onClick={() => handleEdit(deposit)} style={{ marginRight: '8px', padding: '4px 8px', background: '#f39c12', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
                    Ред.
                  </button>
                  <button onClick={() => handleDelete(deposit.id)} style={{ padding: '4px 8px', background: '#e74c3c', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
                    Удал.
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3>{editingDeposit ? 'Редактировать пополнение' : 'Новое пополнение'}</h3>
            <form onSubmit={handleSave}>
              <div style={formGroupStyle}>
                <label>Сотрудник:</label>
                <select
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleInputChange}
                  required
                  style={inputStyle}
                >
                  <option value="">Выберите сотрудника</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.user_name} ({user.user_post})
                    </option>
                  ))}
                </select>
              </div>
              <div style={formGroupStyle}>
                <label>Сумма:</label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={formGroupStyle}>
                <label>Дата:</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ ...buttonStyle, background: '#95a5a6' }}>
                  Отмена
                </button>
                <button type="submit" style={{ ...buttonStyle, background: '#27ae60' }}>
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Переиспользуем те же стили
const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000
};

const modalContentStyle = {
  background: 'white', padding: '20px', borderRadius: '8px', width: '400px'
};

const formGroupStyle = {
  marginBottom: '15px'
};

const inputStyle = {
  width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ddd'
};

const buttonStyle = {
  padding: '8px 16px', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer'
};

export default Deposits;

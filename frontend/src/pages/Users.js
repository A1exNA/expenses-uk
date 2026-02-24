import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    user_name: '',
    user_post: '',
    email: ''
  });

  // Загрузка списка сотрудников
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet('/users');
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Обработка изменения полей формы
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Открыть модалку для создания
  const handleAdd = () => {
    setEditingUser(null);
    setFormData({ user_name: '', user_post: '', email: '' });
    setShowModal(true);
  };

  // Открыть модалку для редактирования
  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      user_name: user.user_name,
      user_post: user.user_post,
      email: user.email || ''
    });
    setShowModal(true);
  };

  // Удаление сотрудника
  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого сотрудника?')) return;
    try {
      await apiDelete(`/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      alert('Ошибка при удалении: ' + err.message);
    }
  };

  // Сохранение (создание или обновление)
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // Валидация email на фронте (необязательно, но для удобства)
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        alert('Введите корректный email или оставьте поле пустым');
        return;
      }

      // Если email пустой, отправляем пустую строку (бэкенд примет)
      const payload = {
        user_name: formData.user_name.trim(),
        user_post: formData.user_post.trim(),
        email: formData.email.trim() || ''
      };

      if (editingUser) {
        const updated = await apiPut(`/users/${editingUser.id}`, payload);
        setUsers(users.map(u => u.id === editingUser.id ? updated : u));
      } else {
        const created = await apiPost('/users', payload);
        setUsers([created, ...users]);
      }
      setShowModal(false);
    } catch (err) {
      alert('Ошибка сохранения: ' + err.message);
    }
  };

  if (loading && users.length === 0) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Сотрудники</h2>
        <button onClick={handleAdd} style={{ padding: '8px 16px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Добавить сотрудника
        </button>
      </div>

      {users.length === 0 ? (
        <p>Нет ни одного сотрудника. Добавьте первого сотрудника.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
          <thead>
            <tr style={{ background: '#34495e', color: 'white' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Имя</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Должность</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>{user.user_name}</td>
                <td style={{ padding: '10px' }}>{user.user_post}</td>
                <td style={{ padding: '10px' }}>{user.email || '—'}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <button onClick={() => handleEdit(user)} style={{ marginRight: '8px', padding: '4px 8px', background: '#f39c12', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
                    Ред.
                  </button>
                  <button onClick={() => handleDelete(user.id)} style={{ padding: '4px 8px', background: '#e74c3c', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
                    Удал.
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Модальное окно */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', width: '400px' }}>
            <h3>{editingUser ? 'Редактировать сотрудника' : 'Новый сотрудник'}</h3>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Имя:</label>
                <input
                  type="text"
                  name="user_name"
                  value={formData.user_name}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Должность:</label>
                <input
                  type="text"
                  name="user_post"
                  value={formData.user_post}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Email (необязательно):</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', background: '#95a5a6', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
                  Отмена
                </button>
                <button type="submit" style={{ padding: '8px 16px', background: '#27ae60', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
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

export default Users;

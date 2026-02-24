import React, { useState, useEffect, useMemo } from 'react';
import { Button, Modal, Input, Card, Badge } from '../components/ui';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import '../styles/utils.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' или 'table'
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [formData, setFormData] = useState({
    user_name: '',
    user_post: '',
    email: ''
  });

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

  // Сортировка
  const sortedUsers = useMemo(() => {
    const sortableItems = [...users];
    sortableItems.sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case 'name':
          aVal = a.user_name || '';
          bVal = b.user_name || '';
          break;
        case 'post':
          aVal = a.user_post || '';
          bVal = b.user_post || '';
          break;
        case 'email':
          aVal = a.email || '';
          bVal = b.email || '';
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
  }, [users, sortConfig]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({ user_name: '', user_post: '', email: '' });
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      user_name: user.user_name,
      user_post: user.user_post,
      email: user.email || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить сотрудника?')) return;
    try {
      await apiDelete(`/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      alert('Ошибка удаления: ' + err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
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

  if (loading && users.length === 0) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div className="fade-in">
      <div className="flex-between mb-3">
        <h2 style={{ fontSize: 'var(--font-size-2xl)' }}>Сотрудники</h2>
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

      {/* Сортировка для карточек */}
      {viewMode === 'cards' && (
        <div className="flex-between mb-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray)' }}>Сортировать:</span>
            <select onChange={handleSortChange} value={`${sortConfig.key}-${sortConfig.direction}`} className="input" style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', borderRadius: 'var(--border-radius)', fontSize: 'var(--font-size-sm)', minWidth: '200px' }}>
              <option value="id-asc">По умолчанию (ID ↑)</option>
              <option value="name-asc">Имя (А-Я)</option>
              <option value="name-desc">Имя (Я-А)</option>
              <option value="post-asc">Должность (А-Я)</option>
              <option value="post-desc">Должность (Я-А)</option>
              <option value="email-asc">Email (А-Я)</option>
              <option value="email-desc">Email (Я-А)</option>
            </select>
          </div>
        </div>
      )}

      {sortedUsers.length === 0 ? (
        <Card><p style={{ textAlign: 'center', color: 'var(--gray)' }}>Нет сотрудников. Добавьте первого.</p></Card>
      ) : viewMode === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
          {sortedUsers.map(user => (
            <Card key={user.id} className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-md)' }}>
                <h3 style={{ fontSize: 'var(--font-size-lg)', margin: 0, color: 'var(--primary)' }}>{user.user_name}</h3>
                <Badge variant="neutral">ID: {user.id}</Badge>
              </div>
              <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray)' }}>Должность</div>
                <div style={{ fontSize: 'var(--font-size-md)' }}>{user.user_post}</div>
              </div>
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray)' }}>Email</div>
                <div style={{ fontSize: 'var(--font-size-md)' }}>{user.email || '—'}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
                <Button variant="warning" size="small" onClick={() => handleEdit(user)}>✎ Ред.</Button>
                <Button variant="danger" size="small" onClick={() => handleDelete(user.id)}>× Удал.</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--light)' }}>
                <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)', cursor: 'pointer' }} onClick={() => requestSort('name')}>
                  Имя {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)', cursor: 'pointer' }} onClick={() => requestSort('post')}>
                  Должность {sortConfig.key === 'post' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)', cursor: 'pointer' }} onClick={() => requestSort('email')}>
                  Email {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ textAlign: 'center', padding: 'var(--spacing-sm)' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--light)' }}>
                  <td style={{ padding: 'var(--spacing-sm)' }}>{user.user_name}</td>
                  <td style={{ padding: 'var(--spacing-sm)' }}>{user.user_post}</td>
                  <td style={{ padding: 'var(--spacing-sm)' }}>{user.email || '—'}</td>
                  <td style={{ textAlign: 'center', padding: 'var(--spacing-sm)' }}>
                    <Button variant="warning" size="small" onClick={() => handleEdit(user)}>Ред.</Button>
                    <Button variant="danger" size="small" onClick={() => handleDelete(user.id)}>Удал.</Button>
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
        title={editingUser ? 'Редактировать сотрудника' : 'Новый сотрудник'}
        footer={
          <>
            <Button variant="neutral" onClick={() => setShowModal(false)}>Отмена</Button>
            <Button variant="success" type="submit" form="userForm">Сохранить</Button>
          </>
        }
      >
        <form id="userForm" onSubmit={handleSave}>
          <Input label="Имя" name="user_name" value={formData.user_name} onChange={handleInputChange} required />
          <Input label="Должность" name="user_post" value={formData.user_post} onChange={handleInputChange} required />
          <Input label="Email" type="email" name="email" value={formData.email} onChange={handleInputChange} />
        </form>
      </Modal>
    </div>
  );
};

export default Users;

import React, { useState, useEffect, useMemo } from 'react';
import { Button, Modal, Input, Card, Badge } from '../components/ui';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import '../styles/utils.css';

const SpendingGroups = () => {
  const [groups, setGroups] = useState([]);
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [viewMode, setViewMode] = useState('cards');
  const [sortConfig, setSortConfig] = useState({ key: 'object', direction: 'asc' });
  const [formData, setFormData] = useState({
    object_id: '',
    text: ''
  });

  // Загрузка данных
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [groupsData, objectsData] = await Promise.all([
        apiGet('/spending-groups'),
        apiGet('/objects')
      ]);
      setGroups(groupsData);
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

  // Функция очистки адреса для сортировки (как в Objects)
  const cleanAddress = (addr) => {
    if (!addr) return '';
    return addr
      .replace(/^г\.?\s*Тверь[,\s]*/i, '')
      .replace(/^\s*(ул\. 2-я|пер\.|бул\.|пр\.|ул\.)\s*/i, '');
  };

  // Сортировка
  const sortedGroups = useMemo(() => {
    const sortableItems = [...groups];
    sortableItems.sort((a, b) => {
      let aVal, bVal;

      switch (sortConfig.key) {
        case 'text':
          aVal = a.text || '';
          bVal = b.text || '';
          break;
        case 'object':
          // Получаем адрес дома для сортировки и очищаем его
          const getAddress = (groupId) => {
            const group = groups.find(g => g.id === groupId);
            if (!group || !group.object_id) return '';
            const obj = objects.find(o => Number(o.id) === Number(group.object_id));
            return obj ? cleanAddress(obj.object_address) : '';
          };
          aVal = getAddress(a.id);
          bVal = getAddress(b.id);
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
  }, [groups, objects, sortConfig]);

  // Обработчики формы
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdd = () => {
    setEditingGroup(null);
    setFormData({ object_id: '', text: '' });
    setShowModal(true);
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setFormData({
      object_id: group.object_id ? group.object_id.toString() : '', // защита от null
      text: group.text
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить группу расходов?')) return;
    try {
      await apiDelete(`/spending-groups/${id}`);
      // После удаления перезагружаем список
      await fetchData();
    } catch (err) {
      alert('Ошибка удаления: ' + err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        object_id: formData.object_id === '' ? null : parseInt(formData.object_id),
        text: formData.text.trim()
      };

      if (editingGroup) {
        await apiPut(`/spending-groups/${editingGroup.id}`, payload);
      } else {
        await apiPost('/spending-groups', payload);
      }
      // Перезагружаем список с сервера
      await fetchData();
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

  const getObjectAddress = (objectId) => {
    if (!objectId) return '—';
    const obj = objects.find(o => Number(o.id) === Number(objectId));
    return obj ? obj.object_address : '—';
  };

  if (loading && groups.length === 0) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div className="fade-in">
      <div className="flex-between mb-3">
        <h2 style={{ fontSize: 'var(--font-size-2xl)' }}>Группы расходов</h2>
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
            <select onChange={handleSortChange} value={`${sortConfig.key}-${sortConfig.direction}`} className="input" style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', borderRadius: 'var(--border-radius)', fontSize: 'var(--font-size-sm)', minWidth: '220px' }}>
              <option value="text-asc">Название (А-Я)</option>
              <option value="text-desc">Название (Я-А)</option>
              <option value="object-asc">Дом (А-Я)</option>
              <option value="object-desc">Дом (Я-А)</option>
            </select>
          </div>
        </div>
      )}

      {sortedGroups.length === 0 ? (
        <Card><p style={{ textAlign: 'center', color: 'var(--gray)' }}>Нет групп расходов. Добавьте первую.</p></Card>
      ) : viewMode === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: 'var(--spacing-lg)' }}>
          {sortedGroups.map(group => (
            <Card key={group.id} className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-md)' }}>
                <h3 style={{ fontSize: 'var(--font-size-lg)', margin: 0, color: 'var(--primary)' }}>{group.text}</h3>
                <Badge variant="neutral">ID: {group.id}</Badge>
              </div>
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray)' }}>Дом</div>
                <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 500 }}>{getObjectAddress(group.object_id)}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
                <Button variant="warning" size="small" onClick={() => handleEdit(group)}>✎ Ред.</Button>
                <Button variant="danger" size="small" onClick={() => handleDelete(group.id)}>× Удал.</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--light)' }}>
                <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)', cursor: 'pointer' }} onClick={() => requestSort('object')}>
                  Дом {sortConfig.key === 'object' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)', cursor: 'pointer' }} onClick={() => requestSort('text')}>
                  Название {sortConfig.key === 'text' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ textAlign: 'center', padding: 'var(--spacing-sm)' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {sortedGroups.map(group => (
                <tr key={group.id} style={{ borderBottom: '1px solid var(--light)' }}>
                  <td style={{ padding: 'var(--spacing-sm)' }}>{getObjectAddress(group.object_id)}</td>
                  <td style={{ padding: 'var(--spacing-sm)' }}>{group.text}</td>
                  <td style={{ textAlign: 'center', padding: 'var(--spacing-sm)' }}>
                    <Button variant="warning" size="small" onClick={() => handleEdit(group)}>Ред.</Button>
                    <Button variant="danger" size="small" onClick={() => handleDelete(group.id)}>Удал.</Button>
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
        title={editingGroup ? 'Редактировать группу' : 'Новая группа'}
        footer={
          <>
            <Button variant="neutral" onClick={() => setShowModal(false)}>Отмена</Button>
            <Button variant="success" type="submit" form="groupForm">Сохранить</Button>
          </>
        }
      >
        <form id="groupForm" onSubmit={handleSave}>
          <Input
            type="select"
            label="Дом (необязательно)"
            name="object_id"
            value={formData.object_id}
            onChange={handleInputChange}
          >
            <option value="">Без дома</option>
            {objects.map(obj => (
              <option key={obj.id} value={obj.id}>{obj.object_address}</option>
            ))}
          </Input>
          <Input
            label="Название группы"
            name="text"
            value={formData.text}
            onChange={handleInputChange}
            required
          />
        </form>
      </Modal>
    </div>
  );
};

export default SpendingGroups;

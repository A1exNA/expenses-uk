import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';

const SpendingGroups = () => {
  const [groups, setGroups] = useState([]);
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({
    object_id: '',
    text: ''
  });

  // Загрузка групп расходов
  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet('/spending-groups');
      setGroups(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка объектов для выпадающего списка
  const fetchObjects = async () => {
    try {
      const data = await apiGet('/objects');
      setObjects(data);
    } catch (err) {
      console.error('Ошибка загрузки объектов:', err);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchObjects();
  }, []);

  // Обработка изменения полей формы
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Открыть модалку для создания
  const handleAdd = () => {
    setEditingGroup(null);
    setFormData({ object_id: '', text: '' });
    setShowModal(true);
  };

  // Открыть модалку для редактирования
  const handleEdit = (group) => {
    setEditingGroup(group);
    setFormData({
      object_id: group.object_id.toString(),
      text: group.text
    });
    setShowModal(true);
  };

  // Удаление группы
  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту группу расходов?')) return;
    try {
      await apiDelete(`/spending-groups/${id}`);
      setGroups(groups.filter(g => g.id !== id));
    } catch (err) {
      alert('Ошибка при удалении: ' + err.message);
    }
  };

  // Сохранение (создание или обновление)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.object_id) {
      alert('Выберите дом');
      return;
    }
    try {
      const payload = {
        object_id: parseInt(formData.object_id),
        text: formData.text.trim()
      };
    
      if (editingGroup) {
        await apiPut(`/spending-groups/${editingGroup.id}`, payload);
      } else {
        await apiPost('/spending-groups', payload);
      }
      // Перезагружаем список групп, чтобы получить актуальные данные с адресами
      await fetchGroups();
      setShowModal(false);
    } catch (err) {
      alert('Ошибка сохранения: ' + err.message);
    }
  };

  // Получить адрес дома по ID
  const getObjectAddress = (objectId) => {
    const obj = objects.find(o => o.id === objectId);
    return obj ? obj.object_address : 'Неизвестный дом';
  };

  if (loading && groups.length === 0) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Группы расходов</h2>
        <button onClick={handleAdd} style={{ padding: '8px 16px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Добавить группу
        </button>
      </div>

      {groups.length === 0 ? (
        <p>Нет ни одной группы расходов. Добавьте первую группу.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
          <thead>
            <tr style={{ background: '#34495e', color: 'white' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Дом</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Название группы</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(group => (
              <tr key={group.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>{getObjectAddress(group.object_id)}</td>
                <td style={{ padding: '10px' }}>{group.text}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <button onClick={() => handleEdit(group)} style={{ marginRight: '8px', padding: '4px 8px', background: '#f39c12', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
                    Ред.
                  </button>
                  <button onClick={() => handleDelete(group.id)} style={{ padding: '4px 8px', background: '#e74c3c', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
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
            <h3>{editingGroup ? 'Редактировать группу' : 'Новая группа'}</h3>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Дом:</label>
                <select
                  name="object_id"
                  value={formData.object_id}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                >
                  <option value="">Выберите дом</option>
                  {objects.map(obj => (
                    <option key={obj.id} value={obj.id}>
                      {obj.object_address}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Название группы:</label>
                <input
                  type="text"
                  name="text"
                  value={formData.text}
                  onChange={handleInputChange}
                  required
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

export default SpendingGroups;

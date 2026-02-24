import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';

const Checks = () => {
  const [checks, setChecks] = useState([]);
  const [spendingGroups, setSpendingGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Модальное окно для чека
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [editingCheck, setEditingCheck] = useState(null);
  const [checkForm, setCheckForm] = useState({
    spending_group_id: '',
    user_id: '',
    text: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Модальное окно для позиций
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [currentCheckId, setCurrentCheckId] = useState(null);
  const [items, setItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    text: '',
    price: '',
    quantity: ''
  });

  // Загрузка всех данных
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [checksData, groupsData, usersData, objectsData] = await Promise.all([
          apiGet('/checks'),
          apiGet('/spending-groups'),
          apiGet('/users'),
          apiGet('/objects')
        ]);
        setChecks(checksData);
        setSpendingGroups(groupsData);
        setUsers(usersData);
        setObjects(objectsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Загрузка позиций
  const fetchItems = async (checkId) => {
    try {
      const data = await apiGet(`/checks/${checkId}/items`);
      setItems(data);
    } catch (err) {
      alert('Ошибка загрузки позиций: ' + err.message);
    }
  };

  // ========== Работа с чеками ==========
  const handleCheckInputChange = (e) => {
    const { name, value } = e.target;
    setCheckForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCheck = () => {
    setEditingCheck(null);
    setCheckForm({
      spending_group_id: '',
      user_id: '',
      text: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowCheckModal(true);
  };

  const handleEditCheck = (check) => {
    setEditingCheck(check);
    setCheckForm({
      spending_group_id: check.spending_group_id.toString(),
      user_id: check.user_id.toString(),
      text: check.text,
      date: check.date
    });
    setShowCheckModal(true);
  };

  const handleDeleteCheck = async (id) => {
    if (!window.confirm('Удалить чек? Все связанные позиции также будут удалены.')) return;
    try {
      await apiDelete(`/checks/${id}`);
      setChecks(checks.filter(c => c.id !== id));
    } catch (err) {
      alert('Ошибка удаления: ' + err.message);
    }
  };

  const handleSaveCheck = async (e) => {
    e.preventDefault();
    if (!checkForm.spending_group_id || !checkForm.user_id) {
      alert('Выберите группу расходов и сотрудника');
      return;
    }
    try {
      const payload = {
        spending_group_id: parseInt(checkForm.spending_group_id),
        user_id: parseInt(checkForm.user_id),
        text: checkForm.text.trim(),
        date: checkForm.date
      };

      if (editingCheck) {
        await apiPut(`/checks/${editingCheck.id}`, payload);
      } else {
        await apiPost('/checks', payload);
      }
      const updatedChecks = await apiGet('/checks');
      setChecks(updatedChecks);
      setShowCheckModal(false);
    } catch (err) {
      alert('Ошибка сохранения чека: ' + err.message);
    }
  };

  // ========== Работа с позициями ==========
  const handleItemInputChange = (e) => {
    const { name, value } = e.target;
    setItemForm(prev => ({ ...prev, [name]: value }));
  };

  const handleManageItems = async (checkId) => {
    setCurrentCheckId(checkId);
    await fetchItems(checkId);
    setEditingItem(null);
    setItemForm({ text: '', price: '', quantity: '' });
    setShowItemsModal(true);
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setItemForm({ text: '', price: '', quantity: '' });
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      text: item.text,
      price: item.price.toString(),
      quantity: item.quantity.toString()
    });
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Удалить позицию?')) return;
    try {
      await apiDelete(`/checks/${currentCheckId}/items/${itemId}`);
      await fetchItems(currentCheckId);
      setEditingItem(null);
      setItemForm({ text: '', price: '', quantity: '' });
    } catch (err) {
      alert('Ошибка удаления позиции: ' + err.message);
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.text || !itemForm.price || !itemForm.quantity) {
      alert('Заполните все поля');
      return;
    }
    try {
      const payload = {
        text: itemForm.text.trim(),
        price: parseFloat(itemForm.price),
        quantity: parseFloat(itemForm.quantity)
      };

      if (editingItem) {
        await apiPut(`/checks/${currentCheckId}/items/${editingItem.id}`, payload);
      } else {
        await apiPost(`/checks/${currentCheckId}/items`, payload);
      }
      await fetchItems(currentCheckId);
      setEditingItem(null);
      setItemForm({ text: '', price: '', quantity: '' });
    } catch (err) {
      alert('Ошибка сохранения позиции: ' + err.message);
    }
  };

  // ========== Вспомогательные функции (исправлены) ==========
  const getGroupName = (groupId) => {
    if (!spendingGroups.length) return 'Загрузка...';
    const group = spendingGroups.find(g => Number(g.id) === Number(groupId));
    return group ? group.text : 'Неизвестная группа';
  };

  const getUserName = (userId) => {
    if (!users.length) return 'Загрузка...';
    const user = users.find(u => Number(u.id) === Number(userId));
    return user ? user.user_name : 'Неизвестный сотрудник';
  };

  const getObjectAddressForGroup = (groupId) => {
    if (!spendingGroups.length || !objects.length) return 'Загрузка...';
    const group = spendingGroups.find(g => Number(g.id) === Number(groupId));
    if (!group) return 'Неизвестная группа';
    const obj = objects.find(o => Number(o.id) === Number(group.object_id));
    return obj ? obj.object_address : '—';
  };

  const formatDate = (dateStr) => dateStr.split('-').reverse().join('.');

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0).toFixed(2);
  };

  if (loading) return <div>Загрузка данных...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div>
      {/* шапка и таблица — без изменений, используем исправленные функции */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Чеки (наличные расходы)</h2>
        <button onClick={handleAddCheck} style={{ padding: '8px 16px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Добавить чек
        </button>
      </div>

      {checks.length === 0 ? (
        <p>Нет ни одного чека. Создайте первый чек.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
          <thead>
            <tr style={{ background: '#34495e', color: 'white' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Дом</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Группа</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Сотрудник</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Описание</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Дата</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {checks.map(check => (
              <tr key={check.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>{getObjectAddressForGroup(check.spending_group_id)}</td>
                <td style={{ padding: '10px' }}>{getGroupName(check.spending_group_id)}</td>
                <td style={{ padding: '10px' }}>{getUserName(check.user_id)}</td>
                <td style={{ padding: '10px' }}>{check.text}</td>
                <td style={{ padding: '10px' }}>{formatDate(check.date)}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <button onClick={() => handleManageItems(check.id)} style={{ marginRight: '8px', padding: '4px 8px', background: '#3498db', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
                    Позиции
                  </button>
                  <button onClick={() => handleEditCheck(check)} style={{ marginRight: '8px', padding: '4px 8px', background: '#f39c12', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
                    Ред.
                  </button>
                  <button onClick={() => handleDeleteCheck(check.id)} style={{ padding: '4px 8px', background: '#e74c3c', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
                    Удал.
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Модальные окна (без изменений) — они уже были в предыдущей версии */}
      {showCheckModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3>{editingCheck ? 'Редактировать чек' : 'Новый чек'}</h3>
            <form onSubmit={handleSaveCheck}>
              <div style={formGroupStyle}>
                <label>Группа расходов:</label>
                <select
                  name="spending_group_id"
                  value={checkForm.spending_group_id}
                  onChange={handleCheckInputChange}
                  required
                  style={inputStyle}
                >
                  <option value="">Выберите группу</option>
                  {spendingGroups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.text} ({getObjectAddressForGroup(group.id)})
                    </option>
                  ))}
                </select>
              </div>
              <div style={formGroupStyle}>
                <label>Сотрудник:</label>
                <select
                  name="user_id"
                  value={checkForm.user_id}
                  onChange={handleCheckInputChange}
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
                <label>Описание:</label>
                <input
                  type="text"
                  name="text"
                  value={checkForm.text}
                  onChange={handleCheckInputChange}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={formGroupStyle}>
                <label>Дата:</label>
                <input
                  type="date"
                  name="date"
                  value={checkForm.date}
                  onChange={handleCheckInputChange}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowCheckModal(false)} style={{ ...buttonStyle, background: '#95a5a6' }}>
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

      {showItemsModal && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, width: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>Позиции чека</h3>
              <button onClick={() => setShowItemsModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '4px' }}>
              <h4>{editingItem ? 'Редактировать позицию' : 'Новая позиция'}</h4>
              <form onSubmit={handleSaveItem}>
                <div style={formGroupStyle}>
                  <label>Наименование:</label>
                  <input
                    type="text"
                    name="text"
                    value={itemForm.text}
                    onChange={handleItemInputChange}
                    required
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1, ...formGroupStyle }}>
                    <label>Цена:</label>
                    <input
                      type="number"
                      step="0.01"
                      name="price"
                      value={itemForm.price}
                      onChange={handleItemInputChange}
                      required
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ flex: 1, ...formGroupStyle }}>
                    <label>Количество:</label>
                    <input
                      type="number"
                      step="0.01"
                      name="quantity"
                      value={itemForm.quantity}
                      onChange={handleItemInputChange}
                      required
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  {editingItem && (
                    <button type="button" onClick={() => { setEditingItem(null); setItemForm({ text: '', price: '', quantity: '' }); }} style={{ ...buttonStyle, background: '#95a5a6' }}>
                      Отмена
                    </button>
                  )}
                  <button type="submit" style={{ ...buttonStyle, background: '#27ae60' }}>
                    {editingItem ? 'Обновить' : 'Добавить'}
                  </button>
                </div>
              </form>
            </div>

            {items.length === 0 ? (
              <p>Нет позиций. Добавьте первую позицию.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#34495e', color: 'white' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Наименование</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Цена</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Кол-во</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Сумма</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '8px' }}>{item.text}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{Number(item.price).toFixed(2)}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{item.quantity}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button onClick={() => handleEditItem(item)} style={{ marginRight: '8px', padding: '2px 6px', background: '#f39c12', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
                          Ред.
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)} style={{ padding: '2px 6px', background: '#e74c3c', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
                          Удал.
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 'bold' }}>
                    <td colSpan="3" style={{ padding: '8px', textAlign: 'right' }}>ИТОГО:</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{calculateTotal(items)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Стили
const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000
};

const modalContentStyle = {
  background: 'white', padding: '20px', borderRadius: '8px', width: '500px', maxHeight: '80vh',
  overflowY: 'auto'
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

export default Checks;

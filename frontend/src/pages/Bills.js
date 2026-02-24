import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';

const Bills = () => {
  // Основные списки
  const [bills, setBills] = useState([]);
  const [spendingGroups, setSpendingGroups] = useState([]);
  const [objects, setObjects] = useState([]); // для отображения адреса дома

  // Состояния загрузки
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Модальное окно для счёта
  const [showBillModal, setShowBillModal] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [billForm, setBillForm] = useState({
    spending_group_id: '',
    text: '',
    date: new Date().toISOString().split('T')[0] // сегодня по умолчанию
  });

  // Модальное окно для позиций
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [currentBillId, setCurrentBillId] = useState(null);
  const [items, setItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    text: '',
    price: '',
    quantity: ''
  });

  // Загрузка начальных данных
  useEffect(() => {
    fetchBills();
    fetchSpendingGroups();
    fetchObjects();
  }, []);

  // Загрузка счетов
  const fetchBills = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/bills');
      setBills(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка групп расходов (для выпадающего списка при создании/редактировании счёта)
  const fetchSpendingGroups = async () => {
    try {
      const data = await apiGet('/spending-groups');
      setSpendingGroups(data);
    } catch (err) {
      console.error('Ошибка загрузки групп расходов:', err);
    }
  };

  // Загрузка объектов (для отображения адреса дома в группе)
  const fetchObjects = async () => {
    try {
      const data = await apiGet('/objects');
      setObjects(data);
    } catch (err) {
      console.error('Ошибка загрузки объектов:', err);
    }
  };

  // Загрузка позиций для конкретного счёта
  const fetchItems = async (billId) => {
    try {
      const data = await apiGet(`/bills/${billId}/items`);
      setItems(data);
    } catch (err) {
      alert('Ошибка загрузки позиций: ' + err.message);
    }
  };

  // ========== Работа со счетами ==========

  const handleBillInputChange = (e) => {
    const { name, value } = e.target;
    setBillForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddBill = () => {
    setEditingBill(null);
    setBillForm({
      spending_group_id: '',
      text: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowBillModal(true);
  };

  const handleEditBill = (bill) => {
    setEditingBill(bill);
    setBillForm({
      spending_group_id: bill.spending_group_id.toString(),
      text: bill.text,
      date: bill.date
    });
    setShowBillModal(true);
  };

  const handleDeleteBill = async (id) => {
    if (!window.confirm('Удалить счёт? Все связанные позиции также будут удалены.')) return;
    try {
      await apiDelete(`/bills/${id}`);
      setBills(bills.filter(b => b.id !== id));
    } catch (err) {
      alert('Ошибка удаления: ' + err.message);
    }
  };

  const handleSaveBill = async (e) => {
    e.preventDefault();
    if (!billForm.spending_group_id) {
      alert('Выберите группу расходов');
      return;
    }
    try {
      const payload = {
        spending_group_id: parseInt(billForm.spending_group_id),
        text: billForm.text.trim(),
        date: billForm.date
      };

      if (editingBill) {
        await apiPut(`/bills/${editingBill.id}`, payload);
      } else {
        await apiPost('/bills', payload);
      }
      await fetchBills(); // обновляем список
      setShowBillModal(false);
    } catch (err) {
      alert('Ошибка сохранения счёта: ' + err.message);
    }
  };

  // ========== Работа с позициями ==========

  const handleItemInputChange = (e) => {
    const { name, value } = e.target;
    setItemForm(prev => ({ ...prev, [name]: value }));
  };

  // Открыть модальное окно для управления позициями счёта
  const handleManageItems = async (billId) => {
    setCurrentBillId(billId);
    await fetchItems(billId);
    setEditingItem(null);
    setItemForm({ text: '', price: '', quantity: '' });
    setShowItemsModal(true);
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
      await apiDelete(`/bills/${currentBillId}/items/${itemId}`);
      await fetchItems(currentBillId); // обновляем список
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
        await apiPut(`/bills/${currentBillId}/items/${editingItem.id}`, payload);
      } else {
        await apiPost(`/bills/${currentBillId}/items`, payload);
      }
      await fetchItems(currentBillId);
      setEditingItem(null);
      setItemForm({ text: '', price: '', quantity: '' });
    } catch (err) {
      alert('Ошибка сохранения позиции: ' + err.message);
    }
  };

  // ========== Вспомогательные функции ==========

  // Получить название группы расходов
  const getGroupName = (groupId) => {
    const group = spendingGroups.find(g => g.id === groupId);
    return group ? group.text : 'Неизвестная группа';
  };

  // Получить адрес дома для группы
  const getObjectAddressForGroup = (groupId) => {
    const group = spendingGroups.find(g => g.id === groupId);
    if (!group) return '—';
    const obj = objects.find(o => o.id === group.object_id);
    return obj ? obj.object_address : '—';
  };

  // Форматирование даты
  const formatDate = (dateStr) => dateStr.split('-').reverse().join('.');

  // Общая сумма позиций
  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);
  };

  if (loading && bills.length === 0) return <div>Загрузка счетов...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Счета (безналичные расходы)</h2>
        <button onClick={handleAddBill} style={{ padding: '8px 16px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Выставить счёт
        </button>
      </div>

      {bills.length === 0 ? (
        <p>Нет ни одного счёта. Создайте первый счёт.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
          <thead>
            <tr style={{ background: '#34495e', color: 'white' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Дом</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Группа</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Описание</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Дата</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {bills.map(bill => (
              <tr key={bill.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>{getObjectAddressForGroup(bill.spending_group_id)}</td>
                <td style={{ padding: '10px' }}>{getGroupName(bill.spending_group_id)}</td>
                <td style={{ padding: '10px' }}>{bill.text}</td>
                <td style={{ padding: '10px' }}>{formatDate(bill.date)}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <button onClick={() => handleManageItems(bill.id)} style={{ marginRight: '8px', padding: '4px 8px', background: '#3498db', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
                    Позиции
                  </button>
                  <button onClick={() => handleEditBill(bill)} style={{ marginRight: '8px', padding: '4px 8px', background: '#f39c12', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
                    Ред.
                  </button>
                  <button onClick={() => handleDeleteBill(bill.id)} style={{ padding: '4px 8px', background: '#e74c3c', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
                    Удал.
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Модальное окно для счёта */}
      {showBillModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3>{editingBill ? 'Редактировать счёт' : 'Новый счёт'}</h3>
            <form onSubmit={handleSaveBill}>
              <div style={formGroupStyle}>
                <label>Группа расходов:</label>
                <select
                  name="spending_group_id"
                  value={billForm.spending_group_id}
                  onChange={handleBillInputChange}
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
                <label>Описание:</label>
                <input
                  type="text"
                  name="text"
                  value={billForm.text}
                  onChange={handleBillInputChange}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={formGroupStyle}>
                <label>Дата:</label>
                <input
                  type="date"
                  name="date"
                  value={billForm.date}
                  onChange={handleBillInputChange}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowBillModal(false)} style={{ ...buttonStyle, background: '#95a5a6' }}>
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

      {/* Модальное окно для позиций */}
      {showItemsModal && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, width: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>Позиции счёта</h3>
              <button onClick={() => setShowItemsModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>

            {/* Форма для редактирования/добавления позиции */}
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

            {/* Список позиций */}
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

// Общие стили (можно вынести в отдельный файл, но пока оставим здесь)
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

export default Bills;

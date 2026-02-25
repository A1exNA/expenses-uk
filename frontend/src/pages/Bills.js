import React, { useState, useEffect, useMemo } from 'react';
import { Button, Modal, Input, Card, Badge } from '../components/ui';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import '../styles/utils.css';

const Bills = () => {
  const [bills, setBills] = useState([]);
  const [spendingGroups, setSpendingGroups] = useState([]);
  const [objects, setObjects] = useState([]);
  const [allItems, setAllItems] = useState([]); // все позиции всех счетов
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('cards');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  
  // Состояние для фильтров
  const [filters, setFilters] = useState({
    searchText: '',
    groupId: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const [showBillModal, setShowBillModal] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [billForm, setBillForm] = useState({
    spending_group_id: '',
    text: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [showItemsModal, setShowItemsModal] = useState(false);
  const [currentBillId, setCurrentBillId] = useState(null);
  const [items, setItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    text: '',
    price: '',
    quantity: ''
  });

  // Загрузка всех данных
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [billsData, groupsData, objectsData, itemsData] = await Promise.all([
        apiGet('/bills'),
        apiGet('/spending-groups'),
        apiGet('/objects'),
        apiGet('/expense-bills')
      ]);
      setBills(billsData);
      setSpendingGroups(groupsData);
      setObjects(objectsData);
      setAllItems(Array.isArray(itemsData) ? itemsData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Загрузка позиций для конкретного счёта
  const fetchItemsForBill = async (billId) => {
    try {
      const data = await apiGet(`/bills/${billId}/items`);
      setItems(data);
    } catch (err) {
      alert('Ошибка загрузки позиций: ' + err.message);
    }
  };

  // Очистка адреса (для сортировки группы)
  const cleanAddress = (addr) => {
    if (!addr) return '';
    return addr
      .replace(/^г\.?\s*Тверь[,\s]*/i, '')
      .replace(/^\s*(ул\. 2-я|пер\.|бул\.|пр\.|ул\.)\s*/i, '');
  };

  // Получение названия группы с адресом
  const getGroupDisplay = (groupId) => {
    const group = spendingGroups.find(g => Number(g.id) === Number(groupId));
    if (!group) return 'Неизвестная группа';
    const obj = objects.find(o => Number(o.id) === Number(group.object_id));
    const address = obj ? obj.object_address : '—';
    return `${group.text} (${address})`;
  };

  // Общая сумма счёта на основе всех позиций
  const getBillTotal = (billId) => {
    const billItems = allItems.filter(item => Number(item.bills_id) === Number(billId));
    const total = billItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    return total.toFixed(2);
  };

  // Фильтрация счетов
  const filteredBills = useMemo(() => {
    return bills.filter(bill => {
      // Поиск по тексту (описание счёта)
      if (filters.searchText && !bill.text.toLowerCase().includes(filters.searchText.toLowerCase())) {
        // Также ищем в названии группы
        const groupName = spendingGroups.find(g => Number(g.id) === Number(bill.spending_group_id))?.text || '';
        if (!groupName.toLowerCase().includes(filters.searchText.toLowerCase())) {
          return false;
        }
      }

      // Фильтр по группе
      if (filters.groupId && Number(bill.spending_group_id) !== Number(filters.groupId)) {
        return false;
      }

      // Фильтр по дате начала
      if (filters.dateFrom && bill.date < filters.dateFrom) {
        return false;
      }

      // Фильтр по дате окончания
      if (filters.dateTo && bill.date > filters.dateTo) {
        return false;
      }

      return true;
    });
  }, [bills, filters, spendingGroups]);

  // Сортировка отфильтрованных счетов
  const sortedBills = useMemo(() => {
    const sortableItems = [...filteredBills];
    sortableItems.sort((a, b) => {
      let aVal, bVal;

      switch (sortConfig.key) {
        case 'date':
          aVal = a.date;
          bVal = b.date;
          break;
        case 'group':
          const getGroupName = (bill) => {
            const group = spendingGroups.find(g => Number(g.id) === Number(bill.spending_group_id));
            if (!group) return '';
            const obj = objects.find(o => Number(o.id) === Number(group.object_id));
            const address = obj ? cleanAddress(obj.object_address) : '';
            return `${group.text} ${address}`.trim();
          };
          aVal = getGroupName(a);
          bVal = getGroupName(b);
          break;
        case 'total':
          aVal = parseFloat(getBillTotal(a.id));
          bVal = parseFloat(getBillTotal(b.id));
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
  }, [filteredBills, spendingGroups, objects, sortConfig]);

  // Обработчики для счёта
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
    if (!window.confirm('Удалить счёт? Все позиции также будут удалены.')) return;
    try {
      await apiDelete(`/bills/${id}`);
      await fetchData();
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
      await fetchData();
      setShowBillModal(false);
    } catch (err) {
      alert('Ошибка сохранения счёта: ' + err.message);
    }
  };

  // Обработчики для позиций
  const handleItemInputChange = (e) => {
    const { name, value } = e.target;
    setItemForm(prev => ({ ...prev, [name]: value }));
  };

  const handleManageItems = async (billId) => {
    setCurrentBillId(billId);
    await fetchItemsForBill(billId);
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
      await fetchItemsForBill(currentBillId);
      await fetchData(); // обновляем allItems
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
      await fetchItemsForBill(currentBillId);
      await fetchData(); // обновляем allItems
      setEditingItem(null);
      setItemForm({ text: '', price: '', quantity: '' });
    } catch (err) {
      alert('Ошибка сохранения позиции: ' + err.message);
    }
  };

  const formatDate = (dateStr) => dateStr.split('-').reverse().join('.');

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

  // Обработчики фильтров
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      searchText: '',
      groupId: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  if (loading && bills.length === 0) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div className="fade-in">
      <div className="flex-between mb-3">
        <h2 style={{ fontSize: 'var(--font-size-2xl)' }}>Счета (безналичные расходы)</h2>
        <div className="flex gap-1">
          <Button variant={viewMode === 'cards' ? 'primary' : 'outline'} size="small" onClick={() => setViewMode('cards')}>
            Карточки
          </Button>
          <Button variant={viewMode === 'table' ? 'primary' : 'outline'} size="small" onClick={() => setViewMode('table')}>
            Таблица
          </Button>
          <Button variant="primary" onClick={handleAddBill}>+ Выставить счёт</Button>
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
              label="Поиск"
              name="searchText"
              value={filters.searchText}
              onChange={handleFilterChange}
              placeholder="Описание, группа..."
            />
            <Input
              type="select"
              label="Группа"
              name="groupId"
              value={filters.groupId}
              onChange={handleFilterChange}
            >
              <option value="">Все группы</option>
              {spendingGroups.map(group => (
                <option key={group.id} value={group.id}>{getGroupDisplay(group.id)}</option>
              ))}
            </Input>
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
              <option value="group-asc">Группа (А-Я)</option>
              <option value="group-desc">Группа (Я-А)</option>
              <option value="total-desc">Сумма (по убыванию)</option>
              <option value="total-asc">Сумма (по возрастанию)</option>
            </select>
          </div>
        </div>
      )}

      {sortedBills.length === 0 ? (
        <Card><p style={{ textAlign: 'center', color: 'var(--gray)' }}>Нет счетов, соответствующих фильтрам.</p></Card>
      ) : viewMode === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: 'var(--spacing-lg)' }}>
          {sortedBills.map(bill => (
            <Card key={bill.id} className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-md)' }}>
                <h3 style={{ fontSize: 'var(--font-size-lg)', margin: 0, color: 'var(--primary)' }}>
                  {bill.text}
                </h3>
                <Badge variant="neutral">ID: {bill.id}</Badge>
              </div>
              <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray)' }}>Группа</div>
                <div>{getGroupDisplay(bill.spending_group_id)}</div>
              </div>
              <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray)' }}>Дата</div>
                <div>{formatDate(bill.date)}</div>
              </div>
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray)' }}>Общая сумма</div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--success)' }}>
                  {getBillTotal(bill.id)} ₽
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
                <Button variant="info" size="small" onClick={() => handleManageItems(bill.id)}>📋 Позиции</Button>
                <Button variant="warning" size="small" onClick={() => handleEditBill(bill)}>✎ Ред.</Button>
                <Button variant="danger" size="small" onClick={() => handleDeleteBill(bill.id)}>× Удал.</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--light)' }}>
                <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)', cursor: 'pointer' }} onClick={() => requestSort('group')}>
                  Группа {sortConfig.key === 'group' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)' }}>Описание</th>
                <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)', cursor: 'pointer' }} onClick={() => requestSort('date')}>
                  Дата {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)', cursor: 'pointer' }} onClick={() => requestSort('total')}>
                  Сумма {sortConfig.key === 'total' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ textAlign: 'center', padding: 'var(--spacing-sm)' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {sortedBills.map(bill => (
                <tr key={bill.id} style={{ borderBottom: '1px solid var(--light)' }}>
                  <td style={{ padding: 'var(--spacing-sm)' }}>{getGroupDisplay(bill.spending_group_id)}</td>
                  <td style={{ padding: 'var(--spacing-sm)' }}>{bill.text}</td>
                  <td style={{ padding: 'var(--spacing-sm)' }}>{formatDate(bill.date)}</td>
                  <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)', fontWeight: 500 }}>
                    {getBillTotal(bill.id)} ₽
                  </td>
                  <td style={{ textAlign: 'center', padding: 'var(--spacing-sm)' }}>
                    <Button variant="info" size="small" onClick={() => handleManageItems(bill.id)}>Поз.</Button>
                    <Button variant="warning" size="small" onClick={() => handleEditBill(bill)}>Ред.</Button>
                    <Button variant="danger" size="small" onClick={() => handleDeleteBill(bill.id)}>Удал.</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Модальное окно для счёта */}
      <Modal
        isOpen={showBillModal}
        onClose={() => setShowBillModal(false)}
        title={editingBill ? 'Редактировать счёт' : 'Новый счёт'}
        footer={
          <>
            <Button variant="neutral" onClick={() => setShowBillModal(false)}>Отмена</Button>
            <Button variant="success" type="submit" form="billForm">Сохранить</Button>
          </>
        }
      >
        <form id="billForm" onSubmit={handleSaveBill}>
          <Input
            type="select"
            label="Группа расходов"
            name="spending_group_id"
            value={billForm.spending_group_id}
            onChange={handleBillInputChange}
            required
          >
            <option value="">Выберите группу</option>
            {spendingGroups.map(group => (
              <option key={group.id} value={group.id}>{getGroupDisplay(group.id)}</option>
            ))}
          </Input>
          <Input
            label="Описание"
            name="text"
            value={billForm.text}
            onChange={handleBillInputChange}
            required
          />
          <Input
            label="Дата"
            type="date"
            name="date"
            value={billForm.date}
            onChange={handleBillInputChange}
            required
          />
        </form>
      </Modal>

      {/* Модальное окно для позиций */}
      <Modal
        isOpen={showItemsModal}
        onClose={() => setShowItemsModal(false)}
        title={`Позиции счёта #${currentBillId}`}
        footer={null}
        width="650px"
      >
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h4 style={{ margin: '0 0 var(--spacing-md) 0', color: 'var(--primary)' }}>
            {editingItem ? 'Редактирование позиции' : 'Добавление позиции'}
          </h4>
          <form onSubmit={handleSaveItem}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <Input
                label="Наименование товара/услуги"
                name="text"
                value={itemForm.text}
                onChange={handleItemInputChange}
                required
                fullWidth
              />
              <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                <Input
                  label="Цена"
                  type="number"
                  step="0.01"
                  name="price"
                  value={itemForm.price}
                  onChange={handleItemInputChange}
                  required
                  fullWidth
                />
                <Input
                  label="Количество"
                  type="number"
                  step="0.01"
                  name="quantity"
                  value={itemForm.quantity}
                  onChange={handleItemInputChange}
                  required
                  fullWidth
                />
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
                {editingItem && (
                  <Button type="button" variant="neutral" onClick={() => { setEditingItem(null); setItemForm({ text: '', price: '', quantity: '' }); }}>
                    Отмена
                  </Button>
                )}
                <Button type="submit" variant="success">
                  {editingItem ? 'Обновить позицию' : 'Добавить позицию'}
                </Button>
              </div>
            </div>
          </form>
        </div>

        <div>
          <h4 style={{ margin: '0 0 var(--spacing-md) 0', color: 'var(--primary)' }}>Список позиций</h4>
          {items.length === 0 ? (
            <p style={{ color: 'var(--gray)', textAlign: 'center' }}>Позиции отсутствуют</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--light)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)' }}>Наименование</th>
                  <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Цена</th>
                  <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Кол-во</th>
                  <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Сумма</th>
                  <th style={{ textAlign: 'center', padding: 'var(--spacing-sm)' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--light)' }}>
                    <td style={{ padding: 'var(--spacing-sm)' }}>{item.text}</td>
                    <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{Number(item.price).toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
                    <td style={{ textAlign: 'center', padding: 'var(--spacing-sm)' }}>
                      <Button variant="warning" size="small" onClick={() => handleEditItem(item)}>Ред.</Button>
                      <Button variant="danger" size="small" onClick={() => handleDeleteItem(item.id)}>Удал.</Button>
                    </td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', borderTop: '2px solid var(--light)' }}>
                  <td colSpan="3" style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>ИТОГО:</td>
                  <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>
                    {items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0).toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Bills;

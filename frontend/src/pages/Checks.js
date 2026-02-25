import React, { useState, useEffect, useMemo } from 'react';
import { Button, Modal, Input, Card, Badge } from '../components/ui';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import '../styles/utils.css';

const Checks = () => {
  const [checks, setChecks] = useState([]);
  const [spendingGroups, setSpendingGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [objects, setObjects] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('cards');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  
  // Состояние для фильтров
  const [filters, setFilters] = useState({
    searchText: '',
    userId: '',
    groupId: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false); // показывать/скрывать панель фильтров

  const [showCheckModal, setShowCheckModal] = useState(false);
  const [editingCheck, setEditingCheck] = useState(null);
  const [checkForm, setCheckForm] = useState({
    spending_group_id: '',
    user_id: '',
    text: '',
    date: new Date().toISOString().split('T')[0]
  });

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
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [checksData, groupsData, usersData, objectsData, itemsData] = await Promise.all([
        apiGet('/checks'),
        apiGet('/spending-groups'),
        apiGet('/users'),
        apiGet('/objects'),
        apiGet('/expense-checks')
      ]);
      setChecks(checksData);
      setSpendingGroups(groupsData);
      setUsers(usersData);
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

  // Загрузка позиций для конкретного чека
  const fetchItemsForCheck = async (checkId) => {
    try {
      const data = await apiGet(`/checks/${checkId}/items`);
      setItems(data);
    } catch (err) {
      alert('Ошибка загрузки позиций: ' + err.message);
    }
  };

  const cleanAddress = (addr) => {
    if (!addr) return '';
    return addr
      .replace(/^г\.?\s*Тверь[,\s]*/i, '')
      .replace(/^\s*(ул\. 2-я|пер\.|бул\.|пр\.|ул\.)\s*/i, '');
  };

  const getGroupDisplay = (groupId) => {
    const group = spendingGroups.find(g => Number(g.id) === Number(groupId));
    if (!group) return 'Неизвестная группа';
    const obj = objects.find(o => Number(o.id) === Number(group.object_id));
    const address = obj ? obj.object_address : '—';
    return `${group.text} (${address})`;
  };

  const getUserName = (userId) => {
    const user = users.find(u => Number(u.id) === Number(userId));
    return user ? user.user_name : 'Неизвестный сотрудник';
  };

  const getCheckTotal = (checkId) => {
    const checkItems = allItems.filter(item => Number(item.check_id) === Number(checkId));
    const total = checkItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    return total.toFixed(2);
  };

  // Фильтрация чеков
  const filteredChecks = useMemo(() => {
    return checks.filter(check => {
      // Поиск по тексту (описание чека)
      if (filters.searchText && !check.text.toLowerCase().includes(filters.searchText.toLowerCase())) {
        // Также ищем в имени сотрудника и названии группы (можно добавить)
        const groupName = spendingGroups.find(g => Number(g.id) === Number(check.spending_group_id))?.text || '';
        const userName = users.find(u => Number(u.id) === Number(check.user_id))?.user_name || '';
        if (!groupName.toLowerCase().includes(filters.searchText.toLowerCase()) &&
            !userName.toLowerCase().includes(filters.searchText.toLowerCase())) {
          return false;
        }
      }

      // Фильтр по сотруднику
      if (filters.userId && Number(check.user_id) !== Number(filters.userId)) {
        return false;
      }

      // Фильтр по группе
      if (filters.groupId && Number(check.spending_group_id) !== Number(filters.groupId)) {
        return false;
      }

      // Фильтр по дате начала
      if (filters.dateFrom && check.date < filters.dateFrom) {
        return false;
      }

      // Фильтр по дате окончания
      if (filters.dateTo && check.date > filters.dateTo) {
        return false;
      }

      return true;
    });
  }, [checks, filters, spendingGroups, users]);

  // Сортировка отфильтрованных чеков
  const sortedChecks = useMemo(() => {
    const sortableItems = [...filteredChecks];
    sortableItems.sort((a, b) => {
      let aVal, bVal;

      switch (sortConfig.key) {
        case 'date':
          aVal = a.date;
          bVal = b.date;
          break;
        case 'group':
          const getGroupName = (check) => {
            const group = spendingGroups.find(g => Number(g.id) === Number(check.spending_group_id));
            if (!group) return '';
            const obj = objects.find(o => Number(o.id) === Number(group.object_id));
            const address = obj ? cleanAddress(obj.object_address) : '';
            return `${group.text} ${address}`.trim();
          };
          aVal = getGroupName(a);
          bVal = getGroupName(b);
          break;
        case 'user':
          aVal = getUserName(a.user_id);
          bVal = getUserName(b.user_id);
          break;
        case 'total':
          aVal = parseFloat(getCheckTotal(a.id));
          bVal = parseFloat(getCheckTotal(b.id));
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
  }, [filteredChecks, spendingGroups, objects, sortConfig]);

  // Обработчики для чеков (без изменений, кроме возможно сброса фильтров при необходимости)
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
    if (!window.confirm('Удалить чек?')) return;
    try {
      await apiDelete(`/checks/${id}`);
      await fetchData();
    } catch (err) {
      alert('Ошибка удаления: ' + err.message);
    }
  };

  const handleSaveCheck = async (e) => {
    e.preventDefault();
    if (!checkForm.spending_group_id || !checkForm.user_id) {
      alert('Выберите группу и сотрудника');
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
      await fetchData();
      setShowCheckModal(false);
    } catch (err) {
      alert('Ошибка сохранения чека: ' + err.message);
    }
  };

  // Обработчики для позиций (без изменений)
  const handleItemInputChange = (e) => {
    const { name, value } = e.target;
    setItemForm(prev => ({ ...prev, [name]: value }));
  };

  const handleManageItems = async (checkId) => {
    setCurrentCheckId(checkId);
    await fetchItemsForCheck(checkId);
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
      await apiDelete(`/checks/${currentCheckId}/items/${itemId}`);
      await fetchItemsForCheck(currentCheckId);
      await fetchData();
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
      await fetchItemsForCheck(currentCheckId);
      await fetchData();
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
      userId: '',
      groupId: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  if (loading && checks.length === 0) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div className="fade-in">
      <div className="flex-between mb-3">
        <h2 style={{ fontSize: 'var(--font-size-2xl)' }}>Чеки (наличные расходы)</h2>
        <div className="flex gap-1">
          <Button variant={viewMode === 'cards' ? 'primary' : 'outline'} size="small" onClick={() => setViewMode('cards')}>
            Карточки
          </Button>
          <Button variant={viewMode === 'table' ? 'primary' : 'outline'} size="small" onClick={() => setViewMode('table')}>
            Таблица
          </Button>
          <Button variant="primary" onClick={handleAddCheck}>+ Добавить чек</Button>
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
              placeholder="Описание, группа, сотрудник..."
            />
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

      {/* Сортировка для карточек */}
      {viewMode === 'cards' && (
        <div className="flex-between mb-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray)' }}>Сортировать:</span>
            <select onChange={handleSortChange} value={`${sortConfig.key}-${sortConfig.direction}`} className="input" style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', borderRadius: 'var(--border-radius)', fontSize: 'var(--font-size-sm)', minWidth: '220px' }}>
              <option value="date-desc">Дата (сначала новые)</option>
              <option value="date-asc">Дата (сначала старые)</option>
              <option value="group-asc">Группа (А-Я)</option>
              <option value="group-desc">Группа (Я-А)</option>
              <option value="user-asc">Сотрудник (А-Я)</option>
              <option value="user-desc">Сотрудник (Я-А)</option>
              <option value="total-desc">Сумма (по убыванию)</option>
              <option value="total-asc">Сумма (по возрастанию)</option>
            </select>
          </div>
        </div>
      )}

      {sortedChecks.length === 0 ? (
        <Card><p style={{ textAlign: 'center', color: 'var(--gray)' }}>Нет чеков, соответствующих фильтрам.</p></Card>
      ) : viewMode === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: 'var(--spacing-lg)' }}>
          {sortedChecks.map(check => (
            <Card key={check.id} className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-md)' }}>
                <h3 style={{ fontSize: 'var(--font-size-lg)', margin: 0, color: 'var(--primary)' }}>
                  {check.text}
                </h3>
                <Badge variant="neutral">ID: {check.id}</Badge>
              </div>
              <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray)' }}>Группа</div>
                <div>{getGroupDisplay(check.spending_group_id)}</div>
              </div>
              <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray)' }}>Сотрудник</div>
                <div>{getUserName(check.user_id)}</div>
              </div>
              <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray)' }}>Дата</div>
                <div>{formatDate(check.date)}</div>
              </div>
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray)' }}>Общая сумма</div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--success)' }}>
                  {getCheckTotal(check.id)} ₽
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
                <Button variant="info" size="small" onClick={() => handleManageItems(check.id)}>📋 Позиции</Button>
                <Button variant="warning" size="small" onClick={() => handleEditCheck(check)}>✎ Ред.</Button>
                <Button variant="danger" size="small" onClick={() => handleDeleteCheck(check.id)}>× Удал.</Button>
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
                <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)', cursor: 'pointer' }} onClick={() => requestSort('user')}>
                  Сотрудник {sortConfig.key === 'user' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
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
              {sortedChecks.map(check => (
                <tr key={check.id} style={{ borderBottom: '1px solid var(--light)' }}>
                  <td style={{ padding: 'var(--spacing-sm)' }}>{getGroupDisplay(check.spending_group_id)}</td>
                  <td style={{ padding: 'var(--spacing-sm)' }}>{getUserName(check.user_id)}</td>
                  <td style={{ padding: 'var(--spacing-sm)' }}>{check.text}</td>
                  <td style={{ padding: 'var(--spacing-sm)' }}>{formatDate(check.date)}</td>
                  <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)', fontWeight: 500 }}>
                    {getCheckTotal(check.id)} ₽
                  </td>
                  <td style={{ textAlign: 'center', padding: 'var(--spacing-sm)' }}>
                    <Button variant="info" size="small" onClick={() => handleManageItems(check.id)}>Поз.</Button>
                    <Button variant="warning" size="small" onClick={() => handleEditCheck(check)}>Ред.</Button>
                    <Button variant="danger" size="small" onClick={() => handleDeleteCheck(check.id)}>Удал.</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Модальные окна без изменений */}
      {/* ... (такие же как в предыдущей версии) */}
      <Modal
        isOpen={showCheckModal}
        onClose={() => setShowCheckModal(false)}
        title={editingCheck ? 'Редактировать чек' : 'Новый чек'}
        footer={
          <>
            <Button variant="neutral" onClick={() => setShowCheckModal(false)}>Отмена</Button>
            <Button variant="success" type="submit" form="checkForm">Сохранить</Button>
          </>
        }
      >
        <form id="checkForm" onSubmit={handleSaveCheck}>
          <Input
            type="select"
            label="Группа расходов"
            name="spending_group_id"
            value={checkForm.spending_group_id}
            onChange={handleCheckInputChange}
            required
          >
            <option value="">Выберите группу</option>
            {spendingGroups.map(group => (
              <option key={group.id} value={group.id}>{getGroupDisplay(group.id)}</option>
            ))}
          </Input>
          <Input
            type="select"
            label="Сотрудник"
            name="user_id"
            value={checkForm.user_id}
            onChange={handleCheckInputChange}
            required
          >
            <option value="">Выберите сотрудника</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.user_name} ({user.user_post})</option>
            ))}
          </Input>
          <Input
            label="Описание"
            name="text"
            value={checkForm.text}
            onChange={handleCheckInputChange}
            required
          />
          <Input
            label="Дата"
            type="date"
            name="date"
            value={checkForm.date}
            onChange={handleCheckInputChange}
            required
          />
        </form>
      </Modal>

      <Modal
        isOpen={showItemsModal}
        onClose={() => setShowItemsModal(false)}
        title={`Позиции чека #${currentCheckId}`}
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

export default Checks;

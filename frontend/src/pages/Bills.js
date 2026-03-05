import React, { useState, useEffect, useMemo } from 'react';
import { Button, Modal, Input, Card, Badge } from '../components/ui';
import SearchableSelect from '../components/ui/SearchableSelect';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import ExportButton from '../components/ui/ExportButton';
import VirtualizedTable from '../components/ui/VirtualizedTable';
import { showSuccess, showError, showInfo } from '../components/ui/Toast';
import '../styles/utils.css';

const Bills = () => {
  const [bills, setBills] = useState([]);
  const [spendingGroups, setSpendingGroups] = useState([]);
  const [objects, setObjects] = useState([]);
  const [allItems, setAllItems] = useState([]);
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
      showError('Ошибка загрузки данных: ' + err.message);
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
      showError('Ошибка загрузки позиций: ' + err.message);
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

  // Общая сумма счёта
  const getBillTotal = (billId) => {
    const billItems = allItems.filter(item => Number(item.bills_id) === Number(billId));
    const total = billItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    return total.toFixed(2);
  };

  // Фильтрация счетов
  const filteredBills = useMemo(() => {
    return bills.filter(bill => {
      if (filters.searchText && !bill.text.toLowerCase().includes(filters.searchText.toLowerCase())) {
        const groupName = spendingGroups.find(g => Number(g.id) === Number(bill.spending_group_id))?.text || '';
        if (!groupName.toLowerCase().includes(filters.searchText.toLowerCase())) {
          return false;
        }
      }

      if (filters.groupId && Number(bill.spending_group_id) !== Number(filters.groupId)) {
        return false;
      }

      if (filters.dateFrom && bill.date < filters.dateFrom) return false;
      if (filters.dateTo && bill.date > filters.dateTo) return false;

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

  const handleDeleteBill = async (id, description) => {
    if (!window.confirm(`Удалить счёт "${description}"? Все позиции также будут удалены.`)) return;
    try {
      await apiDelete(`/bills/${id}`);
      await fetchData();
      showSuccess('Счёт успешно удалён');
    } catch (err) {
      showError('Ошибка удаления: ' + err.message);
    }
  };

  const handleSaveBill = async (e) => {
    e.preventDefault();
    if (!billForm.spending_group_id) {
      showError('Выберите группу расходов');
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
        showSuccess('Счёт успешно обновлён');
      } else {
        await apiPost('/bills', payload);
        showSuccess('Счёт успешно создан');
      }
      await fetchData();
      setShowBillModal(false);
    } catch (err) {
      showError('Ошибка сохранения счёта: ' + err.message);
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

  const handleDeleteItem = async (itemId, itemText) => {
    if (!window.confirm(`Удалить позицию "${itemText}"?`)) return;
    try {
      await apiDelete(`/bills/${currentBillId}/items/${itemId}`);
      await fetchItemsForBill(currentBillId);
      await fetchData();
      setEditingItem(null);
      setItemForm({ text: '', price: '', quantity: '' });
      showSuccess('Позиция удалена');
    } catch (err) {
      showError('Ошибка удаления позиции: ' + err.message);
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.text || !itemForm.price || !itemForm.quantity) {
      showError('Заполните все поля');
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
        showSuccess('Позиция обновлена');
      } else {
        await apiPost(`/bills/${currentBillId}/items`, payload);
        showSuccess('Позиция добавлена');
      }
      await fetchItemsForBill(currentBillId);
      await fetchData();
      setEditingItem(null);
      setItemForm({ text: '', price: '', quantity: '' });
    } catch (err) {
      showError('Ошибка сохранения позиции: ' + err.message);
    }
  };

  const formatDate = (dateStr) => dateStr.split('-').reverse().join('.');
  const formatCurrency = (value) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2 }).format(value);

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
    showInfo('Фильтры сброшены');
  };

  // Колонки для виртуализированной таблицы
  const tableColumns = [
    { title: 'Группа', field: 'group', width: 300, render: (bill) => getGroupDisplay(bill.spending_group_id) },
    { title: 'Описание', field: 'text', width: 300 },
    { title: 'Дата', field: 'date', width: 120, render: (bill) => formatDate(bill.date) },
    { title: 'Сумма', align: 'right', width: 150, render: (bill) => formatCurrency(parseFloat(getBillTotal(bill.id))) },
    { 
      title: 'Действия', 
      width: 200,
      align: 'center',
      render: (bill) => (
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'center' }}>
          <Button 
            variant="info" 
            size="small" 
            onClick={() => handleManageItems(bill.id)}
            ariaLabel={`Управление позициями счёта ${bill.text}`}
          >
            Поз.
          </Button>
          <Button 
            variant="warning" 
            size="small" 
            onClick={() => handleEditBill(bill)}
            ariaLabel={`Редактировать счёт ${bill.text}`}
          >
            Ред.
          </Button>
          <Button 
            variant="danger" 
            size="small" 
            onClick={() => handleDeleteBill(bill.id, bill.text)}
            ariaLabel={`Удалить счёт ${bill.text}`}
          >
            Удал.
          </Button>
        </div>
      )
    }
  ];

  if (loading && bills.length === 0) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div className="fade-in">
      <div className="flex-between mb-3">
        <h2 style={{ fontSize: 'var(--font-size-2xl)' }}>Счета (безналичные расходы)</h2>
        <div className="flex gap-1">
          <Button 
            variant={viewMode === 'cards' ? 'primary' : 'outline'} 
            size="small" 
            onClick={() => setViewMode('cards')}
            ariaLabel="Показать карточками"
          >
            Карточки
          </Button>
          <Button 
            variant={viewMode === 'table' ? 'primary' : 'outline'} 
            size="small" 
            onClick={() => setViewMode('table')}
            ariaLabel="Показать таблицей"
          >
            Таблица
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddBill}
            ariaLabel="Выставить новый счёт"
          >
            + Выставить счёт
          </Button>
          <ExportButton 
            data={sortedBills.map(bill => ({
              id: bill.id,
              group: getGroupDisplay(bill.spending_group_id),
              text: bill.text,
              date: bill.date,
              total: parseFloat(getBillTotal(bill.id))
            }))}
            headers={[
              { key: 'id', label: 'ID', type: 'integer' },
              { key: 'group', label: 'Группа', type: 'string' },
              { key: 'text', label: 'Описание', type: 'string' },
              { key: 'date', label: 'Дата', type: 'date' },
              { key: 'total', label: 'Сумма (₽)', type: 'float' }
            ]}
            title="Отчёт по счетам"
            filename="bills_export"
          >
            Экспорт Excel
          </ExportButton>
        </div>
      </div>

      {/* Кнопка показа/скрытия фильтров */}
      <div className="mb-3">
        <Button 
          variant="info" 
          size="small" 
          onClick={() => setShowFilters(!showFilters)}
          ariaLabel={showFilters ? 'Скрыть панель фильтров' : 'Показать панель фильтров'}
        >
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
            <SearchableSelect
              label="Группа"
              name="groupId"
              value={filters.groupId}
              onChange={handleFilterChange}
              options={[
                { value: '', label: 'Все группы' },
                ...spendingGroups.map(group => ({
                  value: group.id,
                  label: getGroupDisplay(group.id)
                }))
              ]}
              placeholder="Поиск группы..."
            />
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
            <Button 
              variant="neutral" 
              size="small" 
              onClick={resetFilters}
              ariaLabel="Сбросить все фильтры"
            >
              Сбросить фильтры
            </Button>
          </div>
        </Card>
      )}

      {viewMode === 'cards' && (
        <div className="flex-between mb-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray)' }}>Сортировать:</span>
            <select 
              onChange={handleSortChange} 
              value={`${sortConfig.key}-${sortConfig.direction}`} 
              className="input" 
              style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', borderRadius: 'var(--border-radius)', fontSize: 'var(--font-size-sm)', minWidth: '220px' }}
              aria-label="Выберите поле для сортировки"
            >
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
        <Card>
          <p style={{ textAlign: 'center', color: 'var(--gray)' }} role="status">
            Нет счетов, соответствующих фильтрам.
          </p>
        </Card>
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
                <Button 
                  variant="info" 
                  size="small" 
                  onClick={() => handleManageItems(bill.id)}
                  ariaLabel={`Управление позициями счёта ${bill.text}`}
                >
                  📋 Поз.
                </Button>
                <Button 
                  variant="warning" 
                  size="small" 
                  onClick={() => handleEditBill(bill)}
                  ariaLabel={`Редактировать счёт ${bill.text}`}
                >
                  ✎ Ред.
                </Button>
                <Button 
                  variant="danger" 
                  size="small" 
                  onClick={() => handleDeleteBill(bill.id, bill.text)}
                  ariaLabel={`Удалить счёт ${bill.text}`}
                >
                  × Удал.
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <VirtualizedTable
            columns={tableColumns}
            data={sortedBills}
            rowHeight={50}
          />
        </Card>
      )}

      {/* Модальное окно для счёта */}
      {showBillModal && (
        <Modal
          isOpen={showBillModal}
          onClose={() => setShowBillModal(false)}
          title={editingBill ? 'Редактировать счёт' : 'Новый счёт'}
          footer={
            <>
              <Button 
                variant="neutral" 
                onClick={() => setShowBillModal(false)}
                ariaLabel="Отменить"
              >
                Отмена
              </Button>
              <Button 
                variant="success" 
                type="submit" 
                form="billForm"
                ariaLabel="Сохранить счёт"
              >
                Сохранить
              </Button>
            </>
          }
        >
          <form id="billForm" onSubmit={handleSaveBill}>
            <SearchableSelect
              label="Группа расходов"
              name="spending_group_id"
              value={billForm.spending_group_id}
              onChange={handleBillInputChange}
              required
              options={spendingGroups.map(group => ({
                value: group.id,
                label: getGroupDisplay(group.id)
              }))}
              placeholder="Поиск группы..."
            />
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
      )}

      {/* Модальное окно для позиций */}
      {showItemsModal && (
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
                    <Button 
                      type="button" 
                      variant="neutral" 
                      onClick={() => { setEditingItem(null); setItemForm({ text: '', price: '', quantity: '' }); }}
                      ariaLabel="Отменить редактирование"
                    >
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
              <p style={{ color: 'var(--gray)', textAlign: 'center' }} role="status">Позиции отсутствуют</p>
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
                        <Button 
                          variant="warning" 
                          size="small" 
                          onClick={() => handleEditItem(item)}
                          ariaLabel={`Редактировать позицию ${item.text}`}
                        >
                          Ред.
                        </Button>
                        <Button 
                          variant="danger" 
                          size="small" 
                          onClick={() => handleDeleteItem(item.id, item.text)}
                          ariaLabel={`Удалить позицию ${item.text}`}
                        >
                          Удал.
                        </Button>
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
      )}
    </div>
  );
};

export default Bills;

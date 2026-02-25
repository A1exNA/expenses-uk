import React, { useState, useEffect, useMemo } from 'react';
import { Button, Modal, Input, Card, Badge } from '../components/ui';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import '../styles/utils.css';

const Objects = () => {
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingObject, setEditingObject] = useState(null);
  const [viewMode, setViewMode] = useState('cards');
  const [sortConfig, setSortConfig] = useState({ key: 'address', direction: 'asc' });

  // Состояние для фильтров
  const [filters, setFilters] = useState({
    searchText: '',
    areaMin: '',
    areaMax: '',
    managementFeeMin: '',
    managementFeeMax: '',
    repairRateMin: '',
    repairRateMax: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState({
    object_address: '',
    object_area: '',
    management_fee: '',
    current_repair_rate: '',
    service_start_date: ''
  });

  const fetchObjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet('/objects');
      setObjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjects();
  }, []);

  // Функция очистки адреса
  const cleanAddress = (addr) => {
    if (!addr) return '';
    return addr
      .replace(/^г\.?\s*Тверь[,\s]*/i, '')
      .replace(/^\s*(ул\. 2-я|пер\.|бул\.|пр\.|ул\.)\s*/i, '');
  };

  // Фильтрация объектов
  const filteredObjects = useMemo(() => {
    return objects.filter(obj => {
      // Поиск по адресу
      if (filters.searchText && !obj.object_address.toLowerCase().includes(filters.searchText.toLowerCase())) {
        return false;
      }

      // Площадь мин/макс
      const area = Number(obj.object_area);
      if (filters.areaMin && area < Number(filters.areaMin)) return false;
      if (filters.areaMax && area > Number(filters.areaMax)) return false;

      // Ставка управления мин/макс
      const mgmtFee = Number(obj.management_fee);
      if (filters.managementFeeMin && mgmtFee < Number(filters.managementFeeMin)) return false;
      if (filters.managementFeeMax && mgmtFee > Number(filters.managementFeeMax)) return false;

      // Ставка ремонта мин/макс
      const repairRate = Number(obj.current_repair_rate);
      if (filters.repairRateMin && repairRate < Number(filters.repairRateMin)) return false;
      if (filters.repairRateMax && repairRate > Number(filters.repairRateMax)) return false;

      // Дата начала
      if (filters.dateFrom && obj.service_start_date < filters.dateFrom) return false;
      if (filters.dateTo && obj.service_start_date > filters.dateTo) return false;

      return true;
    });
  }, [objects, filters]);

  // Сортировка отфильтрованных объектов
  const sortedObjects = useMemo(() => {
    const sortableItems = [...filteredObjects];
    sortableItems.sort((a, b) => {
      let aVal, bVal;

      switch (sortConfig.key) {
        case 'address':
          aVal = cleanAddress(a.object_address);
          bVal = cleanAddress(b.object_address);
          break;
        case 'area':
          aVal = Number(a.object_area);
          bVal = Number(b.object_area);
          break;
        case 'management_total':
          aVal = Number(a.management_fee) * Number(a.object_area);
          bVal = Number(b.management_fee) * Number(b.object_area);
          break;
        case 'repair_total':
          aVal = Number(a.current_repair_rate) * Number(a.object_area);
          bVal = Number(b.current_repair_rate) * Number(b.object_area);
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
  }, [filteredObjects, sortConfig]);

  // Обработчики формы
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdd = () => {
    setEditingObject(null);
    setFormData({
      object_address: '',
      object_area: '',
      management_fee: '',
      current_repair_rate: '',
      service_start_date: ''
    });
    setShowModal(true);
  };

  const handleEdit = (obj) => {
    setEditingObject(obj);
    setFormData({
      object_address: obj.object_address,
      object_area: obj.object_area.toString(),
      management_fee: obj.management_fee.toString(),
      current_repair_rate: obj.current_repair_rate.toString(),
      service_start_date: obj.service_start_date
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот дом?')) return;
    try {
      await apiDelete(`/objects/${id}`);
      setObjects(objects.filter(obj => obj.id !== id));
    } catch (err) {
      alert('Ошибка при удалении: ' + err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        object_area: parseFloat(formData.object_area),
        management_fee: parseFloat(formData.management_fee),
        current_repair_rate: parseFloat(formData.current_repair_rate)
      };

      if (editingObject) {
        const updated = await apiPut(`/objects/${editingObject.id}`, payload);
        setObjects(objects.map(obj => obj.id === editingObject.id ? updated : obj));
      } else {
        const created = await apiPost('/objects', payload);
        setObjects([created, ...objects]);
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

  // Обработчики фильтров
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      searchText: '',
      areaMin: '',
      areaMax: '',
      managementFeeMin: '',
      managementFeeMax: '',
      repairRateMin: '',
      repairRateMax: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const formatDate = (dateStr) => dateStr.split('-').reverse().join('.');
  const formatCurrency = (value) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2 }).format(value);

  if (loading && objects.length === 0) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div className="fade-in">
      <div className="flex-between mb-3">
        <h2 style={{ fontSize: 'var(--font-size-2xl)' }}>Дома (объекты)</h2>
        <div className="flex gap-1">
          <Button variant={viewMode === 'cards' ? 'primary' : 'outline'} size="small" onClick={() => setViewMode('cards')}>
            Карточки
          </Button>
          <Button variant={viewMode === 'table' ? 'primary' : 'outline'} size="small" onClick={() => setViewMode('table')}>
            Таблица
          </Button>
          <Button variant="primary" onClick={handleAdd}>+ Добавить дом</Button>
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
              label="Поиск по адресу"
              name="searchText"
              value={filters.searchText}
              onChange={handleFilterChange}
              placeholder="Часть адреса..."
            />
            <Input
              label="Площадь от"
              type="number"
              step="0.01"
              name="areaMin"
              value={filters.areaMin}
              onChange={handleFilterChange}
            />
            <Input
              label="Площадь до"
              type="number"
              step="0.01"
              name="areaMax"
              value={filters.areaMax}
              onChange={handleFilterChange}
            />
            <Input
              label="Ставка управления от"
              type="number"
              step="0.01"
              name="managementFeeMin"
              value={filters.managementFeeMin}
              onChange={handleFilterChange}
            />
            <Input
              label="Ставка управления до"
              type="number"
              step="0.01"
              name="managementFeeMax"
              value={filters.managementFeeMax}
              onChange={handleFilterChange}
            />
            <Input
              label="Ставка ремонта от"
              type="number"
              step="0.01"
              name="repairRateMin"
              value={filters.repairRateMin}
              onChange={handleFilterChange}
            />
            <Input
              label="Ставка ремонта до"
              type="number"
              step="0.01"
              name="repairRateMax"
              value={filters.repairRateMax}
              onChange={handleFilterChange}
            />
            <Input
              label="Дата начала с"
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
            />
            <Input
              label="Дата начала по"
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
              <option value="address-asc">Адрес (А-Я)</option>
              <option value="address-desc">Адрес (Я-А)</option>
              <option value="area-asc">Площадь (возр.)</option>
              <option value="area-desc">Площадь (уб.)</option>
              <option value="management_total-asc">Общая ставка упр. (возр.)</option>
              <option value="management_total-desc">Общая ставка упр. (уб.)</option>
              <option value="repair_total-asc">Общая ставка рем. (возр.)</option>
              <option value="repair_total-desc">Общая ставка рем. (уб.)</option>
            </select>
          </div>
        </div>
      )}

      {sortedObjects.length === 0 ? (
        <Card><p style={{ textAlign: 'center', color: 'var(--gray)' }}>Нет домов, соответствующих фильтрам.</p></Card>
      ) : viewMode === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: 'var(--spacing-lg)' }}>
          {sortedObjects.map(obj => (
            <Card key={obj.id} className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-md)' }}>
                <h3 style={{ fontSize: 'var(--font-size-lg)', margin: 0, color: 'var(--primary)' }}>
                  {obj.object_address}
                </h3>
                <Badge variant="neutral">ID: {obj.id}</Badge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray)' }}>Площадь</div>
                  <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>{Number(obj.object_area).toFixed(2)} м²</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray)' }}>Дата начала</div>
                  <div>{formatDate(obj.service_start_date)}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray)' }}>Ставка управления</div>
                  <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 500, color: 'var(--success)' }}>
                    {formatCurrency(obj.management_fee)} ₽/м²
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray)' }}>Ставка ремонта</div>
                  <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 500, color: 'var(--warning)' }}>
                    {formatCurrency(obj.current_repair_rate)} ₽/м²
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray)' }}>Всего управление</div>
                  <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 600 }}>
                    {formatCurrency(Number(obj.management_fee) * Number(obj.object_area))} ₽/мес
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray)' }}>Всего ремонт</div>
                  <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 600 }}>
                    {formatCurrency(Number(obj.current_repair_rate) * Number(obj.object_area))} ₽/мес
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
                <Button variant="warning" size="small" onClick={() => handleEdit(obj)}>✎ Ред.</Button>
                <Button variant="danger" size="small" onClick={() => handleDelete(obj.id)}>× Удал.</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--light)' }}>
                <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)', cursor: 'pointer' }} onClick={() => requestSort('address')}>
                  Адрес {sortConfig.key === 'address' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)', cursor: 'pointer' }} onClick={() => requestSort('area')}>
                  Площадь {sortConfig.key === 'area' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Ставка упр.</th>
                <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Ставка рем.</th>
                <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)', cursor: 'pointer' }} onClick={() => requestSort('management_total')}>
                  Всего упр. {sortConfig.key === 'management_total' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)', cursor: 'pointer' }} onClick={() => requestSort('repair_total')}>
                  Всего рем. {sortConfig.key === 'repair_total' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)' }}>Дата</th>
                <th style={{ textAlign: 'center', padding: 'var(--spacing-sm)' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {sortedObjects.map(obj => (
                <tr key={obj.id} style={{ borderBottom: '1px solid var(--light)' }}>
                  <td style={{ padding: 'var(--spacing-sm)' }}>{obj.object_address}</td>
                  <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{Number(obj.object_area).toFixed(2)} м²</td>
                  <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{formatCurrency(obj.management_fee)}</td>
                  <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{formatCurrency(obj.current_repair_rate)}</td>
                  <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{formatCurrency(Number(obj.management_fee) * Number(obj.object_area))}</td>
                  <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{formatCurrency(Number(obj.current_repair_rate) * Number(obj.object_area))}</td>
                  <td style={{ padding: 'var(--spacing-sm)' }}>{formatDate(obj.service_start_date)}</td>
                  <td style={{ textAlign: 'center', padding: 'var(--spacing-sm)' }}>
                    <Button variant="warning" size="small" onClick={() => handleEdit(obj)}>Ред.</Button>
                    <Button variant="danger" size="small" onClick={() => handleDelete(obj.id)}>Удал.</Button>
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
        title={editingObject ? 'Редактировать дом' : 'Новый дом'}
        footer={
          <>
            <Button variant="neutral" onClick={() => setShowModal(false)}>Отмена</Button>
            <Button variant="success" type="submit" form="objectForm">Сохранить</Button>
          </>
        }
      >
        <form id="objectForm" onSubmit={handleSave}>
          <Input
            label="Адрес"
            name="object_address"
            value={formData.object_address}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Площадь (м²)"
            type="number"
            step="0.01"
            name="object_area"
            value={formData.object_area}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Ставка управления (руб/м²)"
            type="number"
            step="0.01"
            name="management_fee"
            value={formData.management_fee}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Ставка ремонта (руб/м²)"
            type="number"
            step="0.01"
            name="current_repair_rate"
            value={formData.current_repair_rate}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Дата начала"
            type="date"
            name="service_start_date"
            value={formData.service_start_date}
            onChange={handleInputChange}
            required
          />
        </form>
      </Modal>
    </div>
  );
};

export default Objects;

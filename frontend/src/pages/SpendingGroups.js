import React, { useState, useEffect, useMemo } from 'react';
import { Button, Modal, Input, Card, Badge } from '../components/ui';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import ExportButton from '../components/ui/ExportButton';
import VirtualizedTable from '../components/ui/VirtualizedTable';
import { showSuccess, showError, showInfo } from '../components/ui/Toast';
import '../styles/utils.css';

const SpendingGroups = () => {
  const [groups, setGroups] = useState([]);
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [viewMode, setViewMode] = useState('cards');
  const [sortConfig, setSortConfig] = useState({ key: 'text', direction: 'asc' });

  // Состояние для фильтров
  const [filters, setFilters] = useState({
    searchText: '',
    objectId: ''
  });
  const [showFilters, setShowFilters] = useState(false);

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
      showError('Ошибка загрузки данных: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Функция очистки адреса для сортировки
  const cleanAddress = (addr) => {
    if (!addr) return '';
    return addr
      .replace(/^г\.?\s*Тверь[,\s]*/i, '')
      .replace(/^\s*(ул\. 2-я|пер\.|бул\.|пр\.|ул\.)\s*/i, '');
  };

  // Получение адреса объекта
  const getObjectAddress = (objectId) => {
    if (!objectId) return '—';
    const obj = objects.find(o => Number(o.id) === Number(objectId));
    return obj ? obj.object_address : '—';
  };

  // Фильтрация групп
  const filteredGroups = useMemo(() => {
    return groups.filter(group => {
      // Поиск по тексту группы
      if (filters.searchText && !group.text.toLowerCase().includes(filters.searchText.toLowerCase())) {
        return false;
      }

      // Фильтр по конкретному дому
      if (filters.objectId && Number(group.object_id) !== Number(filters.objectId)) {
        return false;
      }

      return true;
    });
  }, [groups, filters]);

  // Сортировка
  const sortedGroups = useMemo(() => {
    const sortableItems = [...filteredGroups];
    sortableItems.sort((a, b) => {
      let aVal, bVal;

      switch (sortConfig.key) {
        case 'text':
          aVal = a.text || '';
          bVal = b.text || '';
          break;
        case 'object':
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
  }, [filteredGroups, objects, groups, sortConfig]);

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
      object_id: group.object_id ? group.object_id.toString() : '',
      text: group.text
    });
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Вы уверены, что хотите удалить группу "${name}"?`)) return;
    try {
      await apiDelete(`/spending-groups/${id}`);
      await fetchData();
      showSuccess('Группа расходов успешно удалена');
    } catch (err) {
      showError('Ошибка удаления: ' + err.message);
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
        showSuccess('Группа расходов успешно обновлена');
      } else {
        await apiPost('/spending-groups', payload);
        showSuccess('Группа расходов успешно создана');
      }
      await fetchData();
      setShowModal(false);
    } catch (err) {
      showError('Ошибка сохранения: ' + err.message);
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
    setFilters({ searchText: '', objectId: '' });
    showInfo('Фильтры сброшены');
  };

  // Колонки для виртуализированной таблицы
  const tableColumns = [
    { title: 'Дом', field: 'object', width: 300, render: (group) => getObjectAddress(group.object_id) },
    { title: 'Название группы', field: 'text', width: 400 },
    { 
      title: 'Действия', 
      width: 150,
      align: 'center',
      render: (group) => (
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'center' }}>
          <Button 
            variant="warning" 
            size="small" 
            onClick={() => handleEdit(group)}
            ariaLabel={`Редактировать группу ${group.text}`}
          >
            Ред.
          </Button>
          <Button 
            variant="danger" 
            size="small" 
            onClick={() => handleDelete(group.id, group.text)}
            ariaLabel={`Удалить группу ${group.text}`}
          >
            Удал.
          </Button>
        </div>
      )
    }
  ];

  if (loading && groups.length === 0) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div className="fade-in">
      <div className="flex-between mb-3">
        <h2 style={{ fontSize: 'var(--font-size-2xl)' }}>Группы расходов</h2>
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
            onClick={handleAdd}
            ariaLabel="Добавить новую группу расходов"
          >
            + Добавить
          </Button>
          <ExportButton 
            data={sortedGroups.map(group => ({
              id: group.id,
              name: group.text,
              object_address: getObjectAddress(group.object_id)
            }))}
            headers={[
              { key: 'id', label: 'ID', type: 'integer' },
              { key: 'name', label: 'Название группы', type: 'string' },
              { key: 'object_address', label: 'Дом', type: 'string' }
            ]}
            title="Отчёт по группам расходов"
            filename="groups_export"
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
              label="Поиск по названию"
              name="searchText"
              value={filters.searchText}
              onChange={handleFilterChange}
              placeholder="Название группы..."
              ariaDescribedBy="search-help"
            />
            <div id="search-help" className="visually-hidden">Введите текст для поиска по названию группы</div>
            <Input
              type="select"
              label="Дом"
              name="objectId"
              value={filters.objectId}
              onChange={handleFilterChange}
            >
              <option value="">Все дома</option>
              {objects.map(obj => (
                <option key={obj.id} value={obj.id}>{obj.object_address}</option>
              ))}
            </Input>
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
              <option value="text-asc">Название (А-Я)</option>
              <option value="text-desc">Название (Я-А)</option>
              <option value="object-asc">Дом (А-Я)</option>
              <option value="object-desc">Дом (Я-А)</option>
            </select>
          </div>
        </div>
      )}

      {sortedGroups.length === 0 ? (
        <Card>
          <p style={{ textAlign: 'center', color: 'var(--gray)' }} role="status">
            Нет групп, соответствующих фильтрам.
          </p>
        </Card>
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
                <Button 
                  variant="warning" 
                  size="small" 
                  onClick={() => handleEdit(group)}
                  ariaLabel={`Редактировать группу ${group.text}`}
                >
                  ✎ Ред.
                </Button>
                <Button 
                  variant="danger" 
                  size="small" 
                  onClick={() => handleDelete(group.id, group.text)}
                  ariaLabel={`Удалить группу ${group.text}`}
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
            data={sortedGroups}
            rowHeight={50}
          />
        </Card>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingGroup ? 'Редактировать группу' : 'Новая группа'}
        footer={
          <>
            <Button 
              variant="neutral" 
              onClick={() => setShowModal(false)}
              ariaLabel="Отменить"
            >
              Отмена
            </Button>
            <Button 
              variant="success" 
              type="submit" 
              form="groupForm"
              ariaLabel="Сохранить группу"
            >
              Сохранить
            </Button>
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
            ariaDescribedBy="text-help"
          />
          <div id="text-help" className="visually-hidden">Введите название группы расходов</div>
        </form>
      </Modal>
    </div>
  );
};

export default SpendingGroups;

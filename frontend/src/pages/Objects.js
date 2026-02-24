import React, { useState, useEffect } from 'react';
import { Button, Modal, Input, Table } from '../components/ui';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import '../styles/utils.css';

const Objects = () => {
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingObject, setEditingObject] = useState(null);
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

  const formatDate = (dateStr) => {
    return dateStr.split('-').reverse().join('.');
  };

  const columns = [
    { title: 'Адрес', field: 'object_address' },
    { title: 'Площадь (м²)', field: 'object_area', align: 'right', render: (obj) => Number(obj.object_area).toFixed(2) },
    { title: 'Ставка управления (руб/м²)', field: 'management_fee', align: 'right', render: (obj) => Number(obj.management_fee).toFixed(2) },
    { title: 'Ставка ремонта (руб/м²)', field: 'current_repair_rate', align: 'right', render: (obj) => Number(obj.current_repair_rate).toFixed(2) },
    { title: 'Дата начала', field: 'service_start_date', render: (obj) => formatDate(obj.service_start_date) },
    { 
      title: 'Действия', 
      align: 'center',
      render: (obj) => (
        <div className="flex gap-1" style={{ justifyContent: 'center' }}>
          <Button variant="warning" size="small" onClick={() => handleEdit(obj)}>
            Ред.
          </Button>
          <Button variant="danger" size="small" onClick={() => handleDelete(obj.id)}>
            Удал.
          </Button>
        </div>
      )
    }
  ];

  if (loading && objects.length === 0) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div>
      <div className="flex-between mb-3">
        <h2>Дома (объекты)</h2>
        <Button variant="primary" onClick={handleAdd}>
          Добавить дом
        </Button>
      </div>

      <Table 
        columns={columns} 
        data={objects} 
        emptyMessage="Нет ни одного дома. Добавьте первый дом."
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingObject ? 'Редактировать дом' : 'Новый дом'}
        footer={
          <>
            <Button variant="neutral" onClick={() => setShowModal(false)}>
              Отмена
            </Button>
            <Button variant="success" type="submit" form="objectForm">
              Сохранить
            </Button>
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

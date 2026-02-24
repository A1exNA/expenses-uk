import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';

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

  if (loading && objects.length === 0) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Дома (объекты)</h2>
        <button onClick={handleAdd} style={{ padding: '8px 16px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Добавить дом
        </button>
      </div>

      {objects.length === 0 ? (
        <p>Нет ни одного дома. Добавьте первый дом.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
          <thead>
            <tr style={{ background: '#34495e', color: 'white' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Адрес</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Площадь (м²)</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Ставка управления (руб/м²)</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Ставка ремонта (руб/м²)</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Дата начала</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {objects.map(obj => (
              <tr key={obj.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>{obj.object_address}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>{parseFloat(obj.object_area).toFixed(2)}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>{parseFloat(obj.management_fee).toFixed(2)}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>{parseFloat(obj.current_repair_rate).toFixed(2)}</td>
                <td style={{ padding: '10px' }}>{formatDate(obj.service_start_date)}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <button onClick={() => handleEdit(obj)} style={{ marginRight: '8px', padding: '4px 8px', background: '#f39c12', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
                    Ред.
                  </button>
                  <button onClick={() => handleDelete(obj.id)} style={{ padding: '4px 8px', background: '#e74c3c', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
                    Удал.
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Модальное окно (без изменений) */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', width: '400px' }}>
            <h3>{editingObject ? 'Редактировать дом' : 'Новый дом'}</h3>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Адрес:</label>
                <input
                  type="text"
                  name="object_address"
                  value={formData.object_address}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Площадь (м²):</label>
                <input
                  type="number"
                  step="0.01"
                  name="object_area"
                  value={formData.object_area}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Ставка управления (руб/м²):</label>
                <input
                  type="number"
                  step="0.01"
                  name="management_fee"
                  value={formData.management_fee}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Ставка ремонта (руб/м²):</label>
                <input
                  type="number"
                  step="0.01"
                  name="current_repair_rate"
                  value={formData.current_repair_rate}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Дата начала:</label>
                <input
                  type="date"
                  name="service_start_date"
                  value={formData.service_start_date}
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

export default Objects;

import React, { useState, useEffect } from 'react';
import * as api from '../services/api';

export default function Timesheets({ lang }) {
  const [timesheets, setTimesheets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    emp_id: '',
    ts_date: '',
    order_id: '',
    operation_no: '',
    hours: '',
    notes: ''
  });

  const t = lang === 'pl' ? {
    title: 'Czas pracy',
    employee: 'Pracownik',
    date: 'Data',
    order: 'Zamówienie',
    operation: 'Operacja',
    hours: 'Godziny',
    notes: 'Notatki',
    actions: 'Akcje',
    add: 'Dodaj wpis',
    edit: 'Edytuj',
    delete: 'Usuń',
    save: 'Zapisz',
    cancel: 'Anuluj',
    loading: 'Ładowanie...',
    error: 'Błąd',
    noItems: 'Brak wpisów',
    selectEmployee: 'Wybierz pracownika',
    selectOrder: 'Wybierz zamówienie'
  } : {
    title: 'Timesheets',
    employee: 'Employee',
    date: 'Date',
    order: 'Order',
    operation: 'Operation',
    hours: 'Hours',
    notes: 'Notes',
    actions: 'Actions',
    add: 'Add Entry',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading...',
    error: 'Error',
    noItems: 'No entries',
    selectEmployee: 'Select employee',
    selectOrder: 'Select order'
  };

  useEffect(() => {
    loadTimesheets();
    loadEmployees();
    loadOrders();
  }, []);

  const loadTimesheets = async () => {
    try {
      setLoading(true);
      const data = await api.getTimesheets();
      setTimesheets(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await api.getEmployees();
      setEmployees(data || []);
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  const loadOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  const handleAddClick = () => {
    setEditingItem(null);
    setFormData({
      emp_id: '',
      ts_date: new Date().toISOString().split('T')[0],
      order_id: '',
      operation_no: '',
      hours: '',
      notes: ''
    });
    setShowForm(true);
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setFormData({
      emp_id: item.emp_id,
      ts_date: item.ts_date,
      order_id: item.order_id || '',
      operation_no: item.operation_no || '',
      hours: item.hours,
      notes: item.notes || ''
    });
    setShowForm(true);
  };

  const handleDeleteClick = async (tsId) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await api.deleteTimesheet(tsId);
      loadTimesheets();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.updateTimesheet(editingItem.ts_id, formData);
      } else {
        await api.createTimesheet(formData);
      }
      loadTimesheets();
      setShowForm(false);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <div className="loading">{t.loading}</div>;

  return (
    <div className="timesheets-container">
      <div className="timesheets-header">
        <h2>{t.title}</h2>
        <button className="btn btn-primary" onClick={handleAddClick}>{t.add}</button>
      </div>

      {error && <div className="error-message">{t.error}: {error}</div>}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? t.edit : t.add}</h3>
              <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label>{t.employee}</label>
                <select
                  name="emp_id"
                  value={formData.emp_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">{t.selectEmployee}</option>
                  {employees.map(e => (
                    <option key={e.emp_id} value={e.emp_id}>{e.name} ({e.emp_id})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{t.date}</label>
                <input
                  type="date"
                  name="ts_date"
                  value={formData.ts_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.order}</label>
                <select
                  name="order_id"
                  value={formData.order_id}
                  onChange={handleInputChange}
                >
                  <option value="">{t.selectOrder}</option>
                  {orders.map(o => (
                    <option key={o.order_id} value={o.order_id}>{o.order_id}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{t.operation}</label>
                <input
                  type="number"
                  name="operation_no"
                  value={formData.operation_no}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>{t.hours}</label>
                <input
                  type="number"
                  name="hours"
                  value={formData.hours}
                  onChange={handleInputChange}
                  step="0.5"
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.notes}</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">{t.save}</button>
                <button type="button" className="btn" onClick={() => setShowForm(false)}>{t.cancel}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        {timesheets.length === 0 ? (
          <p className="empty-message">{t.noItems}</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.employee}</th>
                <th>{t.date}</th>
                <th>{t.order}</th>
                <th>{t.operation}</th>
                <th>{t.hours}</th>
                <th>{t.notes}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {timesheets.map(item => (
                <tr key={item.ts_id}>
                  <td>{item.emp_id}</td>
                  <td>{item.ts_date}</td>
                  <td>{item.order_id || '—'}</td>
                  <td>{item.operation_no || '—'}</td>
                  <td>{item.hours}</td>
                  <td>{item.notes || '—'}</td>
                  <td>
                    <button className="btn-sm btn-edit" onClick={() => handleEditClick(item)}>{t.edit}</button>
                    <button className="btn-sm btn-delete" onClick={() => handleDeleteClick(item.ts_id)}>{t.delete}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

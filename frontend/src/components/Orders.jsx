import React, { useState, useEffect } from 'react';
import * as api from '../services/api';

export default function Orders({ lang }) {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [formData, setFormData] = useState({
    order_id: '',
    customer_id: '',
    status: 'Planned',
    due_date: ''
  });

  const t = lang === 'pl' ? {
    title: 'Zamówienia',
    orderId: 'Nr Zamówienia',
    customer: 'Klient',
    status: 'Status',
    dueDate: 'Termin',
    actions: 'Akcje',
    add: 'Dodaj zamówienie',
    edit: 'Edytuj',
    delete: 'Usuń',
    save: 'Zapisz',
    cancel: 'Anuluj',
    close: 'Zamknij',
    loading: 'Ładowanie...',
    error: 'Błąd',
    noOrders: 'Brak zamówień',
    createSuccess: 'Zamówienie dodane',
    updateSuccess: 'Zamówienie zaktualizowane',
    deleteSuccess: 'Zamówienie usunięte',
    selectCustomer: 'Wybierz klienta'
  } : {
    title: 'Orders',
    orderId: 'Order ID',
    customer: 'Customer',
    status: 'Status',
    dueDate: 'Due Date',
    actions: 'Actions',
    add: 'Add Order',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    loading: 'Loading...',
    error: 'Error',
    noOrders: 'No orders',
    createSuccess: 'Order added',
    updateSuccess: 'Order updated',
    deleteSuccess: 'Order deleted',
    selectCustomer: 'Select customer'
  };

  useEffect(() => {
    loadOrders();
    loadCustomers();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getOrders();
      setOrders(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await api.getCustomers();
      setCustomers(data || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const handleAddClick = () => {
    setEditingOrder(null);
    setFormData({
      order_id: '',
      customer_id: '',
      status: 'Planned',
      due_date: ''
    });
    setShowForm(true);
  };

  const handleEditClick = (order) => {
    setEditingOrder(order);
    setFormData({
      order_id: order.order_id,
      customer_id: order.customer_id,
      status: order.status,
      due_date: order.due_date || ''
    });
    setShowForm(true);
  };

  const handleDeleteClick = async (orderId) => {
    if (!window.confirm(`${t.deleteSuccess}?`)) return;
    try {
      await api.deleteOrder?.(orderId);
      loadOrders();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingOrder) {
        await api.updateOrder?.(formData.order_id, formData);
      } else {
        await api.createOrder(formData);
      }
      loadOrders();
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
    <div className="orders-container">
      <div className="orders-header">
        <h2>{t.title}</h2>
        <button className="btn btn-primary" onClick={handleAddClick}>{t.add}</button>
      </div>

      {error && <div className="error-message">{t.error}: {error}</div>}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingOrder ? t.edit : t.add}</h3>
              <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label>{t.orderId}</label>
                <input
                  type="text"
                  name="order_id"
                  value={formData.order_id}
                  onChange={handleInputChange}
                  disabled={!!editingOrder}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.customer}</label>
                <select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">{t.selectCustomer}</option>
                  {customers.map(c => (
                    <option key={c.customer_id} value={c.customer_id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{t.status}</label>
                <select name="status" value={formData.status} onChange={handleInputChange}>
                  <option value="Planned">Planned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t.dueDate}</label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
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
        {orders.length === 0 ? (
          <p className="empty-message">{t.noOrders}</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.orderId}</th>
                <th>{t.customer}</th>
                <th>{t.status}</th>
                <th>{t.dueDate}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.order_id}>
                  <td>{order.order_id}</td>
                  <td>{order.customer_id}</td>
                  <td><span className={`status-badge ${order.status.toLowerCase()}`}>{order.status}</span></td>
                  <td>{order.due_date || '—'}</td>
                  <td>
                    <button className="btn-sm btn-edit" onClick={() => handleEditClick(order)}>{t.edit}</button>
                    <button className="btn-sm btn-delete" onClick={() => handleDeleteClick(order.order_id)}>{t.delete}</button>
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

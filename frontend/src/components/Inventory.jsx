import React, { useState, useEffect } from 'react';
import * as api from '../services/api';

export default function Inventory({ lang }) {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    txn_id: '',
    product_id: '',
    qty_change: '',
    reason: 'PO',
    lot: '',
    location: ''
  });
  const [importing, setImporting] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importResult, setImportResult] = useState(null)

  const t = lang === 'pl' ? {
    title: 'Magazyn',
    txnId: 'Nr Transakcji',
    product: 'Produkt',
    qtyChange: 'Zmiana Ilości',
    reason: 'Powód',
    lot: 'Partia',
    location: 'Lokalizacja',
    actions: 'Akcje',
    add: 'Dodaj transakcję',
    edit: 'Edytuj',
    delete: 'Usuń',
    save: 'Zapisz',
    cancel: 'Anuluj',
    loading: 'Ładowanie...',
    error: 'Błąd',
    noItems: 'Brak pozycji w magazynie',
    selectProduct: 'Wybierz produkt'
  } : {
    title: 'Inventory',
    txnId: 'Transaction ID',
    product: 'Product',
    qtyChange: 'Qty Change',
    reason: 'Reason',
    lot: 'Lot',
    location: 'Location',
    actions: 'Actions',
    add: 'Add Transaction',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading...',
    error: 'Error',
    noItems: 'No inventory items',
    selectProduct: 'Select product'
  };

  const reasonLabel = (code) => {
    if (lang === 'pl') {
      switch (String(code)) {
        case 'PO': return 'Zakup';
        case 'WO': return 'Produkcja';
        case 'Sale': return 'Sprzedaż';
        case 'Adjust':
        case 'Adjustment': return 'Korekta';
        default: return code;
      }
    }
    return code;
  }

  useEffect(() => {
    loadInventory();
    loadProducts();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await api.getInventory();
      setInventory(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const handleAddClick = () => {
    setEditingItem(null);
    setFormData({
      txn_id: '',
      product_id: '',
      qty_change: '',
      reason: 'PO',
      lot: '',
      location: ''
    });
    setShowForm(true);
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setFormData({
      txn_id: item.txn_id,
      product_id: item.product_id,
      qty_change: item.qty_change,
      reason: item.reason,
      lot: item.lot || '',
      location: item.location || ''
    });
    setShowForm(true);
  };

  const handleDeleteClick = async (txnId) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api.deleteInventory(txnId);
      loadInventory();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.updateInventory(formData.txn_id, formData);
      } else {
        await api.createInventory(formData);
      }
      loadInventory();
      setShowForm(false);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleExport = async () => {
    try {
      const blob = await api.exportInventoryCSV()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'inventory.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert((lang === 'pl' ? 'Błąd eksportu: ' : 'Export error: ') + err.message)
    }
  }

  const handleImportSubmit = async () => {
    if (!importFile) return
    try {
      const res = await api.importInventoryCSV(importFile)
      setImportResult(res)
      await loadInventory()
    } catch (err) {
      alert((lang === 'pl' ? 'Błąd importu: ' : 'Import error: ') + err.message)
    }
  }

  if (loading) return <div className="loading">{t.loading}</div>;

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <h2>{t.title}</h2>
        <div className="header-actions">
          <button className="btn" onClick={handleExport}>{lang==='pl' ? 'Eksport CSV' : 'Export CSV'}</button>
          <button className="btn" onClick={() => { setImporting(true); setImportFile(null); setImportResult(null); }}>
            {lang==='pl' ? 'Import CSV' : 'Import CSV'}
          </button>
          <button className="btn btn-primary" onClick={handleAddClick}>{t.add}</button>
        </div>
      </div>
      {importing && (
        <div className="modal-overlay" onClick={() => setImporting(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{lang==='pl' ? 'Import magazynu' : 'Import inventory'}</h3>
              <button className="close-btn" onClick={() => setImporting(false)}>×</button>
            </div>
            <div className="form">
              <input
                type="file"
                accept=".csv"
                onChange={e => setImportFile(e.target.files?.[0] || null)}
              />
              <div className="form-actions" style={{marginTop:'1rem'}}>
                <button className="btn btn-primary" disabled={!importFile} onClick={handleImportSubmit}>
                  {lang==='pl' ? 'Wyślij' : 'Upload'}
                </button>
                <button className="btn" type="button" onClick={() => setImporting(false)}>{t.cancel}</button>
              </div>
              {importResult && (
                <pre className="import-result" style={{marginTop:'1rem', maxHeight:200, overflow:'auto'}}>
                  {JSON.stringify(importResult, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

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
                <label>{t.txnId}</label>
                <input
                  type="text"
                  name="txn_id"
                  value={formData.txn_id}
                  onChange={handleInputChange}
                  disabled={!!editingItem}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.product}</label>
                <select
                  name="product_id"
                  value={formData.product_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">{t.selectProduct}</option>
                  {products.map(p => (
                    <option key={p.product_id} value={p.product_id}>{p.name} ({p.product_id})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{t.qtyChange}</label>
                <input
                  type="number"
                  name="qty_change"
                  value={formData.qty_change}
                  onChange={handleInputChange}
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.reason}</label>
                <select name="reason" value={formData.reason} onChange={handleInputChange}>
                  <option value="PO">PO</option>
                  <option value="WO">WO</option>
                  <option value="Adjustment">Adjustment</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t.lot}</label>
                <input
                  type="text"
                  name="lot"
                  value={formData.lot}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>{t.location}</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
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
        {inventory.length === 0 ? (
          <p className="empty-message">{t.noItems}</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.txnId}</th>
                <th>{t.product}</th>
                <th>{t.qtyChange}</th>
                <th>{t.reason}</th>
                <th>{t.lot}</th>
                <th>{t.location}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => (
                <tr key={item.txn_id}>
                  <td>{item.txn_id}</td>
                  <td>{item.product_id}</td>
                  <td>{item.qty_change}</td>
                  <td>{reasonLabel(item.reason)}</td>
                  <td>{item.lot || '—'}</td>
                  <td>{item.location || '—'}</td>
                  <td>
                    <button className="btn-sm btn-edit" onClick={() => handleEditClick(item)}>{t.edit}</button>
                    <button className="btn-sm btn-danger" onClick={() => handleDeleteClick(item.txn_id)}>{t.delete}</button>
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

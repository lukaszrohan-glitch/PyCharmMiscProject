import {useState, useEffect} from 'react';
import * as api from '../services/api';
import { useToast } from '../lib/toastContext';
import ModalOverlay from './ModalOverlay';
import EmptyState from './EmptyState';

export default function Inventory({ lang }) {
  const toast = useToast();
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
  const [searchQuery, setSearchQuery] = useState('')
  const [filterReason, setFilterReason] = useState('all')
  const [sortBy, setSortBy] = useState('date')

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
    selectProduct: 'Wybierz produkt',
    deleteConfirm: 'Czy na pewno chcesz usunąć tę transakcję?',
    saveFailed: 'Nie udało się zapisać',
    deleteFailed: 'Nie udało się usunąć',
    exportSuccess: 'Eksport zakończony',
    exportFailed: 'Błąd eksportu',
    importSuccess: 'Import zakończony',
    importFailed: 'Błąd importu'
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
    selectProduct: 'Select product',
    deleteConfirm: 'Are you sure you want to delete this transaction?',
    saveFailed: 'Failed to save transaction',
    deleteFailed: 'Failed to delete transaction',
    exportSuccess: 'Export complete',
    exportFailed: 'Export failed',
    importSuccess: 'Import complete',
    importFailed: 'Import failed'
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

  // Filter and sort logic
  const filteredInventory = inventory
    .filter(item => {
      // Search filter
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query ||
        item.txn_id?.toLowerCase().includes(query) ||
        item.product_id?.toLowerCase().includes(query) ||
        item.lot?.toLowerCase().includes(query) ||
        item.location?.toLowerCase().includes(query);

      // Reason filter
      const matchesReason = filterReason === 'all' || item.reason === filterReason;

      return matchesSearch && matchesReason;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'txn_id':
          return (a.txn_id || '').localeCompare(b.txn_id || '');
        case 'product':
          return (a.product_id || '').localeCompare(b.product_id || '');
        case 'qty':
          return (b.qty_change || 0) - (a.qty_change || 0);
        case 'date':
        default:
          // Assuming txn_date exists or using txn_id as fallback
          return (b.txn_date || b.txn_id || '').localeCompare(a.txn_date || a.txn_id || '');
      }
    });

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
    if (!window.confirm(t.deleteConfirm)) return;
    try {
      await api.deleteInventory(txnId);
      toast.show(t.deleteSuccess || t.delete);
      loadInventory();
    } catch (err) {
      toast.show(`${t.deleteFailed}: ${err.message}`, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.updateInventory(formData.txn_id, formData);
        toast.show(lang==='pl'?'Transakcja zaktualizowana':'Transaction updated');
      } else {
        await api.createInventory(formData);
        toast.show(lang==='pl'?'Transakcja dodana':'Transaction added');
      }
      loadInventory();
      setShowForm(false);
    } catch (err) {
      toast.show(`${t.saveFailed}: ${err.message}`, 'error');
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
      toast.show(t.exportSuccess)
    } catch (err) {
      toast.show(`${t.exportFailed}: ${err.message}`, 'error')
    }
  }

  const handleImportSubmit = async () => {
    if (!importFile) return
    try {
      const res = await api.importInventoryCSV(importFile)
      setImportResult(res)
      await loadInventory()
      toast.show(t.importSuccess)
    } catch (err) {
      toast.show(`${t.importFailed}: ${err.message}`, 'error')
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
        <ModalOverlay ariaLabel={t.cancel} onClose={() => setImporting(false)}>
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <h3>{lang==='pl' ? 'Import magazynu' : 'Import inventory'}</h3>
              <button className="close-btn" type="button" onClick={() => setImporting(false)} aria-label={t.cancel}>×</button>
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
        </ModalOverlay>
      )}

      {showForm && (
        <ModalOverlay ariaLabel={t.cancel} onClose={() => setShowForm(false)}>
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <h3>{editingItem ? t.edit : t.add}</h3>
              <button className="close-btn" type="button" onClick={() => setShowForm(false)} aria-label={t.cancel}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label htmlFor="txn_id_field">{t.txnId}</label>
                <input
                  id="txn_id_field"
                  type="text"
                  name="txn_id"
                  value={formData.txn_id}
                  onChange={handleInputChange}
                  disabled={!!editingItem}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="product_id_field">{t.product}</label>
                <select
                  id="product_id_field"
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
                <label htmlFor="qty_change_field">{t.qtyChange}</label>
                <input
                  id="qty_change_field"
                  type="number"
                  name="qty_change"
                  value={formData.qty_change}
                  onChange={handleInputChange}
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="reason_field">{t.reason}</label>
                <select id="reason_field" name="reason" value={formData.reason} onChange={handleInputChange}>
                  <option value="PO">PO</option>
                  <option value="WO">WO</option>
                  <option value="Adjustment">Adjustment</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="lot_field">{t.lot}</label>
                <input
                  id="lot_field"
                  type="text"
                  name="lot"
                  value={formData.lot}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="location_field">{t.location}</label>
                <input
                  id="location_field"
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
        </ModalOverlay>
      )}

      {error && <div className="error-message">{t.error}: {error}</div>}

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder={lang === 'pl' ? 'Szukaj po ID transakcji, produkcie...' : 'Search by Txn ID, Product...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-controls">
          <select
            className="filter-select"
            value={filterReason}
            onChange={(e) => setFilterReason(e.target.value)}
          >
            <option value="all">{lang === 'pl' ? 'Wszystkie powody' : 'All Reasons'}</option>
            <option value="PO">{lang === 'pl' ? 'Zamówienie zakupu' : 'Purchase Order'}</option>
            <option value="WO">{lang === 'pl' ? 'Zlecenie produkcji' : 'Work Order'}</option>
            <option value="Sale">{lang === 'pl' ? 'Sprzedaż' : 'Sale'}</option>
            <option value="Adjust">{lang === 'pl' ? 'Korekta' : 'Adjustment'}</option>
          </select>
          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">{lang === 'pl' ? 'Data' : 'Date'}</option>
            <option value="txn_id">{lang === 'pl' ? 'ID transakcji' : 'Txn ID'}</option>
            <option value="product">{lang === 'pl' ? 'Produkt' : 'Product'}</option>
            <option value="qty">{lang === 'pl' ? 'Ilość' : 'Quantity'}</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        {filteredInventory.length === 0 ? (
          searchQuery || filterReason !== 'all' ? (
            <EmptyState.Search lang={lang} query={searchQuery || filterReason} />
          ) : (
            <EmptyState.Inventory lang={lang} onAdd={() => setShowForm(true)} />
          )
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
              {filteredInventory.map(item => (
                <tr key={item.txn_id}>
                  <td data-label={t.txnId}>{item.txn_id}</td>
                  <td data-label={t.product}>{item.product_id}</td>
                  <td data-label={t.qtyChange} className={item.qty_change > 0 ? 'qty-positive' : 'qty-negative'}>
                    {item.qty_change > 0 ? '+' : ''}{item.qty_change}
                  </td>
                  <td data-label={t.reason}>{reasonLabel(item.reason)}</td>
                  <td data-label={t.lot}>{item.lot || '—'}</td>
                  <td data-label={t.location}>{item.location || '—'}</td>
                  <td data-label={t.actions}>
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

import { useState, useEffect, useCallback } from 'react'
import * as api from '../services/api'
import { useToast } from '../lib/toastContext'
import Skeleton from './Skeleton'
import EmptyState from './EmptyState'
import CalendarView from './CalendarView'
import { useOrdersAsEvents } from '../hooks/useFilters'

const ORDER_ID_MAX = 24
const CUSTOMER_ID_MAX = 24
const CONTACT_MAX = 80

export default function Orders({ lang }) {
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [viewMode, setViewMode] = useState('table') // 'table' | 'calendar'
  const [formData, setFormData] = useState({
    order_id: '',
    customer_id: '',
    status: 'Planned',
    due_date: ''
  })
  const [importing, setImporting] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const [autoSuggestion, setAutoSuggestion] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [lastCreatedId, setLastCreatedId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const selectedCustomer = customers.find(c => String(c.customer_id) === String(formData.customer_id))

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
    selectCustomer: 'Wybierz klienta',
    autoNext: 'Sugerowany numer',
    contact: 'Osoba kontaktowa',
    orderExists: 'Takie zamówienie już istnieje',
    createFailed:'Nie udało się zapisać zamówienia',
    deleteConfirm:'Na pewno chcesz usunąć to zamówienie?',
    deleteFailed:'Nie udało się usunąć zamówienia',
    exportFailed:'Błąd eksportu',
    importFailed:'Błąd importu'
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
    selectCustomer: 'Select customer',
    autoNext: 'Suggested ID',
    contact: 'Contact person',
    orderExists: 'Order already exists',
    createFailed:'Failed to save order',
    deleteConfirm:'Are you sure you want to delete this order?',
    deleteFailed:'Failed to delete order',
    exportFailed:'Export failed',
    importFailed:'Import failed'
  };

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.getOrders()
      setOrders(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCustomers = useCallback(async () => {
    try {
      const data = await api.getCustomers()
      setCustomers(data || [])
    } catch (err) {
      console.error('Failed to load customers:', err)
    }
  }, [])

  const fetchAutoSuggestion = useCallback(async () => {
    try {
      const hint = await api.suggestOrderId()?.catch(() => null)
      if (hint?.order_id) {
        setAutoSuggestion(hint.order_id)
        return
      }
      const fallback = await api.validateOrderId('__probe__').catch(() => null)
      if (fallback?.suggested_next) setAutoSuggestion(fallback.suggested_next)
    } catch (err) {
      console.warn('Auto ID suggestion failed:', err)
    }
  }, [])

  // Define validateOrder BEFORE the useEffect that uses it
  const validateOrder = useCallback(async (orderId, customerId) => {
    if (!orderId) return
    try {
      await api.validateOrderId(orderId, customerId)
      setFieldErrors((prev) => ({ ...prev, order_id: undefined, customer_id: undefined }))
    } catch (err) {
      const detail = err?.message || 'Validation error'
      if (detail.includes('Order already exists')) {
        setFieldErrors((prev) => ({ ...prev, order_id: lang === 'pl' ? 'Zamówienie już istnieje' : 'Order already exists' }))
      } else if (detail.includes('Customer not found')) {
        setFieldErrors((prev) => ({ ...prev, customer_id: lang === 'pl' ? 'Klient nie istnieje' : 'Customer not found' }))
      }
    }
  }, [lang])

  useEffect(() => {
    loadOrders()
    loadCustomers()
    fetchAutoSuggestion()
  }, [loadOrders, loadCustomers, fetchAutoSuggestion])

  useEffect(() => {
     if (!showForm) {
       setFieldErrors({})
       return
     }
     if (!formData.order_id) return
     validateOrder(formData.order_id, formData.customer_id)
  }, [formData.order_id, formData.customer_id, showForm, validateOrder])

  const handleAddClick = () => {
    setEditingOrder(null)
    setLastCreatedId(null)
    setFormData({
      order_id: '',
      customer_id: '',
      status: 'Planned',
      due_date: ''
    })
    setShowForm(true)
  }

  const handleEditClick = (order) => {
    setEditingOrder(order)
    setFormData({
      order_id: order.order_id,
      customer_id: order.customer_id,
      status: order.status,
      due_date: order.due_date || ''
    })
    setShowForm(true)
  }

  const handleDeleteClick = async (orderId) => {
    if (!window.confirm(t.deleteConfirm)) return
    try {
      await api.deleteOrder?.(orderId)
      toast.show(t.deleteSuccess)
      loadOrders()
    } catch (err) {
      toast.show(`${t.deleteFailed}: ${err.message}`, 'error')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingOrder) {
        await api.updateOrder?.(formData.order_id, formData)
        toast.show(t.updateSuccess)
      } else {
        const payload = { ...formData }
        if (!payload.order_id) delete payload.order_id
        const created = await api.createOrder(payload)
        toast.show(t.createSuccess)
        setLastCreatedId(created?.order_id || null)
        await fetchAutoSuggestion()
      }
      loadOrders()
      setShowForm(false)
    } catch (err) {
      const friendly = err?.message?.includes('already exists')
        ? (lang === 'pl' ? 'To zamówienie już istnieje. Użyj innego numeru.' : 'This order ID already exists. Pick a different number.')
        : err.message
      toast.show(`${t.createFailed}: ${friendly}`, 'error')
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name === 'order_id' && value.length > ORDER_ID_MAX) return
    if (name === 'customer_id' && value.length > CUSTOMER_ID_MAX) return
    if (name === 'contact_person' && value.length > CONTACT_MAX) return
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const renderHint = (key) => fieldErrors[key] && (
    <p className="form-hint form-hint-error">{fieldErrors[key]}</p>
  )

  const handleExport = async () => {
    try {
      const blob = await api.exportOrdersCSV()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'orders.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.show(lang==='pl' ? 'Eksport zakończony' : 'Export complete')
    } catch (err) {
      toast.show(`${t.exportFailed}: ${err.message}`, 'error')
    }
  }

  const handleImportSubmit = async () => {
    if (!importFile) return
    try {
      const res = await api.importOrdersCSV(importFile)
      setImportResult(res)
      await loadOrders()
      toast.show(lang==='pl' ? 'Import zakończony' : 'Import complete')
    } catch (err) {
      toast.show(`${t.importFailed}: ${err.message}`, 'error')
    }
  }

  // Convert orders to calendar events (must be before any conditional returns)
  const calendarEvents = useOrdersAsEvents(orders)

  if (loading) return (
    <div className="orders-container">
      <div className="orders-header">
        <Skeleton style={{ width: '150px', height: '2rem' }} />
        <div className="header-actions stack-mobile">
          <Skeleton style={{ width: '100px', height: '38px', borderRadius: '8px' }} />
          <Skeleton style={{ width: '100px', height: '38px', borderRadius: '8px' }} />
          <Skeleton style={{ width: '120px', height: '38px', borderRadius: '8px' }} />
        </div>
      </div>
      <Skeleton.Table rows={6} cols={5} />
    </div>
  )


  return (
    <div className="orders-container">
      <div className="orders-header">
        <h2>{t.title}</h2>
        <div className="header-actions stack-mobile">
          {/* View mode toggle */}
          <div className="view-toggle" role="group" aria-label={lang === 'pl' ? 'Widok' : 'View'}>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              aria-pressed={viewMode === 'table'}
            >
              📋 {lang === 'pl' ? 'Lista' : 'List'}
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
              aria-pressed={viewMode === 'calendar'}
            >
              📅 {lang === 'pl' ? 'Kalendarz' : 'Calendar'}
            </button>
          </div>
          <button className="btn btn-primary" type="button" onClick={handleExport}>{lang==='pl' ? 'Eksport CSV' : 'Export CSV'}</button>
          <button className="btn" type="button" onClick={() => { setImporting(true); setImportResult(null); setImportFile(null); }}>
            {lang==='pl' ? 'Import CSV' : 'Import CSV'}
          </button>
          <button className="btn btn-primary" type="button" onClick={handleAddClick}>{t.add}</button>
        </div>
      </div>
      {importing && (
        <>
          <button
            type="button"
            className="modal-overlay"
            aria-label={t.cancel}
            onClick={() => setImporting(false)}
          />
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <h3>{lang==='pl' ? 'Import zamówień' : 'Import orders'}</h3>
              <button type="button" className="close-btn" onClick={() => setImporting(false)}>×</button>
            </div>
            <div className="form">
              <input
                type="file"
                accept=".csv"
                onChange={e => setImportFile(e.target.files?.[0] || null)}
              />
              <div className="form-actions" style={{marginTop:'1rem'}}>
                <button className="btn btn-primary" type="button" disabled={!importFile} onClick={handleImportSubmit}>
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
        </>
      )}

      {error && <div className="error-message">{t.error}: {error}</div>}

      {showForm && (
        <>
          <button
            type="button"
            className="modal-overlay"
            aria-label={t.cancel}
            onClick={() => setShowForm(false)}
          />
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <h3>{editingOrder ? t.edit : t.add}</h3>
              <button type="button" className="close-btn" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="form order-form-grid">
              <div className="notice" role="status" aria-live="polite">
                {lang === 'pl'
                  ? 'ID zamówienia zostanie nadane automatycznie po zapisaniu. Opcjonalnie możesz podać własny numer.'
                  : 'Order ID will be assigned automatically after save. Optionally enter your own number.'}
                {lastCreatedId && (
                  <strong> {lang === 'pl' ? `Ostatnio nadane: ${lastCreatedId}` : `Last created: ${lastCreatedId}`}</strong>
                )}
              </div>
              <div className="form-group">
                <label>{t.orderId}</label>
                {editingOrder ? (
                  <input
                    type="text"
                    value={formData.order_id}
                    disabled
                    className="input-readonly"
                  />
                ) : (
                  <div className="auto-id-display">
                    <span className="auto-id-label">
                      {lang === 'pl' ? '🔄 Automatycznie nadany: ' : '🔄 Auto-assigned: '}
                    </span>
                    <strong>{autoSuggestion || '(generowanie...)'}</strong>
                    <p className="form-hint">
                      {lang === 'pl'
                        ? 'Numer zostanie nadany automatycznie po zapisaniu.'
                        : 'Order ID will be generated automatically on save.'}
                    </p>
                  </div>
                )}
                {renderHint('order_id')}
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
                  {customers.map((c) => (
                    <option key={c.customer_id} value={c.customer_id}>{c.name}</option>
                  ))}
                </select>
                {renderHint('customer_id')}
              </div>
              <div className="form-group inline">
                <label>{t.status}</label>
                <select name="status" value={formData.status} onChange={handleInputChange}>
                  <option value="Planned">{lang==='pl'?'Planowane':'Planned'}</option>
                  <option value="InProd">{lang==='pl'?'W produkcji':'In Production'}</option>
                  <option value="Done">{lang==='pl'?'Zakończone':'Completed'}</option>
                </select>
              </div>
              <div className="form-group inline">
                <label>{t.dueDate}</label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>{t.contact}</label>
                <input
                  type="text"
                  name="contact_person"
                  value={formData.contact_person || ''}
                  onChange={handleInputChange}
                  maxLength={CONTACT_MAX}
                  placeholder={lang==='pl'?'Np. Anna Nowak':'e.g. Anna Novak'}
                />
              </div>
              {selectedCustomer && (
                <div className="form-group customer-preview">
                  <div className="customer-preview-name">{selectedCustomer.name}</div>
                  <div className="customer-preview-line">{selectedCustomer.address || '-'}</div>
                  <div className="customer-preview-line">{selectedCustomer.email || '-'}</div>
                  <div className="customer-preview-line">POC: {selectedCustomer.contact_person || '-'}</div>
                </div>
              )}
              <div className="form-actions sticky">
                <button type="submit" className="btn btn-primary" disabled={!!editingOrder && (!formData.order_id || !!fieldErrors.order_id)}>{t.save}</button>
                <button type="button" className="btn" onClick={() => setShowForm(false)}>{t.cancel}</button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Search and Filter Controls */}
      <div className="filter-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder={lang === 'pl' ? 'Szukaj zamówienia lub klienta...' : 'Search order or customer...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-controls">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">{lang === 'pl' ? 'Wszystkie statusy' : 'All statuses'}</option>
            <option value="New">{lang === 'pl' ? 'Nowe' : 'New'}</option>
            <option value="Planned">{lang === 'pl' ? 'Planowane' : 'Planned'}</option>
            <option value="InProd">{lang === 'pl' ? 'W produkcji' : 'In Production'}</option>
            <option value="Done">{lang === 'pl' ? 'Zakończone' : 'Done'}</option>
            <option value="Invoiced">{lang === 'pl' ? 'Zafakturowane' : 'Invoiced'}</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="date">{lang === 'pl' ? 'Sortuj: Data' : 'Sort: Date'}</option>
            <option value="id">{lang === 'pl' ? 'Sortuj: ID' : 'Sort: ID'}</option>
            <option value="customer">{lang === 'pl' ? 'Sortuj: Klient' : 'Sort: Customer'}</option>
            <option value="status">{lang === 'pl' ? 'Sortuj: Status' : 'Sort: Status'}</option>
          </select>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <CalendarView
          events={calendarEvents}
          lang={lang}
          onEventClick={(event) => {
            const order = orders.find(o => o.order_id === event.id)
            if (order) {
              handleEditClick(order)
            }
          }}
        />
      ) : (
      <div className="table-container">
        {(() => {
          // Apply filtering
          let filtered = orders.filter(order => {
            const matchesSearch = !searchTerm ||
              order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
              order.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
              customers.find(c => String(c.customer_id) === String(order.customer_id))?.name.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

            return matchesSearch && matchesStatus;
          });

          // Apply sorting
          filtered = filtered.sort((a, b) => {
            switch (sortBy) {
              case 'id':
                return a.order_id.localeCompare(b.order_id);
              case 'customer':
                return a.customer_id.localeCompare(b.customer_id);
              case 'status':
                return a.status.localeCompare(b.status);
              case 'date':
              default:
                if (!a.due_date && !b.due_date) return 0;
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(b.due_date) - new Date(a.due_date);
            }
          });

          return filtered.length === 0 ? (
            searchTerm || statusFilter !== 'all' ? (
              <EmptyState.Search lang={lang} query={searchTerm || statusFilter} />
            ) : (
              <EmptyState.Orders lang={lang} onAdd={handleAddClick} />
            )
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.orderId}</th>
                  <th>{t.customer}</th>
                  <th>{t.status}</th>
                  <th>{t.dueDate}</th>
                  <th>{t.contact}</th>
                  <th>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.order_id}>
                    <td data-label={t.orderId}>{order.order_id}</td>
                    <td data-label={t.customer}>{(() => { const c = customers.find(x => String(x.customer_id)===String(order.customer_id)); return c ? c.name : order.customer_id })()}</td>
                    <td data-label={t.status}><span className={`status-badge ${order.status.toLowerCase()}`}>
                      {lang==='pl' ? (order.status==='Planned'?'Planowane': order.status==='InProd'?'W produkcji': order.status==='Done'?'Zakończone': order.status) : (order.status==='InProd'?'In Production': order.status==='Done'?'Completed' : order.status)}
                    </span></td>
                    <td data-label={t.dueDate}>{order.due_date || '-'}</td>
                    <td data-label={t.contact}>{order.contact_person || '-'}</td>
                    <td data-label={t.actions}>
                      <button type="button" className="btn-sm btn-edit" onClick={() => handleEditClick(order)}>{t.edit}</button>
                      <button type="button" className="btn-sm btn-danger" onClick={() => handleDeleteClick(order.order_id)}>{t.delete}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()}
      </div>
      )}
    </div>
  );
}

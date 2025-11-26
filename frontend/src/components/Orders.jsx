import React, { useState, useEffect } from 'react'
import * as api from '../services/api'
import { useToast } from './Toast'

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
  const [formData, setFormData] = useState({
    order_id: '',
    customer_id: '',
    status: 'Planned',
    due_date: ''
  })
  const [importing, setImporting] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const [validation, setValidation] = useState({ order: null, customer: null })
  const [autoSuggestion, setAutoSuggestion] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [lastCreatedId, setLastCreatedId] = useState(null)
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

  useEffect(() => {
    loadOrders()
    loadCustomers()
    fetchAutoSuggestion()
  }, [])

  useEffect(() => {
    if (!showForm) {
      setValidation({ order: null, customer: null })
      setFieldErrors({})
      return
    }
    if (!formData.order_id) return
    validateOrder(formData.order_id, formData.customer_id)
  }, [formData.order_id, formData.customer_id, showForm])

  const fetchAutoSuggestion = async () => {
    try {
      const hint = await api.suggestOrderId()?.catch(() => null)
      if (hint?.order_id) {
        setAutoSuggestion(hint.order_id)
        return
      }
      const fallback = await api.validateOrderId('__probe__').catch(() => null)
      if (fallback?.suggested_next) setAutoSuggestion(fallback.suggested_next)
    } catch {}
  }

  const validateOrder = async (orderId, customerId) => {
    if (!orderId) return
    try {
      await api.validateOrderId(orderId, customerId)
      setValidation({ order: { ok: true }, customer: customerId ? { ok: true } : null })
      setFieldErrors((prev) => ({ ...prev, order_id: undefined, customer_id: undefined }))
    } catch (err) {
      const detail = err?.message || 'Validation error'
      if (detail.includes('Order already exists')) {
        setFieldErrors((prev) => ({ ...prev, order_id: lang === 'pl' ? 'Zamówienie już istnieje' : 'Order already exists' }))
        setValidation((prev) => ({ ...prev, order: { ok: false, reason: detail } }))
      } else if (detail.includes('Customer not found')) {
        setFieldErrors((prev) => ({ ...prev, customer_id: lang === 'pl' ? 'Klient nie istnieje' : 'Customer not found' }))
        setValidation((prev) => ({ ...prev, customer: { ok: false, reason: detail } }))
      }
    }
  }

  const loadOrders = async () => {
    try {
      setLoading(true)
      const data = await api.getOrders()
      setOrders(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadCustomers = async () => {
    try {
      const data = await api.getCustomers()
      setCustomers(data || [])
    } catch (err) {
      console.error('Failed to load customers:', err)
    }
  }

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

  if (loading) return <div className="loading">{t.loading}</div>

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h2>{t.title}</h2>
        <div className="header-actions stack-mobile">
          <button className="btn" onClick={handleExport}>{lang==='pl' ? 'Eksport CSV' : 'Export CSV'}</button>
          <button className="btn" onClick={() => { setImporting(true); setImportResult(null); setImportFile(null); }}>
            {lang==='pl' ? 'Import CSV' : 'Import CSV'}
          </button>
          <button className="btn btn-primary" onClick={handleAddClick}>{t.add}</button>
        </div>
      </div>
      {importing && (
        <div className="modal-overlay" onClick={() => setImporting(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{lang==='pl' ? 'Import zamówień' : 'Import orders'}</h3>
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
              <h3>{editingOrder ? t.edit : t.add}</h3>
              <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
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
                <input
                  type="text"
                  name="order_id"
                  value={formData.order_id}
                  onChange={handleInputChange}
                  disabled={!!editingOrder}
                  placeholder={autoSuggestion || 'Auto'}
                />
                {renderHint('order_id')}
                {!editingOrder && autoSuggestion && (
                  <p className="form-hint">{t.autoNext}: {autoSuggestion}</p>
                )}
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
                <th>{t.contact}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.order_id}>
                  <td>{order.order_id}</td>
                  <td>{(() => { const c = customers.find(x => String(x.customer_id)===String(order.customer_id)); return c ? c.name : order.customer_id })()}</td>
                  <td><span className={`status-badge ${order.status.toLowerCase()}`}>
                    {lang==='pl' ? (order.status==='Planned'?'Planowane': order.status==='InProd'?'W produkcji': order.status==='Done'?'Zakończone': order.status) : (order.status==='InProd'?'In Production': order.status==='Done'?'Completed' : order.status)}
                  </span></td>
                  <td>{order.due_date || '-'}</td>
                  <td>{order.contact_person || '-'}</td>
                  <td>
                    <button className="btn-sm btn-edit" onClick={() => handleEditClick(order)}>{t.edit}</button>
                    <button className="btn-sm btn-danger" onClick={() => handleDeleteClick(order.order_id)}>{t.delete}</button>
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

function InlineClientEditor({ lang, customer, onSaved }){
  const toast = useToast()
  const [form, setForm] = React.useState({ name: customer.name||'', address: customer.address||'', email: customer.email||'', contact_person: customer.contact_person||'' })
  const [saving, setSaving] = React.useState(false)
  async function save(){
    setSaving(true)
    try { await api.updateCustomer(customer.customer_id, form); onSaved && onSaved() } catch(e) {
      toast.show((lang==='pl'?'Błąd: ':'Error: ')+e.message, 'error')
    } finally {
      setSaving(false)
    }
  }
  return (
    <div style={{display:'grid', gap:6}}>
      <label>{lang==='pl'?'Nazwa':'Name'}<input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} /></label>
      <label>{lang==='pl'?'Adres':'Address'}<input value={form.address} onChange={e=>setForm({...form, address:e.target.value})} /></label>
      <label>Email<input type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} /></label>
      <label>{lang==='pl'?'Osoba kontaktowa':'Point of contact'}<input value={form.contact_person} onChange={e=>setForm({...form, contact_person:e.target.value})} /></label>
      <div>
        <button type="button" className="btn btn-sm" disabled={saving} onClick={save}>{lang==='pl'?'Zapisz':'Save'}</button>
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { getOrders, getFinance, createOrder, createTimesheet, createInventory, createOrderLine, setApiKey, setAdminKey, getProducts, getCustomers, adminListKeys, adminCreateKey, adminDeleteKey, adminRotateKey } from './services/api'
import AdminPage from './AdminPage'
import OrderLinesEditor from './OrderLinesEditor'
import Autocomplete from './components/Autocomplete'
import { useToast } from './components/Toast'
import { useI18n, translateStatus } from './i18n.jsx'
import StatusBadge from './components/StatusBadge'

function FormField({children}){
  return <div style={{marginBottom:8}}>{children}</div>
}

export default function App(){
  const [orders, setOrders] = useState([])
  const [selected, setSelected] = useState(null)
  const [finance, setFinance] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState(null)

  // API key
  const [apiKeyInput, setApiKeyInput] = useState('')

  // Admin key
  const [adminKeyInput, setAdminKeyInput] = useState('')
  const [apiKeysList, setApiKeysList] = useState([])
  const [newKeyLabel, setNewKeyLabel] = useState('')
  const [lastCreatedKey, setLastCreatedKey] = useState(null)
  const [showAdmin, setShowAdmin] = useState(false)

  // lookups
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])

  // form states
  const [newOrderId, setNewOrderId] = useState('')
  const [newCustomer, setNewCustomer] = useState('')

  const [tsEmp, setTsEmp] = useState('')
  const [tsOrder, setTsOrder] = useState('')
  const [tsHours, setTsHours] = useState('')

  const [invTxn, setInvTxn] = useState('')
  const [invProd, setInvProd] = useState('')
  const [invQty, setInvQty] = useState('')
  const [invReason, setInvReason] = useState('PO')

  // order line form
  const [olOrderId, setOlOrderId] = useState('')
  const [olProduct, setOlProduct] = useState('')
  const [olQty, setOlQty] = useState('')
  const [olPrice, setOlPrice] = useState('')
  const toast = useToast()
  const { t, lang, setLang } = useI18n()

  useEffect(()=>{ loadAll() },[])

  async function loadAll(){
    setLoading(true)
    try{
      const [o, p, c] = await Promise.all([getOrders(), getProducts(), getCustomers()])
      setOrders(o)
      setProducts(p)
      setCustomers(c)
    }catch(e){ setErr(String(e)) }
    setLoading(false)
  }

  async function applyApiKey(){
    setApiKey(apiKeyInput)
    toast.show(t('api_key_set'))
  }

  async function applyAdminKey(){
    setAdminKey(adminKeyInput)
    toast.show(t('admin_key_set'))
    await refreshApiKeys()
  }

  async function refreshApiKeys(){
    try{
      const keys = await adminListKeys()
      setApiKeysList(keys)
    }catch(e){ setErr(String(e)) }
  }

  async function createNewApiKey(e){
    e.preventDefault(); setErr(null); setMsg(null)
    try{
      const row = await adminCreateKey({ label: newKeyLabel })
      setMsg('Created API key')
      setNewKeyLabel('')
      setLastCreatedKey(row.api_key || null)
      await refreshApiKeys()
    }catch(e){ setErr(String(e)) }
  }

  function copyLastKey(){
    if(!lastCreatedKey) return
    navigator.clipboard.writeText(lastCreatedKey)
    setMsg('Copied API key to clipboard')
  }

  async function deleteApiKey(key){
    try{
      await adminDeleteKey(key)
      setMsg('Deleted API key')
      await refreshApiKeys()
    }catch(e){ setErr(String(e)) }
  }

  async function loadOrders(){
    setLoading(true)
    try{
      const data = await getOrders()
      setOrders(data)
    }catch(e){ setErr(String(e)) }
    setLoading(false)
  }

  async function loadFinance(id){
    setSelected(id)
    setFinance(null)
    try{
      const f = await getFinance(id)
      setFinance(f)
    }catch(e){ setErr(String(e)) }
  }

  async function submitOrder(e){
    e.preventDefault(); setMsg(null); setErr(null)
    if(!newOrderId || !newCustomer){ setErr(t('api_key_and_customer_required')); return }
    try{
      await createOrder({ order_id:newOrderId, customer_id:newCustomer })
      toast.show(t('order_created'))
      setNewOrderId(''); setNewCustomer('')
      await loadAll()
    }catch(e){ setErr(String(e)) }
  }

  async function submitTimesheet(e){
    e.preventDefault(); setMsg(null); setErr(null)
    if(!tsEmp || !tsHours){ setErr(t('employee_and_hours_required')); return }
    try{
      await createTimesheet({ emp_id: tsEmp, order_id: tsOrder || null, hours: Number(tsHours) })
      toast.show(t('timesheet_logged'))
      setTsEmp(''); setTsOrder(''); setTsHours('')
      await loadOrders()
    }catch(e){ setErr(String(e)) }
  }

  async function submitInventory(e){
    e.preventDefault(); setMsg(null); setErr(null)
    if(!invTxn || !invProd || !invQty){ setErr(t('txn_product_qty_required')); return }
    try{
      await createInventory({ txn_id: invTxn, product_id: invProd, qty_change: Number(invQty), reason: invReason })
      toast.show(t('inventory_created'))
      setInvTxn(''); setInvProd(''); setInvQty('')
      await loadAll()
    }catch(e){ setErr(String(e)) }
  }

  return (
    <div className="container">
      <div className="app-header">
        <h1>{t('app_title')}</h1>
        <input placeholder={t('write_api_key_placeholder')} value={apiKeyInput} onChange={e=>setApiKeyInput(e.target.value)} />
        <button onClick={applyApiKey}>Set API key</button>
        <button onClick={()=>setShowAdmin(s=>!s)}>{t('toggle_admin')}</button>
        <div className="lang-toggle">
          <span>{t('language')}:</span>
          <button onClick={()=>setLang('pl')} title="Polski" aria-label="Polski">🇵🇱</button>
          <button onClick={()=>setLang('en')} title="English" aria-label="English">🇬🇧</button>
        </div>
      </div>

      {showAdmin ? <AdminPage onClose={()=>setShowAdmin(false)} /> : null}

      {loading && <div className="loading">{t('loading')}</div>}
      {msg && <div style={{color:'green'}}>{msg}</div>}
      {err && <div style={{color:'crimson'}}>{err}</div>}
      <div className="columns">
        <div className="col">
          <h2>{t('orders')}</h2>
          <ul>
            {orders.map(o => (
              <li key={o.order_id}>
                <button onClick={()=>loadFinance(o.order_id)}>
                  <span style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px'}}>
                    <span>{o.order_id}</span>
                    <StatusBadge status={translateStatus(lang, o.status)} />
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <h3>{t('create_order')}</h3>
          <form onSubmit={submitOrder} data-testid="create-order-form">
            <FormField>
              <input placeholder={t('order_id')} value={newOrderId} onChange={e=>setNewOrderId(e.target.value)} data-testid="order-id-input" />
            </FormField>
            <FormField>
              <Autocomplete
                items={customers}
                getLabel={c=> `${c.customer_id} — ${c.name}`}
                inputValue={newCustomer}
                onInputChange={setNewCustomer}
                onSelect={c=> setNewCustomer(c.customer_id)}
                placeholder={t('customer')}
                testId="ac-customer"
              />
            </FormField>
            <button type="submit" data-testid="order-submit" onClick={(e)=>{ if(!confirm(t('create_order_confirm'))) { e.preventDefault(); } }}>{t('create_order')}</button>
          </form>

          <h3>{t('add_order_line')}</h3>
          <OrderLinesEditor products={products} orders={orders} toast={toast} onAdd={async (payload)=>{ try{ await createOrderLine(payload); await loadAll() }catch(e){ setErr(String(e)); toast.show('Order line failed','error') } }} />

          <h3>{t('log_timesheet')}</h3>
          <form onSubmit={submitTimesheet} data-testid="timesheet-form">
            <FormField>
              <input placeholder={t('employee_id')} value={tsEmp} onChange={e=>setTsEmp(e.target.value)} />
            </FormField>
            <FormField>
              <select value={tsOrder} onChange={e=>setTsOrder(e.target.value)}>
                <option value="">-- select order (optional) --</option>
                {orders.map(o=> <option key={o.order_id} value={o.order_id}>{o.order_id}</option>)}
              </select>
            </FormField>
            <FormField>
              <input placeholder={t('hours')} value={tsHours} onChange={e=>setTsHours(e.target.value)} />
            </FormField>
            <button type="submit">{t('add_timesheet')}</button>
          </form>

          <h3>{t('inventory_txn')}</h3>
          <form onSubmit={submitInventory} data-testid="inventory-form">
            <FormField>
              <input placeholder={t('txn_id')} value={invTxn} onChange={e=>setInvTxn(e.target.value)} />
            </FormField>
            <FormField>
              <Autocomplete
                items={products}
                getLabel={p=> `${p.product_id} — ${p.name}`}
                inputValue={invProd}
                onInputChange={setInvProd}
                onSelect={p=> setInvProd(p.product_id)}
                placeholder={t('inventory_product')}
                testId="ac-inv-product"
              />
            </FormField>
            <FormField>
              <input placeholder={t('qty_change')} value={invQty} onChange={e=>setInvQty(e.target.value)} />
            </FormField>
            <FormField>
              <select value={invReason} onChange={e=>setInvReason(e.target.value)}>
                <option>PO</option>
                <option>WO</option>
                <option>Sale</option>
                <option>Adjust</option>
              </select>
            </FormField>
            <button type="submit" onClick={(e)=>{ if(!confirm(t('create_txn'))) { e.preventDefault(); } }}>{t('create_txn')}</button>
          </form>

        </div>
        <div className="col finance-panel">
          {selected && (
            <>
              <h2>{t('finance')}: {selected}</h2>
              <pre>{finance ? JSON.stringify(finance, null, 2) : '—'}</pre>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

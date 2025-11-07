import { useEffect, useState } from 'react'
import { getOrders, getFinance, createOrder, createTimesheet, createInventory, createOrderLine, setApiKey, setAdminKey, getProducts, getCustomers } from './services/api'
import AdminPage from './AdminPage'
import OrderLinesEditor from './OrderLinesEditor'
import Autocomplete from './components/Autocomplete'
import { useToast } from './components/Toast'

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
    toast.show('API key set')
  }

  async function applyAdminKey(){
    setAdminKey(adminKeyInput)
    toast.show('Admin key set')
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
    if(!newOrderId || !newCustomer){ setErr('Order ID and Customer are required'); return }
    try{
      await createOrder({ order_id:newOrderId, customer_id:newCustomer })
      toast.show('Order created')
      setNewOrderId(''); setNewCustomer('')
      await loadAll()
    }catch(e){ setErr(String(e)) }
  }

  async function submitTimesheet(e){
    e.preventDefault(); setMsg(null); setErr(null)
    if(!tsEmp || !tsHours){ setErr('Employee and hours are required'); return }
    try{
      await createTimesheet({ emp_id: tsEmp, order_id: tsOrder || null, hours: Number(tsHours) })
      toast.show('Timesheet logged')
      setTsEmp(''); setTsOrder(''); setTsHours('')
      await loadOrders()
    }catch(e){ setErr(String(e)) }
  }

  async function submitInventory(e){
    e.preventDefault(); setMsg(null); setErr(null)
    if(!invTxn || !invProd || !invQty){ setErr('Txn ID, Product and Qty required'); return }
    try{
      await createInventory({ txn_id: invTxn, product_id: invProd, qty_change: Number(invQty), reason: invReason })
      toast.show('Inventory txn created')
      setInvTxn(''); setInvProd(''); setInvQty('')
      await loadAll()
    }catch(e){ setErr(String(e)) }
  }

  return (
    <div className="container">
      <h1>SMB Tool</h1>

      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12}}>
        <input placeholder="API key (for write ops)" value={apiKeyInput} onChange={e=>setApiKeyInput(e.target.value)} />
        <button onClick={applyApiKey}>Set API key</button>
        <button onClick={()=>setShowAdmin(s=>!s)} style={{marginLeft:8}}>Toggle Admin</button>
      </div>
      {showAdmin ? <AdminPage onClose={()=>setShowAdmin(false)} /> : null}

      {loading && <div>Loading...</div>}
      {msg && <div style={{color:'green'}}>{msg}</div>}
      {err && <div style={{color:'crimson'}}>{err}</div>}
      <div className="columns">
        <div className="col">
          <h2>Orders</h2>
          <ul>
            {orders.map(o => (
              <li key={o.order_id}>
                <button onClick={()=>loadFinance(o.order_id)}>{o.order_id} — {o.status}</button>
              </li>
            ))}
          </ul>

          <h3>Create Order</h3>
          <form onSubmit={submitOrder} data-testid="create-order-form">
            <FormField>
              <input placeholder="Order ID" value={newOrderId} onChange={e=>setNewOrderId(e.target.value)} data-testid="order-id-input" />
            </FormField>
            <FormField>
              <Autocomplete
                items={customers}
                getLabel={c=> `${c.customer_id} — ${c.name}`}
                inputValue={newCustomer}
                onInputChange={setNewCustomer}
                onSelect={c=> setNewCustomer(c.customer_id)}
                placeholder="Customer (type to filter)"
                testId="ac-customer"
              />
            </FormField>
            <button type="submit" data-testid="order-submit" onClick={()=>{ if(!confirm('Create order?')) return }}>Create Order</button>
          </form>

          <h3>Add Order Line</h3>
          <OrderLinesEditor products={products} orders={orders} toast={toast} onAdd={async (payload)=>{ try{ await createOrderLine(payload); await loadAll() }catch(e){ setErr(String(e)); toast.show('Order line failed','error') } }} />

          <h3>Log Timesheet</h3>
          <form onSubmit={submitTimesheet} data-testid="timesheet-form">
            <FormField>
              <input placeholder="Employee ID" value={tsEmp} onChange={e=>setTsEmp(e.target.value)} />
            </FormField>
            <FormField>
              <select value={tsOrder} onChange={e=>setTsOrder(e.target.value)}>
                <option value="">-- select order (optional) --</option>
                {orders.map(o=> <option key={o.order_id} value={o.order_id}>{o.order_id}</option>)}
              </select>
            </FormField>
            <FormField>
              <input placeholder="Hours" value={tsHours} onChange={e=>setTsHours(e.target.value)} />
            </FormField>
            <button type="submit">Add Timesheet</button>
          </form>

          <h3>Inventory Txn</h3>
          <form onSubmit={submitInventory} data-testid="inventory-form">
            <FormField>
              <input placeholder="Txn ID" value={invTxn} onChange={e=>setInvTxn(e.target.value)} />
            </FormField>
            <FormField>
              <select value={invProd} onChange={e=>setInvProd(e.target.value)}>
                <option value="">-- select product --</option>
                {products.map(p=> <option key={p.product_id} value={p.product_id}>{p.product_id} — {p.name}</option>)}
              </select>
            </FormField>
            <FormField>
              <input placeholder="Qty change (e.g. 100 or -50)" value={invQty} onChange={e=>setInvQty(e.target.value)} />
            </FormField>
            <FormField>
              <select value={invReason} onChange={e=>setInvReason(e.target.value)}>
                <option>PO</option>
                <option>WO</option>
                <option>Sale</option>
                <option>Adjust</option>
              </select>
            </FormField>
            <button type="submit">Create Txn</button>
          </form>

        </div>
        <div className="col">
          {selected && (
            <>
              <h2>Finance: {selected}</h2>
              <pre>{finance ? JSON.stringify(finance, null, 2) : '—'}</pre>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

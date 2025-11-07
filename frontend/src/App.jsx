import { useEffect, useState } from 'react'
import { getOrders, getFinance, createOrder, createTimesheet, createInventory, createOrderLine, setApiKey, setAdminKey, getProducts, getCustomers, adminListKeys, adminCreateKey, adminDeleteKey } from './services/api'

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
    setMsg('API key set (in-memory)')
  }

  async function applyAdminKey(){
    setAdminKey(adminKeyInput)
    setMsg('Admin key set (in-memory)')
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
      setMsg('Order created')
      setNewOrderId(''); setNewCustomer('')
      await loadAll()
    }catch(e){ setErr(String(e)) }
  }

  async function submitOrderLine(e){
    e.preventDefault(); setMsg(null); setErr(null)
    if(!olOrderId || !olProduct || !olQty){ setErr('Order ID, product and qty required'); return }
    try{
      await createOrderLine({ order_id: olOrderId, line_no: 1, product_id: olProduct, qty: Number(olQty), unit_price: olPrice ? Number(olPrice) : 0 })
      setMsg('Order line created')
      setOlOrderId(''); setOlProduct(''); setOlQty(''); setOlPrice('')
      await loadAll()
    }catch(e){ setErr(String(e)) }
  }

  async function submitTimesheet(e){
    e.preventDefault(); setMsg(null); setErr(null)
    if(!tsEmp || !tsHours){ setErr('Employee and hours are required'); return }
    try{
      await createTimesheet({ emp_id: tsEmp, order_id: tsOrder || null, hours: Number(tsHours) })
      setMsg('Timesheet logged')
      setTsEmp(''); setTsOrder(''); setTsHours('')
      await loadOrders()
    }catch(e){ setErr(String(e)) }
  }

  async function submitInventory(e){
    e.preventDefault(); setMsg(null); setErr(null)
    if(!invTxn || !invProd || !invQty){ setErr('Txn ID, Product and Qty required'); return }
    try{
      await createInventory({ txn_id: invTxn, product_id: invProd, qty_change: Number(invQty), reason: invReason })
      setMsg('Inventory transaction created')
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
      </div>

      <div style={{border:'1px solid #ddd',padding:8,borderRadius:6,marginBottom:12}}>
        <h3>Admin</h3>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input placeholder="Admin key" value={adminKeyInput} onChange={e=>setAdminKeyInput(e.target.value)} />
          <button onClick={applyAdminKey}>Set Admin key</button>
          <button onClick={refreshApiKeys}>Refresh keys</button>
        </div>
        <div style={{marginTop:8}}>
          <form onSubmit={createNewApiKey}>
            <input placeholder="New key label" value={newKeyLabel} onChange={e=>setNewKeyLabel(e.target.value)} />
            <button type="submit">Create API Key</button>
          </form>
          {lastCreatedKey && (
            <div style={{marginTop:8, padding:8, border:'1px dashed #666'}}>
              <strong>New API Key (save it now, shown once):</strong>
              <div style={{marginTop:6}}><code>{lastCreatedKey}</code></div>
              <div style={{marginTop:6}}><button onClick={copyLastKey}>Copy</button></div>
            </div>
          )}
          <div style={{marginTop:8}}>
            <strong>Existing keys</strong>
            <ul>
              {apiKeysList.map(k=> (
                <li key={k.id}>ID {k.id} — {k.label} — {k.active ? 'active' : 'inactive'}
                  {k.key_text ? (<span> — legacy: ****{String(k.key_text).slice(-4)}</span>) : null}
                  <button onClick={()=>deleteApiKey(k.id)} style={{marginLeft:8}}>Delete</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

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
          <form onSubmit={submitOrder}>
            <FormField>
              <input placeholder="Order ID" value={newOrderId} onChange={e=>setNewOrderId(e.target.value)} />
            </FormField>
            <FormField>
              <select value={newCustomer} onChange={e=>setNewCustomer(e.target.value)}>
                <option value="">-- select customer --</option>
                {customers.map(c=> <option key={c.customer_id} value={c.customer_id}>{c.customer_id} — {c.name}</option>)}
              </select>
            </FormField>
            <button type="submit">Create Order</button>
          </form>

          <h3>Add Order Line</h3>
          <form onSubmit={submitOrderLine}>
            <FormField>
              <select value={olOrderId} onChange={e=>setOlOrderId(e.target.value)}>
                <option value="">-- select order --</option>
                {orders.map(o=> <option key={o.order_id} value={o.order_id}>{o.order_id}</option>)}
              </select>
            </FormField>
            <FormField>
              <select value={olProduct} onChange={e=>setOlProduct(e.target.value)}>
                <option value="">-- select product --</option>
                {products.map(p=> <option key={p.product_id} value={p.product_id}>{p.product_id} — {p.name}</option>)}
              </select>
            </FormField>
            <FormField>
              <input placeholder="Qty" value={olQty} onChange={e=>setOlQty(e.target.value)} />
            </FormField>
            <FormField>
              <input placeholder="Unit price (optional)" value={olPrice} onChange={e=>setOlPrice(e.target.value)} />
            </FormField>
            <button type="submit">Add Line</button>
          </form>

          <h3>Log Timesheet</h3>
          <form onSubmit={submitTimesheet}>
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
          <form onSubmit={submitInventory}>
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

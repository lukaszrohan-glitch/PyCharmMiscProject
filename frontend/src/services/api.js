const rawBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
// normalize: remove trailing slashes
let API_BASE = rawBase.replace(/\/+$/, '')
// ensure ends with /api
if (!API_BASE.endsWith('/api')) API_BASE = API_BASE + '/api'

let API_KEY = import.meta.env.VITE_API_KEY || null
let ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || null

export function setApiKey(key){
  API_KEY = key
}
export function setAdminKey(key){
  ADMIN_KEY = key
}

async function req(path){
  const res = await fetch(`${API_BASE}${path}`)
  if(!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

async function reqAdmin(path){
  const headers = {}
  if(ADMIN_KEY) headers['x-admin-key'] = ADMIN_KEY
  const res = await fetch(`${API_BASE}${path}`, { headers })
  if(!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

async function postJson(path, body){
  const headers = { 'Content-Type': 'application/json' }
  if(API_KEY) headers['x-api-key'] = API_KEY
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })
  const txt = await res.text()
  if(!res.ok){
    let msg = txt
    try{ msg = JSON.parse(txt) }catch{}
    throw new Error((msg && msg.detail) ? msg.detail : `${res.status} ${res.statusText} - ${txt}`)
  }
  try{ return JSON.parse(txt) }catch{ return txt }
}

async function postAdmin(path, body){
  const headers = { 'Content-Type': 'application/json' }
  if(ADMIN_KEY) headers['x-admin-key'] = ADMIN_KEY
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })
  const txt = await res.text()
  if(!res.ok){
    let msg = txt
    try{ msg = JSON.parse(txt) }catch{}
    throw new Error((msg && msg.detail) ? msg.detail : `${res.status} ${res.statusText} - ${txt}`)
  }
  try{ return JSON.parse(txt) }catch{ return txt }
}

async function delAdmin(path){
  const headers = {}
  if(ADMIN_KEY) headers['x-admin-key'] = ADMIN_KEY
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE', headers })
  const txt = await res.text()
  if(!res.ok){
    let msg = txt
    try{ msg = JSON.parse(txt) }catch{}
    throw new Error((msg && msg.detail) ? msg.detail : `${res.status} ${res.statusText} - ${txt}`)
  }
  try{ return JSON.parse(txt) }catch{ return txt }
}

export const getOrders = ()=> req('/orders')
export const getFinance = (orderId)=> req(`/finance/${encodeURIComponent(orderId)}`)
export const getShortages = ()=> req('/shortages')
export const getPlannedTime = (orderId)=> req(`/planned-time/${encodeURIComponent(orderId)}`)
export const getProducts = ()=> req('/products')
export const getCustomers = ()=> req('/customers')

export const createOrder = (payload) => postJson('/orders', payload)
export const createOrderLine = (payload) => postJson('/order-lines', payload)
export const createTimesheet = (payload) => postJson('/timesheets', payload)
export const createInventory = (payload) => postJson('/inventory', payload)

// Admin API: list/create/delete api keys
export const adminListKeys = () => reqAdmin('/admin/api-keys')
export const adminCreateKey = (payload) => postAdmin('/admin/api-keys', payload)
export const adminDeleteKey = (key) => delAdmin(`/admin/api-keys/${encodeURIComponent(key)}`)

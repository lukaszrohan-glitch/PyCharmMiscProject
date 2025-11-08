// Dynamic API base URL detection
// If VITE_API_BASE is set, use it. Otherwise, detect based on current location
function getApiBase() {
  const envBase = import.meta.env.VITE_API_BASE

  if (envBase) {
    // Environment variable is set, use it
    let base = envBase.replace(/\/+$/, '')
    if (!base.endsWith('/api')) base = base + '/api'
    return base
  }

  // Auto-detect based on window.location
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const protocol = window.location.protocol
    const port = window.location.port

    // If we're on localhost:5173 (dev), use localhost:8000
    if (hostname === 'localhost' && port === '5173') {
      return `${protocol}//localhost:8000`
    }

    // For production/tunnel access, use /api on same host (nginx proxies to backend)
    return `${protocol}//${window.location.host}/api`
  }

  // Fallback for SSR or build time
  return '/api'
}

const API_BASE = getApiBase()
console.log('API Base URL:', API_BASE)

let API_KEY = import.meta.env.VITE_API_KEY || null
let ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || null
let TOKEN = null

export function setApiKey(key){
  API_KEY = key
}
export function setAdminKey(key){
  ADMIN_KEY = key
}
export function setToken(t){ TOKEN = t }

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

async function reqAuth(path){
  const headers = {}
  if(TOKEN) headers['Authorization'] = 'Bearer ' + TOKEN
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

async function postAuth(path, body){
  const headers = { 'Content-Type': 'application/json' }
  if(TOKEN) headers['Authorization'] = 'Bearer ' + TOKEN
  const res = await fetch(`${API_BASE}${path}`, { method:'POST', headers, body: JSON.stringify(body) })
  const txt = await res.text()
  if(!res.ok) throw new Error(txt)
  try{return JSON.parse(txt)}catch{return txt}
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

export async function login(email, password){
  const url = `${API_BASE}/api/auth/login`
  console.log('Login API call to:', url)
  const headers = { 'Content-Type': 'application/json' }
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password })
  })
  const txt = await res.text()
  console.log('Login response status:', res.status, 'body:', txt)
  if(!res.ok){
    let msg = txt
    try{ msg = JSON.parse(txt) }catch{}
    throw new Error((msg && msg.detail) ? msg.detail : `${res.status} ${res.statusText} - ${txt}`)
  }
  try{ return JSON.parse(txt) }catch{ return txt }
}
export const getProfile = () => reqAuth('/api/user/profile')
export const changePassword = (old_password, new_password) => postAuth('/api/auth/change-password', { old_password, new_password })
export const adminCreateUser = (payload) => postAuth('/api/admin/users', payload)
export const adminListUsers = () => reqAuth('/api/admin/users')
export const adminCreatePlan = (payload) => postAuth('/api/admin/subscription-plans', payload)
export const adminListPlans = () => reqAuth('/api/admin/subscription-plans')
export const getOrders = ()=> req('/api/orders')
export const getFinance = (orderId)=> req(`/api/finance/${encodeURIComponent(orderId)}`)
export const getShortages = ()=> req('/api/shortages')
export const getPlannedTime = (orderId)=> req(`/api/planned-time/${encodeURIComponent(orderId)}`)
export const getProducts = ()=> req('/api/products')
export const getCustomers = ()=> req('/api/customers')

export const createOrder = (payload) => postJson('/api/orders', payload)
export const createOrderLine = (payload) => postJson('/api/order-lines', payload)
export const createTimesheet = (payload) => postJson('/api/timesheets', payload)
export const createInventory = (payload) => postJson('/api/inventory', payload)

// Admin API: list/create/delete api keys
export const adminListKeys = () => reqAdmin('/api/admin/api-keys')
export const adminCreateKey = (payload) => postAdmin('/api/admin/api-keys', payload)
export const adminDeleteKey = (key) => delAdmin(`/api/admin/api-keys/${encodeURIComponent(key)}`)
export const adminRotateKey = (keyId) => postAdmin(`/api/admin/api-keys/${encodeURIComponent(keyId)}/rotate`, {})

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
      return `${protocol}//localhost:8000/api`
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
  return postAuth('/auth/login', { email, password })
}
export const getProfile = () => reqAuth('/user/profile')
export const changePassword = (old_password, new_password) => postAuth('/auth/change-password', { old_password, new_password })
export const adminCreateUser = (payload) => postAuth('/admin/users', payload)
export const adminListUsers = () => reqAuth('/admin/users')
export const adminCreatePlan = (payload) => postAuth('/admin/subscription-plans', payload)
export const adminListPlans = () => reqAuth('/admin/subscription-plans')
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
export const adminRotateKey = (keyId) => postAdmin(`/admin/api-keys/${encodeURIComponent(keyId)}/rotate`, {})

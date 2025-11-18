// Dynamic API base URL detection with env override
// Prefer VITE_API_BASE_URL, then VITE_API_BASE, then detect from window, else fallback
function resolveApiBase() {
  const pick = (val) => (val ? String(val).trim().replace(/\/+$/, '') : null)
  const envBaseUrl = pick(import.meta.env.VITE_API_BASE_URL)
  const envBase = pick(import.meta.env.VITE_API_BASE)
  if (envBaseUrl || envBase) return envBaseUrl || envBase

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const protocol = window.location.protocol
    const port = window.location.port
    if (hostname === 'localhost' && port === '5173') {
      return `${protocol}//localhost:8000`
    }
    return `${protocol}//${window.location.host}`
  }
  return 'http://localhost:8000'
}

const API_BASE = resolveApiBase()
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
export function setToken(t){
  TOKEN = t
  try {
    if (t) {
      // Store under both keys for compatibility
      localStorage.setItem('authToken', t)
      localStorage.setItem('token', t)
    } else {
      localStorage.removeItem('authToken')
      localStorage.removeItem('token')
    }
  } catch {}
}
export function getToken(){
  if (TOKEN) return TOKEN
  try {
    const t = localStorage.getItem('authToken') || localStorage.getItem('token')
    if (t) TOKEN = t
  } catch {}
  return TOKEN
}

// Unified request helper: adds Authorization; sets Content-Type for JSON bodies; supports parse: 'json'|'text'|'blob'
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const method = String(options.method || 'GET').toUpperCase()
  const parse = options.parse || 'json'

  const headers = { ...(options.headers || {}) }
  const body = options.body
  const isFormData = (typeof FormData !== 'undefined') && body instanceof FormData
  if (!isFormData && method !== 'GET' && method !== 'HEAD' && !('Content-Type' in headers)) {
    headers['Content-Type'] = 'application/json'
  }
  const tok = getToken()
  if (tok && !('Authorization' in headers)) headers['Authorization'] = `Bearer ${tok}`
  const config = { ...options, method, headers }

  const response = await fetch(url, config)
  if (!response.ok) {
    const errorData = await response.json().catch(async () => ({ message: await response.text().catch(()=>'An unknown error occurred') }))
    throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`)
  }
  if (response.status === 204) return null
  if (parse === 'blob') return response.blob()
  if (parse === 'text') return response.text()
  return response.json()
}

async function req(path){
  return request(path, { method: 'GET' })
}

async function reqAdmin(path){
  const headers = {}
  if (ADMIN_KEY) headers['x-admin-key'] = ADMIN_KEY
  return request(path, { method: 'GET', headers })
}

async function reqAuth(path){
  return request(path, { method: 'GET' })
}

async function postJson(path, body){
  const headers = { 'Content-Type': 'application/json' }
  if(API_KEY) headers['x-api-key'] = API_KEY
  return request(path, { method: 'POST', headers, body: JSON.stringify(body) })
}

async function postAdmin(path, body){
  const headers = { 'Content-Type': 'application/json' }
  if (ADMIN_KEY) headers['x-admin-key'] = ADMIN_KEY
  return request(path, { method: 'POST', headers, body: JSON.stringify(body) })
}

async function postAuth(path, body){
  return request(path, { method: 'POST', body: JSON.stringify(body) })
}

async function delAdmin(path){
  const headers = {}
  if (ADMIN_KEY) headers['x-admin-key'] = ADMIN_KEY
  return request(path, { method: 'DELETE', headers })
}

export async function login(email, password){
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}
export async function getProfile() {
  try {
    return await request('/api/users/me', { method: 'GET' })
  } catch (_) {
    return request('/api/user/profile', { method: 'GET' })
  }
}
export const changePassword = (old_password, new_password) => postAuth('/api/auth/change-password', { old_password, new_password })
export const adminCreateUser = (payload) => postAdmin('/api/admin/users', payload)
export const adminListUsers = () => reqAdmin('/api/admin/users')
export const adminCreatePlan = (payload) => postAdmin('/api/admin/subscription-plans', payload)
export const adminListPlans = () => reqAdmin('/api/admin/subscription-plans')
// Admin audit (JWT)
export const adminListAdminAudit = (limit = 100) => reqAuth(`/api/admin/audit?limit=${encodeURIComponent(limit)}`)
export const getOrders = ()=> req('/api/orders')
export const getFinance = (orderId)=> req(`/api/finance/${encodeURIComponent(orderId)}`)
export const getShortages = ()=> req('/api/shortages')
export const getPlannedTime = (orderId)=> req(`/api/planned-time/${encodeURIComponent(orderId)}`)
export const getProducts = ()=> req('/api/products')
export const getCustomers = ()=> req('/api/customers')

export const createProduct = (payload) => postJson('/api/products', payload)
export const updateProduct = (productId, payload) => {
  const headers = { 'Content-Type': 'application/json' }
  if(API_KEY) headers['x-api-key'] = API_KEY
  return request(`/api/products/${encodeURIComponent(productId)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload)
  })
}
export const deleteProduct = (productId) => {
  const headers = {}
  if(API_KEY) headers['x-api-key'] = API_KEY
  return request(`/api/products/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
    headers
  })
}

export const createOrder = (payload) => postJson('/api/orders', payload)
export const updateOrder = (orderId, payload) => {
  const headers = { 'Content-Type': 'application/json' }
  if(API_KEY) headers['x-api-key'] = API_KEY
  return request(`/api/orders/${encodeURIComponent(orderId)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload)
  })
}
export const deleteOrder = (orderId) => {
  const headers = {}
  if(API_KEY) headers['x-api-key'] = API_KEY
  return request(`/api/orders/${encodeURIComponent(orderId)}`, {
    method: 'DELETE',
    headers
  })
}
export const createOrderLine = (payload) => postJson('/api/order-lines', payload)
export const createTimesheet = (payload) => postJson('/api/timesheets', payload)
export const createInventory = (payload) => postJson('/api/inventory', payload)
export const createCustomer = (payload) => postJson('/api/customers', payload)
export const createEmployee = (payload) => postJson('/api/employees', payload)

export const getTimesheets = () => req('/api/timesheets')
export const getTimesheetsFiltered = ({ fromDate, toDate, empId, approved } = {}) => {
  const params = []
  if (fromDate) params.push(`from=${encodeURIComponent(fromDate)}`)
  if (toDate) params.push(`to=${encodeURIComponent(toDate)}`)
  if (empId) params.push(`emp_id=${encodeURIComponent(empId)}`)
  if (approved !== undefined && approved !== null) params.push(`approved=${approved ? 'true' : 'false'}`)
  const qs = params.length ? `?${params.join('&')}` : ''
  return req(`/api/timesheets${qs}`)
}
export const getPendingTimesheets = ({ fromDate, toDate, empId } = {}) => {
  const params = []
  if (fromDate) params.push(`from=${encodeURIComponent(fromDate)}`)
  if (toDate) params.push(`to=${encodeURIComponent(toDate)}`)
  if (empId) params.push(`emp_id=${encodeURIComponent(empId)}`)
  const qs = params.length ? `?${params.join('&')}` : ''
  return reqAuth(`/api/timesheets/pending${qs}`)
}
export const getTimesheetWeeklySummary = ({ fromDate, toDate, empId, approved } = {}) => {
  const params = []
  if (fromDate) params.push(`from=${encodeURIComponent(fromDate)}`)
  if (toDate) params.push(`to=${encodeURIComponent(toDate)}`)
  if (empId) params.push(`emp_id=${encodeURIComponent(empId)}`)
  if (approved !== undefined && approved !== null) params.push(`approved=${approved ? 'true' : 'false'}`)
  const qs = params.length ? `?${params.join('&')}` : ''
  return req(`/api/timesheets/weekly-summary${qs}`)
}
export const getTimesheetSummary = ({ fromDate, toDate, empId, approved } = {}) => {
  const params = []
  if (fromDate) params.push(`from=${encodeURIComponent(fromDate)}`)
  if (toDate) params.push(`to=${encodeURIComponent(toDate)}`)
  if (empId) params.push(`emp_id=${encodeURIComponent(empId)}`)
  if (approved !== undefined && approved !== null) params.push(`approved=${approved ? 'true' : 'false'}`)
  const qs = params.length ? `?${params.join('&')}` : ''
  return req(`/api/timesheets/summary${qs}`)
}
export const getInventory = () => req('/api/inventory')
export const getEmployees = () => req('/api/employees')

export const updateCustomer = (customerId, payload) => {
  const headers = { 'Content-Type': 'application/json' }
  if(API_KEY) headers['x-api-key'] = API_KEY
  return request(`/api/customers/${encodeURIComponent(customerId)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload)
  })
}
export const deleteCustomer = (customerId) => {
  const headers = {}
  if(API_KEY) headers['x-api-key'] = API_KEY
  return request(`/api/customers/${encodeURIComponent(customerId)}`, {
    method: 'DELETE',
    headers
  })
}

export const updateEmployee = (empId, payload) => {
  const headers = { 'Content-Type': 'application/json' }
  if(API_KEY) headers['x-api-key'] = API_KEY
  return request(`/api/employees/${encodeURIComponent(empId)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload)
  })
}
export const deleteEmployee = (empId) => {
  const headers = {}
  if(API_KEY) headers['x-api-key'] = API_KEY
  return request(`/api/employees/${encodeURIComponent(empId)}`, {
    method: 'DELETE',
    headers
  })
}

export const updateTimesheet = (tsId, payload) => {
  const headers = { 'Content-Type': 'application/json' }
  if (API_KEY) headers['x-api-key'] = API_KEY
  return request(`/api/timesheets/${encodeURIComponent(tsId)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload)
  })
}
export const deleteTimesheet = (tsId) => {
  const headers = {}
  if (API_KEY) headers['x-api-key'] = API_KEY
  return request(`/api/timesheets/${encodeURIComponent(tsId)}`, {
    method: 'DELETE',
    headers
  })
}

export const approveTimesheet = (tsId) => postAuth(`/api/timesheets/${encodeURIComponent(tsId)}/approve`, {})
export const unapproveTimesheet = (tsId) => postAuth(`/api/timesheets/${encodeURIComponent(tsId)}/unapprove`, {})

export const exportTimesheetsCSV = async ({ fromDate, toDate, empId, pending } = {}) => {
  const params = []
  if (fromDate) params.push(`from=${encodeURIComponent(fromDate)}`)
  if (toDate) params.push(`to=${encodeURIComponent(toDate)}`)
  if (empId) params.push(`emp_id=${encodeURIComponent(empId)}`)
  if (pending) params.push('pending=true')
  const qs = params.length ? `?${params.join('&')}` : ''
  return request(`/api/timesheets/export.csv${qs}`, { method: 'GET', parse: 'blob' })
}

export const exportTimesheetsSummaryCSV = async ({ fromDate, toDate, empId } = {}) => {
  const params = []
  if (fromDate) params.push(`from=${encodeURIComponent(fromDate)}`)
  if (toDate) params.push(`to=${encodeURIComponent(toDate)}`)
  if (empId) params.push(`emp_id=${encodeURIComponent(empId)}`)
  const qs = params.length ? `?${params.join('&')}` : ''
  return request(`/api/timesheets/export-summary.csv${qs}`, { method: 'GET', parse: 'blob' })
}

export const updateInventory = (txnId, payload) => {
  const headers = { 'Content-Type': 'application/json' }
  if (API_KEY) headers['x-api-key'] = API_KEY
  return request(`/api/inventory/${encodeURIComponent(txnId)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload)
  })
}
export const deleteInventory = (txnId) => {
  const headers = {}
  if (API_KEY) headers['x-api-key'] = API_KEY
  return request(`/api/inventory/${encodeURIComponent(txnId)}`, {
    method: 'DELETE',
    headers
  })
}

// Admin API: list/create/delete api keys
export const adminListKeys = () => reqAdmin('/api/admin/api-keys')
export const adminCreateKey = (payload) => postAdmin('/api/admin/api-keys', payload)
export const adminDeleteKey = (key) => delAdmin(`/api/admin/api-keys/${encodeURIComponent(key)}`)
export const adminRotateKey = (keyId) => postAdmin(`/api/admin/api-keys/${encodeURIComponent(keyId)}/rotate`, {})

// Password reset and user invitation
export const requestPasswordReset = (email) => postAuth('/api/auth/request-reset', { email })
export const resetPasswordWithToken = (token, new_password) => postAuth('/api/auth/reset', { token, new_password })
export const inviteUserAdmin = (payload) => postAuth('/api/admin/users', payload)

// Admin import: CSV upload via multipart/form-data (JWT required)
export const adminImportCSV = async (entityType, file) => {
  const fd = new FormData()
  fd.append('entity_type', entityType)
  fd.append('file', file)
  return request('/api/import/csv', { method: 'POST', body: fd })
}

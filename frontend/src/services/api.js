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

function handleAuthFailure(status) {
  if (status !== 401 && status !== 403) return
  try {
    setToken(null)
  } catch {
    /* no-op */
  }
  try {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:expired', { detail: { status } }))
    if (!window.location.pathname.includes('login')) {
      window.location.href = '/'
    }
  }
}

let API_KEY = import.meta.env.VITE_API_KEY || null
let ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || null
let TOKEN = null

export function setApiKey(key){
  API_KEY = key
}
export function setAdminKey(key){
  ADMIN_KEY = key
}
// persist: 'session' | 'local' | undefined (default 'session')
export function setToken(t, persist){
  TOKEN = t
  const mode = persist === 'local' ? 'local' : 'session'
  try {
    const stor = mode === 'local' ? localStorage : sessionStorage
    const other = mode === 'local' ? sessionStorage : localStorage
    if (t) {
      stor.setItem('authToken', t)
      stor.setItem('token', t)
      // Clear from the other storage to avoid accidental auto-login
      other.removeItem('authToken'); other.removeItem('token')
    } else {
      stor.removeItem('authToken'); stor.removeItem('token')
      other.removeItem('authToken'); other.removeItem('token')
    }
  } catch (err) {
    if (import.meta.env?.MODE === 'development') {
      console.warn('Auth token storage unavailable', err)
    }
  }
}
export function getToken(){
  if (TOKEN) return TOKEN
  try {
    // Prefer sessionStorage so we don't auto-login across new sessions
    const t = sessionStorage.getItem('authToken') || sessionStorage.getItem('token') ||
              localStorage.getItem('authToken') || localStorage.getItem('token')
    if (t) TOKEN = t
  } catch (err) {
    if (import.meta.env?.MODE === 'development') {
      console.warn('Auth token retrieval failed', err)
    }
  }
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
  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  if (!response.ok) {
    handleAuthFailure(response.status)
    if (isJson) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`)
    }
    const bodyText = await response.text().catch(() => '')
    const snippet = bodyText.slice(0, 140).replace(/\s+/g, ' ').trim()
    throw new Error(`API ${method} ${endpoint} failed (${response.status}). Unexpected response type${snippet ? `: ${snippet}` : ''}`)
  }
  if (response.status === 204) return null
  if (parse === 'blob') return response.blob()
  if (parse === 'text') return response.text()
  if (!isJson && parse === 'json') {
    const bodyText = await response.text().catch(() => '')
    const snippet = bodyText.slice(0, 140).replace(/\s+/g, ' ').trim()
    throw new Error(`API ${method} ${endpoint} responded with non-JSON payload${snippet ? `: ${snippet}` : ''}`)
  }
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
  } catch (err) {
    console.warn('Primary profile endpoint failed', err)
    try {
      return await request('/api/user/profile', { method: 'GET' })
    } catch (fallbackErr) {
      console.warn('Fallback profile endpoint failed', fallbackErr)
      return null
    }
  }
}
export const changePassword = (old_password, new_password) => postAuth('/api/auth/change-password', { old_password, new_password })
export const adminCreateUser = (payload) => {
  // Use JWT if available (for logged-in admins), otherwise use admin key
  const tok = getToken()
  if (tok) {
    return postAuth('/api/admin/users', payload)
  }
  return postAdmin('/api/admin/users', payload)
}
export const adminListUsers = () => {
  // Use JWT if available (for logged-in admins), otherwise use admin key
  const tok = getToken()
  if (tok) {
    return reqAuth('/api/admin/users')
  }
  return reqAdmin('/api/admin/users')
}
export const adminCreatePlan = (payload) => {
  const tok = getToken()
  if (tok) {
    return postAuth('/api/admin/subscription-plans', payload)
  }
  return postAdmin('/api/admin/subscription-plans', payload)
}
export const adminListPlans = () => {
  const tok = getToken()
  if (tok) {
    return reqAuth('/api/admin/subscription-plans')
  }
  return reqAdmin('/api/admin/subscription-plans')
}
// Admin audit (JWT)
export const adminListAdminAudit = (limit = 100) => reqAuth(`/api/admin/audit?limit=${encodeURIComponent(limit)}`)
export const getOrders = (params = {}) => {
  const query = []
  if (params.fromDate) query.push(`from=${encodeURIComponent(params.fromDate)}`)
  if (params.toDate) query.push(`to=${encodeURIComponent(params.toDate)}`)
  const qs = query.length ? `?${query.join('&')}` : ''
  return req(`/api/orders${qs}`)
}
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
export const updateOrderSchedule = (orderId, payload) => request(`/api/orders/${encodeURIComponent(orderId)}/schedule`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
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

export const exportOrdersCSV = () => request('/api/orders/export', { method: 'GET', parse: 'blob' })
export const exportInventoryCSV = () => request('/api/inventory/export', { method: 'GET', parse: 'blob' })

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

export const importOrdersCSV = async (file) => {
  const fd = new FormData()
  fd.append('file', file)
  return request('/api/orders/import', { method: 'POST', body: fd })
}

export const importInventoryCSV = async (file) => {
  const fd = new FormData()
  fd.append('file', file)
  return request('/api/inventory/import', { method: 'POST', body: fd })
}

export async function getAnalyticsSummary(params = {}) {
  const usp = new URLSearchParams(params)
  return request(`/api/analytics/summary?${usp.toString()}`)
}

export async function getRevenueByMonth() {
  return request('/api/analytics/revenue-by-month')
}

export async function getTopCustomers(params = {}) {
  const usp = new URLSearchParams(params)
  return request(`/api/analytics/top-customers?${usp.toString()}`)
}

export async function getTopOrders(params = {}) {
  const usp = new URLSearchParams(params)
  return request(`/api/analytics/top-orders?${usp.toString()}`)
}

export const validateOrderId = (orderId, customerId) => {
  const params = new URLSearchParams({ order_id: orderId })
  if (customerId) params.append('customer_id', customerId)
  return request(`/api/orders/validate?${params.toString()}`)
}

export const suggestOrderId = async () => {
  return request('/api/orders/next-id')
}
// Demand scenarios & forecast
export const getDemandScenarios = async () => {
  try {
    return await req('/api/analytics/demand/scenarios')
  } catch (err) {
    console.warn('Demand scenarios API unavailable, falling back to local', err)
    return []
  }
}

export const createDemandScenario = (payload) => postAuth('/api/analytics/demand/scenarios', payload)

export const updateDemandScenario = (id, payload) => request(`/api/analytics/demand/scenarios/${encodeURIComponent(id)}`, {
  method: 'PUT',
  body: JSON.stringify(payload),
  headers: { 'Content-Type': 'application/json' }
})

export const deleteDemandScenario = (id) => request(`/api/analytics/demand/scenarios/${encodeURIComponent(id)}`, { method: 'DELETE' })

export const runDemandForecast = async (payload) => {
  try {
    return await postAuth('/api/analytics/demand', payload)
  } catch (err) {
    console.warn('Demand forecast API failed, synthesizing local result', err)
    const multiplier = payload.multiplier || 1
    const backlog = payload.backlogWeeks || 4
    return {
      scenario: { name: 'Offline', multiplier, backlogWeeks: backlog },
      revenue: 0,
      capacity_usage: multiplier * 50,
      metrics: [0, 0, 0]
    }
  }
}

export const adminDeleteUser = (userId) => {
  const headers = {}
  const tok = getToken()
  if (tok) {
    headers['Authorization'] = `Bearer ${tok}`
  } else if (ADMIN_KEY) {
    headers['x-admin-key'] = ADMIN_KEY
  }
  return request(`/api/admin/users/${encodeURIComponent(userId)}`, { method: 'DELETE', headers })
}

export const adminUpdateUser = (userId, payload) => {
  const headers = { 'Content-Type': 'application/json' }
  const tok = getToken()
  if (tok) {
    headers['Authorization'] = `Bearer ${tok}`
  } else if (ADMIN_KEY) {
    headers['x-admin-key'] = ADMIN_KEY
  }
  return request(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload)
  })
}

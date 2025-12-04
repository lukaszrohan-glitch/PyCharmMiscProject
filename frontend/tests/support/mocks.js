const mockScenarios = [
  {
    id: 'baseline',
    name: 'Bazowy',
    multiplier: 1,
    backlogWeeks: 4
  }
]

const mockForecast = {
  scenario: mockScenarios[0],
  revenue: 1200000,
  capacity_usage: 82,
  metrics: [12, 430, 460]
}

const mockOrders = [
  {
    order_id: 'ORD-1001',
    product_name: 'Wózek A',
    start_date: new Date().toISOString(),
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'InProd',
    work_center: 'Linia 1'
  },
  {
    order_id: 'ORD-1002',
    product_name: 'Wózek B',
    start_date: new Date().toISOString(),
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Planned',
    work_center: 'Linia 2'
  }
]

const mockUser = {
  email: 'qa@synterra.app',
  is_admin: true,
  name: 'QA Admin'
}

 async function intercept(page, route, handler) {
   await page.route(route, async (routeObj) => {
    const request = routeObj.request()
    const body = request.postDataJSON?.() || null
    const response = await handler({ request, body })
    routeObj.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response)
    })
  })
}

export function resetMocks() {
  mockScenarios.splice(1)
  mockOrders.splice(2)
}

export async function setupWorker(page) {
  await intercept(page, '**/api/auth/login', async () => ({ access_token: 'e2e-demo-token', user: mockUser }))
  await intercept(page, '**/api/users/me', async () => mockUser)

  await intercept(page, '**/api/analytics/demand/scenarios', async ({ request, body }) => {
    if (request.method() === 'GET') {
      return mockScenarios
    }
    if (request.method() === 'POST') {
      const created = { id: `scenario-${mockScenarios.length + 1}`, ...body }
      mockScenarios.push(created)
      return created
    }
    if (request.method() === 'PUT') {
      const id = request.url().split('/').pop()
      const idx = mockScenarios.findIndex((s) => s.id === id)
      if (idx >= 0) mockScenarios[idx] = { ...mockScenarios[idx], ...body }
      return mockScenarios[idx]
    }
    if (request.method() === 'DELETE') {
      const id = request.url().split('/').pop()
      const idx = mockScenarios.findIndex((s) => s.id === id)
      if (idx >= 0) mockScenarios.splice(idx, 1)
      return { success: true }
    }
    return mockScenarios
  })

  await intercept(page, '**/api/analytics/demand', async ({ body }) => {
    return { ...mockForecast, scenario: { ...mockForecast.scenario, ...body } }
  })

  await intercept(page, '**/api/orders**', async ({ request }) => {
    if (request.method() === 'GET') {
      return mockOrders
    }
    if (request.method() === 'PATCH') {
      const id = request.url().split('/').pop()
      const payload = request.postDataJSON?.() || {}
      const idx = mockOrders.findIndex((o) => o.order_id === id)
      if (idx >= 0) {
        mockOrders[idx] = { ...mockOrders[idx], ...payload }
        return mockOrders[idx]
      }
    }
    return mockOrders
  })
}

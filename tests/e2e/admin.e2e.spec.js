const { test, expect } = require('@playwright/test');

test('admin create API key and use it to create order, timesheet, inventory', async ({ page, request }) => {
  // Admin key from docker-compose
  const ADMIN_KEY = process.env.ADMIN_KEY || 'test-admin-key';
  const apiBase = process.env.API_BASE || 'http://localhost:8000';

  // 1) Create API key via admin endpoint
  const createResp = await request.post(`${apiBase}/admin/api-keys`, {
    data: { label: 'e2e-test' },
    headers: { 'x-admin-key': ADMIN_KEY }
  });
  expect(createResp.ok()).toBeTruthy();
  const created = await createResp.json();
  expect(created).toHaveProperty('api_key');
  const apiKey = created.api_key;

  // 2) Use API key to create an order (via backend API)
  const orderId = 'E2E-ORD-' + Math.floor(Math.random()*10000);
  const createOrderResp = await request.post(`${apiBase}/api/orders`, {
    data: { order_id: orderId, customer_id: 'CUST-ALFA' },
    headers: { 'x-api-key': apiKey }
  });
  expect(createOrderResp.ok()).toBeTruthy();
  const order = await createOrderResp.json();
  expect(order.order_id).toBe(orderId);

  // 3) Create timesheet for the order
  const tsResp = await request.post(`${apiBase}/api/timesheets`, {
    data: { emp_id: 'E-01', order_id: orderId, hours: 2.5 },
    headers: { 'x-api-key': apiKey }
  });
  expect(tsResp.ok()).toBeTruthy();
  const ts = await tsResp.json();
  expect(ts).toHaveProperty('ts_id');

  // 4) Create inventory transaction (receive some stock)
  const txnId = 'E2E-TXN-' + Math.floor(Math.random()*10000);
  const invResp = await request.post(`${apiBase}/api/inventory`, {
    data: { txn_id: txnId, product_id: 'P-101', qty_change: 10, reason: 'PO' },
    headers: { 'x-api-key': apiKey }
  });
  expect(invResp.ok()).toBeTruthy();
  const inv = await invResp.json();
  expect(inv.txn_id).toBe(txnId);

  // 5) Open frontend and verify order appears
  await page.goto('/');
  await page.waitForSelector('text=Orders');
  await page.click(`text=${orderId}`);
  // Verify finance panel loads (may show placeholder)
  await expect(page.locator('text=Finance')).toBeVisible();

  // 6) Cleanup: delete API key
  if (created.id) {
    const del = await request.delete(`${apiBase}/admin/api-keys/${created.id}`, { headers: { 'x-admin-key': ADMIN_KEY } });
    expect(del.ok()).toBeTruthy();
  }
});

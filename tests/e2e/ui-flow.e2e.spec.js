const { test, expect } = require('@playwright/test')

// Basic UI flow: create order, add line, add timesheet, add inventory
// Relies on backend sqlite seed data (customer CUST-ALFA, products P-100 / P-101, employee E-01)

test('UI flow: create order, add line, timesheet, inventory', async ({ page }) => {
  const base = process.env.UI_BASE || 'http://localhost:5173'
  await page.goto(base)

  // Create order
  const orderId = 'UI-ORD-' + Math.floor(Math.random()*10000)
  await page.getByTestId('order-id-input').fill(orderId)
  await page.getByTestId('ac-customer').click()
  // Pick first customer option
  const opt = await page.getByTestId(/ac-customer-option-0/)
  if(await opt.count()) await opt.first().click()
  // Confirm create
  page.once('dialog', d => d.accept())
  await page.getByTestId('order-submit').click()
  await expect(page.getByText('Order created')).toBeVisible()
  // Verify order appears in list and finance panel loads
  await expect(page.getByText(orderId)).toBeVisible()
  await page.getByText(orderId).click()
  await expect(page.getByText('Finance: ' + orderId)).toBeVisible()

  // Add order line
  await page.getByTestId('ac-order').click()
  const ordOpt = await page.getByTestId(/ac-order-option-0/)
  if(await ordOpt.count()) await ordOpt.first().click()
  await page.getByTestId('ac-product').click()
  const prodOpt = await page.getByTestId(/ac-product-option-0/)
  if(await prodOpt.count()) await prodOpt.first().click()
  await page.getByTestId('line-qty').fill('5')
  await page.getByTestId('line-price').fill('12.5')
  page.once('dialog', d => d.accept())
  await page.getByTestId('line-submit').click()
  await expect(page.getByText('Order line added')).toBeVisible()

  // Timesheet
  await page.getByPlaceholder('Employee ID').fill('E-01')
  await page.getByPlaceholder('Hours').fill('1.5')
  await page.getByText('Add Timesheet').click()
  await expect(page.getByText('Timesheet logged')).toBeVisible()

  // Inventory
  const txnId = 'UI-TXN-' + Math.floor(Math.random()*10000)
  await page.getByPlaceholder('Txn ID').fill(txnId)
  // select product dropdown
  await page.getByRole('combobox').nth(2).selectOption({ label: /P-100/ })
  await page.getByPlaceholder('Qty change (e.g. 100 or -50)').fill('25')
  await page.getByText('Create Txn').click()
  await expect(page.getByText('Inventory txn created')).toBeVisible()
})

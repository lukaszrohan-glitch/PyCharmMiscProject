import { test as base, expect } from '@playwright/test'
import { setupWorker, resetMocks } from '../support/mocks'
import { loginViaUi, openDemandPlanner } from '../support/auth'

const test = base.extend({
  mockServer: async ({ page }, use) => {
    await setupWorker(page)
    await use()
  }
})

test.describe('Demand Planner', () => {
  test.beforeEach(async ({ page, mockServer }) => {
    resetMocks()
    await mockServer
    await loginViaUi(page)
    await openDemandPlanner(page)
  })

  test('creates, runs and lists scenario results', async ({ page }) => {
    await page.getByLabel('Nazwa scenariusza').fill('E2E Test Scenario')
    await page.getByRole('spinbutton', { name: 'Mnożnik popytu' }).fill('1.3')
    await page.getByLabel('Backlog (tyg.)').fill('6')
    await page.getByRole('button', { name: 'Zapisz scenariusz' }).click()
    await expect(page.getByText('Scenario zapisane')).toBeVisible()
    await page.getByRole('button', { name: 'Przelicz' }).click()
    await expect(page.getByText('Przychód prognozowany')).toBeVisible()
    await expect(page.getByText('1 200 000')).toBeVisible()
  })
})

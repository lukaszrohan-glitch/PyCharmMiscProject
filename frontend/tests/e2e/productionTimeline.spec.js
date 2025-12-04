import { test as base, expect } from '@playwright/test'
import { setupWorker, resetMocks } from '../support/mocks'
import { loginViaUi, openProduction } from '../support/auth'

const test = base.extend({
  mockServer: async ({ page }, use) => {
    await setupWorker(page)
    await use()
  }
})

const drag = async (locator, deltaX) => {
  const box = await locator.boundingBox()
  await locator.hover()
  await locator.page().mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await locator.page().mouse.down()
  await locator.page().mouse.move(box.x + box.width / 2 + deltaX, box.y + box.height / 2, { steps: 5 })
  await locator.page().mouse.up()
}

test.describe('Production timeline', () => {
  test.beforeEach(async ({ page, mockServer }) => {
    resetMocks()
    await mockServer
    await loginViaUi(page)
    await openProduction(page)
    await page.getByRole('button', { name: 'Timeline' }).click()
  })

  test('drags order block and persists schedule', async ({ page }) => {
    const block = page.locator('[class*="timelineBlock"]').first()
    await block.waitFor()
    const before = await block.textContent()
    await drag(block, 30)
    await page.waitForTimeout(1000)
    const after = await block.textContent()
    await expect(after).toBe(before)
  })

  test('resizes block with handles', async ({ page }) => {
    const handle = page.locator('[data-handle="end"]').first()
    await handle.waitFor()
    const box = await handle.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2, { steps: 5 })
    await page.mouse.up()
    await expect(page.locator('[class*="timelineBlockDragging"]').first()).toBeHidden()
  })
})

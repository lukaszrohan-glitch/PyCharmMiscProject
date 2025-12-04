const DEFAULT_CREDS = {
  email: 'qa@synterra.app',
  password: 'demo12345'
}

export async function loginViaUi(page, overrides = {}) {
  const { email, password } = { ...DEFAULT_CREDS, ...overrides }
  await page.goto('/')
  await page.getByLabel(/Email/i).fill(email)
  await page.getByLabel(/Hasło|Password/i).fill(password)
  await page.getByRole('button', { name: /Zaloguj się|Sign In/i }).click()
  await page.waitForLoadState('networkidle')
  await page.getByRole('banner').waitFor()
  await page.getByRole('main').waitFor()
}

export async function openProduction(page) {
  await page.goto('/production');
  await page.waitForURL('**/production', { timeout: 5000 });
}

export async function openDemandPlanner(page) {
  await page.goto('/demand');
  await page.waitForURL('**/demand', { timeout: 5000 });
}

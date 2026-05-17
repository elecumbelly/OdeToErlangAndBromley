import { test, expect } from '@playwright/test'

test('calculator computes required agents from volume + AHT + SL target', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Open advanced planner' }).click()

  await page.locator('#volume').fill('500')
  await page.locator('#aht').fill('300')
  await page.locator('#targetSLPercent').fill('80')
  await page.locator('#thresholdSeconds').fill('20')

  await expect(page.getByRole('heading', { name: 'Results' }).first()).toBeVisible()

  // Formula section renders only when calculator produced a result
  // Erlangs line: "A = (500 x 300) / ... = N.NN Erlangs"
  await expect(page.getByText(/Erlangs/).first()).toBeVisible()

  // No DB error banner — if wasm fails, the calculator can't render results
  await expect(page.getByText(/DB ERROR/)).not.toBeVisible()
})

import { test, expect } from '@playwright/test'

test('CSV import via "Load Example Data" populates campaigns', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Open advanced planner' }).click()

  // Navigate to the Data hub group
  await page.getByRole('button', { name: /📥\s*Data/ }).click()

  // Click into the SmartCSVImport tab if a sub-tab exists
  const importSubTab = page.getByRole('tab', { name: /Import/i })
  if (await importSubTab.count() > 0) {
    await importSubTab.first().click()
  }

  // Trigger sample data load (deterministic, no fixture file needed)
  await page.getByRole('button', { name: 'Load Example Data' }).click()

  // Confirm a "Loaded:" label appears after sample apply
  await expect(page.getByText(/^Loaded:/)).toBeVisible({ timeout: 10_000 })
})

import { test, expect } from '@playwright/test'

test('CSV export triggers a download', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Open advanced planner' }).click()

  // Fill calculator so results exist to export
  await page.locator('#volume').fill('500')
  await page.locator('#aht').fill('300')
  await expect(page.getByRole('heading', { name: 'Results' }).first()).toBeVisible()

  // Navigate to the Data hub group → Export sub-tab
  await page.getByRole('button', { name: /📥\s*Data/ }).click()
  const exportSubTab = page.getByRole('tab', { name: /Export/i })
  if (await exportSubTab.count() > 0) {
    await exportSubTab.first().click()
  }

  // Trigger CSV export and capture the download
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /Export CSV/ }).click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toMatch(/^odetoerlangandbromley-results-.+\.csv$/)
})

test('DB backup triggers a sqlite download', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Open advanced planner' }).click()

  await page.getByRole('button', { name: /📥\s*Data/ }).click()
  const exportSubTab = page.getByRole('tab', { name: /Export/i })
  if (await exportSubTab.count() > 0) {
    await exportSubTab.first().click()
  }

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /Export DB/ }).click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toMatch(/^odetoerlangandbromley-db-.+\.sqlite$/)
})

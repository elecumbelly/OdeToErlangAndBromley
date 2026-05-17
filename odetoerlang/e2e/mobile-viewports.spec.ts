import { test, expect, type Page, type ViewportSize } from '@playwright/test'

const VIEWPORTS: { name: string; size: ViewportSize }[] = [
  { name: '360x640 (small phone)', size: { width: 360, height: 640 } },
  { name: '390x844 (iPhone 14)', size: { width: 390, height: 844 } },
  { name: '768x1024 (iPad portrait)', size: { width: 768, height: 1024 } },
]

async function assertNoHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(() => {
    const docWidth = document.documentElement.scrollWidth
    const viewWidth = document.documentElement.clientWidth
    return { docWidth, viewWidth, overflow: docWidth - viewWidth }
  })
  expect(overflow.overflow, `${label}: doc width ${overflow.docWidth}px > viewport ${overflow.viewWidth}px`).toBeLessThanOrEqual(1)
}

async function assertNoDbError(page: Page) {
  await expect(page.getByText(/DB ERROR/)).not.toBeVisible()
}

for (const { name, size } of VIEWPORTS) {
  test.describe(`viewport ${name}`, () => {
    test.use({ viewport: size })

    test('landing renders without horizontal overflow', async ({ page }) => {
      await page.goto('/')
      await assertNoDbError(page)
      await assertNoHorizontalOverflow(page, 'landing')
      await expect(page.getByRole('button', { name: 'Open advanced planner' })).toBeVisible()
    })

    test('advanced calculator renders without horizontal overflow', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: 'Open advanced planner' }).click()
      await page.locator('#volume').fill('500')
      await page.locator('#aht').fill('300')
      await expect(page.getByRole('heading', { name: 'Results' }).first()).toBeVisible()
      await assertNoDbError(page)
      await assertNoHorizontalOverflow(page, 'advanced calculator')
    })

    test('dashboard renders without horizontal overflow', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: 'Open advanced planner' }).click()
      // Advanced mode lands on the Dashboard (📊 Command group) by default
      await page.getByRole('button', { name: /📊\s*Command/ }).click()
      // Wait for the lazy-loaded Dashboard to mount (the lazy chunk takes a moment)
      await page.waitForLoadState('networkidle')
      await assertNoDbError(page)
      await assertNoHorizontalOverflow(page, 'dashboard')
    })
  })
}

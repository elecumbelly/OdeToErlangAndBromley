import { test, expect, type Page, type ViewportSize } from '@playwright/test'

const VIEWPORTS: { name: string; size: ViewportSize; mobile: boolean }[] = [
  { name: '360x640 (small phone)', size: { width: 360, height: 640 }, mobile: true },
  { name: '390x844 (iPhone 14)', size: { width: 390, height: 844 }, mobile: true },
  { name: '768x1024 (iPad portrait)', size: { width: 768, height: 1024 }, mobile: false },
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

for (const { name, size, mobile } of VIEWPORTS) {
  test.describe(`viewport ${name}`, () => {
    test.use({ viewport: size })

    test('landing renders without horizontal overflow', async ({ page }) => {
      await page.goto('/')
      await assertNoDbError(page)
      await assertNoHorizontalOverflow(page, 'landing')
      await expect(page.getByRole('button', { name: 'Open advanced planner' })).toBeVisible()
    })

    test('advanced calculator renders without horizontal overflow', async ({ page }) => {
      // Known issues on phone widths: header toolbar (Simple/Advanced/Math
      // Model/theme) and tab nav (Command/Calculator/...) overflow at 360px
      // and 390px. Tracked in TODO.md; expected to fail until fixed.
      // The iPad viewport (768px) passes.
      if (mobile) test.fail()

      await page.goto('/')
      await page.getByRole('button', { name: 'Open advanced planner' }).click()
      await page.locator('#volume').fill('500')
      await page.locator('#aht').fill('300')
      await expect(page.getByRole('heading', { name: 'Results' }).first()).toBeVisible()
      await assertNoDbError(page)
      await assertNoHorizontalOverflow(page, 'advanced calculator')
    })
  })
}

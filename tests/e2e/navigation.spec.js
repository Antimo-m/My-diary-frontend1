import { expect, test } from '@playwright/test'

test('mobile drawer opens and exposes navigation actions', async ({ isMobile, page }) => {
  test.skip(!isMobile, 'Drawer is mobile-only.')

  await page.goto('/')

  await page.getByLabel('Apri menu').click()

  await expect(page.getByRole('dialog', { name: 'Menu principale' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Home' }).last()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Diario' }).last()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Kanban' }).last()).toBeVisible()
})

test('dark mode applies a dark navbar surface', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('my-diary-theme', 'dark')
  })
  await page.goto('/')

  const background = await page.locator('.app-navbar').evaluate((element) => (
    window.getComputedStyle(element).backgroundColor
  ))

  expect(background).not.toBe('rgba(255, 255, 255, 0.78)')
  expect(background).not.toBe('rgb(255, 255, 255)')
})

for (const width of [320, 375, 425]) {
  test(`home mobile has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/')

    const overflow = await page.evaluate(() => ({
      body: document.body.scrollWidth - document.documentElement.clientWidth,
      root: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }))

    expect(overflow.body).toBeLessThanOrEqual(1)
    expect(overflow.root).toBeLessThanOrEqual(1)
  })
}

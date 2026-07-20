import { expect, test } from '@playwright/test'

async function mockAuthenticatedUser(page, { showWelcomeModal }) {
  await page.route('**/api/v1/user', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          show_welcome_modal: showWelcomeModal,
        },
      }),
    })
  })
}

// Regressione: prima del fix, il modal di benvenuto ricompariva a ogni F5
// finche l'utente non spuntava "non mostrare piu", perche la chiusura non
// era persistita da nessuna parte e show_welcome_modal restava true lato
// server dopo una chiusura "semplice".
test('dismissing the welcome modal survives a page reload', async ({ page }) => {
  await mockAuthenticatedUser(page, { showWelcomeModal: true })
  await page.route('**/api/v1/diary-notes**', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: [], meta: { current_page: 1, last_page: 1, total: 0 } }),
  }))

  await page.goto('/diary')

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  await page.getByRole('button', { name: /Continua|Continue/ }).click()
  await expect(dialog).toHaveCount(0)

  await page.reload()
  await expect(dialog).toHaveCount(0)
})

test('the welcome modal never shows once the server flag is off', async ({ page }) => {
  await mockAuthenticatedUser(page, { showWelcomeModal: false })
  await page.route('**/api/v1/diary-notes**', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: [], meta: { current_page: 1, last_page: 1, total: 0 } }),
  }))

  await page.goto('/diary')

  await expect(page.getByRole('dialog')).toHaveCount(0)
})

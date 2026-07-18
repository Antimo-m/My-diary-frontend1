import { expect, test } from '@playwright/test'

async function mockAuthenticatedUser(page) {
  await page.route('**/api/v1/user', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            show_welcome_modal: false,
          },
        }),
      })
      return
    }

    await route.fallback()
  })
}

function mockCsrfCookie(page) {
  return page.route('**/sanctum/csrf-cookie', (route) => route.fulfill({ status: 204, body: '' }))
}

test('account deletion asks for the password and returns to the home page', async ({ page }) => {
  await mockAuthenticatedUser(page)
  await mockCsrfCookie(page)

  let deleteBody = null
  await page.route('**/api/v1/user', async (route) => {
    if (route.request().method() === 'DELETE') {
      deleteBody = route.request().postDataJSON()
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Account eliminato.' }),
      })
      return
    }

    await route.fallback()
  })

  await page.goto('/profile')
  await page.getByRole('button', { name: /Elimina account|Delete account/ }).click()

  const dialog = page.getByRole('dialog', { name: /Eliminare definitivamente|Permanently delete/ })
  await expect(dialog).toBeVisible()

  await dialog.getByLabel(/Conferma con la tua password|Confirm with your password/).fill('Valida123!')
  await dialog.getByRole('button', { name: /Elimina il mio account|Delete my account/ }).click()

  await expect(page).toHaveURL(/\/$/)
  expect(deleteBody).toEqual({ password: 'Valida123!' })
})

test('registration shows the password rules returned by the backend', async ({ page }) => {
  await page.route('**/api/v1/user', (route) => route.fulfill({
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'Unauthenticated.' }),
  }))
  await mockCsrfCookie(page)
  await page.route('**/api/v1/register', (route) => route.fulfill({
    status: 422,
    contentType: 'application/json',
    body: JSON.stringify({
      message: 'The password field must be at least 8 characters.',
      errors: {
        password: ['The password field must be at least 8 characters.'],
      },
    }),
  }))

  await page.goto('/diary')
  await page.getByRole('button', { name: /^Registrati$|^Sign up$|^Register$/ }).click()

  await page.getByLabel(/Nome|Name/).fill('Nuovo Utente')
  await page.getByLabel('Email').fill('nuovo@example.com')
  await page.getByLabel('Password', { exact: true }).fill('corta')
  await page.getByLabel(/Conferma password|Confirm password/).fill('corta')
  await page.getByRole('button', { name: /Crea account|Create account/ }).click()

  await expect(page.locator('.user-message--error')).toContainText(/almeno 8 caratteri|at least 8 characters/)
})

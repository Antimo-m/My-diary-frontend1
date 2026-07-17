import { expect, test } from '@playwright/test'

async function mockAuthenticatedUser(page) {
  await page.route('**/api/v1/user', async (route) => {
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
  })
}

function mockDiaryList(page, getNotes) {
  return page.route('**/api/v1/diary-notes?*', async (route) => {
    const notes = getNotes()

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        data: notes,
        meta: { current_page: 1, last_page: 1, total: notes.length, from: notes.length ? 1 : null, to: notes.length || null },
      }),
    })
  })
}

test('delete confirmation dialog closes on Escape without deleting', async ({ page }) => {
  await mockAuthenticatedUser(page)
  const note = { id: 1, route_identifier: 'nota-di-prova', title: 'Nota di prova', formatted_date: '01 giugno 2026', excerpt: 'Testo' }
  await mockDiaryList(page, () => [note])

  let deleteCalled = false
  await page.route('**/api/v1/diary-notes/nota-di-prova', async (route) => {
    if (route.request().method() === 'DELETE') {
      deleteCalled = true
    }

    await route.fulfill({ status: 204, body: '' })
  })

  await page.goto('/diary')
  await page.getByLabel(/Elimina pagina|Delete page/).click()

  const dialog = page.getByRole('dialog', { name: /Eliminare|Delete/ })
  await expect(dialog).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  expect(deleteCalled).toBe(false)
})

test('confirming delete shows a success toast and removes the note', async ({ page }) => {
  await mockAuthenticatedUser(page)
  const note = { id: 2, route_identifier: 'seconda-nota', title: 'Seconda nota', formatted_date: '02 giugno 2026', excerpt: 'Testo' }
  let notes = [note]
  await mockDiaryList(page, () => notes)
  await page.route('**/api/v1/diary-notes/seconda-nota', async (route) => {
    if (route.request().method() === 'DELETE') {
      notes = []
    }

    await route.fulfill({ status: 204, body: '' })
  })

  await page.goto('/diary')
  await page.getByLabel(/Elimina pagina|Delete page/).click()

  const dialog = page.getByRole('dialog', { name: /Eliminare|Delete/ })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: /^Elimina$|^Delete$/ }).click()

  await expect(page.getByRole('status').filter({ hasText: /Pagina eliminata|Page deleted/ })).toBeVisible()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByText('Seconda nota')).toHaveCount(0)
})

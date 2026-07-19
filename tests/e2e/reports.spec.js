import { expect, test } from '@playwright/test'

function mockUser(page, { isAdmin }) {
  return page.route('**/api/v1/user', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      user: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        show_welcome_modal: false,
        is_admin: isAdmin,
      },
    }),
  }))
}

test('a user can submit a report with the auto-collected technical context', async ({ page }) => {
  await mockUser(page, { isAdmin: false })

  let submittedPayload = null
  let reports = []
  await page.route('**/api/v1/reports/mine**', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: reports, current_page: 1, last_page: 1, from: reports.length ? 1 : null, to: reports.length || null, total: reports.length }),
  }))
  await page.route('**/api/v1/reports', async (route) => {
    submittedPayload = route.request().postDataJSON()
    reports = [{ id: 1, type: submittedPayload.type, status: 'open', subject: submittedPayload.subject, created_at: '2026-07-19T10:00:00Z' }]

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'ok', data: reports[0] }),
    })
  })

  await page.goto('/segnalazioni')

  await page.getByLabel(/Oggetto|Subject/).fill('Il calendario non si apre')
  await page.getByLabel(/Descrizione|Description/).fill('Su Safari il calendario della Bacheca non compare.')
  await page.getByRole('button', { name: /Invia segnalazione|Send report/ }).click()

  await expect(page.locator('.user-message--success')).toContainText(/Segnalazione inviata|Report submitted/)
  await expect(page.locator('.report-row')).toContainText('Il calendario non si apre')
  await expect(page.locator('.report-status--open')).toBeVisible()

  expect(submittedPayload.type).toBe('bug')
  expect(submittedPayload.context.route).toBe('/segnalazioni')
  expect(submittedPayload.context.browser).toBeTruthy()
  expect(submittedPayload.context.viewport).toMatch(/^\d+x\d+$/)
  expect(submittedPayload.context.url).not.toContain('#')
})

test('admins manage reports and can change their status', async ({ page }) => {
  await mockUser(page, { isAdmin: true })
  await page.route('**/api/v1/admin/reports/stats', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: { total: 2, by_status: { open: 1, in_progress: 1 }, by_type: { bug: 2 } } }),
  }))

  let patched = null
  await page.route('**/api/v1/admin/reports/5', async (route) => {
    patched = route.request().postDataJSON()
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ message: 'ok', data: { id: 5, status: patched.status } }),
    })
  })
  await page.route('**/api/v1/admin/reports?**', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      data: [{
        id: 5,
        type: 'bug',
        status: 'open',
        subject: 'Il calendario non si apre',
        message: 'Su Safari il calendario della Bacheca non compare.',
        fingerprint: 'a1b2c3d4e5f60718',
        context: { route: '/bacheca', browser: 'Safari', os: 'macOS', viewport: '1440x900', app_version: '1.4.0' },
        created_at: '2026-07-19T10:00:00Z',
        user: { id: 2, name: 'Sara', email: 'sara@example.com' },
      }],
      current_page: 1,
      last_page: 1,
      from: 1,
      to: 1,
      total: 1,
    }),
  }))

  await page.goto('/segnalazioni/gestione')

  await expect(page.getByRole('heading', { level: 1, name: /Gestione segnalazioni|Reports management/ })).toBeVisible()
  await expect(page.locator('.report-card')).toContainText('sara@example.com')
  await expect(page.locator('.report-card')).toContainText('a1b2c3d4e5f60718')

  await page.locator('.report-card__actions').getByRole('button', { name: /In lavorazione|In progress/ }).click()

  await expect(page.locator('.user-message--success')).toContainText(/Segnalazione aggiornata|Report updated/)
  expect(patched).toEqual({ status: 'in_progress' })
})

test('non-admin users cannot open the reports management page', async ({ page }) => {
  await mockUser(page, { isAdmin: false })

  await page.goto('/segnalazioni/gestione')

  await expect(page.getByText(/riservata agli amministratori|restricted to administrators/)).toBeVisible()
})

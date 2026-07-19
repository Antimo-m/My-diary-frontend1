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

function mockMonitoringData(page) {
  return Promise.all([
    page.route('**/api/v1/monitoring/errors/stats**', (route) => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          period_days: 30,
          totals: { errors: 12, today: 4, week: 9, groups: 3, affected_users: 2 },
          trend: [
            { date: '2026-07-18', total: 5 },
            { date: '2026-07-19', total: 7 },
          ],
          top_groups: [
            { fingerprint: 'abc', message: 'TypeError: x is not a function', source: 'ErrorBoundary', total: 9, first_seen: '2026-07-12T08:00:00Z', last_seen: '2026-07-19T10:00:00Z' },
          ],
          by_browser: [{ browser: 'Chrome', total: 10 }, { browser: 'Firefox', total: 2 }],
          by_page: [{ page: '/diary', total: 8 }, { page: '/bacheca', total: 4 }],
          by_version: [{ app_version: '1.4.0', total: 12 }],
        },
      }),
    })),
    page.route('**/api/v1/monitoring/errors?**', (route) => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        data: [{
          id: 7,
          message: 'TypeError: x is not a function',
          source: 'ErrorBoundary',
          page: '/diary',
          browser: 'Chrome',
          occurred_at: '2026-07-19T10:00:00Z',
          user: { id: 1, name: 'Test User', email: 'test@example.com' },
        }],
        current_page: 1,
        last_page: 1,
        from: 1,
        to: 1,
        total: 1,
      }),
    })),
  ])
}

test('admins see the error monitoring dashboard with stats and reports', async ({ isMobile, page }) => {
  await mockUser(page, { isAdmin: true })
  await mockMonitoringData(page)

  await page.goto('/monitoraggio')

  await expect(page.getByRole('heading', { level: 1, name: /Monitoraggio Errori|Error Monitoring/ })).toBeVisible()
  await expect(page.locator('.monitoring-tile').first()).toContainText('4')
  await expect(page.getByText('TypeError: x is not a function').first()).toBeVisible()
  await expect(page.locator('.monitoring-list').first()).toContainText('Chrome')

  if (!isMobile) {
    await expect(page.getByRole('button', { name: /Monitoraggio|Monitoring/ })).toBeVisible()
  }
})

test('clicking a report opens the full detail with the stack trace', async ({ page }) => {
  await mockUser(page, { isAdmin: true })
  await mockMonitoringData(page)
  await page.route('**/api/v1/monitoring/errors/7', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      data: {
        id: 7,
        message: 'TypeError: x is not a function',
        stack: 'TypeError: x is not a function\n    at App (App.jsx:10:5)',
        component_stack: '\n    at App',
        source: 'ErrorBoundary',
        url: 'https://mydiary.test/diary',
        browser: 'Chrome',
        os: 'macOS',
        viewport: '1440x900',
        app_version: '1.4.0',
        commit_sha: 'abc1234def',
        environment: 'production',
        occurred_at: '2026-07-19T10:00:00Z',
        user: { id: 1, name: 'Test User', email: 'test@example.com' },
      },
    }),
  }))

  await page.goto('/monitoraggio')
  await page.locator('button.monitoring-report').first().click()

  const dialog = page.getByRole('dialog', { name: /Dettaglio errore|Error detail/ })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('at App (App.jsx:10:5)')
  await expect(dialog).toContainText('1.4.0')
  await expect(dialog).toContainText('abc1234')
})

test('non-admin users are denied and never see the nav entry', async ({ page }) => {
  await mockUser(page, { isAdmin: false })

  await page.goto('/monitoraggio')

  await expect(page.getByText(/riservata agli amministratori|restricted to administrators/)).toBeVisible()
  await expect(page.locator('.app-navbar__links').getByRole('button', { name: /Monitoraggio|Monitoring/ })).toHaveCount(0)
})

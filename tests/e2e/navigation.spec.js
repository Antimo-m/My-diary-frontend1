import { expect, test } from '@playwright/test'
import { Buffer } from 'node:buffer'

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

test('mobile drawer opens and exposes navigation actions', async ({ isMobile, page }) => {
  test.skip(!isMobile, 'Drawer is mobile-only.')
  await mockAuthenticatedUser(page)

  await page.goto('/')

  await page.getByLabel(/Apri menu|Open menu/).click()

  await expect(page.getByRole('dialog', { name: /Menu principale|Main menu/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Home' }).last()).toBeVisible()
  await expect(page.getByRole('button', { name: /Diario|Diary/ }).last()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Bacheca' }).last()).toBeVisible()
})

test('recent project shortcut on home opens the bacheca project board', async ({ page }) => {
  await mockAuthenticatedUser(page)
  await page.route('**/api/v1/home', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      stats: { notes: 3, today_tasks: 1, projects: 1 },
      recent_projects: [{ id: 9, name: 'Progetto Viaggi', route_identifier: 'progetto-viaggi', tasks_count: 4 }],
    }),
  }))
  await page.route('**/api/v1/bacheca/projects', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: [{ id: 9, name: 'Progetto Viaggi', route_identifier: 'progetto-viaggi' }] }),
  }))
  await page.route('**/api/v1/bacheca/project/progetto-viaggi', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      project: { id: 9, name: 'Progetto Viaggi', route_identifier: 'progetto-viaggi' },
      columns: [],
      labels: [],
    }),
  }))

  await page.goto('/')
  await page.getByRole('button', { name: /Progetto Viaggi/ }).click()

  await expect(page).toHaveURL(/\/bacheca\/project\/progetto-viaggi/)
  await expect(page.getByRole('heading', { level: 1, name: 'Progetto Viaggi' })).toBeVisible()
})

test('dark mode applies a dark navbar surface', async ({ page }) => {
  await mockAuthenticatedUser(page)
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

test('diary heading follows the selected English language', async ({ page }) => {
  await mockAuthenticatedUser(page)
  await page.addInitScript(() => {
    window.localStorage.setItem('my-diary-locale', 'en')
  })
  await page.route('**/api/v1/diary-notes**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, from: null, to: null },
      }),
    })
  })

  await page.goto('/diary')

  await expect(page.getByRole('heading', { level: 1, name: 'Diary' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: 'Diario' })).toHaveCount(0)
})

test('home uses real device-specific clips and keeps walkthroughs on internal pages', async ({ isMobile, page }) => {
  await mockAuthenticatedUser(page)
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /Uno spazio per scrivere|A place to write/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Dalla giornata ai progetti|From today to complex/ })).toBeVisible()
  const clips = page.locator('.home-feature-video video')
  await expect(clips).toHaveCount(2)
  await expect(clips.nth(0)).toHaveAttribute('src', isMobile ? /diary-mobile.*\.webm/ : /diary-desktop.*\.webm/)
  await expect(clips.nth(1)).toHaveAttribute('src', isMobile ? /kanban-mobile.*\.webm/ : /kanban-desktop.*\.webm/)
  await expect(page.locator('.diary-walkthrough, .product-walkthrough')).toHaveCount(0)
})

test('diary keeps a compact three-step walkthrough in the page flow', async ({ page }) => {
  await mockAuthenticatedUser(page)
  await page.route('**/api/v1/diary-notes**', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: [], meta: { current_page: 1, last_page: 1, total: 0 } }),
  }))
  await page.goto('/diary')

  await expect(page.locator('.diary-walkthrough')).toBeVisible()
  await expect(page.locator('.diary-walkthrough__clip')).toBeVisible()
  await expect(page.locator('.diary-walkthrough__steps button')).toHaveCount(3)
  await expect(page.locator('.diary-walkthrough video')).toHaveCount(0)
})

test('diary cover images load through the authenticated API client', async ({ page }) => {
  await mockAuthenticatedUser(page)
  await page.route('**/api/v1/diary-notes**', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      data: [{
        id: 7,
        route_identifier: 'pagina-con-cover',
        title: 'Pagina con cover',
        excerpt: 'Ricordo',
        formatted_date: '15 giugno 2026',
        cover_image_url: 'http://127.0.0.1:8000/api/diary-notes/pagina-con-cover/cover',
      }],
      meta: { current_page: 1, last_page: 1, total: 1 },
    }),
  }))
  await page.route('**/api/diary-notes/pagina-con-cover/cover', (route) => route.fulfill({
    contentType: 'image/png',
    body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  }))

  await page.goto('/diary')

  const cover = page.getByRole('img', { name: /Pagina con cover/ })
  await expect(cover).toBeVisible()
  await expect.poll(() => cover.evaluate((image) => image.naturalWidth)).toBeGreaterThan(0)
})

test('diary detail keeps only the back action and shows the default cover', async ({ page }) => {
  await mockAuthenticatedUser(page)
  const note = {
    id: 8,
    route_identifier: 'pagina-senza-cover',
    title: 'Pagina senza cover',
    body: 'Testo della pagina.',
    excerpt: 'Testo della pagina.',
    formatted_date: '15 giugno 2026',
    cover_image_url: null,
    photo_dedication: '',
  }
  await page.route('**/api/v1/diary-notes**', (route) => {
    if (route.request().url().endsWith('/pagina-senza-cover')) {
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ data: note }),
      })
    }

    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: [note], meta: { current_page: 1, last_page: 1, total: 1 } }),
    })
  })

  await page.goto('/diary')
  await page.getByRole('heading', { name: 'Pagina senza cover' }).click()

  await expect(page.locator('.diary-detail__toolbar .icon-action')).toHaveCount(1)
  await expect(page.locator('.book-cover-fallback')).toBeVisible()
  await expect(page.locator('.diary-detail__toolbar')).toHaveCSS('justify-content', 'flex-start')
})

test('browser back restores the page matching the previous URL', async ({ isMobile, page }) => {
  await mockAuthenticatedUser(page)
  await page.route('**/api/v1/home', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ stats: {}, recent_projects: [] }),
  }))
  await page.route('**/api/v1/bacheca/projects', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: [] }),
  }))
  await page.route('**/api/v1/stats/profile**', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      range: { starts_at: '2026-06-01', ends_at: '2026-06-07' },
      kanban: { total_activities: 0, completed_activities: 0, completion_rate: 0, trend: [] },
      diary: { interactions: 0, writing_days: 0, public_notes: 0, secret_notes: 0, trend: [] },
    }),
  }))

  await page.goto('/')
  if (isMobile) {
    await page.getByLabel(/Apri menu|Open menu/).click()
  }
  await page.getByRole('button', { name: /Analisi|Analysis/ }).first().click()
  await expect(page).toHaveURL(/\/analysis$/)
  await expect(page.getByRole('heading', { level: 1, name: /Analisi|Analysis/ })).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: /Scrivi la giornata|Write your day/ })).toBeVisible()
})

test('analysis keeps advice in the page flow and uses the shared custom select', async ({ page }) => {
  await mockAuthenticatedUser(page)
  await page.route('**/api/v1/bacheca/projects', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: [] }),
  }))
  await page.route('**/api/v1/stats/profile**', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      data: {
        range: { starts_at: '2026-06-01', ends_at: '2026-06-07' },
        kanban: { total_activities: 0, completed_activities: 0, completion_rate: 0, trend: [] },
        diary: { interactions: 0, writing_days: 0, public_notes: 0, secret_notes: 0, trend: [] },
      },
    }),
  }))

  await page.goto('/analysis')

  await expect(page.locator('.stats-card--advice')).toBeVisible()
  await expect(page.locator('.stats-card--advice')).toHaveCSS('position', 'relative')
  await expect(page.locator('.stats-dashboard__board-select .custom-select')).toBeVisible()
  await expect(page.locator('.stats-dashboard select')).toHaveCount(0)
  await expect(page.locator('.stats-zero-state')).toHaveCount(2)
  await expect(page.locator('.stats-trend-note')).toHaveCount(2)
})

test('analysis select contains very long project names without horizontal scrolling', async ({ page }) => {
  const longProjectName = `Progetto ${'estremamente-lungo-'.repeat(18)}finale`
  await mockAuthenticatedUser(page)
  await page.route('**/api/v1/bacheca/projects', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: [{ id: 99, name: longProjectName }] }),
  }))
  await page.route('**/api/v1/stats/profile**', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      data: {
        range: { starts_at: '2026-06-01', ends_at: '2026-06-07' },
        kanban: { total_activities: 0, completed_activities: 0, completion_rate: 0, trend: [] },
        diary: { interactions: 0, writing_days: 0, public_notes: 0, secret_notes: 0, trend: [] },
      },
    }),
  }))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/analysis')
  await page.locator('.stats-dashboard__board-select .custom-select__trigger').click()

  const dimensions = await page.locator('.custom-select__options').evaluate((element) => {
    const lastOption = element.querySelector('button:last-child')

    return {
      clientWidth: element.clientWidth,
      optionWidth: lastOption.getBoundingClientRect().width,
      scrollWidth: element.scrollWidth,
    }
  })

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
  expect(dimensions.optionWidth).toBeGreaterThanOrEqual(dimensions.clientWidth - 1)
  expect(dimensions.optionWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
})

test('home, kanban, and analysis render without console errors', async ({ page }) => {
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })
  page.on('pageerror', (error) => errors.push(error.message))

  await mockAuthenticatedUser(page)
  await page.route('**/api/v1/home', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ stats: { notes: 0, today_tasks: 0, projects: 0 }, recent_projects: [] }),
  }))
  await page.route('**/api/v1/bacheca/projects', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: [] }),
  }))
  await page.route('**/api/v1/stats/profile**', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      range: { starts_at: '2026-06-01', ends_at: '2026-06-07' },
      kanban: { total_activities: 0, completed_activities: 0, completion_rate: 0, trend: [] },
      diary: { interactions: 0, writing_days: 0, public_notes: 0, secret_notes: 0, trend: [] },
    }),
  }))

  for (const path of ['/', '/kanban', '/analysis']) {
    await page.goto(path)
    await page.locator('.page-container').waitFor()
  }

  expect(errors).toEqual([])
})

test('secret diary locks after five inactive minutes without logging out the account', async ({ page }) => {
  let unlocked = true
  await page.clock.install()
  await mockAuthenticatedUser(page)
  await page.route('**/api/v1/secret-diary/status', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: { has_password: true, unlocked } }),
  }))
  await page.route('**/sanctum/csrf-cookie', (route) => route.fulfill({ status: 204 }))
  await page.route('**/api/v1/secret-diary/lock', (route) => {
    unlocked = false
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: { has_password: true, unlocked: false } }),
    })
  })
  await page.route('**/api/v1/secret-diary/notes**', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: [], meta: { current_page: 1, last_page: 1, total: 0 } }),
  }))

  await page.goto('/secret-diary')
  await expect(page.getByRole('button', { name: /Esci dal Diario Segreto|Leave Secret Diary/ })).toBeVisible()

  await page.clock.runFor(4 * 60 * 1000)
  await page.dispatchEvent('body', 'pointerdown')
  await page.clock.runFor(2 * 60 * 1000)
  await expect(page.getByRole('button', { name: /Esci dal Diario Segreto|Leave Secret Diary/ })).toBeVisible()
  await page.clock.runFor(3 * 60 * 1000)

  const notice = page.getByText(/chiuso automaticamente dopo 5 minuti|locked automatically after 5 minutes/)
  await expect(notice).toBeVisible()
  await expect(page.getByRole('heading', { name: /Sblocca diario|Unlock diary/ })).toBeVisible()
  await expect(page).toHaveURL(/\/secret-diary$/)

  await page.clock.runFor(5000)
  await expect(notice).toHaveCount(0)
})

test('secret diary exit button locks the protected area immediately', async ({ page }) => {
  let unlocked = true
  await mockAuthenticatedUser(page)
  await page.route('**/api/v1/secret-diary/status', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: { has_password: true, unlocked } }),
  }))
  await page.route('**/sanctum/csrf-cookie', (route) => route.fulfill({ status: 204 }))
  await page.route('**/api/v1/secret-diary/lock', (route) => {
    unlocked = false
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: { has_password: true, unlocked: false } }),
    })
  })
  await page.route('**/api/v1/secret-diary/notes**', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: [], meta: { current_page: 1, last_page: 1, total: 0 } }),
  }))

  await page.goto('/secret-diary')
  await expect(page.locator('.secret-diary-lockbar__status')).toHaveCount(0)
  await page.getByRole('button', { name: /Esci dal Diario Segreto|Leave Secret Diary/ }).click()

  await expect(page.getByRole('heading', { name: /Sblocca diario|Unlock diary/ })).toBeVisible()
})

test('secret diary locks when reopened after five inactive minutes', async ({ page }) => {
  let unlocked = true
  await page.clock.install()
  await mockAuthenticatedUser(page)
  await page.route('**/api/v1/home', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ stats: {}, recent_projects: [] }),
  }))
  await page.route('**/api/v1/secret-diary/status', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: { has_password: true, unlocked } }),
  }))
  await page.route('**/sanctum/csrf-cookie', (route) => route.fulfill({ status: 204 }))
  await page.route('**/api/v1/secret-diary/lock', (route) => {
    unlocked = false
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: { has_password: true, unlocked: false } }),
    })
  })
  await page.route('**/api/v1/secret-diary/notes**', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: [], meta: { current_page: 1, last_page: 1, total: 0 } }),
  }))

  await page.goto('/secret-diary')
  await expect(page.locator('.secret-diary-exit')).toBeVisible()
  await page.goto('/')
  await page.clock.runFor(5 * 60 * 1000)
  await page.goto('/secret-diary')

  await expect(page.getByText(/chiuso automaticamente dopo 5 minuti|locked automatically after 5 minutes/)).toBeVisible()
  await expect(page.getByRole('heading', { name: /Sblocca diario|Unlock diary/ })).toBeVisible()
  await expect(page).toHaveURL(/\/secret-diary$/)
})

test('kanban task form uses the custom clock selector', async ({ page }) => {
  await mockAuthenticatedUser(page)
  await page.route('**/api/v1/bacheca/projects', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: [] }),
  }))
  await page.route('**/api/v1/bacheca/daily**', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      columns: [{ id: 1, title: 'Da fare', color: '#d6a43a', tasks: [] }],
      labels: [],
      date: '2026-06-07',
    }),
  }))

  await page.goto('/bacheca')
  await page.locator('.kanban-hub-card--daily').click()
  await page.locator('.add-task-in-column').click()

  await expect(page.locator('input[type="time"]')).toHaveCount(0)
  const deadlineClock = page.locator('.custom-time__control').first()
  await deadlineClock.click()
  await page.getByRole('listbox', { name: /Ore|Hours/ }).getByRole('option', { name: '14', exact: true }).click()
  await page.getByRole('listbox', { name: /Minuti|Minutes/ }).getByRole('option', { name: '30', exact: true }).click()
  await page.getByRole('button', { name: /Conferma|Confirm/ }).click()

  await expect(deadlineClock).toContainText('14:30')
})

test('profile timezone uses the custom searchable selector', async ({ page }) => {
  await mockAuthenticatedUser(page)
  await page.goto('/profile')

  const selector = page.locator('.custom-select__trigger')
  await selector.click()

  await expect(page.getByRole('listbox')).toBeVisible()
  await page.getByRole('searchbox').fill('Tokyo')
  await page.getByRole('option', { name: 'Asia/Tokyo' }).click()
  await expect(selector).toContainText('Asia/Tokyo')
})

test('kanban project navigation uses the project slug', async ({ page }) => {
  await mockAuthenticatedUser(page)
  await page.route('**/api/v1/bacheca/projects', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        data: [{
          id: 42,
          slug: 'progetto-di-lavoro',
          route_identifier: 'progetto-di-lavoro',
          name: 'Progetto di lavoro',
          tasks_count: 0,
        }],
      }),
    })
  })
  await page.route('**/api/v1/bacheca/project/progetto-di-lavoro', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        project: {
          id: 42,
          slug: 'progetto-di-lavoro',
          route_identifier: 'progetto-di-lavoro',
          name: 'Progetto di lavoro',
        },
        columns: [],
        labels: [],
      }),
    })
  })

  await page.goto('/bacheca')
  await page.locator('.kanban-hub-project__open').filter({ hasText: 'Progetto di lavoro' }).click()

  await expect(page).toHaveURL(/\/bacheca\/project\/progetto-di-lavoro$/)
  await expect(page.getByRole('heading', { name: 'Progetto di lavoro' })).toBeVisible()
})

test('kanban project activity badge shows only icon and count', async ({ page }) => {
  await mockAuthenticatedUser(page)
  await page.route('**/api/v1/bacheca/projects', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: [{ id: 22, name: 'Progetto test', slug: 'progetto-test', tasks_count: 4 }] }),
  }))

  await page.goto('/bacheca')

  const badge = page.locator('.kanban-hub-project__task-count')
  await expect(badge).toContainText('4')
  await expect(badge).not.toContainText(/attivit|activit/i)
  await expect(badge).toHaveCSS('border-radius', '999px')
})

for (const width of [320, 375, 425]) {
  test(`home mobile has no horizontal overflow at ${width}px`, async ({ page }) => {
    await mockAuthenticatedUser(page)
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/')

    const overflow = await page.evaluate(() => ({
      body: document.body.scrollWidth - document.documentElement.clientWidth,
      root: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }))

    expect(overflow.body).toBeLessThanOrEqual(1)
    expect(overflow.root).toBeLessThanOrEqual(1)

    const videoFramesFit = await page.locator('.home-feature-video__frame').evaluateAll((frames) => frames.every((frame) => {
      const container = frame.closest('.home-product-zone')
      const frameBox = frame.getBoundingClientRect()
      const containerBox = container.getBoundingClientRect()

      return frameBox.left >= containerBox.left && frameBox.right <= containerBox.right
    }))
    expect(videoFramesFit).toBe(true)
    await expect(page.locator('.home-feature-video video').first()).toHaveCSS('border-radius', '17px')
  })
}

for (const viewport of [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1366, height: 900 },
]) {
  test(`kanban hub has no horizontal overflow at ${viewport.width}px`, async ({ page }) => {
    await mockAuthenticatedUser(page)
    await page.route('**/api/v1/bacheca/projects', (route) => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        data: [{
          id: 42,
          slug: 'progetto-test',
          route_identifier: 'progetto-test',
          name: 'Progetto test',
          tasks_count: 7,
        }],
      }),
    }))
    await page.setViewportSize(viewport)
    await page.goto('/bacheca')

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

    expect(overflow).toBeLessThanOrEqual(1)
    await expect(page.locator('.kanban-hub-intro')).toHaveCount(0)
    await expect(page.locator('.home-feature-video--kanban')).toBeVisible()
    await expect(page.locator('.home-feature-video__frame')).toBeVisible()
    await expect(page.locator('.kanban-hub-projects')).toBeVisible()
    await expect(page.locator('.kanban-hub-projects__count')).toContainText('1')
    await expect(page.locator('.kanban-hub-project__task-count')).toHaveText('7')

    if (viewport.width <= 390) {
      const frameFits = await page.locator('.home-feature-video__frame').first().evaluate((frame) => {
        const hubBox = frame.closest('.kanban-hub').getBoundingClientRect()
        const frameBox = frame.getBoundingClientRect()

        return frameBox.left >= hubBox.left && frameBox.right <= hubBox.right
      })
      expect(frameFits).toBe(true)
    }
  })
}

test('diary mobile uses a clean reading surface without decorative ruled lines', async ({ page }) => {
  await mockAuthenticatedUser(page)
  await page.route('**/api/v1/diary-notes**', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: [], meta: { current_page: 1, last_page: 1, total: 0 } }),
  }))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/diary')
  await expect(page.locator('.diary-walkthrough')).toBeVisible()

  const styles = await page.evaluate(() => {
    const reader = document.createElement('section')
    const note = document.createElement('p')
    reader.className = 'diary-book--reader'
    note.className = 'book-note-body'
    note.textContent = 'Testo di prova'
    reader.append(note)
    document.body.append(reader)
    const computed = window.getComputedStyle(note)
    return {
      backgroundImage: computed.backgroundImage,
      lineHeight: Number.parseFloat(computed.lineHeight),
    }
  })

  expect(styles.backgroundImage).toBe('none')
  expect(styles.lineHeight).toBeGreaterThan(20)
})

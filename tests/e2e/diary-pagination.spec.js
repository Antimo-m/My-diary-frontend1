import { expect, test } from '@playwright/test'

const longUnbrokenBody = `DASDASDADASD${'c'.repeat(1800)}`

async function mockDiary(page) {
  await page.route('**/api/v1/user', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 2,
          name: 'Sara',
          email: 'sara@example.com',
          show_welcome_modal: false,
        },
      }),
    })
  })

  const note = {
    id: 5,
    slug: 'testo-senza-spazi',
    route_identifier: 'testo-senza-spazi',
    entry_date: '2026-06-07',
    formatted_date: '07 giugno 2026',
    title: 'DASDASDADASDASDSDASDASD',
    body: longUnbrokenBody,
    photo_dedication: '',
    cover_image_url: null,
  }

  await page.route('**/api/v1/diary-notes/testo-senza-spazi', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: note }),
    })
  })

  await page.route('**/api/v1/diary-notes?*', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        data: [note],
        meta: { current_page: 1, last_page: 1, total: 1, from: 1, to: 1 },
      }),
    })
  })
}

test('long text without spaces is preserved across diary pages', async ({ page }) => {
  await mockDiary(page)
  await page.goto('/diary/testo-senza-spazi')

  const counter = page.locator('.diary-page-turner span')
  await expect(counter).toHaveText(/\d+ \/ \d+/)

  const totalPages = Number((await counter.textContent()).split('/')[1].trim())
  expect(totalPages).toBeGreaterThan(1)

  let reconstructedBody = ''

  for (let currentPage = 1; currentPage <= totalPages; currentPage += 1) {
    reconstructedBody += await page.locator('.book-note-body:not(.diary-measure-box)').textContent()

    if (currentPage < totalPages) {
      await page.getByLabel(/Pagina successiva|Next page/).click()
      await expect(counter).toHaveText(`${currentPage + 1} / ${totalPages}`)
    }
  }

  expect(reconstructedBody).toBe(longUnbrokenBody)
})

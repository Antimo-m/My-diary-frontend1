import { chromium } from '@playwright/test'
import path from 'node:path'

// Records the Home/Bacheca demo videos against a REAL backend (no API mocks),
// so seeded defaults (preset columns and labels) appear exactly as in production.
// Requirements:
//   1. Backend running on DEMO_BACKEND_URL (default http://127.0.0.1:8001) with a
//      disposable database containing users demo1..demo8@example.com / Password!234
//      (locale it for 1-4, en for 5-8, show_welcome_modal=false).
//   2. Frontend dev server on http://127.0.0.1:5176 pointed at that backend
//      (VITE_API_BASE_URL / VITE_BACKEND_URL).
const baseUrl = 'http://127.0.0.1:5176'
const backendUrl = process.env.DEMO_BACKEND_URL ?? 'http://127.0.0.1:8001'
const assetsDir = path.resolve('src/assets')
const recordingsDir = '/private/tmp/my-diary-home-recordings'
const password = 'Password!234'

const devices = [
  { name: 'desktop', viewport: { width: 1280, height: 800 }, video: { width: 1280, height: 800 } },
  { name: 'mobile', viewport: { width: 390, height: 844 }, video: { width: 390, height: 844 }, isMobile: true },
]

const locales = {
  it: {
    suffix: '',
    browserLocale: 'it-IT',
    labels: {
      newPage: 'Nuova pagina',
      title: 'Titolo',
      text: 'Testo del diario',
      dedication: 'Didascalia',
      save: 'Salva',
      createBoard: 'Crea bacheca',
      projectPlaceholder: /Universita|University/,
      backToHub: 'Torna alla Bacheca',
      newTask: 'Nuova attivita',
      taskTitlePlaceholder: 'Es. Preparare la riunione',
      taskNotesPlaceholder: 'Aggiungi dettagli utili, link o appunti veloci',
      addTask: 'Aggiungi attivita',
      presetColumn: 'Cose da fare',
    },
    diaryNote: {
      title: 'Un pensiero da conservare',
      body: 'Oggi mi fermo un momento, raccolgo quello che conta e lo trasformo in una pagina da ritrovare.',
      dedication: 'Una piccola pausa che merita spazio.',
    },
    board: {
      projectName: 'Lancio personale',
      taskTitle: 'Preparare la prima bozza',
      taskNotes: 'Raccogliere idee, priorita e prossimi passi.',
    },
  },
  en: {
    suffix: '-en',
    browserLocale: 'en-US',
    labels: {
      newPage: 'New page',
      title: 'Title',
      text: 'Diary text',
      dedication: 'Caption',
      save: 'Save',
      createBoard: 'Create board',
      projectPlaceholder: /Universita|University/,
      backToHub: 'Back to Board',
      newTask: 'New task',
      taskTitlePlaceholder: 'E.g. Prepare the meeting',
      taskNotesPlaceholder: 'Add useful details, links, or quick notes',
      addTask: 'Add task',
      presetColumn: 'Cose da fare',
    },
    diaryNote: {
      title: 'A thought worth keeping',
      body: 'Today I pause for a moment, gather what matters and turn it into a page I can come back to.',
      dedication: 'A small pause that deserves its own space.',
    },
    board: {
      projectName: 'Personal launch',
      taskTitle: 'Prepare the first draft',
      taskNotes: 'Collect ideas, priorities and next steps.',
    },
  },
}

let demoUserCursor = 0
const demoUsers = { it: [1, 2, 3, 4], en: [5, 6, 7, 8] }

function nextDemoEmail(localeKey) {
  const pool = demoUsers[localeKey]
  const index = pool.shift()
  if (index === undefined) throw new Error(`No demo users left for locale ${localeKey}`)
  demoUserCursor = index
  return `demo${index}@example.com`
}

async function xsrfHeader(context) {
  const cookies = await context.cookies(backendUrl)
  const token = cookies.find((cookie) => cookie.name === 'XSRF-TOKEN')
  return { 'X-XSRF-TOKEN': decodeURIComponent(token?.value ?? '') }
}

const apiHeaders = {
  Accept: 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
  Origin: baseUrl,
  Referer: `${baseUrl}/`,
}

async function loginContext(context, localeKey) {
  const email = nextDemoEmail(localeKey)
  await context.request.get(`${backendUrl}/sanctum/csrf-cookie`, { headers: apiHeaders })
  const response = await context.request.post(`${backendUrl}/api/v1/login`, {
    headers: { ...apiHeaders, ...(await xsrfHeader(context)) },
    data: { email, password },
  })
  if (!response.ok()) {
    throw new Error(`Login failed for ${email}: ${response.status()} ${await response.text()}`)
  }
}

async function preparePage(context, localeKey) {
  await loginContext(context, localeKey)
  const page = await context.newPage()
  await page.addInitScript(([locale]) => {
    window.localStorage.setItem('my-diary-locale', locale)
    window.localStorage.setItem('my-diary-theme', 'light')
  }, [localeKey])
  return page
}

async function makeCoverImage(browser) {
  const context = await browser.newContext()
  const page = await context.newPage()
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 1500
    const ctx = canvas.getContext('2d')
    const sky = ctx.createLinearGradient(0, 0, 0, 1500)
    sky.addColorStop(0, '#f8e3bb')
    sky.addColorStop(0.55, '#e0a45c')
    sky.addColorStop(1, '#7b5423')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, 1200, 1500)
    ctx.fillStyle = 'rgba(255, 250, 240, 0.92)'
    ctx.beginPath()
    ctx.arc(600, 520, 170, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(60, 40, 15, 0.55)'
    for (const [x, height] of [[80, 340], [320, 470], [610, 390], [880, 500], [1080, 360]]) {
      ctx.beginPath()
      ctx.moveTo(x - 150, 1500)
      ctx.lineTo(x, 1500 - height)
      ctx.lineTo(x + 150, 1500)
      ctx.closePath()
      ctx.fill()
    }
    return canvas.toDataURL('image/png')
  })
  await context.close()
  return Buffer.from(dataUrl.split(',')[1], 'base64')
}

async function recordDiary(browser, device, localeKey, coverImage) {
  const { browserLocale, diaryNote, labels, suffix } = locales[localeKey]
  const context = await browser.newContext({
    locale: browserLocale,
    viewport: device.viewport,
    recordVideo: { dir: recordingsDir, size: device.video },
  })
  const page = await preparePage(context, localeKey)
  const video = page.video()

  await page.goto(`${baseUrl}/diary`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(900)
  await page.getByRole('button', { name: labels.newPage }).click()
  await page.waitForTimeout(550)
  await page.getByLabel(labels.title).fill(diaryNote.title)
  await page.waitForTimeout(400)
  await page.getByLabel(labels.text).fill(diaryNote.body)
  await page.waitForTimeout(500)
  await page.getByLabel(labels.dedication).fill(diaryNote.dedication)
  await page.waitForTimeout(400)
  await page.locator('input[type="file"]').setInputFiles({ buffer: coverImage, mimeType: 'image/png', name: 'ricordo.png' })
  await page.waitForTimeout(900)
  await page.getByRole('button', { name: labels.save, exact: true }).click()
  await page.getByRole('heading', { name: diaryNote.title }).waitFor()
  await page.locator('.diary-image-frame img').waitFor()
  await page.waitForTimeout(2200)

  await page.close()
  await video.saveAs(path.join(assetsDir, `diary-${device.name}${suffix}.webm`))
  await context.close()
}

async function recordKanban(browser, device, localeKey) {
  const { board, browserLocale, labels, suffix } = locales[localeKey]
  const context = await browser.newContext({
    locale: browserLocale,
    viewport: device.viewport,
    recordVideo: { dir: recordingsDir, size: device.video },
  })
  const page = await preparePage(context, localeKey)
  const video = page.video()

  await page.goto(`${baseUrl}/bacheca`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(900)

  // Daily board: preset columns and labels are seeded by the real backend.
  await page.locator('.kanban-hub-card--daily').click()
  await page.getByRole('heading', { name: labels.presetColumn }).waitFor()
  await page.waitForTimeout(1600)
  await page.getByRole('button', { name: labels.backToHub }).click()
  await page.locator('.kanban-hub-card--project .kanban-hub-card__trigger').waitFor()
  await page.waitForTimeout(600)

  // Custom board: created for real, opens with the seeded preset columns.
  await page.locator('.kanban-hub-card--project .kanban-hub-card__trigger').click()
  await page.waitForTimeout(450)
  await page.getByPlaceholder(labels.projectPlaceholder).fill(board.projectName)
  await page.waitForTimeout(450)
  await page.getByRole('button', { name: labels.createBoard, exact: true }).click()
  await page.getByRole('heading', { name: board.projectName }).waitFor()
  await page.getByRole('heading', { name: labels.presetColumn }).waitFor()
  await page.waitForTimeout(900)
  await page.getByRole('button', { name: labels.newTask }).first().click()
  await page.getByPlaceholder(labels.taskTitlePlaceholder).fill(board.taskTitle)
  await page.getByPlaceholder(labels.taskNotesPlaceholder).fill(board.taskNotes)
  await page.waitForTimeout(550)
  await page.getByRole('button', { name: labels.addTask, exact: true }).click()
  await page.getByText(board.taskTitle).waitFor()
  await page.waitForTimeout(2200)

  await page.close()
  await video.saveAs(path.join(assetsDir, `kanban-${device.name}${suffix}.webm`))
  await context.close()
}

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: 'chrome' })
  } catch {
    return await chromium.launch()
  }
}

const browser = await launchBrowser()
const coverImage = await makeCoverImage(browser)
for (const localeKey of Object.keys(locales)) {
  for (const device of devices) {
    await recordDiary(browser, device, localeKey, coverImage)
    await recordKanban(browser, device, localeKey)
  }
}
await browser.close()

console.log(`Recorded real Diary and Bacheca videos (it + en, desktop + mobile). Last demo user index: ${demoUserCursor}`)

import { afterEach, describe, expect, it, vi } from 'vitest'
import { computeFingerprint } from '../../src/monitoring/fingerprint'
import { buildReport } from '../../src/monitoring/reportBuilder'
import { addTransport, clearTransports, dispatchReport } from '../../src/monitoring/transportManager'
import { installGlobalErrorHandlers, reportError, reportEvent } from '../../src/monitoring'

// Messaggi unici per test: il dedupe del logger e globale al modulo.
let sequence = 0
const uniqueMessage = () => `boom-${Date.now()}-${sequence += 1}`

afterEach(() => {
  clearTransports()
  vi.restoreAllMocks()
})

describe('fingerprint', () => {
  it('e stabile tra build e tra utenti (righe, hash asset, valori dinamici)', () => {
    const base = {
      message: 'Cannot read id 42 of "utente-rossi"',
      source: 'ErrorBoundary',
      stack: 'TypeError: x\n    at load (https://app.test/assets/DiaryPage-B9fElw3Y.js:10:220)',
    }
    const nextBuild = {
      message: 'Cannot read id 97 of "utente-bianchi"',
      source: 'ErrorBoundary',
      stack: 'TypeError: x\n    at load (https://app.test/assets/DiaryPage-Zk29fQw1.js:44:7)',
    }

    expect(computeFingerprint(base)).toBe(computeFingerprint(nextBuild))
  })

  it('separa errori diversi', () => {
    const first = computeFingerprint({ message: 'TypeError: a', source: 'ErrorBoundary', stack: null })
    const second = computeFingerprint({ message: 'ReferenceError: b', source: 'ErrorBoundary', stack: null })

    expect(first).not.toBe(second)
  })
})

describe('buildReport', () => {
  it('normalizza un Error in un report completo', () => {
    const message = uniqueMessage()
    const report = buildReport(new Error(message), { componentStack: 'in App', source: 'ErrorBoundary' }, {
      release: '1.4.0',
      commitSha: 'abc1234',
      environment: 'test',
    })

    expect(report).toMatchObject({
      kind: 'error',
      message,
      componentStack: 'in App',
      source: 'ErrorBoundary',
      release: '1.4.0',
      commitSha: 'abc1234',
      environment: 'test',
    })
    expect(report.stack).toContain(message)
    expect(report.fingerprint).toMatch(/^[a-f0-9]{16}$/)
    expect(report.browser).toBeTruthy()
    expect(report.os).toBeTruthy()
    expect(report.viewport).toMatch(/^\d+x\d+$/)
    expect(new Date(report.occurredAt).getTime()).not.toBeNaN()
  })

  it('non include mai il fragment dell URL', () => {
    window.location.hash = '#reset_token=super-segreto'

    const report = buildReport(new Error(uniqueMessage()))

    expect(report.url).not.toContain('#')
    expect(report.url).not.toContain('reset_token')
    window.location.hash = ''
  })

  it('accetta valori che non sono Error', () => {
    const report = buildReport('stringa lanciata')

    expect(report.message).toBe('stringa lanciata')
    expect(report.stack).toBeNull()
    expect(report.source).toBe('unhandled')
  })
})

describe('transportManager', () => {
  it('smista a tutti i transport e isola quelli rotti', () => {
    const healthy = vi.fn()
    addTransport(() => {
      throw new Error('transport rotto')
    })
    addTransport(() => Promise.reject(new Error('rete giu')))
    addTransport(healthy)

    expect(() => dispatchReport({ message: 'x' })).not.toThrow()
    expect(healthy).toHaveBeenCalledTimes(1)
  })

  it('l unsubscribe scollega il singolo transport', () => {
    const transport = vi.fn()
    const unsubscribe = addTransport(transport)

    unsubscribe()
    dispatchReport({ message: 'x' })

    expect(transport).not.toHaveBeenCalled()
  })
})

describe('errorLogger', () => {
  it('consegna il report e l errore originale ai transport', () => {
    const transport = vi.fn()
    addTransport(transport)

    const message = uniqueMessage()
    reportError(new Error(message))

    expect(transport).toHaveBeenCalledTimes(1)
    expect(transport.mock.calls[0][0].message).toBe(message)
    expect(transport.mock.calls[0][1]).toBeInstanceOf(Error)
  })

  it('sopprime i duplicati dello stesso crash nella finestra di dedupe', () => {
    const transport = vi.fn()
    addTransport(transport)

    const error = new Error(uniqueMessage())
    expect(reportError(error)).not.toBeNull()
    expect(reportError(error)).toBeNull()
    expect(transport).toHaveBeenCalledTimes(1)
  })

  it('reportEvent viaggia come kind event con il suo payload', () => {
    const transport = vi.fn()
    addTransport(transport)

    reportEvent(uniqueMessage(), { endpoint: '/demo', duration_ms: 4200 })

    const [report] = transport.mock.calls[0]
    expect(report.kind).toBe('event')
    expect(report.source).toBe('health')
    expect(report.data).toEqual({ endpoint: '/demo', duration_ms: 4200 })
  })

  it('gli handler globali catturano window error e unhandledrejection', () => {
    const transport = vi.fn()
    addTransport(transport)
    const uninstall = installGlobalErrorHandlers()

    const windowErrorMessage = uniqueMessage()
    window.dispatchEvent(new ErrorEvent('error', { error: new Error(windowErrorMessage) }))

    const rejectionMessage = uniqueMessage()
    const rejectionEvent = new Event('unhandledrejection')
    rejectionEvent.reason = new Error(rejectionMessage)
    window.dispatchEvent(rejectionEvent)

    uninstall()
    // Dopo l'uninstall nessuno gestisce l'evento: il preventDefault evita che
    // jsdom lo classifichi come eccezione non catturata del test run.
    const swallow = (event) => event.preventDefault()
    window.addEventListener('error', swallow)
    window.dispatchEvent(new ErrorEvent('error', { error: new Error(uniqueMessage()), cancelable: true }))
    window.removeEventListener('error', swallow)

    expect(transport).toHaveBeenCalledTimes(2)
    expect(transport.mock.calls[0][0]).toMatchObject({ message: windowErrorMessage, source: 'window.onerror' })
    expect(transport.mock.calls[1][0]).toMatchObject({ message: rejectionMessage, source: 'unhandledrejection' })
  })
})

describe('laravelTransport', () => {
  it('adatta il report al contratto snake_case e filtra i kind esclusi', async () => {
    const { createLaravelTransport } = await import('../../src/monitoring/transports/laravelTransport')
    const client = { post: vi.fn() }
    const transport = createLaravelTransport({ client, kinds: ['error'] })

    const report = buildReport(new Error(uniqueMessage()), { source: 'ErrorBoundary' }, { release: '1.4.0' })
    transport(report)

    expect(client.post).toHaveBeenCalledWith('/frontend-errors', expect.objectContaining({
      message: report.message,
      component_stack: null,
      fingerprint: report.fingerprint,
      app_version: '1.4.0',
      user_agent: report.userAgent,
      occurred_at: report.occurredAt,
    }))

    transport({ ...report, kind: 'event' })
    expect(client.post).toHaveBeenCalledTimes(1)
  })
})

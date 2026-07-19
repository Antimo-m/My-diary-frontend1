import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addErrorTransport, installGlobalErrorHandlers, reportError } from '../../src/services/errorLogger'

// Ogni test usa un messaggio unico: il dedupe del logger e globale al modulo
// e messaggi ripetuti tra test produrrebbero report soppressi.
let sequence = 0
const uniqueMessage = () => `boom-${Date.now()}-${sequence += 1}`

describe('errorLogger', () => {
  let unsubscribes = []

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    unsubscribes.forEach((unsubscribe) => unsubscribe())
    unsubscribes = []
    vi.restoreAllMocks()
  })

  const track = (handler) => {
    unsubscribes.push(addErrorTransport(handler))
  }

  it('normalizza l errore in un report completo', () => {
    const message = uniqueMessage()
    const report = reportError(new Error(message), { componentStack: 'in App', source: 'ErrorBoundary' })

    expect(report.message).toBe(message)
    expect(report.stack).toContain(message)
    expect(report.componentStack).toBe('in App')
    expect(report.source).toBe('ErrorBoundary')
    expect(report.url).toContain('http')
    expect(report.userAgent).toBeTruthy()
    expect(report.browser).toBeTruthy()
    expect(new Date(report.occurredAt).getTime()).not.toBeNaN()
  })

  it('non include mai il fragment dell URL nel report', () => {
    window.location.hash = '#reset_token=super-segreto'

    const report = reportError(new Error(uniqueMessage()))

    expect(report.url).not.toContain('#')
    expect(report.url).not.toContain('reset_token')
    window.location.hash = ''
  })

  it('accetta anche valori che non sono Error', () => {
    const message = uniqueMessage()
    const report = reportError(message)

    expect(report.message).toBe(message)
    expect(report.stack).toBeNull()
    expect(report.source).toBe('unhandled')
  })

  it('inoltra il report a tutti i transport registrati', () => {
    const first = vi.fn()
    const second = vi.fn()
    track(first)
    track(second)

    const message = uniqueMessage()
    reportError(new Error(message))

    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
    expect(first.mock.calls[0][0].message).toBe(message)
    expect(second.mock.calls[0][1]).toBeInstanceOf(Error)
  })

  it('sopprime i duplicati dello stesso crash nella finestra di dedupe', () => {
    const transport = vi.fn()
    track(transport)

    const error = new Error(uniqueMessage())
    const firstReport = reportError(error)
    const secondReport = reportError(error)

    expect(firstReport).not.toBeNull()
    expect(secondReport).toBeNull()
    expect(transport).toHaveBeenCalledTimes(1)
  })

  it('un transport rotto non blocca gli altri e non propaga nulla', () => {
    const healthy = vi.fn()
    track(() => {
      throw new Error('transport rotto')
    })
    track(() => Promise.reject(new Error('rete giu')))
    track(healthy)

    expect(() => reportError(new Error(uniqueMessage()))).not.toThrow()
    expect(healthy).toHaveBeenCalledTimes(1)
  })

  it('l unsubscribe scollega il transport', () => {
    const transport = vi.fn()
    const unsubscribe = addErrorTransport(transport)

    unsubscribe()
    reportError(new Error(uniqueMessage()))

    expect(transport).not.toHaveBeenCalled()
  })

  it('gli handler globali catturano window error e unhandledrejection', () => {
    const transport = vi.fn()
    track(transport)
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

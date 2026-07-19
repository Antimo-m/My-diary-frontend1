import { buildReport } from './reportBuilder'
import { dispatchReport } from './transportManager'

// Facciata del modulo: chi cattura un errore chiama reportError (o
// reportEvent per i segnali di salute applicativa) e non sa nulla delle
// destinazioni. Configurazione iniettata da initMonitoring in index.js.

let buildConfig = {}

export function configureLogger(config) {
  buildConfig = config ?? {}
}

// Lo stesso crash ripetuto (es. loop di render) produce un solo report per
// finestra: protegge i transport remoti dal flood e rispetta i rate limit.
const DEDUPE_WINDOW_MS = 30_000
const MAX_TRACKED_REPORTS = 50
const recentReports = new Map()

function isDuplicate(key) {
  const now = Date.now()
  const lastSeen = recentReports.get(key)

  if (lastSeen && now - lastSeen < DEDUPE_WINDOW_MS) {
    return true
  }

  if (recentReports.size >= MAX_TRACKED_REPORTS) {
    recentReports.clear()
  }

  recentReports.set(key, now)

  return false
}

/**
 * Normalizza e smista un errore. Non deve MAI lanciare: un report fallito
 * non puo diventare un secondo crash dentro un ErrorBoundary o un handler
 * globale. Restituisce il report inviato, o null se soppresso dal dedupe.
 */
export function reportError(error, context = {}) {
  const report = buildReport(error, context, buildConfig)

  if (isDuplicate(`${report.kind}|${report.source}|${report.message}`)) {
    return null
  }

  dispatchReport(report, error instanceof Error ? error : undefined)

  return report
}

/**
 * Evento di salute applicativa (timeout, API lente, upload falliti, errori di
 * sincronizzazione, ...): stesso viaggio dei crash, con kind "event". Ogni
 * transport decide se e come trattarli.
 */
export function reportEvent(name, data = {}, context = {}) {
  return reportError(name, { ...context, source: context.source ?? 'health', kind: 'event', data })
}

/**
 * Cattura cio che gli ErrorBoundary non vedono: eccezioni non gestite
 * (window "error") e promise rifiutate senza catch ("unhandledrejection").
 * Restituisce la funzione di smontaggio.
 */
export function installGlobalErrorHandlers() {
  const onWindowError = (event) => {
    reportError(event.error ?? event.message ?? 'Errore sconosciuto', { source: 'window.onerror' })
  }

  const onUnhandledRejection = (event) => {
    reportError(event.reason ?? 'Promise rifiutata senza motivo', { source: 'unhandledrejection' })
  }

  window.addEventListener('error', onWindowError)
  window.addEventListener('unhandledrejection', onUnhandledRejection)

  return () => {
    window.removeEventListener('error', onWindowError)
    window.removeEventListener('unhandledrejection', onUnhandledRejection)
  }
}

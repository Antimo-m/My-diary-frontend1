// Punto unico di raccolta degli errori runtime del frontend. Nessun
// console.error sparso nei componenti: chi cattura un errore chiama
// reportError e le destinazioni (console, Sentry, endpoint Laravel) sono
// transport registrati altrove. Il modulo non dipende da nulla del progetto:
// e riutilizzabile cosi com'e in qualsiasi app React.

let transports = []

// Lo stesso crash ripetuto (es. loop di render) produce un solo report per
// finestra: protegge i transport remoti dal flood e rispetta i rate limit.
const DEDUPE_WINDOW_MS = 30_000
const MAX_TRACKED_REPORTS = 50
const recentReports = new Map()

/**
 * Registra una destinazione per i report. Ogni transport riceve
 * (report, originalError) e puo essere sincrono o asincrono; i fallimenti
 * vengono assorbiti. Restituisce la funzione di unsubscribe.
 */
export function addErrorTransport(handler) {
  transports = [...transports, handler]

  return () => {
    transports = transports.filter((transport) => transport !== handler)
  }
}

function detectBrowser(userAgent) {
  if (/edg\//i.test(userAgent)) return 'Edge'
  if (/opr\//i.test(userAgent)) return 'Opera'
  if (/chrome|crios/i.test(userAgent)) return 'Chrome'
  if (/firefox|fxios/i.test(userAgent)) return 'Firefox'
  if (/safari/i.test(userAgent)) return 'Safari'

  return 'Altro'
}

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
 * Normalizza e inoltra un errore a tutti i transport registrati.
 * Non deve MAI lanciare: un report fallito non puo diventare un secondo
 * crash dentro un ErrorBoundary o un handler globale.
 */
export function reportError(error, context = {}) {
  const message = error instanceof Error ? error.message : String(error)
  const source = context.source ?? 'unhandled'

  if (isDuplicate(`${source}|${message}`)) {
    return null
  }

  const userAgent = navigator.userAgent
  const report = {
    message,
    stack: error instanceof Error ? error.stack ?? null : null,
    componentStack: context.componentStack ?? null,
    source,
    // Il fragment non lascia mai il client: e il canale dei token di reset.
    url: window.location.href.split('#')[0],
    userAgent,
    browser: detectBrowser(userAgent),
    appVersion: import.meta.env.VITE_APP_RELEASE ?? null,
    occurredAt: new Date().toISOString(),
  }

  // La console resta la destinazione di base anche in produzione: se i
  // transport remoti mancano o falliscono, il crash e comunque ispezionabile.
  console.error('[my-diary] frontend error', report)

  for (const transport of transports) {
    try {
      // Un transport che fallisce (rete giu, 422, ...) non deve propagare
      // nulla e non deve impedire l'esecuzione degli altri.
      Promise.resolve(transport(report, error)).catch(() => {})
    } catch {
      // Anche un transport sincrono difettoso viene assorbito.
    }
  }

  return report
}

/**
 * Cattura gli errori che gli ErrorBoundary non vedono: eccezioni non gestite
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

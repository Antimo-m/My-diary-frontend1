import { computeFingerprint } from './fingerprint'

// Unico punto in cui un report viene costruito: nessun oggetto assemblato a
// mano altrove. Il report e normalizzato e autodescrittivo; l'identita
// dell'utente NON viene mai dichiarata dal client (la deriva il server dalla
// sessione: un client compromesso non puo attribuire errori ad altri).

function detectBrowser(userAgent) {
  if (/edg\//i.test(userAgent)) return 'Edge'
  if (/opr\//i.test(userAgent)) return 'Opera'
  if (/chrome|crios/i.test(userAgent)) return 'Chrome'
  if (/firefox|fxios/i.test(userAgent)) return 'Firefox'
  if (/safari/i.test(userAgent)) return 'Safari'

  return 'Altro'
}

function detectOs(userAgent) {
  if (/windows/i.test(userAgent)) return 'Windows'
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS'
  if (/android/i.test(userAgent)) return 'Android'
  if (/mac os/i.test(userAgent)) return 'macOS'
  if (/linux/i.test(userAgent)) return 'Linux'

  return 'Altro'
}

/**
 * Costruisce un report normalizzato.
 *
 * @param error   Error, stringa o valore qualsiasi lanciato.
 * @param context { source, componentStack, kind, data }
 * @param config  { release, commitSha, environment } dal setup dell'app.
 */
export function buildReport(error, context = {}, config = {}) {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack ?? null : null
  const source = context.source ?? 'unhandled'
  const userAgent = navigator.userAgent

  return {
    kind: context.kind ?? 'error',
    message,
    stack,
    componentStack: context.componentStack ?? null,
    source,
    fingerprint: computeFingerprint({ message, source, stack }),
    // Il fragment non lascia mai il client: e il canale dei token di reset.
    url: window.location.href.split('#')[0],
    route: window.location.pathname,
    userAgent,
    browser: detectBrowser(userAgent),
    os: detectOs(userAgent),
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language ?? null,
    release: config.release ?? null,
    commitSha: config.commitSha ?? null,
    environment: config.environment ?? null,
    occurredAt: new Date().toISOString(),
    // Payload libero per gli eventi di salute (timeout, API lente, ...).
    data: context.data ?? null,
  }
}

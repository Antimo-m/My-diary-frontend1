import { addErrorTransport } from './errorLogger'

/**
 * Integrazione Sentry, attiva solo se VITE_SENTRY_DSN e configurata: in
 * locale (senza DSN) il modulo non viene nemmeno scaricato, grazie
 * all'import dinamico che lo tiene fuori dal bundle principale.
 *
 * Scelte deliberate per un'app-diario:
 * - Session Replay DISATTIVATO: registrerebbe testo privato degli utenti.
 * - sendDefaultPii false: niente IP o dati personali automatici.
 * - GlobalHandlers disattivati: l'unico imbuto e errorLogger, che inoltra a
 *   Sentry via transport. Cosi ogni errore e contato una sola volta e ogni
 *   destinazione (Sentry, Laravel) riceve lo stesso report.
 */
export async function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN

  if (!dsn) {
    return null
  }

  const Sentry = await import('@sentry/react')

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_APP_ENV ?? import.meta.env.MODE,
    release: import.meta.env.VITE_APP_RELEASE || undefined,
    sendDefaultPii: false,
    // Breadcrumbs (console, fetch, storia di navigazione) restano attivi:
    // arrivano dalle integrazioni di default non filtrate qui sotto.
    integrations: (defaults) => defaults.filter((integration) => integration.name !== 'GlobalHandlers'),
    // Performance monitoring a campione basso: sufficiente per i trend
    // senza consumare quota. Alzarlo solo con un piano Sentry adeguato.
    tracesSampleRate: 0.1,
  })

  addErrorTransport((report, originalError) => {
    Sentry.captureException(originalError instanceof Error ? originalError : new Error(report.message), {
      contexts: { report },
      tags: { source: report.source },
    })
  })

  return Sentry
}

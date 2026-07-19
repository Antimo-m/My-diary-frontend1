/**
 * Transport Sentry, creato solo se esiste un DSN: l'SDK viene scaricato con
 * un import dinamico, quindi resta fuori dal bundle quando e spento.
 *
 * Scelte di default pensate per app con dati sensibili:
 * - Session Replay NON attivato (registrerebbe contenuti degli utenti);
 * - sendDefaultPii false;
 * - GlobalHandlers disattivati: l'unico imbuto e il logger del modulo, cosi
 *   ogni errore e contato una volta sola e tutte le destinazioni ricevono lo
 *   stesso report (i breadcrumbs delle altre integrazioni restano attivi).
 */
export async function createSentryTransport({ dsn, environment, release, tracesSampleRate = 0.1 }) {
  if (!dsn) {
    return null
  }

  const Sentry = await import('@sentry/react')

  Sentry.init({
    dsn,
    environment,
    release: release || undefined,
    sendDefaultPii: false,
    integrations: (defaults) => defaults.filter((integration) => integration.name !== 'GlobalHandlers'),
    tracesSampleRate,
  })

  return (report, originalError) => {
    if (report.kind !== 'error') {
      // Gli eventi di salute diventano breadcrumb, non issue.
      Sentry.addBreadcrumb({ category: 'health', message: report.message, data: report.data ?? {} })
      return
    }

    Sentry.captureException(originalError ?? new Error(report.message), {
      contexts: { report },
      tags: { source: report.source, fingerprint: report.fingerprint },
    })
  }
}

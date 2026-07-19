/**
 * Transport verso un backend Laravel con il modulo Frontend Monitoring.
 * Il client HTTP viene iniettato (axios instance, fetch wrapper...): il
 * modulo non conosce ne l'autenticazione ne la base URL del progetto ospite.
 *
 * @param client   oggetto con .post(url, payload) => Promise
 * @param endpoint percorso dell'endpoint di raccolta
 * @param kinds    tipologie di report da inoltrare (default: tutte)
 */
export function createLaravelTransport({ client, endpoint = '/frontend-errors', kinds = ['error', 'event'] }) {
  return (report) => {
    if (!kinds.includes(report.kind)) {
      return undefined
    }

    return client.post(endpoint, {
      kind: report.kind,
      message: report.message,
      stack: report.stack,
      component_stack: report.componentStack,
      source: report.source,
      fingerprint: report.fingerprint,
      url: report.url,
      route: report.route,
      user_agent: report.userAgent,
      browser: report.browser,
      os: report.os,
      viewport: report.viewport,
      language: report.language,
      app_version: report.release,
      commit_sha: report.commitSha,
      environment: report.environment,
      occurred_at: report.occurredAt,
    })
  }
}

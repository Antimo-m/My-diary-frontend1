// Modulo di monitoraggio frontend, indipendente dall'app ospite.
//
// Integrazione minima in un nuovo progetto React:
//
//   import { initMonitoring, createConsoleTransport, createLaravelTransport } from './monitoring'
//
//   initMonitoring({
//     release: import.meta.env.VITE_APP_RELEASE,
//     commitSha: import.meta.env.VITE_COMMIT_SHA,
//     environment: import.meta.env.MODE,
//     transports: [
//       createConsoleTransport(),
//       createLaravelTransport({ client: apiClient }),
//     ],
//   })
//
// Flusso: Error -> reportBuilder -> errorLogger -> transportManager -> transports.

import { configureLogger, installGlobalErrorHandlers } from './errorLogger'
import { addTransport } from './transportManager'

export { reportError, reportEvent, installGlobalErrorHandlers } from './errorLogger'
export { addTransport, clearTransports } from './transportManager'
export { buildReport } from './reportBuilder'
export { computeFingerprint } from './fingerprint'
export { createConsoleTransport } from './transports/consoleTransport'
export { createLaravelTransport } from './transports/laravelTransport'
export { createSentryTransport } from './transports/sentryTransport'
export { default as ErrorBoundary } from './components/ErrorBoundary'
export { useErrorReporter } from './hooks/useErrorReporter'

/**
 * Setup unico del modulo: memorizza la configurazione dei report (release,
 * commit, environment), registra i transport e installa gli handler globali.
 * Restituisce la funzione di smontaggio completo.
 */
export function initMonitoring({ commitSha, environment, globalHandlers = true, release, transports = [] } = {}) {
  configureLogger({ commitSha, environment, release })

  const unsubscribes = transports.filter(Boolean).map((transport) => addTransport(transport))
  const uninstall = globalHandlers ? installGlobalErrorHandlers() : () => {}

  return () => {
    uninstall()
    unsubscribes.forEach((unsubscribe) => unsubscribe())
  }
}

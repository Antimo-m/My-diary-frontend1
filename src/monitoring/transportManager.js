// Registro delle destinazioni dei report. Il logger non conosce Laravel,
// Sentry o la console: consegna al manager, che smista in parallelo a ogni
// transport registrato isolandone i fallimenti.

let transports = []

/**
 * Registra un transport: (report, originalError) => void|Promise.
 * Restituisce la funzione di unsubscribe.
 */
export function addTransport(handler) {
  transports = [...transports, handler]

  return () => {
    transports = transports.filter((transport) => transport !== handler)
  }
}

/** Svuota il registro (utile nei test e negli smontaggi completi). */
export function clearTransports() {
  transports = []
}

/**
 * Consegna il report a tutti i transport. Non lancia mai: un transport rotto
 * o una rete assente non devono produrre un secondo errore, ne impedire la
 * consegna agli altri.
 */
export function dispatchReport(report, originalError) {
  for (const transport of transports) {
    try {
      Promise.resolve(transport(report, originalError)).catch(() => {})
    } catch {
      // Anche i transport sincroni difettosi vengono assorbiti.
    }
  }
}

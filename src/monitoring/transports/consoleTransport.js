/**
 * Transport console: destinazione di base, utile in sviluppo e come rete di
 * sicurezza in produzione (un crash resta ispezionabile anche se i transport
 * remoti mancano o falliscono).
 */
export function createConsoleTransport({ prefix = '[monitoring]' } = {}) {
  return (report) => {
    console.error(prefix, report)
  }
}

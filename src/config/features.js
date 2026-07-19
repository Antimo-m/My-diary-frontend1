// Feature flags del frontend, pilotati da variabili d'ambiente: si spegne
// una funzionalita ridistribuendo la build con una env diversa, senza toccare
// codice. Un flag e attivo salvo esplicito "false".
function flag(value, fallback = true) {
  return value === undefined || value === '' ? fallback : value !== 'false'
}

export const features = {
  monitoring: flag(import.meta.env.VITE_FEATURE_MONITORING),
  // Pagina strumenti sviluppatore: mai attiva fuori dalle build di sviluppo.
  devTools: import.meta.env.DEV,
}

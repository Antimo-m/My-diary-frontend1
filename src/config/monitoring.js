// Configurazione centralizzata del monitoraggio: unico punto in cui l'app
// legge le variabili d'ambiente relative a errori e Sentry. CI/CD-ready:
// in pipeline basta valorizzare le env, nessun codice da toccare.
export const monitoringConfig = {
  release: import.meta.env.VITE_APP_RELEASE || null,
  commitSha: import.meta.env.VITE_COMMIT_SHA || null,
  environment: import.meta.env.VITE_APP_ENV || import.meta.env.MODE,
  sentry: {
    dsn: import.meta.env.VITE_SENTRY_DSN || null,
    tracesSampleRate: 0.1,
  },
}

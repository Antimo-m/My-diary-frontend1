import { useContext } from 'react'
import { ErrorBoundary as MonitoringErrorBoundary } from '../monitoring'
import { I18nContext } from '../i18n/i18nContext'

// Testi di riserva nel caso il crash avvenga sopra I18nProvider: l'utente
// non deve mai vedere una chiave grezza.
const fallbackCopy = {
  'errors.unexpected': 'Si e verificato un errore imprevisto.',
  'errors.unexpectedCopy': 'I tuoi dati sono al sicuro. Ricarica l app per riprendere da dove eri.',
  'errors.reload': 'Ricarica l app',
}

function safeTranslate(t, key) {
  try {
    const translated = t?.(key)

    if (translated && translated !== key) {
      return translated
    }
  } catch {
    // Il fallback non deve mai crashare: si usa la copy di riserva.
  }

  return fallbackCopy[key] ?? key
}

function AppErrorFallback() {
  // useContext diretto: a differenza di useI18n non lancia se il crash e
  // avvenuto sopra I18nProvider; in quel caso si usa la copy di riserva.
  const t = useContext(I18nContext)?.t ?? null

  return (
    <section className="page-container error-fallback" role="alert" aria-live="assertive">
      <div className="error-fallback__card surface">
        <h2>{safeTranslate(t, 'errors.unexpected')}</h2>
        <p>{safeTranslate(t, 'errors.unexpectedCopy')}</p>
        <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>
          {safeTranslate(t, 'errors.reload')}
        </button>
      </div>
    </section>
  )
}

/**
 * Boundary applicativo: la cattura e il report vivono nel modulo monitoring,
 * qui c'e solo il fallback nel design system dell'app.
 */
function ErrorBoundary({ children }) {
  return (
    <MonitoringErrorBoundary fallback={<AppErrorFallback />}>
      {children}
    </MonitoringErrorBoundary>
  )
}

export default ErrorBoundary

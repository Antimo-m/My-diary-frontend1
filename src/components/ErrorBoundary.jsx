import { Component } from 'react'
import { I18nContext } from '../i18n/i18nContext'
import { reportError } from '../services/errorLogger'

// Testi di riserva nel caso il crash avvenga sopra I18nProvider (o il
// contesto lanci a sua volta): l'utente non deve mai vedere una chiave grezza.
const fallbackCopy = {
  'errors.unexpected': 'Si e verificato un errore imprevisto.',
  'errors.unexpectedCopy': 'I tuoi dati sono al sicuro. Ricarica l app per riprendere da dove eri.',
  'errors.reload': 'Ricarica l app',
}

/**
 * Contiene i crash di render delle pagine: registra l'errore tramite
 * errorLogger e mostra un fallback accessibile con il pulsante di ricarica.
 * La gestione del report (console, Sentry, endpoint Laravel) NON vive qui.
 */
class ErrorBoundary extends Component {
  static contextType = I18nContext

  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    reportError(error, {
      componentStack: errorInfo?.componentStack ?? null,
      source: 'ErrorBoundary',
    })
  }

  // t() con doppia rete di sicurezza: contesto assente o traduzione mancante
  // (la t del progetto restituisce la chiave stessa) ripiegano sui testi fissi.
  translate(key) {
    try {
      const translated = this.context?.t?.(key)

      if (translated && translated !== key) {
        return translated
      }
    } catch {
      // Il fallback non deve mai crashare: qualsiasi problema col contesto
      // viene assorbito e si usa la copy di riserva.
    }

    return fallbackCopy[key] ?? key
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <section className="page-container error-fallback" role="alert" aria-live="assertive">
        <div className="error-fallback__card surface">
          <h2>{this.translate('errors.unexpected')}</h2>
          <p>{this.translate('errors.unexpectedCopy')}</p>
          <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>
            {this.translate('errors.reload')}
          </button>
        </div>
      </section>
    )
  }
}

export default ErrorBoundary

import { Component } from 'react'
import { reportError } from '../errorLogger'

const defaultFallback = (
  <div role="alert" aria-live="assertive">
    <p>Si e verificato un errore imprevisto.</p>
    <button type="button" onClick={() => window.location.reload()}>Ricarica</button>
  </div>
)

/**
 * ErrorBoundary generico del modulo: cattura, delega il report al logger e
 * mostra il fallback fornito dall'app ospite (elemento o render prop che
 * riceve l'errore). Nessuna dipendenza da i18n o design system del progetto.
 */
class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    reportError(error, {
      componentStack: errorInfo?.componentStack ?? null,
      source: 'ErrorBoundary',
    })

    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (!this.state.error) {
      return this.props.children
    }

    const { fallback = defaultFallback } = this.props

    return typeof fallback === 'function' ? fallback(this.state.error) : fallback
  }
}

export default ErrorBoundary

import { Component } from 'react'
import { I18nContext } from '../i18n/i18nContext'

/**
 * Contiene i crash di render delle pagine: al posto di uno schermo bianco
 * mostra un messaggio e il pulsante per ricaricare l'app.
 */
class ErrorBoundary extends Component {
  static contextType = I18nContext

  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const t = this.context?.t ?? ((key) => key)

    return (
      <section className="page-container loading-state" role="alert">
        <p>{t('errors.unexpected')}</p>
        <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>
          {t('errors.reload')}
        </button>
      </section>
    )
  }
}

export default ErrorBoundary

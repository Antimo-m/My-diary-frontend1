import { useState } from 'react'
import { useErrorReporter } from '../monitoring'
import apiClient from '../services/apiClient'

// Strumenti per verificare la pipeline di monitoraggio end-to-end.
// La rotta esiste solo nelle build di sviluppo (vedi App.jsx): in produzione
// questo file non entra nemmeno nel bundle.
function DevMonitoringPage() {
  const { reportEvent } = useErrorReporter()
  const [shouldCrash, setShouldCrash] = useState(false)
  const [lastAction, setLastAction] = useState('')

  if (shouldCrash) {
    throw new Error('Dev: crash di render volontario')
  }

  const actions = [
    {
      label: 'React render error (ErrorBoundary)',
      run: () => setShouldCrash(true),
    },
    {
      label: 'Promise rejection non gestita',
      run: () => {
        void Promise.reject(new Error('Dev: promise rejection volontaria'))
      },
    },
    {
      label: 'Errore di rete (host inesistente)',
      run: () => {
        void fetch('https://host-inesistente.invalid/ping')
      },
    },
    {
      label: 'Errore API (404 non gestito)',
      run: () => {
        void apiClient.get('/endpoint-inesistente')
      },
    },
    {
      label: 'Errore di validazione (422 non gestito)',
      run: () => {
        void apiClient.post('/register', {})
      },
    },
    {
      label: 'Health event (api.slow)',
      run: () => {
        reportEvent('api.slow', { endpoint: '/demo', duration_ms: 4200 })
      },
    },
  ]

  return (
    <section className="page-container monitoring-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Dev · Monitoring</h1>
          <p className="page-subtitle">Genera errori di prova e verifica che arrivino a console, backend e Sentry.</p>
        </div>
      </header>

      <div className="monitoring-tiles">
        {actions.map((action) => (
          <button
            className="monitoring-tile surface"
            key={action.label}
            type="button"
            onClick={() => {
              setLastAction(action.label)
              action.run()
            }}
          >
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {lastAction ? <p className="monitoring-empty" role="status">Eseguito: {lastAction}</p> : null}
    </section>
  )
}

export default DevMonitoringPage

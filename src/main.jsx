import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import { I18nProvider } from './i18n/I18nProvider.jsx'
import { registerServiceWorker } from './registerServiceWorker'
import { addTransport, createConsoleTransport, createLaravelTransport, createSentryTransport, initMonitoring } from './monitoring'
import { features } from './config/features'
import { monitoringConfig } from './config/monitoring'
import apiClient from './services/apiClient'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <App />
        </I18nProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)

registerServiceWorker()

// Monitoraggio: un solo imbuto (src/monitoring) e piu destinazioni in
// parallelo — console, modulo Laravel Frontend Monitoring e Sentry se
// configurato via env. Tutto il setup vive in src/config/monitoring.js.
if (features.monitoring) {
  initMonitoring({
    ...monitoringConfig,
    transports: [
      createConsoleTransport(),
      createLaravelTransport({ client: apiClient }),
    ],
  })

  createSentryTransport({ ...monitoringConfig.sentry, environment: monitoringConfig.environment, release: monitoringConfig.release })
    .then((transport) => transport && addTransport(transport))
}

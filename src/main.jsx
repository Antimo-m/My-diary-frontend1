import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import { I18nProvider } from './i18n/I18nProvider.jsx'
import { registerServiceWorker } from './registerServiceWorker'
import { addErrorTransport, installGlobalErrorHandlers } from './services/errorLogger'
import { sendFrontendErrorReport } from './services/monitoringApi'
import { initSentry } from './services/sentryClient'

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

// Monitoraggio errori: un solo imbuto (errorLogger) e due destinazioni,
// il modulo Laravel Frontend Monitoring e Sentry (se configurato via env).
installGlobalErrorHandlers()
addErrorTransport(sendFrontendErrorReport)
initSentry()

import apiClient from './apiClient'

/**
 * Transport verso il modulo Laravel "Frontend Monitoring": adatta il report
 * del logger al contratto snake_case di POST /frontend-errors. Endpoint
 * pubblico e best effort: gli errori di invio sono assorbiti dal logger.
 */
export function sendFrontendErrorReport(report) {
  return apiClient.post('/frontend-errors', {
    message: report.message,
    stack: report.stack,
    component_stack: report.componentStack,
    source: report.source,
    url: report.url,
    user_agent: report.userAgent,
    browser: report.browser,
    app_version: report.appVersion,
    occurred_at: report.occurredAt,
  })
}

// --- Dashboard amministrativa "Monitoraggio Errori" ---

export async function getMonitoringStats(days) {
  const response = await apiClient.get('/monitoring/errors/stats', { params: { days } })

  return response.data.data
}

export async function listMonitoringErrors(params = {}) {
  const response = await apiClient.get('/monitoring/errors', { params })

  return response.data
}

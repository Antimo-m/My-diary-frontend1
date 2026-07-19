import apiClient from './apiClient'

// API del modulo Segnalazioni: separato dal monitoraggio automatico
// (monitoringApi). Il contesto tecnico viene raccolto dal chiamante con
// collectEnvironment() del modulo monitoring.

export async function createUserReport(payload) {
  const response = await apiClient.post('/reports', payload)

  return response.data
}

export async function listMyReports(params = {}) {
  const response = await apiClient.get('/reports/mine', { params })

  return response.data
}

// --- Gestione amministrativa ---

export async function listAdminReports(params = {}) {
  const response = await apiClient.get('/admin/reports', { params })

  return response.data
}

export async function updateAdminReport(id, payload) {
  const response = await apiClient.patch(`/admin/reports/${id}`, payload)

  return response.data.data
}

export async function getAdminReportStats() {
  const response = await apiClient.get('/admin/reports/stats')

  return response.data.data
}

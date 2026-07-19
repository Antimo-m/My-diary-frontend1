import apiClient from './apiClient'

// API della dashboard amministrativa "Monitoraggio Errori". L'invio dei
// report NON passa da qui: lo fa il laravelTransport del modulo
// src/monitoring, che riceve apiClient per injection.

export async function getMonitoringStats(days) {
  const response = await apiClient.get('/monitoring/errors/stats', { params: { days } })

  return response.data.data
}

export async function listMonitoringErrors(params = {}) {
  const response = await apiClient.get('/monitoring/errors', { params })

  return response.data
}

export async function getMonitoringError(id) {
  const response = await apiClient.get(`/monitoring/errors/${id}`)

  return response.data.data
}

import apiClient from './apiClient'

export async function getBachecaBoard(date) {
  const response = await apiClient.get('/bacheca/daily', { params: { date } })

  return response.data
}

export async function getBachecaProject(identifier) {
  const response = await apiClient.get(`/bacheca/project/${encodeURIComponent(identifier)}`)

  return response.data
}

export async function listBachecaProjects() {
  const response = await apiClient.get('/bacheca/projects')

  return response.data.data
}

export async function createProject(payload) {
  const response = await apiClient.post('/projects', payload)

  return response.data.data
}

export async function updateProject(identifier, payload) {
  const response = await apiClient.put(`/projects/${encodeURIComponent(identifier)}`, payload)

  return response.data.data
}

export async function deleteProject(identifier) {
  await apiClient.delete(`/projects/${encodeURIComponent(identifier)}`)
}

export async function createColumn(payload) {
  const response = await apiClient.post('/bacheca/columns', payload)

  return response.data.data
}

export async function updateColumn(id, payload) {
  const response = await apiClient.put(`/bacheca/columns/${id}`, payload)

  return response.data.data
}

export async function deleteColumn(id) {
  await apiClient.delete(`/bacheca/columns/${id}`)
}

export async function createTask(payload) {
  const response = await apiClient.post('/bacheca/tasks', payload)

  return response.data.data
}

export async function updateTask(id, payload) {
  const response = await apiClient.put(`/bacheca/tasks/${id}`, payload)

  return response.data.data
}

export async function moveTask(id, payload) {
  const response = await apiClient.patch(`/bacheca/tasks/${id}/move`, payload)

  return response.data.data
}

export async function deleteTask(id) {
  await apiClient.delete(`/bacheca/tasks/${id}`)
}

export async function toggleTaskComplete(id) {
  const response = await apiClient.post(`/activities/${id}/toggle-complete`)

  return response.data.data
}

export async function createLabel(payload) {
  const response = await apiClient.post('/bacheca/labels', payload)

  return response.data.data
}

export async function updateLabel(id, payload) {
  const response = await apiClient.put(`/bacheca/labels/${id}`, payload)

  return response.data.data
}

export async function deleteLabel(id) {
  await apiClient.delete(`/bacheca/labels/${id}`)
}

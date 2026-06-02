import apiClient from './apiClient'

export async function getKanbanBoard(date) {
  const response = await apiClient.get('/kanban/board', { params: { date } })

  return response.data
}

export async function createColumn(payload) {
  const response = await apiClient.post('/kanban/columns', payload)

  return response.data.data
}

export async function updateColumn(id, payload) {
  const response = await apiClient.put(`/kanban/columns/${id}`, payload)

  return response.data.data
}

export async function deleteColumn(id) {
  await apiClient.delete(`/kanban/columns/${id}`)
}

export async function createTask(payload) {
  const response = await apiClient.post('/kanban/tasks', payload)

  return response.data.data
}

export async function updateTask(id, payload) {
  const response = await apiClient.put(`/kanban/tasks/${id}`, payload)

  return response.data.data
}

export async function moveTask(id, payload) {
  const response = await apiClient.patch(`/kanban/tasks/${id}/move`, payload)

  return response.data.data
}

export async function deleteTask(id) {
  await apiClient.delete(`/kanban/tasks/${id}`)
}

export async function createLabel(payload) {
  const response = await apiClient.post('/kanban/labels', payload)

  return response.data.data
}

export async function updateLabel(id, payload) {
  const response = await apiClient.put(`/kanban/labels/${id}`, payload)

  return response.data.data
}

export async function deleteLabel(id) {
  await apiClient.delete(`/kanban/labels/${id}`)
}

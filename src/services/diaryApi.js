import apiClient from './apiClient'

export async function listDiaryNotes(params = {}) {
  const response = await apiClient.get('/diary-notes', { params })

  return response.data
}

export async function getDiaryNote(identifier) {
  const response = await apiClient.get(`/diary-notes/${encodeURIComponent(identifier)}`)

  return response.data.data
}

export async function saveDiaryNote(payload, identifier = null) {
  const formData = new FormData()

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      formData.append(key, value)
    }
  })

  if (identifier) {
    formData.append('_method', 'PUT')
  }

  const response = await apiClient.post(identifier ? `/diary-notes/${encodeURIComponent(identifier)}` : '/diary-notes', formData)

  return response.data.data
}

export async function deleteDiaryNote(identifier) {
  await apiClient.delete(`/diary-notes/${encodeURIComponent(identifier)}`)
}

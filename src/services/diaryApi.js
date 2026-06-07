import apiClient from './apiClient'

export async function listDiaryNotes(params = {}) {
  const response = await apiClient.get('/diary-notes', { params })

  return response.data
}

export async function getDiaryNote(id) {
  const response = await apiClient.get(`/diary-notes/${id}`)

  return response.data.data
}

export async function saveDiaryNote(payload, id = null) {
  const formData = new FormData()

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      formData.append(key, value)
    }
  })

  if (id) {
    formData.append('_method', 'PUT')
  }

  const response = await apiClient.post(id ? `/diary-notes/${id}` : '/diary-notes', formData)

  return response.data.data
}

export async function deleteDiaryNote(id) {
  await apiClient.delete(`/diary-notes/${id}`)
}

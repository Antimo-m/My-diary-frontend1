import apiClient, { ensureCsrfCookie } from './apiClient'

export async function getSecretDiaryStatus() {
  const response = await apiClient.get('/secret-diary/status')

  return response.data.data
}

export async function setupSecretDiary(payload) {
  await ensureCsrfCookie()
  const response = await apiClient.post('/secret-diary/setup', payload)

  return response.data.data
}

export async function unlockSecretDiary(password) {
  await ensureCsrfCookie()
  const response = await apiClient.post('/secret-diary/unlock', { password })

  return response.data.data
}

export async function lockSecretDiary() {
  await ensureCsrfCookie()
  const response = await apiClient.post('/secret-diary/lock')

  return response.data.data
}

export async function requestSecretDiaryPasswordReset(email) {
  await ensureCsrfCookie()
  const response = await apiClient.post('/secret-diary/forgot-password', { email })

  return response.data
}

export async function resetSecretDiaryPassword(payload) {
  await ensureCsrfCookie()
  const response = await apiClient.post('/secret-diary/reset-password', payload)

  return response.data
}

export async function listDiaryNotes(params = {}) {
  const response = await apiClient.get('/secret-diary/notes', { params })

  return response.data
}

export async function getDiaryNote(identifier) {
  const response = await apiClient.get(`/secret-diary/notes/${encodeURIComponent(identifier)}`)

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

  const response = await apiClient.post(identifier ? `/secret-diary/notes/${encodeURIComponent(identifier)}` : '/secret-diary/notes', formData)

  return response.data.data
}

export async function deleteDiaryNote(identifier) {
  await apiClient.delete(`/secret-diary/notes/${encodeURIComponent(identifier)}`)
}

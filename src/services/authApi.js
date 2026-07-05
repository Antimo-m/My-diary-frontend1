import apiClient, { ensureCsrfCookie } from './apiClient'

export async function getCurrentUser() {
  const response = await apiClient.get('/user')

  return response.data.user
}

export async function login(credentials) {
  await ensureCsrfCookie()
  const response = await apiClient.post('/login', credentials)

  return response.data.user
}

export async function register(payload) {
  await ensureCsrfCookie()
  const response = await apiClient.post('/register', payload)

  return response.data.user
}

export async function requestPasswordReset(email) {
  await ensureCsrfCookie()
  const response = await apiClient.post('/forgot-password', { email })

  return response.data
}

export async function resetPassword(payload) {
  await ensureCsrfCookie()
  const response = await apiClient.post('/reset-password', payload)

  return response.data
}

export async function logout() {
  await ensureCsrfCookie()
  await apiClient.post('/logout')
}

export async function deleteAccount(password) {
  await ensureCsrfCookie()
  const response = await apiClient.delete('/user', { data: { password } })

  return response.data
}

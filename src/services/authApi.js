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

export async function logout() {
  await ensureCsrfCookie()
  await apiClient.post('/logout')
}

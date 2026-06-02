import apiClient from './apiClient'

export async function updateProfile(payload) {
  const response = await apiClient.put('/user', payload)

  return response.data.user
}

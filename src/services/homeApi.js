import apiClient from './apiClient'

export async function getHomeOverview() {
  const response = await apiClient.get('/home')

  return response.data
}

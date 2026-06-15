import apiClient from './apiClient'

export async function updateProfile(payload) {
  const response = await apiClient.put('/user', payload)

  return response.data.user
}

export async function getProfileStats({ board = 'all', period = 'week' } = {}) {
  const params = { period }

  if (board === 'daily') {
    params.board = 'daily'
  } else if (board !== 'all') {
    params.board = 'project'
    params.project_id = board
  }

  const response = await apiClient.get('/stats/profile', { params })

  return response.data.data ?? response.data
}

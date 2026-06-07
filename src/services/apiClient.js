import axios from 'axios'

export const backendBaseUrl = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/$/, '')
export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withXSRFToken: true,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

apiClient.interceptors.request.use((config) => {
  config.headers['Accept-Language'] = localStorage.getItem('my-diary-locale') || document.documentElement.lang || 'it'

  return config
})

function readCookie(name) {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')
    .slice(1)
    .join('=')
}

export async function ensureCsrfCookie() {
  await axios.get(`${backendBaseUrl}/sanctum/csrf-cookie`, {
    withCredentials: true,
    headers: {
      Accept: 'application/json',
      'Accept-Language': localStorage.getItem('my-diary-locale') || document.documentElement.lang || 'it',
      'X-Requested-With': 'XMLHttpRequest',
    },
  })

  const xsrfToken = readCookie('XSRF-TOKEN')

  if (xsrfToken) {
    apiClient.defaults.headers.common['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken)
  }
}

export default apiClient

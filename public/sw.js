const APP_VERSION = 'v2'
const APP_CACHE = `my-diary-app-${APP_VERSION}`
const RUNTIME_CACHE = `my-diary-runtime-${APP_VERSION}`
const APP_SHELL = ['/', '/offline.html', '/manifest.webmanifest', '/my-diary-logo.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => cache.addAll(APP_SHELL)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith('my-diary-') && ![APP_CACHE, RUNTIME_CACHE].includes(key))
        .map((key) => caches.delete(key)),
    )),
  )
  self.clients.claim()
})

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cachedResponse = await cache.match(request)
  const networkResponsePromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone())
      }

      return networkResponse
    })
    .catch(() => null)

  return cachedResponse || await networkResponsePromise || caches.match('/offline.html')
}

function offlineApiResponse() {
  return new Response(JSON.stringify({
    message: 'My Diary e offline. Le modifiche richiedono una connessione attiva.',
    offline: true,
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 503,
  })
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const requestUrl = new URL(request.url)

  if (requestUrl.origin !== self.location.origin) {
    return
  }

  if (requestUrl.pathname.startsWith('/api')) {
    event.respondWith(fetch(request).catch(offlineApiResponse))
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone()
          caches.open(APP_CACHE).then((cache) => cache.put('/', responseClone))

          return response
        })
        .catch(() => caches.match('/') || caches.match('/offline.html')),
    )
    return
  }

  if (request.method !== 'GET') {
    return
  }

  event.respondWith(staleWhileRevalidate(request))
})

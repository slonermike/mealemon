// Passthrough service worker — satisfies PWA installability without caching.
// No offline support is intentional; the app requires network to function.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request))
})

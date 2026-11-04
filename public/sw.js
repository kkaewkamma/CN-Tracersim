const CACHE_NAME = 'cn-tracersim-v5.2.2-clean';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Navigation / HTML request: Network-First to guarantee latest UI release
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
          return networkResponse;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Static assets: Cache-First with fallback to network
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
        }
        return networkResponse;
      });
    })
  );
});

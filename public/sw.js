const CACHE_PREFIX = 'gra-pwa-';
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const BASE_PATH = new URL('./', self.location.href).pathname;
const assetPath = (fileName) => `${BASE_PATH}${fileName}`;

const STATIC_ASSETS = [
  BASE_PATH,
  assetPath('index.html'),
  assetPath('manifest.json'),
  assetPath('pwa-192.png'),
  assetPath('pwa-512.png'),
  assetPath('pwa-192-maskable.png'),
  assetPath('pwa-512-maskable.png'),
  assetPath('apple-touch-icon.png')
];

// Install Event: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up old SW caches without touching localStorage
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache.startsWith(CACHE_PREFIX) && cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
          return undefined;
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Serve cached content offline, dynamic cache for build assets
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Do not cache analytics or third-party API calls with credentials
  if (url.protocol.startsWith('http') && url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update for cache freshness if online
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
        }).catch(() => {/* Offline mode - ignore network failure */});

        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Offline fallback for navigation/html
        if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match(assetPath('index.html'));
        }
        return Response.error();
      });
    })
  );
});

const CACHE = 'kazicoach-shell-v2';
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Never cache mutations, cross-origin resources, API responses, auth, payments or user data.
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) caches.open(CACHE).then(cache => cache.put('/index.html', response.clone()));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  const cacheable = ['script', 'style', 'font', 'image', 'manifest', 'worker'].includes(request.destination);
  if (!cacheable) return;

  event.respondWith(
    caches.match(request).then(cached => {
      const update = fetch(request).then(response => {
        if (response.ok && response.type === 'basic') caches.open(CACHE).then(cache => cache.put(request, response.clone()));
        return response;
      });
      return cached || update;
    })
  );
});

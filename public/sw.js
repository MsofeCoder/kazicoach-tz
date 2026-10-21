const CACHE = `kazicoach-shell-${self.__KC_VERSION || 'v2-dev'}`;
const SCOPE = new URL('./', self.location.href).pathname; // e.g. /kazicoach-tz/
const INDEX = new URL('./index.html', self.location.href).href;
// Build step supplies all public shell assets, including lazy document readers.
const ASSETS = (self.__KC_ASSETS || ['index.html']).map(path => new URL(path, self.location.href).href);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('kazicoach-shell-') && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(SCOPE)) return;
  // Recovery/confirmation codes and arbitrary query URLs must never become cache keys.
  if (url.search || url.hash) return;
  if (event.request.headers.has('authorization') || event.request.cache === 'no-store') return;
  const shell = ASSETS.includes(url.href);
  // Account APIs and unknown URLs never enter the shell cache.
  if (!shell && event.request.mode !== 'navigate') return;
  if (event.request.mode === 'navigate' && ![SCOPE, `${SCOPE}index.html`].includes(url.pathname)) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok && !/no-store|private/.test(response.headers.get('cache-control') || '')) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy)));
        }
        return response;
      }).catch(async () => event.request.mode === 'navigate' ? (await caches.match(INDEX)) || Response.error() : Response.error());
    })
  );
});

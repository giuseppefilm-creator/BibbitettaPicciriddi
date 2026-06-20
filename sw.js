/* =========================================================
   Bibbietta · Catania — Service Worker
   Versione cache: aggiorna CACHE_NAME per forzare refresh
   ========================================================= */

const CACHE_NAME = 'bibbietta-ct-v1';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon.svg',
];

/* --- Install: pre-carica tutti i file in cache --- */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* --- Activate: rimuove vecchie cache --- */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* --- Fetch: cache-first, fallback a rete --- */
self.addEventListener('fetch', event => {
  // Ignora richieste non-GET e richieste esterne (WhatsApp, Maps…)
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Salva in cache solo risposte valide
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline e non in cache: ritorna la home
        return caches.match('./index.html');
      });
    })
  );
});

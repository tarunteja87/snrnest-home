/* ============================================================
   SNR NEST — service worker
   Offline support + smart asset caching (PWA)
   ------------------------------------------------------------
   Strategies:
   - HTML navigations ..... network-first, cache fallback
   - images / fonts ....... cache-first, runtime cache
   - css / js / others .... stale-while-revalidate
   ------------------------------------------------------------
   Bump VERSION below whenever site files change so every
   visitor gets the fresh copy on their next visit.
   ============================================================ */
const VERSION = 'v35';
const PRECACHE = 'snrnest-pre-' + VERSION;
const RUNTIME = 'snrnest-run-' + VERSION;

/* Files always available offline */
const PRECACHE_FILES = [
  './',
  'index.html',
  '404.html',
  'about.html',
  'services.html',
  'contact.html',
  'services/bpo-services.html',
  'services/manpower-services.html',
  'services/website-development.html',
  'services/internship.html',
  'services/training-placements.html',
  'css/tailwind.css',
  'css/style.css',
  'js/script.js',
  'assets/vendor/lucide.min.js',
  'assets/vendor/qrcode.js',
  'assets/fonts/PlusJakartaSans.woff2',
  'assets/fonts/fonts.css',
  'assets/favicon.svg',
  'site.webmanifest',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/apple-touch-icon.png',
  'images/logo/logo.svg',
  'images/hero/hero-1.jpg',
  'images/hero/hero-2.jpg',
  'images/hero/hero-3.jpg',
  'images/hero/hero-4.jpg',
  'images/services/bpo-hiring.jpg',
  'images/services/manpower.jpg',
  'images/services/dark-store.jpg',
  'images/services/website-development.jpg',
  'images/services/talent-acquisition.jpg',
  'images/about/team-collaboration.jpg',
  'assets/og-image.jpg',
];

/* Install: precache the app shell, take over immediately */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_FILES))
      .then(() => self.skipWaiting())
  );
});

/* Activate: purge caches from older versions */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('snrnest-') && key !== PRECACHE && key !== RUNTIME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* Allow the page to ask for an immediate update (SKIP_WAITING) */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  /* Only handle same-origin GET (no range requests, no cross-origin) */
  if (request.method !== 'GET') return;
  if (request.headers.has('range')) return;
  try {
    if (new URL(request.url).origin !== self.location.origin) return;
  } catch (err) {
    return;
  }

  /* 1. Page navigations: try the network first so updates arrive fast,
        fall back to the cached shell when offline. */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(PRECACHE).then((cache) => cache.put('./', copy)).catch(() => {});
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match('./') || caches.match('index.html'))
        )
    );
    return;
  }

  /* 2. Images & fonts: cache-first (they rarely change). */
  if (request.destination === 'image' || request.destination === 'font') {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(RUNTIME).then((cache) => cache.put(request, copy)).catch(() => {});
            return response;
          })
      )
    );
    return;
  }

  /* 3. Everything else (css/js/…): stale-while-revalidate —
        serve instantly from cache, refresh in the background. */
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

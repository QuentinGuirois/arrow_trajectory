const CACHE_NAME = 'archery-ballistics-v1';
const APP_SHELL = [
  './',
  './index.html',
  './documentation.html',
  './style-extra.css',
  './manifest.webmanifest',
  './aero-models.js',
  './arrow-builder.js',
  './bow-utils.js',
  './calibration.js',
  './diagnostic-indicators.js',
  './draw-weight.js',
  './physics-advanced.js',
  './physics-archery.js',
  './plotly-charts.js',
  './script-archery.js',
  './share-schema.js',
  './simulation-params.js',
  './spine-database.js',
  './spine-display.js',
  './spine-evaluation.js',
  './spine-generalized.js',
  './spine-lookup.js',
  './spine-normalizer.js',
  './spine-recommendation.js',
  './spine-sources.js',
  './spine-tables.js',
  './spine-trends.js',
  './state.js',
  './trajectory.worker-archery.js',
  './tuning-diagnostics.js',
  './units.js',
  './util.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      }))
  );
});

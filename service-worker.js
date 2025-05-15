const CACHE_NAME = 'backtesting-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './estilos.css',
  './javascript.js',
  './manifest.json',
  './Logo_app_trading-removebg-preview.png',
  './almacenamiento.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      )
    )
  );
});

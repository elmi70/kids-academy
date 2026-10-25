/* Offline support. Bump CACHE when you change files so devices pick up the new version. */
const CACHE = 'kids-academy-v1';
const FILES = [
  './',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'index.html',
  'manifest.webmanifest',
  'shared/app.css',
  'shared/core.js',
  'shared/hub.js',
  'shared/lang.js',
  'subjects/coding/app.js',
  'subjects/coding/index.html',
  'subjects/coding/levels.js',
  'subjects/english/app.js',
  'subjects/english/data.js',
  'subjects/english/index.html',
  'subjects/german/app.js',
  'subjects/german/data.js',
  'subjects/german/index.html',
  'subjects/maths/app.js',
  'subjects/maths/gen.js',
  'subjects/maths/index.html',
  'subjects/reading/app.js',
  'subjects/reading/data.js',
  'subjects/reading/index.html',
  'subjects/writing/app.js',
  'subjects/writing/data.js',
  'subjects/writing/index.html'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => {
    const net = fetch(e.request).then(res => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return res; }).catch(() => hit || caches.match('index.html'));
    return hit || net;
  }));
});

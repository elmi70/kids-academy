"""Writes sw.js with the list of every file to keep for offline use. Run after adding or removing files. Bump VERSION when content changes."""
import os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERSION = sys.argv[1] if len(sys.argv) > 1 else 'v2'
files = []
for root, dirs, fs in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in ('tests', '.github', 'tools', 'node_modules', '__pycache__')]
    for f in fs:
        p = os.path.relpath(os.path.join(root, f), ROOT).replace(os.sep, '/')
        if p in ('sw.js', '.nojekyll') or p.endswith('.md') or p.endswith('.pyc'): continue
        files.append(p)
files.sort()
body = ',\n  '.join("'%s'" % f for f in ['./'] + files)
sw = """/* Offline support. Bump CACHE when you change files so devices pick up the new version. */
const CACHE = 'kids-academy-%s';
const FILES = [
  %s
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  // network first, so a fixed file reaches the phone straight away; the saved copy is used when offline
  e.respondWith(fetch(e.request).then(res => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return res; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(hit => hit || caches.match('index.html'))));
});
""" % (VERSION, body)
open(os.path.join(ROOT, 'sw.js'), 'w').write(sw)
print('sw.js:', len(files), 'files, cache', VERSION)

// Fisher Family Adventures service worker: offline shell, scoped to this site only.
// Bump VERSION on every deploy that changes cached files.
const VERSION = 'ffa-v0.2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/ff-192.png', './icons/ff-512.png', './icons/ff-maskable-512.png'];
self.addEventListener('install', e => {
  e.waitUntil((async () => { const c = await caches.open(VERSION); await c.addAll(SHELL); await self.skipWaiting(); })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => { for (const k of await caches.keys()) if (k.startsWith('ffa-') && k !== VERSION) await caches.delete(k); await self.clients.claim(); })());
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  if (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('.webmanifest')) {
    // network-first so new deploys show up at once; cached build when offline
    e.respondWith((async () => { const c = await caches.open(VERSION);
      try { const r = await fetch(req, { cache: 'no-cache' }); if (r.ok) c.put(req, r.clone()); return r; }
      catch (_) { return (await c.match(req, { ignoreSearch: true })) || (await c.match('./index.html')) || Response.error(); } })());
    return;
  }
  e.respondWith((async () => { const c = await caches.open(VERSION); const hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit; const r = await fetch(req); if (r.ok) c.put(req, r.clone()); return r; })());
});

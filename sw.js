/* SANTIAGO LIFTSS — offline cache (works at the gym with no signal) */
const V = 'liftss-v4';
const CORE = [
  './', './index.html', './manifest.json',
  './img/logo.webp', './img/logo-sm.webp', './img/sant7.webp',
  './img/bg-noise.webp', './img/bg-restore.webp', './img/bg-focus.webp',
  './img/icon-180.png', './img/icon-192.png', './img/icon-512.png', './img/favicon-64.png',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== V + '-fonts').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);
  if (url.origin === location.origin) {
    // stale-while-revalidate: opens instantly offline, updates in the background
    e.respondWith(caches.open(V).then(async c => {
      const hit = await c.match(r, { ignoreSearch: true });
      const net = fetch(r).then(res => { if (res && res.ok) c.put(r, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }));
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(V + '-fonts').then(async c => {
      const hit = await c.match(r);
      if (hit) return hit;
      const res = await fetch(r);
      c.put(r, res.clone());
      return res;
    }).catch(() => caches.match(r)));
  }
});

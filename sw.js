/* ===================================================
   Mileage — Service Worker
   - Pre-caches the static shell on install.
   - Cache-first for same-origin GETs, with opportunistic caching of
     anything not in the pre-cache (e.g. bg.jpg, fetched on first use).
   - External requests (Google Fonts + Photon/Nominatim/Valhalla/FE.gov)
     pass straight through so the existing best-effort error paths still
     run when the user is offline.
   - Bump VERSION to force a cache refresh after a deploy.
   =================================================== */

const VERSION    = 'v15';
const CACHE_NAME = `mileage-${VERSION}`;

const LANGS = [
  'cs','da','de','el','en','es','fi','fr','hi','hu','id','it',
  'ja','ko','nl','no','pl','pt','ro','ru','sv','tr','vi','zh',
];

const SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon.svg',
  './kastrack.png',
  './model-aliases.json',
  ...LANGS.flatMap(l => [`./lang/${l}.json`, `./titles/${l}.json`]),
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // External APIs / fonts: don't intercept. The app's existing fetch error
  // paths handle the offline case.
  if (url.origin !== self.location.origin) return;
  if (e.request.method !== 'GET')          return;

  e.respondWith((async () => {
    const cached = await caches.match(e.request);
    if (cached) return cached;
    try {
      const res = await fetch(e.request);
      // Opportunistically cache successful same-origin responses (this is
      // how bg.jpg ends up cached after first online use).
      if (res && res.ok && res.type === 'basic') {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      }
      return res;
    } catch {
      return new Response('', { status: 503, statusText: 'Service Unavailable' });
    }
  })());
});

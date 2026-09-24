/*
  sw.js — service worker for offline use and "Add to Home Screen".

  Strategy (README § Tech architecture / Roadmap Phase 2):
    * App shell (HTML, CSS, JS, manifest, icons, the core JSON every screen needs):
      precached on install, then served stale-while-revalidate so a new deploy
      shows up on the next load without ever blocking on the network.
    * Content (data/units/*, data/gnt/*): network-first, cached on use, so a
      chapter you have opened once is readable offline.
    * Google Fonts: cached on use (opaque responses), fallback fonts otherwise.

  Bump CACHE_VERSION whenever the shell changes in a way old caches must not serve.
  All paths are relative to this file so the app works at any GitHub Pages sub-path.
*/

const CACHE_VERSION = 'v4';
const SHELL_CACHE = `koine-shell-${CACHE_VERSION}`;
const CONTENT_CACHE = `koine-content-${CACHE_VERSION}`;
const FONT_CACHE = `koine-fonts-${CACHE_VERSION}`;

const SHELL = [
  './',
  './index.html',
  './drill.html',
  './alphabet.html',
  './reading.html',
  './settings.html',
  './grammar.html',
  './read.html',
  './lexicon.html',
  './progress.html',
  './manifest.json',
  './css/base.css',
  './css/theme-classic.css',
  './css/theme-lexis.css',
  './css/theme-nous.css',
  './js/theme.js',
  './js/storage.js',
  './js/srs.js',
  './js/data.js',
  './js/drill.js',
  './js/alphabet.js',
  './js/reading.js',
  './js/morph.js',
  './js/grammar.js',
  './js/nav.js',
  './js/lexicon.js',
  './js/achievements.js',
  './js/chain.js',
  './js/speech.js',
  './js/session-view.js',
  './js/pwa.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './data/curriculum.json',
  './data/lexicon.json',
  './data/alphabet.json',
  './data/paradigms.json',
  './data/irregular-verbs.json',
  './data/forms.json',
  './data/stats.json',
  './data/units/unit-01-foundations.json',
  './data/gnt/john.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      // addAll would reject the whole install on one 404; add individually so a missing optional file cannot brick offline mode
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('koine-') && ![SHELL_CACHE, CONTENT_CACHE, FONT_CACHE].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    if (url.pathname.includes('/data/units/') || url.pathname.includes('/data/gnt/')) {
      event.respondWith(networkFirst(req, CONTENT_CACHE));
    } else {
      event.respondWith(staleWhileRevalidate(req, SHELL_CACHE));
    }
    return;
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(req, FONT_CACHE));
  }
});

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req, { ignoreSearch: true });
  const network = fetch(req).then((res) => {
    if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  if (cached) return cached;
  const res = await network;
  if (res) return res;
  return offlineFallback(req);
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const cached = await cache.match(req);
    return cached || offlineFallback(req);
  }
}

function offlineFallback(req) {
  if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
    return caches.match('./index.html');
  }
  return new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
}

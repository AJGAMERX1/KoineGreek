/*
  recover.js — classic (non-module) script loaded first on every page.
  If the page's module graph fails to link (typically a mix of old cached
  modules and a new page right after a deploy), clear caches, drop the
  service worker and reload once. Prevents the "unstyled page, nothing
  works" state until the next manual refresh.
*/
(function () {
  var KEY = 'koine.recovered';
  function looksLikeStaleModules(msg) {
    msg = String(msg || '');
    return /does not provide an export|Importing binding name|import.*not found|Failed to fetch dynamically imported module|Unexpected token 'export'|export declarations|Cannot use import statement|Importing a module script failed/i.test(msg);
  }
  function recover() {
    var done = false;
    try { done = sessionStorage.getItem(KEY) === '1'; sessionStorage.setItem(KEY, '1'); } catch (e) {}
    if (done) return; // already tried once this session: avoid a reload loop
    var work = [];
    if (window.caches && caches.keys) work.push(caches.keys().then(function (keys) { return Promise.all(keys.map(function (k) { return caches.delete(k); })); }));
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) work.push(navigator.serviceWorker.getRegistrations().then(function (regs) { return Promise.all(regs.map(function (r) { return r.unregister(); })); }));
    Promise.all(work).catch(function () {}).then(function () { location.reload(); });
  }
  window.addEventListener('error', function (e) {
    if (looksLikeStaleModules(e.message) || (e.target && e.target.tagName === 'SCRIPT' && e.target.type === 'module')) recover();
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    if (e.reason && looksLikeStaleModules(e.reason.message || e.reason)) recover();
  });
  // A healthy load clears the flag so a future stale state can recover again.
  window.addEventListener('load', function () { setTimeout(function () { try { if (document.documentElement.getAttribute('data-theme')) sessionStorage.removeItem(KEY); } catch (e) {} }, 3000); });
})();

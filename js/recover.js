/*
  recover.js — classic (non-module) script loaded first on every page.
  If the page's module graph fails to link (typically a mix of old cached
  modules and a new page right after a deploy), clear caches, drop the
  service worker and reload once. Prevents the "unstyled page, nothing
  works" state until the next manual refresh.
*/
(function () {
  // ---- Pre-apply the saved theme before the first paint (no white flash in dark mode) ----
  // Mirrors js/theme.js applyTheme(); must stay in sync with the FONTS ids there.
  try {
    var raw = localStorage.getItem('koine.v1');
    var st = raw ? JSON.parse(raw).settings || {} : {};
    var root = document.documentElement;
    var theme = ['classic', 'lexis', 'nous'].indexOf(st.theme) >= 0 ? st.theme : 'classic';
    var mode = st.mode === 'dark' ? 'dark' : 'light';
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-mode', mode);
    root.style.colorScheme = mode; // browser canvas goes dark immediately, before CSS arrives
    var fonts = ['baloo', 'garamond', 'grotesk', 'noto-sans', 'noto-serif'];
    var slots = { fontGreek: 'data-font-greek', fontDisplay: 'data-font-display', fontBody: 'data-font-body' };
    for (var k in slots) if (fonts.indexOf(st[k]) >= 0) root.setAttribute(slots[k], st[k]);
    // Backgrounds of the three themes so even the pre-CSS canvas matches (kept in sync with css/theme-*.css)
    var bg = { classic: ['#FFFDF8', '#1B2420'], lexis: ['#F3E9D2', '#241811'], nous: ['#FFFFFF', '#0D0D0D'] }[theme][mode === 'dark' ? 1 : 0];
    root.style.backgroundColor = bg;
    // the <meta name="theme-color"> comes after this script in <head>; set it once the head is parsed
    document.addEventListener('DOMContentLoaded', function () {
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', bg);
    });
  } catch (e) {}

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

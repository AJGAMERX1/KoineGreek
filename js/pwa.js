/*
  pwa.js — registers the service worker (sw.js) and captures the browser's
  install prompt so the Settings screen can offer "Add to Home Screen".
  Import once per page: `import { initPwa } from './js/pwa.js'; initPwa();`
*/

let deferredPrompt = null;
const listeners = new Set();

export function initPwa() {
  if ('serviceWorker' in navigator) {
    // Relative path so it works at any GitHub Pages sub-path.
    navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('service worker registration failed', err));
    // When an updated worker takes control (new deploy), reload once so the page and its
    // modules all come from the same version.
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded || !navigator.serviceWorker.controller) return;
      reloaded = true;
      if (sessionStorage.getItem('koine.swreload') === '1') return;
      sessionStorage.setItem('koine.swreload', '1');
      location.reload();
    });
    window.addEventListener('load', () => setTimeout(() => sessionStorage.removeItem('koine.swreload'), 5000));
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    listeners.forEach((fn) => fn(true));
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    listeners.forEach((fn) => fn(false));
  });
}

/** True when the browser has offered an install prompt we can show. */
export function canInstall() {
  return !!deferredPrompt;
}

/** Subscribe to install-availability changes: fn(available: boolean). */
export function onInstallAvailable(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Show the native install prompt. Resolves to 'accepted' | 'dismissed' | 'unavailable'. */
export async function promptInstall() {
  if (!deferredPrompt) return 'unavailable';
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  listeners.forEach((fn) => fn(false));
  return outcome;
}

/** True when running as an installed app (standalone display mode). */
export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

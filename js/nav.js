/*
  nav.js — the shared bottom navigation for top-level screens (Path, Read,
  Lexicon, Progress, Profile). The Progress tab is opt-in via
  settings.showProgress (Settings → "Show Progress tab").
*/
import { getSettings } from './storage.js';

const ICONS = {
  path: '<svg viewBox="0 0 24 24"><path d="M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3l9-8z" fill="currentColor"/></svg>',
  read: '<svg viewBox="0 0 24 24"><path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H12v18H5.5A1.5 1.5 0 0 1 4 19.5v-15zM20 4.5A1.5 1.5 0 0 0 18.5 3H12v18h6.5a1.5 1.5 0 0 0 1.5-1.5v-15z" fill="currentColor"/></svg>',
  lexicon: '<svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M14.5 14.5L21 21" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>',
  progress: '<svg viewBox="0 0 24 24"><path d="M6 4h12v3a5 5 0 0 1-4.5 5v2h1.5a1 1 0 0 1 0 2h-6a1 1 0 0 1 0-2H10v-2A5 5 0 0 1 6 7V4zM4 5h2v2a3 3 0 0 1-2-2V5zm16 0h-2v2a3 3 0 0 0 2-2V5zM8 20h8v2H8v-2z" fill="currentColor"/></svg>',
  profile: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="currentColor"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="currentColor"/></svg>',
};

const TABS = [
  { id: 'path', label: 'Path', href: 'index.html' },
  { id: 'read', label: 'Read', href: 'read.html' },
  { id: 'lexicon', label: 'Lexicon', href: 'lexicon.html' },
  { id: 'progress', label: 'Progress', href: 'progress.html', optional: 'showProgress' },
  { id: 'profile', label: 'Profile', href: 'settings.html' },
];

/** Render the nav into `container` (a .bottom-nav element) with `active` highlighted. */
export function renderNav(container, active) {
  const settings = getSettings();
  container.innerHTML = TABS.filter((t) => !t.optional || settings[t.optional]).map((t) => `
    <button class="nav-item ${t.id === active ? 'active' : ''}" type="button" data-href="${t.href}" aria-current="${t.id === active ? 'page' : 'false'}">
      ${ICONS[t.id]}<span class="nav-item-label">${t.label}</span>
    </button>`).join('');
  container.querySelectorAll('.nav-item').forEach((b) => b.addEventListener('click', () => {
    if (!b.classList.contains('active')) location.href = b.dataset.href;
  }));
}

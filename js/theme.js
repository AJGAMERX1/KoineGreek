/*
  theme.js — applies and persists the visual theme (Classic/Lexis/Nous)
  and light/dark mode. This is the real implementation behind what will
  eventually be a Settings screen; index.html's theme-switcher panel is
  a working demo of exactly this, not a mock.
*/

import { getSettings, setSettings } from './storage.js';

/** Working placeholder app name — change freely, referenced in index.html's title too. */
export const APP_NAME = 'Rhema';

export const THEMES = ['classic', 'lexis', 'nous'];
export const MODES = ['light', 'dark'];

/** Font families every theme loads; a learner can assign any of them to any slot (mix and match). */
export const FONTS = [
  { id: 'theme', label: 'Theme default' },
  { id: 'baloo', label: 'Baloo 2', theme: 'Classic' },
  { id: 'garamond', label: 'EB Garamond', theme: 'Lexis' },
  { id: 'grotesk', label: 'Space Grotesk', theme: 'Nous' },
  { id: 'noto-sans', label: 'Noto Sans' },
  { id: 'noto-serif', label: 'Noto Serif' },
];
export const FONT_SLOTS = ['fontGreek', 'fontDisplay', 'fontBody']; // Greek text, headings, body

/** Apply a theme/mode pair (and font overrides) to the document without persisting (used at boot). */
export function applyTheme(theme, mode, fonts = {}) {
  const root = document.documentElement;
  root.setAttribute('data-theme', THEMES.includes(theme) ? theme : 'classic');
  root.setAttribute('data-mode', MODES.includes(mode) ? mode : 'light');
  for (const slot of FONT_SLOTS) {
    const attr = `data-font-${slot.slice(4).toLowerCase()}`; // fontGreek -> data-font-greek
    const value = fonts[slot];
    if (value && value !== 'theme' && FONTS.some((f) => f.id === value)) root.setAttribute(attr, value);
    else root.removeAttribute(attr);
  }
}

/** Read saved settings and apply them. Call once on page load. */
export function initTheme() {
  const s = getSettings();
  applyTheme(s.theme, s.mode, s);
  return { theme: s.theme, mode: s.mode };
}

/** Set + persist + apply one font slot ('fontGreek' | 'fontDisplay' | 'fontBody'). */
export function setFont(slot, fontId) {
  if (!FONT_SLOTS.includes(slot)) throw new Error(`unknown font slot ${slot}`);
  const settings = setSettings({ [slot]: FONTS.some((f) => f.id === fontId) ? fontId : 'theme' });
  applyTheme(settings.theme, settings.mode, settings);
  return settings;
}

/** Set + persist + apply a new theme, keeping the current mode. */
export function setTheme(theme) {
  const settings = setSettings({ theme });
  applyTheme(settings.theme, settings.mode, settings);
  return settings;
}

/** Set + persist + apply a new light/dark mode, keeping the current theme. */
export function setMode(mode) {
  const settings = setSettings({ mode });
  applyTheme(settings.theme, settings.mode, settings);
  return settings;
}

export function toggleMode() {
  const { mode } = getSettings();
  return setMode(mode === 'dark' ? 'light' : 'dark');
}

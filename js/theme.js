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

/** Apply a theme/mode pair to the document without persisting (used at boot). */
export function applyTheme(theme, mode) {
  const root = document.documentElement;
  root.setAttribute('data-theme', THEMES.includes(theme) ? theme : 'classic');
  root.setAttribute('data-mode', MODES.includes(mode) ? mode : 'light');
}

/** Read saved settings and apply them. Call once on page load. */
export function initTheme() {
  const { theme, mode } = getSettings();
  applyTheme(theme, mode);
  return { theme, mode };
}

/** Set + persist + apply a new theme, keeping the current mode. */
export function setTheme(theme) {
  const settings = setSettings({ theme });
  applyTheme(settings.theme, settings.mode);
  return settings;
}

/** Set + persist + apply a new light/dark mode, keeping the current theme. */
export function setMode(mode) {
  const settings = setSettings({ mode });
  applyTheme(settings.theme, settings.mode);
  return settings;
}

export function toggleMode() {
  const { mode } = getSettings();
  return setMode(mode === 'dark' ? 'light' : 'dark');
}

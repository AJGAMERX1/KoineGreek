# Agent notes for this project

Quick orientation for continuing this build (originally scaffolded in Claude, intended to be picked up in Claude Code). Read `README.md` first for the full plan — this file is the short "don't relitigate these decisions" version, plus pointers.

## What's already decided (don't re-derive from scratch)

- **Static site, no backend, no build step for v1.** Plain HTML/CSS/JS. Targets GitHub Pages.
- **State lives in one `localStorage` key**, accessed only through `js/storage.js`'s functions (`getSettings`/`setSettings`, `getVocabItem`/`updateVocabItem`, `getReadingRecord`/`setReadingRecord`). Don't call `localStorage` directly from elsewhere — if a new kind of trackable data is needed (e.g. grammar-drill records), add a new top-level key to the store shape in `storage.js` and matching accessor functions, following the existing pattern, rather than inventing a new convention.
- **SRS scheduling goes through `js/srs.js`** (`scheduleReview(record, quality)` — simplified SM-2). Any new spaced-repetition surface (vocab, reading, future parsing drills) should call this same function, not a new one.
- **Theming is a shared-data/swappable-skin architecture, not per-theme forks of the app.** One HTML structure + shared data, three theme CSS files scoped by `[data-theme="classic|lexis|nous"]` and `[data-theme="…"][data-mode="dark"]`. `js/theme.js` applies `data-theme`/`data-mode` attributes on `<html>` from saved settings. When building a new screen: write the markup once, add CSS rules to *all three* theme files (not just one), don't hardcode colors in HTML — use CSS custom properties from the active theme.
- **Style is a user Settings preference**, not a fixed choice — all three themes (Classic/Lexis/Nous) are meant to ship together, switchable at any time, light/dark included.
- **No AI-graded free-text translation in v1.** Read & Translate is self-graded (reveal reference translation, learner self-rates Missed it/Close/Nailed it). Don't add a live grading API call without first setting up a separate serverless adjunct (see README's "Known limitation") — a static GitHub Pages site cannot hold the secret key that would require.
- **Only public-domain reference translations** (KJV, YLT, WEB) may be bundled. Never add ESV/NIV/NASB or other copyrighted translation text to `data/`.
- **Content is sourced, not hand-invented**: SBLGNT (Greek text), MorphGNT (morphological tagging), Trenchard frequency list (vocab ordering). The `data/*.sample.json` files are small hand-written placeholders in the target shape — replacing them with real derived data is the first real content task, not a nice-to-have.

## File map

- `index.html` — working theme-switcher proof of concept (lesson-path screen, Classic/Lexis/Nous × light/dark all live). Treat this as the pattern for every future screen, not as a one-off demo to throw away.
- `css/base.css` — shared/reset styles, theme-independent layout.
- `css/theme-{classic,lexis,nous}.css` — one file per theme, each defining the same set of CSS custom properties (`--bg`, `--surface`, `--ink`, `--muted`, `--border`, `--accent`/theme-specific accent names, `--font-display`, `--font-body`) plus a `[data-mode="dark"]` override block. Keep the custom-property *names* consistent across all three files so shared component CSS in `base.css` can reference them theme-agnostically.
- `js/storage.js`, `js/srs.js`, `js/theme.js` — see above.
- `data/*.sample.json` — placeholder content; real schema to build out against.

## Design tokens reference (extracted from the mockups)

**Classic:** `--primary:#16795A; --primary-dark:#0F5A41; --gold:#D9A521; --coral:#E25C4B;` fonts: Baloo 2 (display) + Noto Sans (body).
**Lexis:** `--bg:#F3E9D2; --ink:#3B2417; --accent:#7A1F1F; --gold:#B8860B;` fonts: EB Garamond (display) + Noto Serif (body). Manuscript/parchment feel — double gold rules, wax-seal-style circular nodes.
**Nous:** `--bg:#FFFFFF; --ink:#111111; --accent:#0047FF;` fonts: Space Grotesk (display) + Noto Sans (body). Minimal editorial feel — numbered list rows instead of a path, no ornament.

Full color/dark-mode values are in `css/theme-*.css` — the above is just enough to recognize which theme you're looking at.

## Visual reference (read-only, don't copy markup from it)

Full mockup set (all themes/modes/orientations + lesson/parsing/read screens): **https://claude.ai/artifact/LCg9owamSJS9oFz3iKriqp**

This is in Claude's artifact `.dc.html` format, which won't run outside Claude's artifact canvas (needs its `support.js`/`DCLogic` runtime). Use it to see layout/spacing/interaction intent, then re-implement in plain HTML/CSS/JS matching this project's conventions — don't paste `.dc.html` markup in directly.

## Immediate next task

Per the README roadmap: replace `data/*.sample.json` with real content for Unit 1 (Greek alphabet + εἰμί, "to be") sourced from Trenchard's frequency list, then build the vocab drill screen (`js/srs.js` already has the scheduling logic it needs).

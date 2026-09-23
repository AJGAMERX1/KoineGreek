# Koine Greek Learning App

A Duolingo-style web app for learning **Koine (New Testament) Greek** — not Modern Greek. Static site, hosted on GitHub Pages, installable on a phone as a PWA, no backend required for v1.

> **Working name:** the mockups were built under the codename "Logos," which we agreed was too overused. This scaffold uses the placeholder name **Rhema** (ῥῆμα — "word, utterance") — it's a single constant (`APP_NAME` in `js/theme.js` and the `<title>` in `index.html`), change it freely. It is unrelated to the visual theme names below (Classic / Lexis / Nous), which are display *styles*, not app names.

## Why not just use Duolingo?

Duolingo's Greek course teaches Modern Greek, which differs from Koine (NT-era, ~300 BC–300 AD) in pronunciation, vocabulary, and — most importantly for a learning app — grammar emphasis. Koine has structural features that need their own dedicated drill types, not just reskinned vocab flashcards:

- **Full case system** (nominative/genitive/dative/accusative/vocative) across three declensions — meaning matters, word order famously doesn't.
- **Six principal parts per verb** — the same verb (e.g. λύω) looks very different in each of its six principal-part forms, and NT Greek is full of high-frequency verbs with irregular ("strange") principal parts.
- **Aspect-based tense system** — present/imperfect (imperfective), aorist (perfective), perfect (stative) — this is a different mental model than English tense, not a vocab problem.
- **Middle/passive voice + deponent verbs** — verbs that are middle/passive in form but active in meaning, which trips up nearly every first-year Greek student.
- **Heavy participle use** — Koine leans on participles (verbal adjectives) far more than English does; reading fluency depends on recognizing them fast.

So the curriculum is organized around *grammar tracks*, with the verb system treated as its own extended track (not folded into general vocab), plus dedicated "strange/irregular verb" drilling.

## Curriculum structure

1. **Alphabet & pronunciation** — letter forms, diphthongs, breathing marks, accents. Pronunciation scheme is a **user setting**: Erasmian (most common in seminaries) vs. reconstructed Koine.
2. **Core vocabulary** — highest-frequency NT words first (see Content sourcing below), taught with spaced repetition from day one.
3. **Nominal system** — the three declensions, cases, definite article, adjective agreement.
4. **Verb system (extended track)** — its own multi-stage path:
   - Present tense, ω-verbs
   - Contract verbs (-άω, -έω, -όω)
   - Future tense
   - Aorist: 1st (weak) and 2nd (strong) aorist
   - Imperfect
   - Middle/passive voice
   - Perfect tense
   - Subjunctive mood
   - Participles (present, aorist, perfect — all voices)
   - **Deponents & irregular/"strange" verbs** — a dedicated drill pool of the NT's most common irregular verbs (εἰμί, οἶδα, λέγω/εἶπον, ἔρχομαι/ἦλθον, ὁράω/εἶδον, etc.), drilled by principal part.
5. **Reading track** — starts with the Gospel of John (simplest NT Greek vocabulary/syntax), verse by verse, using the **Read & Translate** mode below.

## Exercise types

- **Vocab drills** — multiple choice, typing, and audio (where feasible), all backed by the SRS scheduler (see Data model).
- **Parsing drills** — given an inflected form, identify case/number/gender (nouns) or person/number/tense/voice/mood (verbs). This is where "strange verb" drilling lives.
- **Grammar/pattern drills** — fill-in-the-blank and transformation exercises (e.g. "change this present-tense verb to aorist").
- **Read & Translate** — the reading-comprehension mode: a real NT verse is shown in Greek with known/new-word highlighting; the learner forms their own translation mentally, taps **Reveal** to see a public-domain reference translation, and self-rates (Missed it / Close / Nailed it), which feeds the SRS.

## Content sourcing & licensing

No content needs to be hand-built from scratch — real, freely licensed sources exist:

| Content | Source | License note |
|---|---|---|
| Greek NT text | **SBLGNT** (SBL Greek New Testament) | Free-licensed for this kind of use; check current SBLGNT license terms before distribution |
| Morphological tagging (lemma + full parse per word) | **MorphGNT** | Open-source, CC-BY |
| Vocabulary frequency list | **Trenchard's *Complete Vocabulary Guide to the Greek New Testament*** frequency data | Widely used as a public frequency reference for NT vocab ordering |
| Reference translations for Read & Translate | **KJV, YLT (Young's Literal Translation), WEB (World English Bible)** | Public domain — safe to bundle |

**Do not bundle ESV, NIV, NASB, or other modern copyrighted translations** — they require licensing and are not safe to ship in a static, freely-distributed repo.

`data/*.sample.json` in this scaffold contains small hand-written *samples* in the target shape (a handful of lexicon entries, one unit, one verse) so the app runs out of the box. Replacing these with the full SBLGNT/MorphGNT/Trenchard-derived datasets is the first real content task.

## Tech architecture

- **Pure static site** — plain HTML/CSS/JS, no build step required (though one can be added later). Deploys directly to GitHub Pages.
- **No backend for v1.** All progress/settings/SRS state lives client-side in `localStorage` (schema in `js/storage.js`). If usage grows, `localStorage` can be swapped for `IndexedDB` behind the same `storage.js` API without touching the rest of the app.
- **PWA** — add a `manifest.json` and a service worker (not yet included in this scaffold — see Roadmap) so the app can be "Added to Home Screen" on a phone and used offline.
- **Known limitation, stated honestly:** true AI-graded free-text translation ("did the user's exact English wording capture the Greek correctly?") requires a live API call with a secret key, which a static GitHub Pages site *cannot* hold securely. That needs a small external serverless function (Cloudflare Worker / Vercel function / similar) as an adjunct service. **v1 deliberately avoids this** and uses the self-graded reveal-and-compare pattern in Read & Translate instead (show reference translation, learner self-rates). AI-graded translation is a good v2+ feature once a serverless adjunct is worth the added complexity.

## Theming system: shared data, swappable skin

Three visual styles were mocked up, all teaching the same content through the same data:

- **Classic** — chunky, bright, Duolingo-genre-inspired (green/gold/coral, rounded path nodes).
- **Lexis** — illuminated-manuscript styling (parchment/oxblood/gold, serif type, wax-seal-style nodes).
- **Nous** — minimal editorial styling (white/black/electric-blue, numbered-list lesson rows instead of a path).

Rather than picking one, style is a **user-selectable Settings preference** (like an e-reader's page/sepia/night modes), stored in `settings.theme` (`'classic' | 'lexis' | 'nous'`) and `settings.mode` (`'light' | 'dark'`). The architecture is:

- **One shared data/logic layer** — lesson data, exercise state, SRS scheduling, progress — identical regardless of theme.
- **A swappable presentation layer** — each theme is a CSS file (`css/theme-*.css`) scoped under `[data-theme="…"]` (and `[data-theme="…"][data-mode="dark"]` for dark variants), applied to the *same* HTML structure. `js/theme.js` applies the saved theme/mode as `data-theme`/`data-mode` attributes on `<html>` at load and whenever Settings changes it.

`index.html` in this scaffold is a working proof of concept of exactly this: one lesson-path screen, one dataset, a live theme + light/dark switcher. Build every future screen the same way — shared markup/data, theme-scoped CSS — rather than duplicating a screen per theme.

## Data model

All state lives under one `localStorage` key (`koine.v1`), read/written only through `js/storage.js` — nothing else should touch `localStorage` directly. Shape:

```js
{
  settings: {
    theme: 'classic',        // 'classic' | 'lexis' | 'nous'
    mode: 'light',           // 'light' | 'dark'
    pronunciation: 'erasmian' // 'erasmian' | 'koine'
  },
  progress: {
    streak: 0,
    xp: 0,
    unitsCompleted: [],      // unit ids
    lastActiveDate: null
  },
  vocabSRS: {
    // keyed by lexicon item id, one record per vocab item
    '<itemId>': { interval, easeFactor, dueDate, repetitions, lastReviewed }
  },
  readingHistory: {
    // keyed by verse id (e.g. "john-1-1")
    '<verseId>': { attempts, lastRating, dueDate, ... }
  }
}
```

This generalizes the spaced-repetition record shape (originally designed just for vocab) into the storage pattern for *all* app state: every trackable thing is a keyed record with its own scheduling/metadata, read and written through the same small API (`getVocabItem`/`updateVocabItem`, `getReadingRecord`/`setReadingRecord`, `getSettings`/`setSettings`). New trackable content (grammar drills, parsing drills) should follow the same pattern — a new top-level key, same shape, same API style — rather than inventing a new storage convention.

`js/srs.js` implements a simplified SM-2 spaced-repetition algorithm. The app's 3-button self-rating UI (Missed it / Close / Nailed it) maps to SM-2 quality scores, which produce a new interval, ease factor, and due date per item. This same function drives both vocab review and reading-verse review.

## Project structure

```
koine-greek-app/
├── README.md          — this file
├── CLAUDE.md           — quick-orientation notes for an agent continuing this build
├── .gitignore
├── index.html          — working theme-switcher demo (lesson path screen)
├── css/
│   ├── base.css         — shared layout/reset, theme-independent
│   ├── theme-classic.css
│   ├── theme-lexis.css
│   └── theme-nous.css
├── js/
│   ├── storage.js        — localStorage schema + accessor API
│   ├── srs.js             — SM-2 spaced-repetition scheduler
│   └── theme.js            — applies/persists theme + light/dark mode
└── data/
    ├── lexicon.sample.json         — sample vocab entries (replace with full Trenchard-ordered list)
    ├── unit-01-foundations.sample.json — sample lesson unit
    └── john-1-1.sample.json         — sample Read & Translate verse (Greek + KJV/YLT/WEB)
```

## Visual reference

The full set of mockups (all three themes, light + dark, vertical + horizontal, plus lesson/parsing/read screens) lives in a Claude artifact and is the visual source of truth for building out real screens:

**https://claude.ai/artifact/LCg9owamSJS9oFz3iKriqp**

Note: those mockups are built in Claude's artifact "Design Component" format (`.dc.html`), which is **not portable** — it depends on a runtime (`support.js`, `DCLogic`) that only exists inside Claude's artifact canvas. They're for visual/UX reference only; none of that markup should be copied verbatim into this project. This scaffold's `index.html` re-implements the Classic-theme lesson-path screen from scratch in plain HTML/CSS/JS as the pattern to follow for the rest.

## Roadmap

**Phase 1 — Foundation (this scaffold)**
- [x] Project structure, data model, SRS algorithm
- [x] Theme system (3 skins × light/dark) with working switcher
- [ ] Replace sample data with real SBLGNT/MorphGNT/Trenchard-derived content (start with Unit 1: alphabet + εἰμί)

**Phase 2 — Core loop**
- [ ] Vocab drill screen (MCQ + typing) wired to `srs.js`
- [ ] Lesson path screen wired to real progress data (this scaffold's `index.html` is the starting point)
- [ ] Settings screen (theme picker, pronunciation toggle) — the working switcher in `index.html` already proves this out; needs to become a real screen
- [ ] PWA basics: `manifest.json` + service worker for offline + "Add to Home Screen"

**Phase 3 — Verb track & parsing**
- [ ] Verb system track (contract verbs → aorist → middle/passive → perfect → subjunctive → participles → deponents)
- [ ] Parsing drill screen (identify case/number/gender or person/tense/voice/mood)
- [ ] Dedicated "strange/irregular verb" drill pool

**Phase 4 — Reading**
- [ ] Read & Translate screen (built from this scaffold's data model), starting with John 1
- [ ] Expand verse dataset beyond the John 1:1 sample

**Phase 5 — Polish / stretch**
- [ ] Audio pronunciation (Erasmian + reconstructed Koine)
- [ ] Leaderboards/streaks/social sharing
- [ ] Optional serverless adjunct for AI-graded free-text translation (see limitation above) — only if justified

## Running locally

No build step needed:

```bash
cd koine-greek-app
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploying to GitHub Pages

```bash
git init   # if not already done
git add .
git commit -m "Initial scaffold"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

Then in the repo's Settings → Pages, set the source to the `main` branch, root folder. The site will be live at `https://<username>.github.io/<repo-name>/`.

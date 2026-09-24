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

## How it teaches

`PEDAGOGY.md` is the learning-science foundation: spaced retrieval, comprehensible
input, production and feedback, specialized to Koine. It is the source of truth
for instructional design; every feature should satisfy one of its labeled
mandates (M1–M32). Two of its numbers shape everything below:

- **~310 words** (those occurring 50+ times) are **~80% of the NT text**. Books
  I–VIII teach exactly this core, alongside the grammar.
- **~98% coverage** is needed to read unassisted, so every reading shows real
  Greek with every unknown word one tap from its gloss and parse, from Unit 1.

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

### The generated spine (`data/curriculum.json`)

The curriculum is built by `scripts/build_data.py` from `scripts/curriculum.py`
and the real GNT data, so the "which words when" is measured, not guessed:

| Books | Content | Vocabulary |
|---|---|---|
| I Foundations | alphabet (4 lessons), ten most common words, εἰμί, the article & cases, **read John 1:1–2** | hand-picked |
| II Nouns | 1st/2nd declension, prepositions + cases, adjectives, pronouns, names, **read John 1:3–5** | hand-picked |
| III Present verbs | ω-verbs, deponents, compounds, contract verbs, imperfect, infinitive, relative/interrogative pronouns, **read John 1:6–13** | hand-picked |
| IV Third declension | consonant stems, -μα/-ος neuters, -ις/-ευς, πᾶς πολύς μέγας εἷς, numbers, **read John 1:14–18** | hand-picked |
| V Future & aorist | future, 1st/2nd aorist, aorist & future passive, **read John 1:19–28** | hand-picked + remaining core |
| VI Perfect & moods | perfect, pluperfect, subjunctive, imperative, articular infinitive, **read John 1:29–42** | next frequency band |
| VII Participles | all tenses/voices, uses, genitive absolute, periphrasis, **read John 1:43–51** | next frequency band |
| VIII Strange verbs | principal parts, -μι verbs, the irregular-verb pool, conditionals & optative, **read 1 John 1** | next band; **every 50+ word is now known** |
| IX–XXXV Reading | one Book per NT book, ordered by measured lexical difficulty (John, 1–3 John, Matthew, Mark … Hebrews, Pastorals). Before each chapter, a vocab lesson introduces the not-yet-known words that chapter uses (10+ occurrences only; rarer words are tap-to-gloss). | data-driven, i+1 |

Each grammar lesson carries a short explicit `rule` (a few sentences + real
examples; PEDAGOGY M20), the paradigms it introduces (`data/paradigms.json`,
every cell validated against forms attested in the GNT), and its blocked set of
new words. Reading lessons record their measured coverage (`known` /
`schedulable`) so the app can show a learner how much of a passage they truly own.

## Exercise types

- **Vocab drills** — multiple choice, typing, and audio (where feasible), all backed by the SRS scheduler (see Data model).
- **Parsing drills** — given an inflected form, identify case/number/gender (nouns) or person/number/tense/voice/mood (verbs). This is where "strange verb" drilling lives.
- **Grammar/pattern drills** — fill-in-the-blank and transformation exercises (e.g. "change this present-tense verb to aorist").
- **Read & Translate** — the reading-comprehension mode: a real NT verse is shown in Greek with known/new-word highlighting; the learner forms their own translation mentally, taps **Reveal** to see a public-domain reference translation, and self-rates (Missed it / Close / Nailed it), which feeds the SRS.

## Content sourcing & licensing

All content is derived from open sources by one script — nothing textual is hand-typed:

| Content | Source | License |
|---|---|---|
| Greek NT text, per-word lemma + parse | **SBLGNT** via **MorphGNT SBLGNT** (`github.com/morphgnt/sblgnt`) | SBLGNT text CC BY 4.0; morphology CC BY-SA 3.0 |
| Citation forms, glosses, Strong's/GK numbers | **MorphGNT morphological lexicon** (`lexemes.yaml`; glosses from the public-domain Dodson lexicon) | CC BY-SA 3.0 |
| Vocabulary frequency ordering | **Computed from MorphGNT lemma counts** (137,554 tokens, 5,461 lemmas) | derivative; Trenchard's book is *not* copied |
| Reference translations | **KJV, YLT** (scrollmapper/bible_databases), **WEB** (ebible.org) | Public domain |

Full attribution and rules are in `data/LICENSES.md`. **Do not bundle ESV, NIV,
NASB, or other modern copyrighted translations.**

### Regenerating the data

```bash
python3 scripts/build_data.py
```

Downloads the sources into `scripts/cache/` (gitignored) on first run, then writes
everything under `data/`. Hand-authored reference grammar and the lesson spine
live in `scripts/curriculum.py`; edit that, not the generated JSON.

## Tech architecture

- **Pure static site** — plain HTML/CSS/JS, no build step required (though one can be added later). Deploys directly to GitHub Pages.
- **No backend for v1.** All progress/settings/SRS state lives client-side in `localStorage` (schema in `js/storage.js`). If usage grows, `localStorage` can be swapped for `IndexedDB` behind the same `storage.js` API without touching the rest of the app.
- **PWA** — `manifest.json` + `sw.js` make the app installable ("Add to Home Screen") and usable offline: the app shell, the lexicon, the curriculum index, Unit 1 and John are precached; other units and chapters are cached the first time they are opened. App files are served network-first (revalidating past the browser's HTTP cache) so a deploy never mixes old and new modules; the cache is the offline fallback. `js/recover.js` clears caches and reloads once if a module graph ever fails to link, and `js/pwa.js` reloads once when an updated worker takes control. Bump `CACHE_VERSION` in `sw.js` on each deploy. All paths are relative so it works at any GitHub Pages sub-path.
- **Known limitation, stated honestly:** true AI-graded free-text translation ("did the user's exact English wording capture the Greek correctly?") requires a live API call with a secret key, which a static GitHub Pages site *cannot* hold securely. That needs a small external serverless function (Cloudflare Worker / Vercel function / similar) as an adjunct service. **v1 deliberately avoids this** and uses the self-graded reveal-and-compare pattern in Read & Translate instead (show reference translation, learner self-rates). AI-graded translation is a good v2+ feature once a serverless adjunct is worth the added complexity.

## Theming system: shared data, swappable skin

Three visual styles were mocked up, all teaching the same content through the same data:

- **Classic** — chunky, bright, Duolingo-genre-inspired (green/gold/coral, rounded path nodes).
- **Lexis** — illuminated-manuscript styling (parchment/oxblood/gold, serif type, wax-seal-style nodes).
- **Nous** — minimal editorial styling (white/black/electric-blue, numbered-list lesson rows instead of a path).

Rather than picking one, style is a **user-selectable Settings preference** (like an e-reader's page/sepia/night modes), stored in `settings.theme` (`'classic' | 'lexis' | 'nous'`) and `settings.mode` (`'light' | 'dark'`). The architecture is:

- **One shared data/logic layer** — lesson data, exercise state, SRS scheduling, progress — identical regardless of theme.
- **A swappable presentation layer** — each theme is a CSS file (`css/theme-*.css`) scoped under `[data-theme="…"]` (and `[data-theme="…"][data-mode="dark"]` for dark variants), applied to the *same* HTML structure. `js/theme.js` applies the saved theme/mode as `data-theme`/`data-mode` attributes on `<html>` at load and whenever Settings changes it.

`settings.html` holds the live theme + light/dark switcher (it started life as a demo panel on the lesson path). Build every screen the same way — shared markup/data, theme-scoped CSS — rather than duplicating a screen per theme.

## Data model

All state lives under one `localStorage` key (`koine.v1`), read/written only through `js/storage.js` — nothing else should touch `localStorage` directly. Shape:

```js
{
  settings: {
    theme: 'classic',        // 'classic' | 'lexis' | 'nous'
    mode: 'light',           // 'light' | 'dark'
    pronunciation: 'erasmian', // 'erasmian' | 'koine'
    translation: 'web'       // 'web' | 'kjv' | 'ylt' — reference translation in Read & Translate
  },
  progress: {
    streak: 0,
    xp: 0,
    unitsCompleted: [],      // unit ids
    lessonsCompleted: [],    // lesson ids; the lesson path derives complete/active/locked from this
    lastActiveDate: null
  },
  vocabSRS: {
    // keyed by lexicon item id (== the lemma, e.g. 'λόγος'), one record per vocab item
    '<itemId>': { interval, easeFactor, dueDate, repetitions, lastReviewed }
  },
  readingHistory: {
    // keyed by verse id (e.g. "john-1-1"); same SM-2 fields as vocabSRS plus reading extras
    '<verseId>': { interval, easeFactor, dueDate, repetitions, lastReviewed, attempts, lastRating, reveals }
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
├── PEDAGOGY.md         — learning-science mandates (M1–M32) every feature traces back to
├── .gitignore
├── index.html          — lesson-path screen (all 35 Books), due-review banner, theme switcher
├── drill.html          — vocab drill session (lesson mode: ?lesson=<id>; review mode: ?mode=due)
├── alphabet.html       — alphabet lessons (Book I lessons 1–4: ?lesson=u01-alphabet-N)
├── reading.html        — Read & Translate (?lesson=<reading lesson id>)
├── read.html           — Read tab: parallel Greek/English reader (?book=<slug>&chapter=<n>)
├── lexicon.html        — Lexicon tab: search + word detail (?q=<lemma> opens it)
├── progress.html       — Progress tab: achievement board (opt-in)
├── settings.html       — Settings / Profile: style, mode, pronunciation, voice, translation, placement, progress, install, backup, credits
├── placement.html      — placement test ("test out" of Books you already know)
├── manifest.json       — web app manifest (installable PWA)
├── sw.js               — service worker: offline caching (see Tech architecture)
├── icons/              — app icon (SVG source + 192/512/maskable/apple-touch PNGs)
├── css/
│   ├── base.css         — shared layout/reset, theme-independent
│   ├── theme-classic.css
│   ├── theme-lexis.css
│   └── theme-nous.css
├── js/
│   ├── storage.js        — localStorage schema + accessor API
│   ├── srs.js             — SM-2 spaced-repetition scheduler
│   ├── drill.js           — vocab drill logic: session builder, formats, distractors, grading, feedback (no DOM)
│   ├── reading.js         — Read & Translate logic: known/unknown annotation, coverage, verse rating → SRS record, XP (no DOM)
│   ├── morph.js           — decodes MorphGNT part-of-speech + 8-slot parse codes into English
│   ├── alphabet.js        — alphabet lesson logic: transliteration, syllabification, accent/breathing detection, session builder (no DOM)
│   ├── nav.js             — shared bottom navigation (Path · Read · Lexicon · [Progress] · Profile)
│   ├── lexicon.js         — lexicon search/filter + per-word status (no DOM)
│   ├── achievements.js    — achievement definitions + evaluation (no DOM)
│   ├── chain.js           — the daily review chain (drill → grammar → reading due modes)
│   ├── speech.js          — pronunciation via the Web Speech API (Greek voice / phonetic respelling)
│   ├── placement.js       — placement test: question sampling, pass mark, known-records seeding (no DOM)
│   ├── recover.js         — classic script: self-heal from a stale-module load (clear caches, reload once)
│   ├── pwa.js             — service-worker registration, controller-change reload, install-prompt capture
│   ├── session-view.js    — shared session UI: progress, intro / question / feedback / summary cards, Greek keyboard
│   ├── data.js            — cached loaders for data/*.json (the only module that fetches content)
│   └── theme.js            — applies/persists theme + light/dark mode
├── scripts/
│   ├── build_data.py     — downloads sources, derives every file under data/
│   ├── curriculum.py     — hand-authored alphabet, paradigms, principal parts, lesson spine + rule text
│   └── cache/            — downloaded sources (gitignored)
└── data/                 — GENERATED; see data/LICENSES.md
    ├── curriculum.json   — index of all 35 Books and 453 lessons
    ├── units/<id>.json   — full lesson content per Book (vocab, paradigms, rule, reading refs + coverage)
    ├── lexicon.json      — all 5,461 GNT lemmas, frequency-ranked, with gloss / pos / citation form
    ├── forms.json        — attested inflected forms + parse + count for every 10+ lemma (parsing drills)
    ├── paradigms.json    — 73 paradigms, cells validated against attested forms
    ├── irregular-verbs.json — principal parts for the strange-verb drill pool
    ├── alphabet.json     — letters, diphthongs, breathing, accents, both pronunciation schemes
    ├── stats.json        — per-chapter lexical coverage, used to sequence reading
    └── gnt/<book>.json   — every NT verse: tagged words + KJV / YLT / WEB
```

`gnt/*.json` word objects are `{t, l, p, m, n?}`: text as printed, lemma, MorphGNT
part-of-speech, 8-slot parse code, and the normalized form only when it differs
from the punctuation-stripped text.

## Visual reference

The full set of mockups (all three themes, light + dark, vertical + horizontal, plus lesson/parsing/read screens) lives in a Claude artifact and is the visual source of truth for building out real screens:

**https://claude.ai/artifact/LCg9owamSJS9oFz3iKriqp**

Note: those mockups are built in Claude's artifact "Design Component" format (`.dc.html`), which is **not portable** — it depends on a runtime (`support.js`, `DCLogic`) that only exists inside Claude's artifact canvas. They're for visual/UX reference only; none of that markup should be copied verbatim into this project. This scaffold's `index.html` re-implements the Classic-theme lesson-path screen from scratch in plain HTML/CSS/JS as the pattern to follow for the rest.

## Roadmap

**Phase 1 — Foundation (this scaffold)**
- [x] Project structure, data model, SRS algorithm
- [x] Theme system (3 skins × light/dark) with working switcher
- [x] Replace sample data with real SBLGNT/MorphGNT-derived content: full lexicon, forms, all 27 books, curriculum spine, Unit 1 content
- [x] PEDAGOGY.md adopted as the instructional-design source of truth

**Phase 2 — Core loop**
- [x] Alphabet lesson screen (`alphabet.html` + `js/alphabet.js`): letters in blocks of four with intro → recall, name / shape / sound / transliteration formats with confusable distractors, diphthongs, breathing, iota subscript, accents, syllables and punctuation, "read the word" typed transliteration of real GNT words, pronunciation-scheme toggle (Erasmian / Koine) saved to settings
- [x] Daily review chain (`js/chain.js`): the path's one "Review now" button runs due words → due forms → due verses as a single chained session (PEDAGOGY M3)
- [x] Vocab drill screen (`drill.html` + `js/drill.js`): due-first sessions, intro → recall for new words, MC → typed → produced formats by strength, diagnostic distractors, answer + one-line reason feedback, misses requeue and reset the SRS, XP by retrieval difficulty, streak counted only for real work
- [~] Lesson path screen wired to real progress data — now reads `curriculum.json` and derives lesson state from `progress.lessonsCompleted`; lesson screens themselves are still to build
- [x] Settings screen (`settings.html`, Profile tab): style + light/dark, pronunciation, reference translation, progress stats, install button, backup download / restore / reset, credits. The lesson-path theme switcher graduated here.
- [x] PWA basics: `manifest.json`, icons, `sw.js` (app shell + core data precached and served stale-while-revalidate; units and chapters cached on use, network-first), `js/pwa.js` install prompt

**Phase 3 — Verb track & parsing**
- [x] Verb system track (Books III–VIII in `data/curriculum.json`: present → deponents → contract → imperfect → future → aorist → passive → perfect → subjunctive → imperative → participles → -μι verbs → strange verbs), each lesson with rule text, paradigms and vocabulary
- [x] Parsing drill screen (`grammar.html` + `js/grammar.js`): paradigm table → cell-by-cell recall with confusable distractors → parse real attested GNT forms of the lesson's own words (`data/forms.json`) → produce forms by typing as cells strengthen; every cell is an SRS object (`formSRS`), due cells are reviewed from the path (chained after due vocab)
- [x] Dedicated "strange/irregular verb" drill pool (`data/irregular-verbs.json`, Book VIII): principal parts by part and by lemma, typed once strong
- [x] `scripts/smoke.mjs`: data cross-checks + builds a session for every one of the 453 lessons (run before deploying)

**Phase 4 — Reading**
- [x] Read & Translate screen (`reading.html` + `js/reading.js` + `js/morph.js`): one verse at a time from `data/gnt/`, known words plain / unknown dotted, tap any word for form, decoded parse, lemma and gloss, reveal WEB / KJV / YLT (choice saved), self-rate Missed it / Close / Nailed it → `readingHistory` via `srs.js`, XP drops with reveals of words the learner should own, summary offers to add looked-up words to the SRS; reading lessons with prep vocabulary route through the vocab drill first and back
- [x] Expand verse dataset: all 27 NT books are bundled in `data/gnt/` with KJV/YLT/WEB

**Phase 5 — Polish / stretch**
- [x] Placement test (`placement.html` + `js/placement.js`): six questions per grammar Book from its own words, paradigms and strange verbs; stops at the first Book not passed; confirming marks earlier Books complete and enters their words and endings into the review schedule as known
- [x] Pronunciation (`js/speech.js`): speaker buttons on every Greek prompt, verse and lexicon entry, auto-speak for new words and verses, adjustable speed (Settings → Voice). Koine scheme uses the device's Greek voice via the Web Speech API; Erasmian (no such voice exists anywhere) is a phonetic respelling read by an English voice, labelled as an approximation. No audio files are bundled.
- [x] Progress tab (single-player achievement board — a static site has no leaderboard): coverage meters, 73 achievements for words, verses, endings, streaks, Books and XP; opt-in via Settings → "Show Progress tab"
- [x] Read tab: parallel Greek / English reader over the whole NT (SBLGNT + WEB/KJV/YLT), verse-aligned columns on wide screens, tap-to-gloss, "Study this chapter" hand-off to the curriculum
- [x] Lexicon tab: all 5,461 lemmas searchable in Greek (accent-insensitive) or English, status per word, detail with attested forms and "add to my words"
- [ ] Social sharing
- [ ] Optional serverless adjunct for AI-graded free-text translation (see limitation above) — only if justified

## Running locally

No build step needed:

```bash
cd koine-greek-app
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploying to GitHub Pages

The site is fully static and every path is relative, so it works at a project sub-path
(`https://<username>.github.io/<repo-name>/`) with no build step. `.nojekyll` is
present so GitHub serves the files as-is.

```bash
node scripts/smoke.mjs        # data + logic checks; must print OK
git add -A
git commit -m "…"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

Then in the repo's **Settings → Pages**, set the source to **Deploy from a branch**,
branch `main`, folder `/ (root)`. The site goes live within a minute or two.

After deploying: open the site once on a phone, then use the Settings screen's
**Install** button (Android/Chrome) or Share → **Add to Home Screen** (iOS). To test
offline, install, open a chapter, then switch on airplane mode and reopen the app.

When you change `sw.js`'s cached shell in an incompatible way, bump `CACHE_VERSION`
there; browsers pick up the new worker on the next visit and drop the old caches.

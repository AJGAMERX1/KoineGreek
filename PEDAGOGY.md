# PEDAGOGY.md — Learning-Science Foundation for the Koine Greek App

> **What this document is.** A research-grounded specification for *how the app
> should teach*. It translates the strongest findings from cognitive science,
> second-language acquisition (SLA), and Koine-Greek-specific pedagogy into
> concrete, non-negotiable design mandates. Every feature — the SRS, the drills,
> the reading track, the lesson path, the gamification — should trace back to a
> principle here. When a product decision conflicts with a mandate in this
> document, this document wins unless there is a documented reason to override.
>
> **How Claude Code should use it.** Treat this as the source of truth for
> instructional design. Reference it from `CLAUDE.md`. When implementing a
> feature, find the relevant mandate (they are labeled **M#**) and satisfy it.
> The principle → feature map in Part V is the fastest index.

---

## The thesis in one paragraph

People do not learn a language by decoding it slowly with a grammar chart and a
dictionary; they learn it by understanding a large volume of meaningful input at
the right difficulty, by repeatedly *retrieving* what they're learning from
memory at *expanding time intervals*, by *producing* the language, and by getting
*immediate feedback*. For Koine specifically, the fastest path to reading the
Greek New Testament (GNT) is to (1) deliberately master the small set of
very-high-frequency words that make up ~80% of the text, (2) read real Greek from
day one with just enough scaffolding (glossing) that comprehension stays near the
~98% coverage threshold real reading requires, and (3) build automatic
form-recognition of the language's morphology through retrieval, not
parse-and-translate. The app's job is to engineer those four conditions —
**spaced retrieval, comprehensible input, production, and feedback** — and to make
them habitual. Gamification is the delivery vehicle for the *habit*, never a
substitute for the *learning behaviors themselves*.

---

## Part I — Domain-general learning science

These findings are among the most replicated in all of psychology. They apply to
any subject; the mandates specialize them to this app.

### 1. The spacing effect (distributed practice)

**Finding.** Study sessions spread out over time produce dramatically more
durable memory than the same amount of study massed together. This is one of the
most robust results in the science of learning, replicated for over 130 years.
The optimal gap between reviews *expands* as the target retention interval grows
— roughly, to remember something for months, reviews should eventually be spaced
weeks apart. Meta-analyses of spaced practice in second-language learning
specifically confirm the benefit.

**Design mandates.**
- **M1.** Vocabulary and morphology review MUST be scheduled by a spaced-repetition
  algorithm with *expanding* intervals, not re-shown in bulk within one session.
- **M2.** The interval for an item MUST grow after each successful retrieval
  (e.g., 1 day → 3 → 7 → 16 → 35 → …) and MUST shrink sharply after a failure.
- **M3.** A day's session SHOULD be assembled from *what is due today* across all
  prior lessons, not only the current lesson's items. "Due today" is the primary
  organizing unit of a session.

### 2. Retrieval practice (the testing effect)

**Finding.** *Recalling* information from memory strengthens it far more than
re-reading or re-studying it. In the largest meta-analysis (Adesope, Trevisan &
Sundararajan, 2017 — 272 effects from 188 experiments), practice testing beat
restudying by **d ≈ 0.51** and beat no-activity controls by **d ≈ 0.93**. Notable
details for design: a **single** well-placed test beat several massed tests; a
delay of **1–6 days** between practice and final test (d ≈ 0.82) beat same-day
practice (d ≈ 0.56); and — surprisingly — multiple-choice testing (d ≈ 0.70) was
at least as effective as short-answer (d ≈ 0.48) *when items are well-written*.
Retrieval works best **with feedback**.

**Design mandates.**
- **M4.** Every learning interaction MUST be a retrieval attempt, not a
  presentation. The default verb of the app is *recall*, not *read*. Introducing a
  word is followed immediately by asking for it.
- **M5.** Retrieval MUST be followed by immediate corrective feedback (show the
  correct answer + a short reason) — see M18.
- **M6.** Multiple-choice is a legitimate, effective retrieval format when
  distractors are *plausible and diagnostic* (near-miss glosses, forms of related
  lemmas). Free-recall / production formats (type the gloss, supply the form)
  SHOULD be mixed in as the learner strengthens, because they force deeper
  processing (see M12). Distractor quality is a first-class design concern, not an
  afterthought.
- **M7.** Do not over-test a single item within one session. Once retrieved
  correctly, an item should *leave* the session and return on a later day (this is
  M1/M2 and the single-test finding working together).

### 3. Interleaving (mixed practice) — with a critical caveat

**Finding.** Mixing different item types or skills within a practice set
(interleaving) improves long-term retention and, especially, the ability to
*discriminate* between confusable categories — compared with practicing one type
in a block. **But** there is an important nuance for beginners and for new
declarative material: recent evidence (Hwang, 2025, *Language Learning*) shows
that when the material is brand-new or the learner is struggling, an initial
**blocked** exposure to form the basic representation, *followed by*
interleaving, works better than interleaving from the very first contact.

**Design mandates.**
- **M8.** Practice sets SHOULD interleave item types (vocab recall, form
  recognition, parsing, reading) rather than running long single-type blocks —
  this is why the app mixes a parsing question into a vocab set.
- **M9.** **Block first, then interleave.** When a *new* concept or word is
  introduced, give a short blocked run to establish it, then fold it into
  interleaved review from the next session onward. Never interleave something the
  learner has never once seen.
- **M10.** Interleave *confusable* things deliberately — e.g., contrasting cases
  of the article, aorist vs. present stems, ἔρχομαι vs. ἔχω — because
  discrimination is exactly what interleaving trains.

### 4. Desirable difficulties (Bjork)

**Finding.** Conditions that make practice *feel harder and slower* — spacing,
interleaving, retrieval, varying the context, generating rather than recognizing —
tend to produce *better long-term learning*, even though they depress performance
*during* practice. The corollary is a trap: **performance during a session is not
a measure of learning.** Fluency-in-the-moment (from massed, blocked, re-read
practice) feels great and predicts little.

**Design mandates.**
- **M11.** Optimize the product for *long-term retention and reading ability*, not
  for in-session ease, speed, or a high in-session score. Explicitly resist
  designs that make today's session feel effortless at the cost of tomorrow's
  recall.
- **M12.** Prefer *generation* over *recognition* as the learner strengthens:
  progress an item from multiple-choice → type-the-answer → produce-in-context.
  Store a per-item "strength" that governs which format is used.
- **M13.** A small, well-calibrated amount of struggle is the goal state. Target a
  success rate in the ballpark of **~80–90%** on due items — high enough to stay
  motivated, low enough that real retrieval is happening. Tune SRS difficulty
  toward that band.

---

## Part II — Second-language acquisition (SLA)

Domain-general laws are necessary but not sufficient; language has its own
findings.

### 5. Comprehensible input (Krashen's i+1) — foundational, but not the whole story

**Finding.** Acquiring a language requires large amounts of *comprehensible input*
— messages the learner mostly understands, pitched just beyond current level
("i+1"). This is the most influential idea in modern language teaching and the
engine behind immersion and extensive-reading methods. Its strong form is
critiqued as unfalsifiable and as *necessary but not sufficient*: input alone,
without attention to form and without production, tends to leave gaps
(especially in accuracy and in low-salience grammar like inflectional endings).
Modern consensus: **rich comprehensible input is the foundation, combined with
noticing, output, and targeted explicit instruction.**

**Design mandates.**
- **M14.** The learner MUST encounter real, meaningful Greek early and often — not
  just isolated words and paradigm tables. The reading track is not a reward at the
  end; it is core from the first unit.
- **M15.** Input MUST be kept *comprehensible* by scaffolding (glossing,
  tap-to-reveal, audio, known-word highlighting) so the learner reads near the
  high-coverage threshold real comprehension requires (see M22–M24), rather than
  being dropped into text they can only decode 60% of.
- **M16.** Difficulty MUST be adaptive and incremental ("i+1"): the next thing is
  a small, reachable step beyond what the learner already controls. Sequence
  reading by measured lexical/grammatical load, not by canonical book order alone.

### 6. Output / production (Swain's output hypothesis)

**Finding.** *Producing* language (speaking, writing, supplying a form) does work
that comprehension alone does not: it forces the learner to *notice gaps* in what
they can say, to process syntax (not just meaning), and to test hypotheses about
how the language works. "Pushed output" — being stretched to produce slightly
beyond comfort — improves accuracy and fluency.

**Design mandates.**
- **M17.** Include production, not only recognition: type the Greek word, supply
  the correct inflected form, reconstruct a phrase, translate *into* Greek for
  high-frequency patterns. Production tasks SHOULD increase as an item strengthens
  (ties to M12). Even a reading app should ask the learner to produce, because
  production is where the endings finally get learned.

### 7. Feedback and error correction

**Finding.** Retrieval and output only pay off fully when paired with **timely,
specific feedback**. The testing-effect literature shows feedback amplifies gains
and corrects errors before they consolidate.

**Design mandates.**
- **M18.** Feedback MUST be immediate and *informative*: not just right/wrong, but
  the correct answer plus a one-line reason ("aorist because of the -σ- and the
  augment ἐ-"; "genitive after ἐκ"). Feedback is a teaching moment, the highest-
  value real estate in the app.
- **M19.** On errors, the item's SRS interval MUST reset/shrink and the item MUST
  return soon — errors are signal, not just score.

### 8. Explicit instruction vs. pure immersion (for grammar/morphology)

**Finding.** For *learnable rules* — and Greek morphology is full of them — a
meta-analytic result (Norris & Ortega, 2000; corroborated by Spada & Tomita,
2010) is that **explicit instruction produces larger measurable gains than purely
implicit exposure**, especially when the explicit teaching is embedded in
meaningful use rather than delivered as decontextualized rules. Explicit +
input + practice beats any one alone.

**Design mandates.**
- **M20.** Teach morphology explicitly *but briefly and in service of reading*: a
  short, clear statement of the pattern (e.g., how the aorist is formed), then
  immediately retrieval and real examples in context. Explicit rule → retrieval →
  input, in that tight loop. Never long grammar lectures divorced from text.
- **M21.** Because Greek is highly inflected and endings carry meaning (case,
  tense, voice, mood, person, number), the app MUST build *automatic recognition
  of morphology*, treating endings and stems as first-class learnable objects with
  their own retrieval schedule — not as something the learner will "pick up."

---

## Part III — Koine-Greek–specific pedagogy

### 9. The frequency reality of the GNT (the "80 / 5.5" rule)

**Finding.** The Greek New Testament contains roughly **5,420 distinct words
(lemmas)** across ~**138,150 total word occurrences**. The distribution is
extraordinarily top-heavy:
- **~310 words** occur 50+ times. They are only **5.5%** of the vocabulary but
  account for **~80% of all running text.**
- **~882 words** get you to **~90%** text coverage.
- The remaining ~10% of coverage requires learning 80%+ of the total vocabulary
  (thousands of rare words, ~2,000 of which occur only once) — an enormous effort
  for a small comprehension gain.

This is *not* the usual 80/20; it's closer to **80/5.5**, which makes
high-frequency-first study exceptionally efficient for Greek.

### 10. But 80% coverage is nowhere near enough to *read* (the lexical threshold)

**Finding.** Knowing 80% of the words in a text does not let you read it. Hu &
Nation (2000) found **nobody read adequately at 80% coverage**; only a minority
managed at 90–95%; **~98% coverage is the threshold for adequate unassisted
comprehension**, with ~95% as a *minimal, guided* threshold (Laufer &
Ravenhorst-Kalovski, 2010). Small vocabulary gains keep improving comprehension
even when they barely move the coverage percentage.

**The core tension, and how the app resolves it.** Mastering the ~310–882
highest-frequency words (§9) gets a learner to only ~80–90% coverage — genuinely
useful, but *below* the ~95–98% reading threshold (§10). The resolution is the
central architectural decision of this app:

- **M22.** **Deliberately master the high-frequency core with SRS.** Front-load the
  ~310 words at 50+ frequency, then extend toward ~882 (90% coverage). This is the
  spine of the vocabulary track and the single highest-leverage thing the learner
  can do.
- **M23.** **Scaffold the long tail so reading happens at ~98%+ effective
  coverage from day one.** Every word *outside* the learner's known set MUST be
  instantly glossable (tap/hover to reveal gloss + lemma + parse). This lifts a
  real GNT verse from ~80% *known* to ~100% *comprehensible*, putting the learner
  above the reading threshold immediately while their true known-vocabulary grows
  underneath. Known words are shown plainly; new words are marked and one tap from
  a gloss. (The Read track already does this — it is pedagogically load-bearing,
  not a convenience.)
- **M24.** **Track true known-vocabulary separately from what is glossed**, and use
  it to (a) grow the proportion of unglossed text over time and (b) choose reading
  passages at the right level (M16). The goal is a steadily rising percentage of
  text the learner reads *without* revealing anything.

### 11. Read for meaning, don't parse-and-translate (fluency vs. decoding)

**Finding.** The traditional grammar-translation method — memorize paradigms, then
laboriously parse every word and translate — reliably produces learners who can
*decode* slowly but never achieve *reading fluency*, and who abandon Greek because
reading stays painful. Communicative / "living-language" practitioners
(Randall Buth's Biblical Language Center and others) argue, and demonstrate, that
fluent reading only comes when the language is *internalized* — recognized
directly for meaning — rather than converted into English word by word. Their
methods spend 90%+ of time in the target language and use listening, storytelling
(TPRS), and physical response (TPR) to internalize before formal analysis.

**Design mandates.**
- **M25.** The target skill is **direct comprehension of Greek**, not translation
  into English. Design reading tasks around *understanding the Greek*
  (comprehension checks, "what happens," reveal-then-self-rate) rather than
  producing a polished English translation. Translation is a check, not the goal.
- **M26.** Build **automaticity**: reward fast, accurate form-recognition; use
  timed or low-friction retrieval so recognition becomes reflexive rather than
  computed. A learner should come to *see* ἦν as "was," not derive it.
- **M27.** Bring in **audio and, where feasible, listening-first exposure.**
  Hearing the language aids internalization and reading speed (BLC's central
  claim). At minimum, provide audio for vocabulary and read passages; ideally,
  short listening/comprehension moments before analysis.
- **M28.** Prefer **meaningful connected text and simple comprehensible sentences**
  over isolated paradigm drilling. Paradigms are taught (M20) but always cashed out
  immediately in real or realistic Greek.

---

## Part IV — Motivation & gamification (necessary, and dangerous)

**Finding.** Gamification (streaks, XP, levels, leagues) measurably improves
motivation, engagement, and daily retention in language apps — a systematic review
of the Duolingo literature confirms the engagement benefit. **But** there is a
well-documented failure mode ("gamification misuse"): learners begin optimizing
for *points and streak preservation* instead of learning, doing the minimum,
easiest actions to keep the number going. When the game rewards *time-on-app* or
*streak survival* rather than *learning behaviors*, it can actively degrade
learning while feeling productive.

**Design mandates.**
- **M29.** Gamify the **behaviors that cause learning**, per this document:
  completing *due* spaced reviews, reading new text, producing forms, clearing
  items to higher strength. Do **not** primarily reward raw time-on-app or a streak
  that can be preserved by trivial effort.
- **M30.** XP/rewards SHOULD scale with *retrieval difficulty and honesty* — a
  correctly produced (not multiple-choice-guessed) item, or a verse read with fewer
  reveals, is worth more. Never reward guessing or reveal-spamming.
- **M31.** Protect the learner from the streak becoming the point. Count a day as
  "done" only when *real due work* is completed; let a streak survive a genuine
  spaced-review day even if it's short. Avoid dark-pattern pressure that produces
  anxiety rather than habit.
- **M32.** Streaks/XP are the **habit layer** (they get the learner to show up
  daily, which spacing requires); the **learning layer** underneath them is
  everything in Parts I–III. Keep the two conceptually separate in the code so the
  reward system can never dilute the pedagogy.

---

## Part V — Principle → feature map (implementation index)

| Research principle | Mandates | Where it lives in the app |
|---|---|---|
| Spacing effect | M1–M3 | SRS scheduler; "due today" session builder |
| Retrieval practice | M4–M7 | All drills are recall; MC + production formats; feedback |
| Interleaving (block-then-mix) | M8–M10 | Mixed sessions; new items blocked first; confusable pairs |
| Desirable difficulties | M11–M13 | Format progression MC→type→produce; ~80–90% target accuracy |
| Comprehensible input | M14–M16 | Read track from Unit 1; glossing; adaptive difficulty |
| Output / production | M17 | Type-the-form, translate-into-Greek, phrase reconstruction |
| Feedback | M18–M19 | Immediate answer + one-line reason; error → SRS reset |
| Explicit morphology | M20–M21 | Short rule → retrieval → input; endings as SRS objects |
| GNT frequency (80/5.5) | M22 | High-frequency core vocab spine (310 → 882 words) |
| Lexical threshold (98%) | M23–M24 | Tap-to-gloss every unknown word; track true known-vocab |
| Fluency over decoding | M25–M28 | Comprehension-based reading; automaticity; audio; real text |
| Gamification (safely) | M29–M32 | Reward due-reviews/reading/production, not time or streak-gaming |

---

## Part VI — The recommended learning loop

Each of these is built from the mandates above; implement the app so a typical
day flows like this.

**Daily session = "Due first, then new."**
1. **Warm-up: due spaced reviews** (M1–M3). Pull every vocab item, ending, and
   pattern scheduled for today across all past lessons. Interleaved (M8), correct
   answers exit the session (M7), errors reset and requeue (M19).
2. **New material, blocked then mixed** (M9). Introduce a small set of new
   high-frequency words / one morphology pattern. Brief explicit statement (M20),
   a short blocked retrieval run to establish it, then merge into the interleaved
   pool.
3. **Read real Greek** (M14–M16, M22–M28). A short passage at the learner's level,
   at ~98% effective coverage via glossing. Known words plain, new words tappable.
   Learner forms a mental sense of meaning, then reveals to self-check and rates
   themselves (miss / close / nailed) — that self-rating feeds the SRS for the
   reading item and for the words in it.
4. **Produce** (M17). At least one production task per session — supply a form,
   type a word, reconstruct a phrase — scaled to current strength (M12).
5. **Feedback throughout** (M18). Every item ends in the correct answer and a
   one-line reason.
6. **Reward the right things** (M29–M32). XP for cleared due-reviews, words newly
   strengthened, verses read with few reveals, forms produced — not for minutes
   elapsed.

**The lesson path** is a scaffold over this loop: it sequences *which* new
high-frequency words and morphology patterns get introduced, in an order that
keeps each new reading passage at i+1 (M16). It is a curriculum spine, not the
learning mechanism — the SRS + reading loop is the mechanism.

---

## Part VII — Anti-patterns (things the app must NOT do)

- **Presentation without retrieval.** Showing a word/paradigm and moving on. Every
  exposure must ask for recall soon after (M4).
- **Massed cramming.** Drilling an item many times in one session and calling it
  learned. Violates M1/M7; feels good (M11 trap), doesn't last.
- **Grammar tables in a vacuum.** Teaching a full paradigm with no immediate
  retrieval and no real Greek to use it in (M20, M28).
- **Parse-and-translate as the goal.** Turning reading into an English-translation
  exercise instead of direct comprehension (M25).
- **Dropping the learner into under-covered text.** Real GNT at ~80% known with no
  glossing — below the reading threshold, produces frustration and slow decoding
  (M23).
- **Recognition-only forever.** Never progressing past multiple-choice to
  production; the endings never truly get learned (M12, M17).
- **Rewarding the streak, not the study.** Letting trivial actions preserve XP/
  streaks; optimizing engagement metrics over learning (M29–M31).
- **Front-loading rare vocabulary.** Teaching low-frequency words before the core
  310–882 are solid; poor return on effort (M22).

---

## Part VIII — What this implies for the SRS specifically

The SRS is where most of Part I lives, so make it correct:
- Expanding intervals per item, lengthening on success, sharply shortening on
  failure (M1, M2, M19). A simplified SM-2-style scheme is fine to start.
- The scheduler, not the lesson, owns the session: assemble each day from *due*
  items across all history (M3).
- Store a per-item **strength/stability** that drives (a) the interval and (b) the
  *format* — weak items get multiple-choice, strong items get production (M12).
- Separate schedules (or at least separate item types) for **words**, **endings/
  morphology patterns**, and **reading passages** — each is a retrievable object
  (M21, M24).
- Target ~80–90% success on due items; if a learner is far above, lengthen
  intervals / harden formats; if far below, shorten / soften (M13).
- Persist all of this locally (the app is a static GitHub-Pages site), and treat
  the schedule as the learner's real progress — not XP, which is only the habit
  layer (M32).

---

## Sources

**Cognitive science of learning**
- Adesope, Trevisan & Sundararajan (2017), *Rethinking the Use of Tests: A
  Meta-Analysis of Practice Testing*, Review of Educational Research —
  https://www.researchgate.net/publication/315706448_Rethinking_the_Use_of_Tests_A_Meta-Analysis_of_Practice_Testing
- Cepeda et al. / spacing meta-analytic reviews (distributed practice) —
  https://pmc.ncbi.nlm.nih.gov/articles/PMC5476736/ and
  http://www.lscp.net/persons/ramus/docs/EPR20.pdf
- Kim & Webb (2022), *The Effects of Spaced Practice on Second Language Learning:
  A Meta-Analysis* —
  https://www.researchgate.net/publication/358406370_The_Effects_of_Spaced_Practice_on_Second_Language_Learning_A_Meta-Analysis
- Firth (2021), *A systematic review of interleaving as a concept learning
  strategy*, Review of Education —
  https://bera-journals.onlinelibrary.wiley.com/doi/10.1002/rev3.3266
- Hwang (2025), *Undesirable Difficulty of Interleaved Practice: The Importance of
  Initial Blocked Practice…*, Language Learning —
  https://onlinelibrary.wiley.com/doi/10.1111/lang.12659
- Bjork & Bjork on desirable difficulties —
  https://www.unh.edu/teaching-learning-resource-hub/sites/default/files/media/2023-06/itow-introducing-desirable-difficulties-into-practice-and-instruction-bjork-and-bjork.pdf

**Second-language acquisition**
- Krashen, *Principles and Practice in Second Language Acquisition* (input
  hypothesis) — https://sdkrashen.com/content/books/principles_and_practice.pdf ;
  critique: https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1636777/full
- Swain, output hypothesis (overview) — https://en.wikipedia.org/wiki/Merrill_Swain ;
  empirical: https://files.eric.ed.gov/fulltext/EJ1127288.pdf
- Norris & Ortega (2000), explicit vs. implicit instruction meta-analysis —
  https://benjamins.com/catalog/sibil.48.18goo ; Spada & Tomita (2010) —
  https://onlinelibrary.wiley.com/doi/10.1111/j.1467-9922.2010.00562.x
- Hu & Nation (2000) & Laufer & Ravenhorst-Kalovski (2010), lexical coverage
  thresholds — https://files.eric.ed.gov/fulltext/EJ887873.pdf ;
  replication: https://onlinelibrary.wiley.com/doi/10.1111/lang.12622

**Koine / Biblical Greek**
- Greg Lanier, *Quantifying the Task of Learning Greek* (GNT frequency & coverage
  statistics) — https://glanier.wordpress.com/2015/01/27/quantifying-the-task-of-learning-greek/
- Institute of Biblical Greek, vocabulary frequency list —
  https://biblicalgreek.org/grammar/vocabulary-frequency-list/
- Randall Buth / Biblical Language Center methodology (communicative, living-
  language) — https://www.biblicallanguagecenter.com/methodology/

**Gamification**
- Systematic review of Duolingo gamification literature (2012–2020) —
  https://www.tandfonline.com/doi/full/10.1080/09588221.2021.1933540
- *When Gamification Spoils Your Learning* (misuse case study), ACM L@S —
  https://dl.acm.org/doi/10.1145/3491140.3528274

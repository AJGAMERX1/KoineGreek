#!/usr/bin/env python3
"""
build_data.py — derive the app's real content from open sources.

Run from the repo root:   python3 scripts/build_data.py

Sources (downloaded into scripts/cache/ on first run, then reused):
  * MorphGNT SBLGNT (github.com/morphgnt/sblgnt) — SBLGNT text (CC BY 4.0)
    with per-word lemma + morphological parse (CC BY-SA 3.0).
  * MorphGNT morphological lexicon (github.com/morphgnt/morphological-lexicon)
    — lexemes.yaml: citation forms, Dodson glosses, Strong's/GK numbers (CC BY-SA 3.0).
  * KJV + YLT (public domain) via github.com/scrollmapper/bible_databases (MIT packaging).
  * World English Bible (public domain) from ebible.org (verse-per-line archive).

Outputs (all under data/):
  lexicon.json        every GNT lemma, frequency-ranked, with gloss/pos/citation form
  forms.json          attested inflected forms (+parse, +count) for lemmas with ≥10 occurrences
  stats.json          per-chapter lexical-load stats used to sequence reading (PEDAGOGY M16)
  gnt/<book>.json     one file per NT book: every verse as tagged words + KJV/YLT/WEB
  curriculum.json     the beginner→pro lesson spine (from scripts/curriculum.py)
  units/<unit>.json   one file per unit, with resolved vocab / paradigms / readings

Frequency ordering is computed directly from MorphGNT lemma counts. That gives
the same practical ordering as Trenchard's published list (which is a
copyrighted book and is therefore NOT bundled or copied).
"""
from __future__ import annotations

import collections
import io
import json
import os
import re
import sys
import unicodedata
import urllib.request
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "scripts", "cache")
DATA = os.path.join(ROOT, "data")
sys.path.insert(0, os.path.join(ROOT, "scripts"))

MORPHGNT_RAW = "https://raw.githubusercontent.com/morphgnt/sblgnt/master/"
LEXEMES_URL = "https://raw.githubusercontent.com/morphgnt/morphological-lexicon/master/lexemes.yaml"
SCROLLMAPPER = "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/"
WEB_ZIP_URL = "https://ebible.org/Scriptures/eng-web_vpl.zip"

# (number, morphgnt code, slug, English name, WEB code, Greek title)
BOOKS = [
    (1, "Mt", "matthew", "Matthew", "MAT", "Κατὰ Μαθθαῖον"),
    (2, "Mk", "mark", "Mark", "MAR", "Κατὰ Μᾶρκον"),
    (3, "Lk", "luke", "Luke", "LUK", "Κατὰ Λουκᾶν"),
    (4, "Jn", "john", "John", "JOH", "Κατὰ Ἰωάννην"),
    (5, "Ac", "acts", "Acts", "ACT", "Πράξεις Ἀποστόλων"),
    (6, "Ro", "romans", "Romans", "ROM", "Πρὸς Ῥωμαίους"),
    (7, "1Co", "1-corinthians", "1 Corinthians", "1CO", "Πρὸς Κορινθίους Αʹ"),
    (8, "2Co", "2-corinthians", "2 Corinthians", "2CO", "Πρὸς Κορινθίους Βʹ"),
    (9, "Ga", "galatians", "Galatians", "GAL", "Πρὸς Γαλάτας"),
    (10, "Eph", "ephesians", "Ephesians", "EPH", "Πρὸς Ἐφεσίους"),
    (11, "Php", "philippians", "Philippians", "PHI", "Πρὸς Φιλιππησίους"),
    (12, "Col", "colossians", "Colossians", "COL", "Πρὸς Κολοσσαεῖς"),
    (13, "1Th", "1-thessalonians", "1 Thessalonians", "1TH", "Πρὸς Θεσσαλονικεῖς Αʹ"),
    (14, "2Th", "2-thessalonians", "2 Thessalonians", "2TH", "Πρὸς Θεσσαλονικεῖς Βʹ"),
    (15, "1Ti", "1-timothy", "1 Timothy", "1TI", "Πρὸς Τιμόθεον Αʹ"),
    (16, "2Ti", "2-timothy", "2 Timothy", "2TI", "Πρὸς Τιμόθεον Βʹ"),
    (17, "Tit", "titus", "Titus", "TIT", "Πρὸς Τίτον"),
    (18, "Phm", "philemon", "Philemon", "PHM", "Πρὸς Φιλήμονα"),
    (19, "Heb", "hebrews", "Hebrews", "HEB", "Πρὸς Ἑβραίους"),
    (20, "Jas", "james", "James", "JAM", "Ἰακώβου"),
    (21, "1Pe", "1-peter", "1 Peter", "1PE", "Πέτρου Αʹ"),
    (22, "2Pe", "2-peter", "2 Peter", "2PE", "Πέτρου Βʹ"),
    (23, "1Jn", "1-john", "1 John", "1JO", "Ἰωάννου Αʹ"),
    (24, "2Jn", "2-john", "2 John", "2JO", "Ἰωάννου Βʹ"),
    (25, "3Jn", "3-john", "3 John", "3JO", "Ἰωάννου Γʹ"),
    (26, "Jud", "jude", "Jude", "JUD", "Ἰούδα"),
    (27, "Re", "revelation", "Revelation", "REV", "Ἀποκάλυψις Ἰωάννου"),
]
BOOK_BY_NUM = {b[0]: b for b in BOOKS}

POS_NAMES = {
    "A-": "adjective", "C-": "conjunction", "D-": "adverb", "I-": "interjection",
    "N-": "noun", "P-": "preposition", "RA": "article", "RD": "demonstrative pronoun",
    "RI": "interrogative/indefinite pronoun", "RP": "personal pronoun",
    "RR": "relative pronoun", "V-": "verb", "X-": "particle",
}

# Lemmas present in MorphGNT but absent from lexemes.yaml.
GLOSS_OVERRIDES = {
    "δέω": {"gloss": "I bind, tie; (impersonal δεῖ) it is necessary, one must"},
    "ἐργάζομαι": {"gloss": "I work, trade, do"},  # upstream typo: "I word"
    "μήν": {"gloss": "surely, indeed (particle)", "citation": "μήν"},
    "συναπάγομαι": {"gloss": "I am carried away with; associate with", "citation": "συναπάγομαι"},
}

# Lexicon items that only exist as a frequency-list convenience but should never be
# scheduled as vocab (proper names ≥ 10 occurrences are still kept — learners need them).
FORMS_MIN_COUNT = 10


# ----------------------------------------------------------------------------
# fetching
# ----------------------------------------------------------------------------

def fetch(url: str, dest: str) -> str:
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return dest
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    print(f"  downloading {url}")
    with urllib.request.urlopen(url, timeout=120) as r, open(dest, "wb") as f:
        f.write(r.read())
    return dest


def fetch_all() -> None:
    print("Fetching sources (cached in scripts/cache/)…")
    for num, code, *_ in BOOKS:
        fetch(f"{MORPHGNT_RAW}{60 + num}-{code}-morphgnt.txt", os.path.join(CACHE, f"{60 + num}-{code}-morphgnt.txt"))
    fetch(LEXEMES_URL, os.path.join(CACHE, "lexemes.yaml"))
    fetch(SCROLLMAPPER + "KJV.json", os.path.join(CACHE, "KJV.json"))
    fetch(SCROLLMAPPER + "YLT.json", os.path.join(CACHE, "YLT.json"))
    web_zip = fetch(WEB_ZIP_URL, os.path.join(CACHE, "eng-web_vpl.zip"))
    web_txt = os.path.join(CACHE, "web", "eng-web_vpl.txt")
    if not os.path.exists(web_txt):
        with zipfile.ZipFile(web_zip) as z:
            z.extractall(os.path.join(CACHE, "web"))


# ----------------------------------------------------------------------------
# parsing sources
# ----------------------------------------------------------------------------

def nfc(s: str) -> str:
    return unicodedata.normalize("NFC", s)


PUNCT_RE = re.compile(r"[^\w\u0370-\u03FF\u1F00-\u1FFF]")


def strip_punct(text: str) -> str:
    """Same rule the client uses to recover a word's normalized form when 'n' is absent."""
    return PUNCT_RE.sub("", text)


def load_lexemes() -> dict:
    """Minimal parser for the flat two-level lexemes.yaml (no PyYAML dependency)."""
    lex, cur = {}, None
    with open(os.path.join(CACHE, "lexemes.yaml"), encoding="utf-8") as f:
        for line in f:
            if not line.strip() or line.startswith("#"):
                continue
            if not line.startswith(" "):
                cur = nfc(line.rstrip("\n").rstrip(":"))
                lex[cur] = {}
            else:
                key, _, val = line.strip().partition(":")
                lex[cur][key.strip()] = val.strip()
    return lex


def load_morphgnt():
    """Yield (book_num, chapter, verse, pos, parse, text, word, normalized, lemma)."""
    for num, code, *_ in BOOKS:
        path = os.path.join(CACHE, f"{60 + num}-{code}-morphgnt.txt")
        with open(path, encoding="utf-8") as f:
            for line in f:
                parts = line.split()
                if len(parts) < 7:
                    continue
                ref, pos, parse, text, word, norm, lemma = parts[:7]
                yield (int(ref[0:2]), int(ref[2:4]), int(ref[4:6]), pos, parse,
                       nfc(text), nfc(word), nfc(norm), nfc(lemma))


def load_scrollmapper(name: str) -> dict:
    """Return {(book_num, ch, v): text} for the NT books of a scrollmapper JSON."""
    with open(os.path.join(CACHE, f"{name}.json"), encoding="utf-8") as f:
        d = json.load(f)
    books = d["books"]
    assert len(books) == 66, f"{name}: expected 66 books, got {len(books)}"
    out = {}
    for i, b in enumerate(books[39:]):
        num = i + 1
        # scrollmapper uses Roman numerals ("I Corinthians") and "Revelation of John";
        # match on the last word of the English name so ordering mistakes still fail loudly.
        expect = BOOK_BY_NUM[num][3]
        assert expect.split()[-1] in b["name"], (name, b["name"], expect)
        for ch in b["chapters"]:
            for v in ch["verses"]:
                out[(num, ch["chapter"], v["verse"])] = v["text"].strip()
    return out


def load_web() -> dict:
    code_to_num = {b[4]: b[0] for b in BOOKS}
    out = {}
    pat = re.compile(r"^([1-3A-Z]{3}) (\d+):(\d+) (.*)$")
    with open(os.path.join(CACHE, "web", "eng-web_vpl.txt"), encoding="utf-8") as f:
        for line in f:
            m = pat.match(line.rstrip("\n"))
            if not m or m.group(1) not in code_to_num:
                continue
            out[(code_to_num[m.group(1)], int(m.group(2)), int(m.group(3)))] = m.group(4).strip()
    return out


# ----------------------------------------------------------------------------
# building
# ----------------------------------------------------------------------------

def write_json(rel: str, obj, compact=False) -> None:
    path = os.path.join(DATA, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        if compact:
            json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
        else:
            json.dump(obj, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"  wrote data/{rel} ({os.path.getsize(path) // 1024} KB)")


def build() -> None:
    fetch_all()
    print("Parsing MorphGNT…")
    lexemes = load_lexemes()

    counts = collections.Counter()
    pos_of = {}
    forms = collections.Counter()          # (lemma, norm, pos, parse) -> count
    verses = collections.OrderedDict()     # (book, ch, v) -> [word dicts]
    chapter_tokens = collections.defaultdict(list)  # (book, ch) -> [lemma,...]

    for num, ch, v, pos, parse, text, word, norm, lemma in load_morphgnt():
        counts[lemma] += 1
        pos_of.setdefault(lemma, pos)
        forms[(lemma, norm, pos, parse)] += 1
        w = {"t": text, "l": lemma, "p": pos, "m": parse}
        if strip_punct(text) != norm:
            w["n"] = norm  # only stored when it differs from the punctuation-stripped text
        verses.setdefault((num, ch, v), []).append(w)
        chapter_tokens[(num, ch)].append(lemma)

    total = sum(counts.values())
    ranked = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    rank_of = {lemma: i + 1 for i, (lemma, _) in enumerate(ranked)}
    print(f"  {total} tokens, {len(counts)} lemmas, {len(forms)} distinct forms")

    # ---- lexicon.json ----
    items = []
    for lemma, count in ranked:
        lx = lexemes.get(lemma, {})
        ov = GLOSS_OVERRIDES.get(lemma, {})
        gloss = ov.get("gloss") or lx.get("gloss") or ""
        citation = ov.get("citation") or lx.get("full-citation-form") or lx.get("danker-entry") or lemma
        item = {
            "id": lemma,
            "lemma": lemma,
            "citation": citation,
            "gloss": gloss,
            "pos": POS_NAMES.get(pos_of[lemma], pos_of[lemma]),
            "count": count,
            "rank": rank_of[lemma],
        }
        for key in ("strongs", "gk"):
            nums = [int(x) for x in re.findall(r"\d+", lx.get(key, ""))]
            if nums:
                item[key] = nums[0] if len(nums) == 1 else nums
        if lx.get("mounce-morphcat"):
            item["morphcat"] = lx["mounce-morphcat"]
        items.append(item)
    assert all(i["gloss"] for i in items), [i["lemma"] for i in items if not i["gloss"]][:10]

    cov = lambda n: round(sum(c for _, c in ranked[:n]) / total, 4)
    lexicon = {
        "_meta": {
            "source": "MorphGNT SBLGNT (lemmas, counts) + MorphGNT morphological lexicon (citation forms, Dodson glosses). See data/LICENSES.md.",
            "totalTokens": total,
            "totalLemmas": len(items),
            "coverage": {str(n): cov(n) for n in (100, 310, 500, 882, 1125, 2000)},
            "idNote": "item id == lemma (NFC Unicode). vocabSRS in storage.js is keyed by this id.",
        },
        "items": items,
    }
    # (lexicon.json is written after the curriculum build below, so items can carry `lesson`)

    # ---- forms.json (lemmas with >= FORMS_MIN_COUNT occurrences) ----
    core = {lemma for lemma, c in ranked if c >= FORMS_MIN_COUNT}
    by_lemma = collections.defaultdict(list)
    for (lemma, norm, pos, parse), c in forms.items():
        if lemma in core:
            by_lemma[lemma].append([norm, pos, parse, c])
    for lst in by_lemma.values():
        lst.sort(key=lambda r: (-r[3], r[0]))
    write_json("forms.json", {
        "_meta": {
            "source": "MorphGNT SBLGNT. Each row: [form (normalized), pos, parseCode, count]. parseCode = MorphGNT 8-slot code: person, tense, voice, mood, case, number, gender, degree.",
            "minLemmaCount": FORMS_MIN_COUNT,
            "lemmas": len(by_lemma),
            "forms": sum(len(v) for v in by_lemma.values()),
        },
        "forms": by_lemma,
    }, compact=True)

    # ---- translations ----
    print("Loading translations…")
    kjv, ylt, web = load_scrollmapper("KJV"), load_scrollmapper("YLT"), load_web()

    # ---- gnt/<book>.json ----
    print("Writing NT books…")
    os.makedirs(os.path.join(DATA, "gnt"), exist_ok=True)
    missing_tr = collections.Counter()
    for num, code, slug, name, webcode, greek in BOOKS:
        chapters = collections.OrderedDict()
        for (b, ch, v), words in verses.items():
            if b != num:
                continue
            key = (num, ch, v)
            tr = {}
            for tname, src in (("kjv", kjv), ("ylt", ylt), ("web", web)):
                if key in src:
                    tr[tname] = src[key]
                else:
                    missing_tr[tname] += 1
            chapters.setdefault(str(ch), collections.OrderedDict())[str(v)] = {
                "id": f"{slug}-{ch}-{v}",
                "words": words,
                "translations": tr,
            }
        write_json(f"gnt/{slug}.json", {
            "book": name, "slug": slug, "greekTitle": greek, "number": num,
            "chapters": chapters,
        }, compact=True)
    if missing_tr:
        print(f"  note: verses without a translation (versification differences): {dict(missing_tr)}")

    # ---- stats.json: lexical load per chapter (PEDAGOGY M16, M22–M24) ----
    bands = (100, 310, 500, 882, 1125)
    chapter_stats = []
    for (num, ch), lemmas in chapter_tokens.items():
        slug = BOOK_BY_NUM[num][2]
        n = len(lemmas)
        row = {
            "book": slug, "chapter": ch, "tokens": n, "lemmas": len(set(lemmas)),
            "coverage": {str(b): round(sum(1 for l in lemmas if rank_of[l] <= b) / n, 4) for b in bands},
        }
        chapter_stats.append(row)
    book_stats = []
    for num, code, slug, name, *_ in BOOKS:
        rows = [r for r in chapter_stats if r["book"] == slug]
        toks = sum(r["tokens"] for r in rows)
        book_stats.append({
            "book": slug, "name": name, "number": num, "greekTitle": BOOK_BY_NUM[num][5], "chapters": len(rows), "tokens": toks,
            "coverage": {str(b): round(sum(r["coverage"][str(b)] * r["tokens"] for r in rows) / toks, 4) for b in bands},
        })
    book_stats.sort(key=lambda r: -r["coverage"]["882"])
    write_json("stats.json", {
        "_meta": {
            "note": "coverage[N] = share of a chapter's running words whose lemma has frequency rank <= N. "
                    "Used to sequence reading so each passage stays near the ~95-98% comprehension threshold "
                    "once glossing is accounted for (PEDAGOGY M16, M23-M24).",
            "bands": list(bands),
        },
        "books": book_stats,
        "chapters": chapter_stats,
    })

    # ---- curriculum (hand-authored spine resolved against the data) ----
    print("Building curriculum…")
    import curriculum  # scripts/curriculum.py
    lex_by_id = {i["id"]: i for i in items}
    attested = {(lemma, norm, parse) for (lemma, norm, pos, parse) in forms}
    assigned = curriculum.build(
        lex_by_id=lex_by_id,
        ranked=[l for l, _ in ranked],
        attested_forms=attested,
        verses=verses,
        chapter_stats=chapter_stats,
        book_by_num=BOOK_BY_NUM,
        write_json=write_json,
    )
    for item in items:
        if item["id"] in assigned:
            item["lesson"] = assigned[item["id"]]
    lexicon["_meta"]["lessonNote"] = "item.lesson = id of the lesson that introduces the word (absent for words under scheduleMinCount, which are gloss-only)."
    write_json("lexicon.json", lexicon, compact=True)
    print("Done.")


if __name__ == "__main__":
    build()

# -*- coding: utf-8 -*-
"""
curriculum.py — the hand-authored curriculum spine, resolved against real data
by build_data.py. Everything here is either (a) standard reference grammar
(alphabet, paradigms, principal parts) or (b) curriculum design (which words and
patterns come when, and the short explicit rule that introduces each). The
Greek text, glosses and frequencies are never hand-written — they come from
MorphGNT / SBLGNT via build_data.py.

Design rules this file follows (see PEDAGOGY.md):
  * High-frequency first (M22): Books I–VIII introduce every word occurring 50+
    times in the GNT (the ~310-word core that covers ~80% of the text).
  * Read real Greek from Unit 1 (M14): every Book ends with a reading lesson.
  * Explicit rule → retrieval → input (M20): each grammar lesson carries a short
    `rule` (a few sentences + examples), never a lecture.
  * Endings are first-class objects (M21): every pattern is a paradigm in
    PARADIGMS, so forms can be scheduled and drilled like words.
  * Block first, then interleave (M9): a lesson's vocab/paradigms are the blocked
    set; the SRS interleaves them from the next session on.
  * i+1 sequencing (M16): the reading track (Books IX+) introduces, right before
    each chapter, the not-yet-known words that chapter uses, in frequency order;
    words under 10 occurrences are never scheduled — they are tap-to-gloss (M23).
"""
from __future__ import annotations

import unicodedata


def nfc(s):
    return unicodedata.normalize("NFC", s)


# =============================================================================
# ALPHABET (Unit 1 content) — both pronunciation schemes; `settings.pronunciation`
# picks which one the UI shows ('erasmian' | 'koine').
# =============================================================================

ALPHABET = {
    "_note": "erasmian = the scheme most seminaries teach; koine = the reconstructed 1st-century pronunciation "
             "(after Randall Buth / Biblical Language Center). Both are taught as sounds, not IPA, for beginners.",
    "letters": [
        # (upper, lower, name, translit, erasmian, koine, note)
        {"upper": "Α", "lower": "α", "name": "alpha", "translit": "a", "erasmian": "a as in father", "koine": "a as in father"},
        {"upper": "Β", "lower": "β", "name": "beta", "translit": "b", "erasmian": "b as in boy", "koine": "v as in vine"},
        {"upper": "Γ", "lower": "γ", "name": "gamma", "translit": "g", "erasmian": "g as in go; before γ κ χ ξ it is ng as in sing", "koine": "soft gh (like Spanish 'g' in agua); before γ κ χ ξ it is ng"},
        {"upper": "Δ", "lower": "δ", "name": "delta", "translit": "d", "erasmian": "d as in dog", "koine": "th as in this"},
        {"upper": "Ε", "lower": "ε", "name": "epsilon", "translit": "e", "erasmian": "e as in met (short)", "koine": "e as in met"},
        {"upper": "Ζ", "lower": "ζ", "name": "zeta", "translit": "z", "erasmian": "dz as in adze", "koine": "z as in zoo"},
        {"upper": "Η", "lower": "η", "name": "eta", "translit": "ē", "erasmian": "ay as in say (long)", "koine": "e as in they (long, no glide)"},
        {"upper": "Θ", "lower": "θ", "name": "theta", "translit": "th", "erasmian": "th as in thin", "koine": "th as in thin"},
        {"upper": "Ι", "lower": "ι", "name": "iota", "translit": "i", "erasmian": "i as in sit, or ee as in machine", "koine": "ee as in machine"},
        {"upper": "Κ", "lower": "κ", "name": "kappa", "translit": "k", "erasmian": "k as in keep", "koine": "k as in keep"},
        {"upper": "Λ", "lower": "λ", "name": "lambda", "translit": "l", "erasmian": "l as in law", "koine": "l as in law"},
        {"upper": "Μ", "lower": "μ", "name": "mu", "translit": "m", "erasmian": "m as in mother", "koine": "m as in mother"},
        {"upper": "Ν", "lower": "ν", "name": "nu", "translit": "n", "erasmian": "n as in new", "koine": "n as in new"},
        {"upper": "Ξ", "lower": "ξ", "name": "xi", "translit": "x", "erasmian": "x as in box (ks)", "koine": "x as in box (ks)"},
        {"upper": "Ο", "lower": "ο", "name": "omicron", "translit": "o", "erasmian": "o as in not (short)", "koine": "o as in note"},
        {"upper": "Π", "lower": "π", "name": "pi", "translit": "p", "erasmian": "p as in pie", "koine": "p as in pie"},
        {"upper": "Ρ", "lower": "ρ", "name": "rho", "translit": "r", "erasmian": "r as in rod (lightly rolled)", "koine": "r as in rod (rolled)"},
        {"upper": "Σ", "lower": "σ / ς", "name": "sigma", "translit": "s", "erasmian": "s as in sit (ς is used only at the end of a word)", "koine": "s as in sit (ς only at the end of a word)"},
        {"upper": "Τ", "lower": "τ", "name": "tau", "translit": "t", "erasmian": "t as in tip", "koine": "t as in tip"},
        {"upper": "Υ", "lower": "υ", "name": "upsilon", "translit": "u / y", "erasmian": "u as in put, or oo as in food", "koine": "ü as in German über (lips rounded, say 'ee')"},
        {"upper": "Φ", "lower": "φ", "name": "phi", "translit": "ph", "erasmian": "ph as in phone", "koine": "f as in fish"},
        {"upper": "Χ", "lower": "χ", "name": "chi", "translit": "ch", "erasmian": "ch as in Scottish loch (a rough k)", "koine": "ch as in loch"},
        {"upper": "Ψ", "lower": "ψ", "name": "psi", "translit": "ps", "erasmian": "ps as in lips", "koine": "ps as in lips"},
        {"upper": "Ω", "lower": "ω", "name": "omega", "translit": "ō", "erasmian": "o as in tone (long)", "koine": "o as in note"},
    ],
    "vowels": {
        "short": ["ε", "ο"], "long": ["η", "ω"], "either": ["α", "ι", "υ"],
        "note": "α ι υ can be short or long; the difference matters for accents, not for meaning.",
    },
    "diphthongs": [
        {"text": "αι", "erasmian": "ai as in aisle", "koine": "e as in met", "example": "καί (and)"},
        {"text": "ει", "erasmian": "ei as in eight", "koine": "ee as in machine", "example": "εἰμί (I am)"},
        {"text": "οι", "erasmian": "oi as in oil", "koine": "ü as in German über", "example": "οἱ (the, plural)"},
        {"text": "υι", "erasmian": "wee as in sweet", "koine": "ee as in machine", "example": "υἱός (son)"},
        {"text": "αυ", "erasmian": "ow as in cow", "koine": "av / af", "example": "αὐτός (he)"},
        {"text": "ευ", "erasmian": "eu as in feud", "koine": "ev / ef", "example": "εὐαγγέλιον (gospel)"},
        {"text": "ου", "erasmian": "oo as in food", "koine": "oo as in food", "example": "οὐ (not)"},
        {"text": "ηυ", "erasmian": "ay-oo (η + υ)", "koine": "ev / ef", "example": "ηὐλόγησεν (he blessed)"},
    ],
    "iotaSubscript": {
        "forms": ["ᾳ", "ῃ", "ῳ"],
        "note": "A tiny iota written under α η ω. It is silent in both schemes, but it changes meaning "
                "(it often marks the dative case), so always look for it.",
        "example": "ἐν ἀρχῇ (in the beginning) — the ῃ tells you 'beginning' is dative after ἐν.",
    },
    "breathing": [
        {"mark": "smooth ( ᾿ )", "example": "ἐν", "rule": "No sound. Just marks that the word starts with a vowel."},
        {"mark": "rough ( ῾ )", "example": "ὁ = ho", "rule": "Add an 'h' sound before the vowel. Every initial υ and initial ρ takes a rough breathing (ῥ)."},
    ],
    "accents": [
        {"mark": "acute ( ´ )", "example": "λόγος"},
        {"mark": "grave ( ` )", "example": "καὶ ὁ", "note": "An acute on a word's last syllable becomes grave when another word follows without punctuation."},
        {"mark": "circumflex ( ῀ )", "example": "τοῦ", "note": "Only on long vowels or diphthongs, only on the last two syllables."},
    ],
    "accentRule": "For reading: stress the accented syllable, whichever accent it is. Which accent appears is a spelling "
                  "rule, not something you must decide when speaking. A few pairs differ only by accent "
                  "(τίς who? vs τις someone; εἰ if vs εἶ you are), and the app will point those out as they come up.",
    "punctuation": [
        {"mark": ",", "meaning": "comma"},
        {"mark": ".", "meaning": "full stop"},
        {"mark": "·", "meaning": "raised dot = English semicolon or colon"},
        {"mark": ";", "meaning": "QUESTION MARK (not a semicolon!)"},
    ],
    "syllables": "Greek words have as many syllables as they have vowels or diphthongs: λό-γος (2), ἄν-θρω-πος (3), "
                 "εὐ-αγ-γέ-λι-ον (5). Say every syllable; there are no silent letters except iota subscript.",
}


# =============================================================================
# PARADIGMS — endings as first-class learnable objects (M21). Each cell carries
# a MorphGNT-style parse code so parsing drills, form-recognition drills and
# the reading screen all speak the same language. build_data.py checks every
# cell against the forms actually attested in the GNT and reports mismatches.
# =============================================================================

PARADIGMS = []


def nom(pid, lemma, title, note, genders, cases_sg="NGDAV", cases_pl="NGDA"):
    """Nominal paradigm. genders = {"M": (sg_forms, pl_forms), ...}; a gender key of
    "-" means the form has no gender (ἐγώ, σύ). sg_forms may omit the vocative."""
    cells = []
    for g, (sg, pl) in genders.items():
        for case, form in zip(cases_sg, sg):
            if form:
                cells.append({"parse": f"----{case}S{g}-", "form": form})
        for case, form in zip(cases_pl, pl):
            if form:
                cells.append({"parse": f"----{case}P{g}-", "form": form})
    PARADIGMS.append({"id": pid, "kind": "nominal", "lemma": lemma, "title": title, "note": note, "cells": cells})


def vb(pid, lemma, title, note, tvm, forms):
    """Finite verb paradigm: forms = [1S, 2S, 3S, 1P, 2P, 3P]; tvm = tense+voice+mood code."""
    cells = []
    for (person, number), form in zip([(1, "S"), (2, "S"), (3, "S"), (1, "P"), (2, "P"), (3, "P")], forms):
        if form:
            cells.append({"parse": f"{person}{tvm}-{number}--", "form": form})
    PARADIGMS.append({"id": pid, "kind": "verbal", "lemma": lemma, "title": title, "note": note, "cells": cells})


def inf(pid, lemma, title, note, items):
    """Infinitives: items = [(tense+voice, form), ...]"""
    cells = [{"parse": f"-{tv}N----", "form": form} for tv, form in items]
    PARADIGMS.append({"id": pid, "kind": "infinitive", "lemma": lemma, "title": title, "note": note, "cells": cells})


def ptc(pid, lemma, title, note, tv, genders):
    """Participle paradigm: tv = tense+voice; genders like nom() but no vocative."""
    cells = []
    for g, (sg, pl) in genders.items():
        for case, form in zip("NGDA", sg):
            cells.append({"parse": f"-{tv}P{case}S{g}-", "form": form})
        for case, form in zip("NGDA", pl):
            cells.append({"parse": f"-{tv}P{case}P{g}-", "form": form})
    PARADIGMS.append({"id": pid, "kind": "participle", "lemma": lemma, "title": title, "note": note, "cells": cells})


# ---- εἰμί -------------------------------------------------------------------
vb("eimi-pres", "εἰμί", "εἰμί — present (I am)",
   "Irregular and enclitic, but the most common verb in the NT. Learn it as a song: εἰμί, εἶ, ἐστί(ν), ἐσμέν, ἐστέ, εἰσί(ν).",
   "PAI", ["εἰμί", "εἶ", "ἐστί(ν)", "ἐσμέν", "ἐστέ", "εἰσί(ν)"])
vb("eimi-impf", "εἰμί", "εἰμί — imperfect (I was)",
   "ἦν (he/she/it was) is the 2nd most common form of εἰμί; John 1:1 uses it three times. MorphGNT tags ἤμην as middle.",
   "IAI", ["ἤμην", "ἦς", "ἦν", "ἦμεν", "ἦτε", "ἦσαν"])
vb("eimi-fut", "εἰμί", "εἰμί — future (I will be)",
   "The future of εἰμί has middle endings with active meaning; ἔσται (it will be) is the one you will meet most.",
   "FMI", ["ἔσομαι", "ἔσῃ", "ἔσται", "ἐσόμεθα", "ἔσεσθε", "ἔσονται"])
vb("eimi-subj", "εἰμί", "εἰμί — present subjunctive",
   "Just the endings of λύω's subjunctive with a rough breathing: ὦ, ᾖς, ᾖ, ὦμεν, ἦτε, ὦσι(ν).",
   "PAS", ["ὦ", "ᾖς", "ᾖ", "ὦμεν", "ἦτε", "ὦσι(ν)"])

# ---- article, nouns ---------------------------------------------------------
nom("article", "ὁ", "ὁ, ἡ, τό — the article",
    "The single most useful paradigm in Greek: nouns and adjectives of the 1st and 2nd declension share these endings. Learn the article and you have learned the cases.",
    {"M": (["ὁ", "τοῦ", "τῷ", "τόν"], ["οἱ", "τῶν", "τοῖς", "τούς"]),
     "F": (["ἡ", "τῆς", "τῇ", "τήν"], ["αἱ", "τῶν", "ταῖς", "τάς"]),
     "N": (["τό", "τοῦ", "τῷ", "τό"], ["τά", "τῶν", "τοῖς", "τά"])})
nom("decl2-masc", "λόγος", "λόγος — 2nd declension masculine",
    "Endings: -ος -ου -ῳ -ον (-ε) / -οι -ων -οις -ους. Compare the article: same vowels, same pattern.",
    {"M": (["λόγος", "λόγου", "λόγῳ", "λόγον", "λόγε"], ["λόγοι", "λόγων", "λόγοις", "λόγους"])})
nom("decl2-neut", "ἔργον", "ἔργον — 2nd declension neuter",
    "Neuter nominative and accusative are always identical, and the plural of both ends in -α. A neuter plural subject often takes a singular verb.",
    {"N": (["ἔργον", "ἔργου", "ἔργῳ", "ἔργον"], ["ἔργα", "ἔργων", "ἔργοις", "ἔργα"])})
nom("decl1-eta", "ἀρχή", "ἀρχή — 1st declension in -η",
    "Feminine nouns in -η keep η through the singular: -η -ης -ῃ -ην. The plural is the same for every 1st-declension noun: -αι -ων -αις -ας.",
    {"F": (["ἀρχή", "ἀρχῆς", "ἀρχῇ", "ἀρχήν"], ["ἀρχαί", "ἀρχῶν", "ἀρχαῖς", "ἀρχάς"])})
nom("decl1-alpha-pure", "ἡμέρα", "ἡμέρα — 1st declension in -α (after ε ι ρ)",
    "When the stem ends in ε, ι or ρ the α stays through the singular: -α -ας -ᾳ -αν.",
    {"F": (["ἡμέρα", "ἡμέρας", "ἡμέρᾳ", "ἡμέραν"], ["ἡμέραι", "ἡμερῶν", "ἡμέραις", "ἡμέρας"])})
nom("decl1-alpha-mixed", "δόξα", "δόξα — 1st declension in -α (mixed)",
    "Other -α nouns switch to η in the genitive and dative singular: -α -ης -ῃ -αν.",
    {"F": (["δόξα", "δόξης", "δόξῃ", "δόξαν"], ["δόξαι", "δοξῶν", "δόξαις", "δόξας"])})
nom("decl1-masc", "προφήτης", "προφήτης — 1st declension masculine",
    "A few masculine nouns (προφήτης, μαθητής, Ἰωάννης) use 1st-declension endings but a -ου genitive borrowed from the 2nd declension, and take the masculine article: ὁ προφήτης, τοῦ προφήτου.",
    {"M": (["προφήτης", "προφήτου", "προφήτῃ", "προφήτην", "προφῆτα"], ["προφῆται", "προφητῶν", "προφήταις", "προφήτας"])})

# ---- 3rd declension ---------------------------------------------------------
nom("decl3-sarx", "σάρξ", "σάρξ, σαρκός — 3rd declension (consonant stem)",
    "Find the stem from the GENITIVE (σαρκ-), then add -ς -ος -ι -α / -ες -ων -σι(ν) -ας. The nominative singular is often disguised by the final consonant merging with -ς.",
    {"F": (["σάρξ", "σαρκός", "σαρκί", "σάρκα"], ["σάρκες", "σαρκῶν", "σαρξί(ν)", "σάρκας"])})
nom("decl3-archon", "ἄρχων", "ἄρχων, ἄρχοντος — 3rd declension (-ντ stem)",
    "Stems in -ντ lose the ντ before σ, lengthening the vowel: ἄρχων, ἄρχουσι(ν). Participles like λύων follow this exact pattern.",
    {"M": (["ἄρχων", "ἄρχοντος", "ἄρχοντι", "ἄρχοντα"], ["ἄρχοντες", "ἀρχόντων", "ἄρχουσι(ν)", "ἄρχοντας"])})
nom("decl3-pater", "πατήρ", "πατήρ, πατρός — family nouns",
    "πατήρ, μήτηρ, ἀνήρ shorten the stem in the genitive and dative singular (πατρός, πατρί) and have a distinctive dative plural (πατράσι).",
    {"M": (["πατήρ", "πατρός", "πατρί", "πατέρα", "πάτερ"], ["πατέρες", "πατέρων", "πατράσι(ν)", "πατέρας"])})
nom("decl3-onoma", "ὄνομα", "ὄνομα, ὀνόματος — neuters in -μα",
    "Stem in -ματ. Neuter, so nominative = accusative, and the plural of both is -ματα. Very common: πνεῦμα, σῶμα, ῥῆμα, αἷμα.",
    {"N": (["ὄνομα", "ὀνόματος", "ὀνόματι", "ὄνομα"], ["ὀνόματα", "ὀνομάτων", "ὀνόμασι(ν)", "ὀνόματα"])})
nom("decl3-ethnos", "ἔθνος", "ἔθνος, ἔθνους — neuters in -ος",
    "Looks like a 2nd-declension masculine but is neuter 3rd declension: the genitive is -ους, the plural -η. Watch the article: τὸ ἔθνος, τὰ ἔθνη.",
    {"N": (["ἔθνος", "ἔθνους", "ἔθνει", "ἔθνος"], ["ἔθνη", "ἐθνῶν", "ἔθνεσι(ν)", "ἔθνη"])})
nom("decl3-pistis", "πίστις", "πίστις, πίστεως — feminines in -ις",
    "The -ις / -εως pattern covers many abstract nouns (πίστις, πόλις, δύναμις, κρίσις). Nominative and accusative plural are both -εις.",
    {"F": (["πίστις", "πίστεως", "πίστει", "πίστιν"], ["πίστεις", "πίστεων", "πίστεσι(ν)", "πίστεις"])})
nom("decl3-basileus", "βασιλεύς", "βασιλεύς, βασιλέως — masculines in -ευς",
    "Nouns for roles and offices: βασιλεύς, ἀρχιερεύς, γραμματεύς. Note the -εῖς of the plural nominative and accusative.",
    {"M": (["βασιλεύς", "βασιλέως", "βασιλεῖ", "βασιλέα", "βασιλεῦ"], ["βασιλεῖς", "βασιλέων", "βασιλεῦσι(ν)", "βασιλεῖς"])})

# ---- adjectives & pronouns ---------------------------------------------------
nom("adj-agathos", "ἀγαθός", "ἀγαθός, -ή, -όν — 2-1-2 adjective",
    "Masculine like λόγος, feminine like ἀρχή, neuter like ἔργον. An adjective agrees with its noun in case, number and gender, never necessarily in ending.",
    {"M": (["ἀγαθός", "ἀγαθοῦ", "ἀγαθῷ", "ἀγαθόν", "ἀγαθέ"], ["ἀγαθοί", "ἀγαθῶν", "ἀγαθοῖς", "ἀγαθούς"]),
     "F": (["ἀγαθή", "ἀγαθῆς", "ἀγαθῇ", "ἀγαθήν"], ["ἀγαθαί", "ἀγαθῶν", "ἀγαθαῖς", "ἀγαθάς"]),
     "N": (["ἀγαθόν", "ἀγαθοῦ", "ἀγαθῷ", "ἀγαθόν"], ["ἀγαθά", "ἀγαθῶν", "ἀγαθοῖς", "ἀγαθά"])})
nom("pron-autos", "αὐτός", "αὐτός, -ή, -ό — he, she, it / self / same",
    "Declined like ἀγαθός except the neuter αὐτό has no -ν. Three uses: plain pronoun (αὐτοῦ = his), intensive with a noun (αὐτὸς ὁ θεός = God himself), identical with the article (ὁ αὐτός = the same).",
    {"M": (["αὐτός", "αὐτοῦ", "αὐτῷ", "αὐτόν"], ["αὐτοί", "αὐτῶν", "αὐτοῖς", "αὐτούς"]),
     "F": (["αὐτή", "αὐτῆς", "αὐτῇ", "αὐτήν"], ["αὐταί", "αὐτῶν", "αὐταῖς", "αὐτάς"]),
     "N": (["αὐτό", "αὐτοῦ", "αὐτῷ", "αὐτό"], ["αὐτά", "αὐτῶν", "αὐτοῖς", "αὐτά"])})
nom("pron-ego", "ἐγώ", "ἐγώ — I / we",
    "The short forms μου, μοι, με are unaccented (enclitic) and far more common than ἐμοῦ, ἐμοί, ἐμέ, which are used for emphasis and after prepositions.",
    {"-": (["ἐγώ", "μου", "μοι", "με"], ["ἡμεῖς", "ἡμῶν", "ἡμῖν", "ἡμᾶς"])}, cases_sg="NGDA")
nom("pron-su", "σύ", "σύ — you / you all",
    "Singular σύ vs plural ὑμεῖς: English 'you' hides this, Greek never does. ὑμῖν (to you all) is one of the most common words in the letters.",
    {"-": (["σύ", "σου", "σοι", "σε"], ["ὑμεῖς", "ὑμῶν", "ὑμῖν", "ὑμᾶς"])}, cases_sg="NGDA")
nom("pron-houtos", "οὗτος", "οὗτος, αὕτη, τοῦτο — this",
    "The stem starts with τ- except in the nominative masculine and feminine (which start with a rough breathing, like the article). The vowel before the ending matches it: ου before ο/ω-type endings, αυ before α/η-type.",
    {"M": (["οὗτος", "τούτου", "τούτῳ", "τοῦτον"], ["οὗτοι", "τούτων", "τούτοις", "τούτους"]),
     "F": (["αὕτη", "ταύτης", "ταύτῃ", "ταύτην"], ["αὗται", "τούτων", "ταύταις", "ταύτας"]),
     "N": (["τοῦτο", "τούτου", "τούτῳ", "τοῦτο"], ["ταῦτα", "τούτων", "τούτοις", "ταῦτα"])})
nom("pron-ekeinos", "ἐκεῖνος", "ἐκεῖνος, -η, -ο — that",
    "Declined exactly like αὐτός (neuter ἐκεῖνο without -ν). 'That one' in contrast to οὗτος 'this one'.",
    {"M": (["ἐκεῖνος", "ἐκείνου", "ἐκείνῳ", "ἐκεῖνον"], ["ἐκεῖνοι", "ἐκείνων", "ἐκείνοις", "ἐκείνους"]),
     "F": (["ἐκείνη", "ἐκείνης", "ἐκείνῃ", "ἐκείνην"], ["ἐκεῖναι", "ἐκείνων", "ἐκείναις", "ἐκείνας"]),
     "N": (["ἐκεῖνο", "ἐκείνου", "ἐκείνῳ", "ἐκεῖνο"], ["ἐκεῖνα", "ἐκείνων", "ἐκείνοις", "ἐκεῖνα"])})
nom("pron-hos", "ὅς", "ὅς, ἥ, ὅ — who, which, that",
    "The relative pronoun is the article's endings with a rough breathing and an accent, and no τ-. It takes its gender and number from the noun it refers back to, but its CASE from its job in its own clause.",
    {"M": (["ὅς", "οὗ", "ᾧ", "ὅν"], ["οἵ", "ὧν", "οἷς", "οὕς"]),
     "F": (["ἥ", "ἧς", "ᾗ", "ἥν"], ["αἵ", "ὧν", "αἷς", "ἅς"]),
     "N": (["ὅ", "οὗ", "ᾧ", "ὅ"], ["ἅ", "ὧν", "οἷς", "ἅ"])})
nom("pron-tis", "τίς", "τίς, τί — who? what? (and τις, τι — someone, something)",
    "3rd-declension. With an acute accent on the first syllable it is a question word; unaccented (enclitic) it means someone / a certain / something. Masculine and feminine share one set of forms.",
    {"M": (["τίς", "τίνος", "τίνι", "τίνα"], ["τίνες", "τίνων", "τίσι(ν)", "τίνας"]),
     "N": (["τί", "τίνος", "τίνι", "τί"], ["τίνα", "τίνων", "τίσι(ν)", "τίνα"])})
nom("adj-pas", "πᾶς", "πᾶς, πᾶσα, πᾶν — all, every, whole",
    "3-1-3 pattern: masculine and neuter are 3rd declension (stem παντ-), feminine is 1st declension. Before a noun without the article: 'every'; with the article: 'all / the whole'.",
    {"M": (["πᾶς", "παντός", "παντί", "πάντα"], ["πάντες", "πάντων", "πᾶσι(ν)", "πάντας"]),
     "F": (["πᾶσα", "πάσης", "πάσῃ", "πᾶσαν"], ["πᾶσαι", "πασῶν", "πάσαις", "πάσας"]),
     "N": (["πᾶν", "παντός", "παντί", "πᾶν"], ["πάντα", "πάντων", "πᾶσι(ν)", "πάντα"])})
nom("adj-polus", "πολύς", "πολύς, πολλή, πολύ — much, many",
    "Irregular only in four forms (πολύς, πολύν, πολύ, πολύ); everywhere else the stem is πολλ- with ordinary 2-1-2 endings.",
    {"M": (["πολύς", "πολλοῦ", "πολλῷ", "πολύν"], ["πολλοί", "πολλῶν", "πολλοῖς", "πολλούς"]),
     "F": (["πολλή", "πολλῆς", "πολλῇ", "πολλήν"], ["πολλαί", "πολλῶν", "πολλαῖς", "πολλάς"]),
     "N": (["πολύ", "πολλοῦ", "πολλῷ", "πολύ"], ["πολλά", "πολλῶν", "πολλοῖς", "πολλά"])})
nom("adj-megas", "μέγας", "μέγας, μεγάλη, μέγα — great, large",
    "Same trick as πολύς: four short irregular forms (μέγας, μέγαν, μέγα, μέγα), otherwise the stem μεγαλ- with 2-1-2 endings.",
    {"M": (["μέγας", "μεγάλου", "μεγάλῳ", "μέγαν"], ["μεγάλοι", "μεγάλων", "μεγάλοις", "μεγάλους"]),
     "F": (["μεγάλη", "μεγάλης", "μεγάλῃ", "μεγάλην"], ["μεγάλαι", "μεγάλων", "μεγάλαις", "μεγάλας"]),
     "N": (["μέγα", "μεγάλου", "μεγάλῳ", "μέγα"], ["μεγάλα", "μεγάλων", "μεγάλοις", "μεγάλα"])})
nom("adj-heis", "εἷς", "εἷς, μία, ἕν — one (and οὐδείς — no one)",
    "Singular only. Masculine/neuter stem ἑν-, feminine μία. οὐδείς and μηδείς are just οὐδέ/μηδέ + εἷς: οὐδείς, οὐδεμία, οὐδέν.",
    {"M": (["εἷς", "ἑνός", "ἑνί", "ἕνα"], [None, None, None, None]),
     "F": (["μία", "μιᾶς", "μιᾷ", "μίαν"], [None, None, None, None]),
     "N": (["ἕν", "ἑνός", "ἑνί", "ἕν"], [None, None, None, None])})

# ---- λύω: indicative --------------------------------------------------------
vb("pres-act", "λύω", "λύω — present active indicative",
   "Primary active endings: -ω -εις -ει -ομεν -ετε -ουσι(ν). Present = ongoing or general action: 'I loose / I am loosing'.",
   "PAI", ["λύω", "λύεις", "λύει", "λύομεν", "λύετε", "λύουσι(ν)"])
vb("pres-mp", "λύω", "λύομαι — present middle/passive indicative",
   "Primary middle/passive endings: -ομαι -ῃ -εται -όμεθα -εσθε -ονται. Same form for middle (I loose for myself) and passive (I am being loosed); context decides. Deponent verbs (ἔρχομαι) use these endings with active meaning.",
   "PMI", ["λύομαι", "λύῃ", "λύεται", "λυόμεθα", "λύεσθε", "λύονται"])
vb("impf-act", "λύω", "ἔλυον — imperfect active indicative",
   "Augment ἐ- in front + secondary endings -ον -ες -ε(ν) -ομεν -ετε -ον. Imperfect = ongoing or repeated action in the past: 'I was loosing / I used to loose'. Vowel-initial verbs lengthen instead: ἀκούω → ἤκουον.",
   "IAI", ["ἔλυον", "ἔλυες", "ἔλυε(ν)", "ἐλύομεν", "ἐλύετε", "ἔλυον"])
vb("impf-mp", "λύω", "ἐλυόμην — imperfect middle/passive indicative",
   "Augment + secondary middle endings -όμην -ου -ετο -όμεθα -εσθε -οντο. Deponents: ἠρχόμην 'I was coming'.",
   "IMI", ["ἐλυόμην", "ἐλύου", "ἐλύετο", "ἐλυόμεθα", "ἐλύεσθε", "ἐλύοντο"])
vb("fut-act", "λύω", "λύσω — future active indicative",
   "Insert σ between stem and the present endings: λύ-σ-ω. Stems ending in a consonant merge with σ: π/β/φ + σ = ψ, κ/γ/χ + σ = ξ, τ/δ/θ drop out.",
   "FAI", ["λύσω", "λύσεις", "λύσει", "λύσομεν", "λύσετε", "λύσουσι(ν)"])
vb("fut-mid", "λύω", "λύσομαι — future middle indicative",
   "σ + present middle endings. Some very common verbs have a future that is middle in form only: γίνομαι → γενήσομαι, ἔρχομαι → ἐλεύσομαι, λαμβάνω → λήμψομαι, εἰμί → ἔσομαι.",
   "FMI", ["λύσομαι", "λύσῃ", "λύσεται", "λυσόμεθα", "λύσεσθε", "λύσονται"])
vb("aor1-act", "λύω", "ἔλυσα — first aorist active indicative",
   "Augment + σα + secondary endings: ἔ-λυ-σα, -σας, -σε(ν), -σαμεν, -σατε, -σαν. Aorist = the action viewed as a whole, a snapshot: usually 'I loosed'. It is the default past tense of narrative.",
   "AAI", ["ἔλυσα", "ἔλυσας", "ἔλυσε(ν)", "ἐλύσαμεν", "ἐλύσατε", "ἔλυσαν"])
vb("aor1-mid", "λύω", "ἐλυσάμην — first aorist middle indicative",
   "Augment + σα + secondary middle endings: -σάμην -σω -σατο -σάμεθα -σασθε -σαντο. Not passive! Aorist middle and passive have separate forms.",
   "AMI", ["ἐλυσάμην", "ἐλύσω", "ἐλύσατο", "ἐλυσάμεθα", "ἐλύσασθε", "ἐλύσαντο"])
vb("aor2-act", "βάλλω", "ἔβαλον — second aorist active indicative",
   "Same endings as the imperfect, but on a DIFFERENT (usually shorter) stem: βάλλω → ἔβαλον, λαμβάνω → ἔλαβον, λέγω → εἶπον, ἔρχομαι → ἦλθον. You learn the stem as vocabulary, not by rule.",
   "AAI", ["ἔβαλον", "ἔβαλες", "ἔβαλε(ν)", "ἐβάλομεν", "ἐβάλετε", "ἔβαλον"])
vb("aor2-mid", "γίνομαι", "ἐγενόμην — second aorist middle indicative",
   "Imperfect middle endings on the aorist stem γεν-. ἐγένετο 'it happened / came to be' opens hundreds of NT sentences.",
   "AMI", ["ἐγενόμην", "ἐγένου", "ἐγένετο", "ἐγενόμεθα", "ἐγένεσθε", "ἐγένοντο"])
vb("aor-pass", "λύω", "ἐλύθην — aorist passive indicative",
   "Augment + θη + ACTIVE-looking secondary endings: -θην -θης -θη -θημεν -θητε -θησαν. Some verbs drop the θ (second aorist passive): γράφω → ἐγράφην, ἀποστέλλω → ἀπεστάλην.",
   "API", ["ἐλύθην", "ἐλύθης", "ἐλύθη", "ἐλύθημεν", "ἐλύθητε", "ἐλύθησαν"])
vb("fut-pass", "λύω", "λυθήσομαι — future passive indicative",
   "θησ + present middle endings. Built on the aorist passive stem, so learn the sixth principal part and you get this for free.",
   "FPI", ["λυθήσομαι", "λυθήσῃ", "λυθήσεται", "λυθησόμεθα", "λυθήσεσθε", "λυθήσονται"])
vb("perf-act", "λύω", "λέλυκα — perfect active indicative",
   "Reduplicate the first consonant with ε (λε-λυ-) and add κα: -κα -κας -κε(ν) -καμεν -κατε -κασι(ν). Perfect = a completed action whose result still stands: γέγραπται 'it stands written'.",
   "XAI", ["λέλυκα", "λέλυκας", "λέλυκε(ν)", "λελύκαμεν", "λελύκατε", "λελύκασι(ν)"])
vb("perf-mp", "λύω", "λέλυμαι — perfect middle/passive indicative",
   "Reduplication + primary middle endings attached directly to the stem (no connecting vowel): -μαι -σαι -ται -μεθα -σθε -νται.",
   "XMI", ["λέλυμαι", "λέλυσαι", "λέλυται", "λελύμεθα", "λέλυσθε", "λέλυνται"])
vb("plup-act", "λύω", "ἐλελύκειν — pluperfect active indicative",
   "Rare. Augment (often dropped) + reduplication + κει + secondary endings. Meaning: 'I had loosed'. Most NT pluperfects are ᾔδειν (I knew) and εἱστήκειν (I stood).",
   "YAI", ["ἐλελύκειν", "ἐλελύκεις", "ἐλελύκει", "ἐλελύκειμεν", "ἐλελύκειτε", "ἐλελύκεισαν"])

# ---- λύω: subjunctive, imperative, infinitive -------------------------------
vb("pres-act-subj", "λύω", "λύω — present active subjunctive",
   "Lengthen the connecting vowel: ω/ῃ/ῃ/ωμεν/ητε/ωσι(ν). The subjunctive is the mood of possibility; it lives in ἵνα (in order that), ἐάν (if), ὅταν (whenever) clauses and after οὐ μή.",
   "PAS", ["λύω", "λύῃς", "λύῃ", "λύωμεν", "λύητε", "λύωσι(ν)"])
vb("aor-act-subj", "λύω", "λύσω — aorist active subjunctive",
   "Aorist stem (with σ, NO augment) + the same lengthened endings. Looks like the future indicative in the 1st person; the ῃ in the 2nd/3rd singular gives it away.",
   "AAS", ["λύσω", "λύσῃς", "λύσῃ", "λύσωμεν", "λύσητε", "λύσωσι(ν)"])
vb("pres-mp-subj", "λύω", "λύωμαι — present middle/passive subjunctive",
   "Lengthened vowel + middle endings: -ωμαι -ῃ -ηται -ώμεθα -ησθε -ωνται.",
   "PMS", ["λύωμαι", "λύῃ", "λύηται", "λυώμεθα", "λύησθε", "λύωνται"])
vb("aor-pass-subj", "λύω", "λυθῶ — aorist passive subjunctive",
   "θ + the contracted endings -ῶ -ῇς -ῇ -ῶμεν -ῆτε -ῶσι(ν) (all with a circumflex).",
   "APS", ["λυθῶ", "λυθῇς", "λυθῇ", "λυθῶμεν", "λυθῆτε", "λυθῶσι(ν)"])
vb("pres-act-impv", "λύω", "λῦε — present active imperative",
   "Only 2nd and 3rd persons exist: λῦε (you sg.), λυέτω (let him), λύετε (you pl.), λυέτωσαν (let them). Present imperative = keep doing / do as a habit. Prohibition: μή + present imperative = stop doing.",
   "PAD", [None, "λῦε", "λυέτω", None, "λύετε", "λυέτωσαν"])
vb("aor-act-impv", "λύω", "λῦσον — aorist active imperative",
   "No augment (only the indicative augments): λῦσον, λυσάτω, λύσατε, λυσάτωσαν. Aorist imperative = do it (as a single act). Prohibition uses μή + aorist SUBJUNCTIVE instead: μὴ λύσῃς.",
   "AAD", [None, "λῦσον", "λυσάτω", None, "λύσατε", "λυσάτωσαν"])
vb("pres-mp-impv", "λύω", "λύου — present middle/passive imperative",
   "λύου, λυέσθω, λύεσθε, λυέσθωσαν. Deponents use these: ἔρχου (come!), πορεύεσθε (go!).",
   "PMD", [None, "λύου", "λυέσθω", None, "λύεσθε", "λυέσθωσαν"])
vb("aor-pass-impv", "λύω", "λύθητι — aorist passive imperative",
   "λύθητι, λυθήτω, λύθητε, λυθήτωσαν. Recognize by the θη: ἐγέρθητι 'be raised!', φοβήθητε 'fear!'.",
   "APD", [None, "λύθητι", "λυθήτω", None, "λύθητε", "λυθήτωσαν"])
inf("infinitives", "λύω", "Infinitives of λύω (and εἰμί)",
    "Present -ειν / -εσθαι, aorist -σαι / -σασθαι / -θῆναι, perfect -κέναι / -σθαι; second aorist βαλεῖν, γενέσθαι; εἶναι 'to be'. Tense in an infinitive is aspect, not time.",
    [("PA", "λύειν"), ("PM", "λύεσθαι"), ("AA", "λῦσαι"), ("AM", "λύσασθαι"), ("AP", "λυθῆναι"), ("XA", "λελυκέναι"), ("XM", "λελύσθαι")])
inf("infinitives-eimi", "εἰμί", "εἶναι — to be", "The infinitive of εἰμί.", [("PA", "εἶναι")])
inf("infinitives-aor2", "βάλλω", "βαλεῖν — second aorist infinitive", "Second aorist stem + -εῖν (circumflex): βαλεῖν, λαβεῖν, εἰπεῖν, ἐλθεῖν, ἰδεῖν.", [("AA", "βαλεῖν")])

# ---- contract verbs ----------------------------------------------------------
vb("contract-eo", "ποιέω", "ποιῶ — -έω contract verb, present active",
   "ε + ω → ω, ε + ει → ει, ε + ο → ου. Contraction leaves a circumflex where the vowels merged. Outside the present and imperfect the ε lengthens to η: ποιήσω, ἐποίησα.",
   "PAI", ["ποιῶ", "ποιεῖς", "ποιεῖ", "ποιοῦμεν", "ποιεῖτε", "ποιοῦσι(ν)"])
vb("contract-ao", "ἀγαπάω", "ἀγαπῶ — -άω contract verb, present active",
   "α + ω/ο → ω, α + ει/ῃ → ᾳ. Outside the present the α lengthens to η: ἀγαπήσω, ἠγάπησα.",
   "PAI", ["ἀγαπῶ", "ἀγαπᾷς", "ἀγαπᾷ", "ἀγαπῶμεν", "ἀγαπᾶτε", "ἀγαπῶσι(ν)"])
vb("contract-oo", "πληρόω", "πληρῶ — -όω contract verb, present active",
   "ο + ω → ω, ο + ει → οι, ο + ο → ου. Outside the present the ο lengthens to ω: πληρώσω, ἐπλήρωσα.",
   "PAI", ["πληρῶ", "πληροῖς", "πληροῖ", "πληροῦμεν", "πληροῦτε", "πληροῦσι(ν)"])

# ---- -μι verbs and οἶδα --------------------------------------------------------
vb("mi-didomi-pres", "δίδωμι", "δίδωμι — present active (I give)",
   "-μι verbs reduplicate with ι in the present (δι-δω-) and add endings straight to the stem: -μι -ς -σι(ν) -μεν -τε -ασι(ν). The stem vowel is long in the singular (δίδω-), short in the plural (δίδο-).",
   "PAI", ["δίδωμι", "δίδως", "δίδωσι(ν)", "δίδομεν", "δίδοτε", "διδόασι(ν)"])
vb("mi-didomi-aor", "δίδωμι", "ἔδωκα — aorist active of δίδωμι",
   "A 'κ-aorist': ἔδωκα, ἔδωκας, ἔδωκε(ν), ἐδώκαμεν, ἐδώκατε, ἔδωκαν. τίθημι (ἔθηκα) and ἀφίημι (ἀφῆκα) do the same.",
   "AAI", ["ἔδωκα", "ἔδωκας", "ἔδωκε(ν)", "ἐδώκαμεν", "ἐδώκατε", "ἔδωκαν"])
vb("mi-tithemi-pres", "τίθημι", "τίθημι — present active (I put, place)",
   "Same pattern as δίδωμι with the stem θε-/θη-: τίθημι, τίθης, τίθησι(ν), τίθεμεν, τίθετε, τιθέασι(ν).",
   "PAI", ["τίθημι", "τίθης", "τίθησι(ν)", "τίθεμεν", "τίθετε", "τιθέασι(ν)"])
vb("mi-histemi-pres", "ἵστημι", "ἵστημι — present active (I set, stand)",
   "Stem στα-/στη- with the reduplication showing as a rough breathing: ἵστημι, ἵστης, ἵστησι(ν), ἵσταμεν, ἵστατε, ἱστᾶσι(ν). Its 2nd aorist ἔστην and perfect ἕστηκα both mean 'I stood / I stand'.",
   "PAI", ["ἵστημι", "ἵστης", "ἵστησι(ν)", "ἵσταμεν", "ἵστατε", "ἱστᾶσι(ν)"])
vb("oida-perf", "οἶδα", "οἶδα — I know (perfect in form, present in meaning)",
   "οἶδα, οἶδας, οἶδε(ν), οἴδαμεν, οἴδατε, οἴδασι(ν). Its pluperfect ᾔδειν means 'I knew'. Learn it as its own mini-paradigm.",
   "XAI", ["οἶδα", "οἶδας", "οἶδε(ν)", "οἴδαμεν", "οἴδατε", "οἴδασι(ν)"])

# ---- participles -------------------------------------------------------------
ptc("ptc-pres-act", "λύω", "λύων, λύουσα, λῦον — present active participle",
    "3-1-3: masculine/neuter follow ἄρχων (stem λυοντ-), feminine follows δόξα. 'loosing / while loosing'. The participle of εἰμί (ὤν, οὖσα, ὄν) is just the endings.",
    "PA",
    {"M": (["λύων", "λύοντος", "λύοντι", "λύοντα"], ["λύοντες", "λυόντων", "λύουσι(ν)", "λύοντας"]),
     "F": (["λύουσα", "λυούσης", "λυούσῃ", "λύουσαν"], ["λύουσαι", "λυουσῶν", "λυούσαις", "λυούσας"]),
     "N": (["λῦον", "λύοντος", "λύοντι", "λῦον"], ["λύοντα", "λυόντων", "λύουσι(ν)", "λύοντα"])})
ptc("ptc-pres-mp", "λύω", "λυόμενος, -η, -ον — present middle/passive participle",
    "The easiest participle: -όμενος declines exactly like ἀγαθός. Deponents use it: ἐρχόμενος 'coming'.",
    "PM",
    {"M": (["λυόμενος", "λυομένου", "λυομένῳ", "λυόμενον"], ["λυόμενοι", "λυομένων", "λυομένοις", "λυομένους"]),
     "F": (["λυομένη", "λυομένης", "λυομένῃ", "λυομένην"], ["λυόμεναι", "λυομένων", "λυομέναις", "λυομένας"]),
     "N": (["λυόμενον", "λυομένου", "λυομένῳ", "λυόμενον"], ["λυόμενα", "λυομένων", "λυομένοις", "λυόμενα"])})
ptc("ptc-aor-act", "λύω", "λύσας, λύσασα, λῦσαν — first aorist active participle",
    "σα + the -ντ pattern (no augment: only the indicative augments). Aorist participle usually = action before the main verb: 'having loosed'.",
    "AA",
    {"M": (["λύσας", "λύσαντος", "λύσαντι", "λύσαντα"], ["λύσαντες", "λυσάντων", "λύσασι(ν)", "λύσαντας"]),
     "F": (["λύσασα", "λυσάσης", "λυσάσῃ", "λύσασαν"], ["λύσασαι", "λυσασῶν", "λυσάσαις", "λυσάσας"]),
     "N": (["λῦσαν", "λύσαντος", "λύσαντι", "λῦσαν"], ["λύσαντα", "λυσάντων", "λύσασι(ν)", "λύσαντα"])})
ptc("ptc-aor2-act", "βάλλω", "βαλών, βαλοῦσα, βαλόν — second aorist active participle",
    "Present-participle endings on the second-aorist stem, with the accent on the ending: ἐλθών (having come), ἰδών (having seen), εἰπών (having said), λαβών (having taken).",
    "AA",
    {"M": (["βαλών", "βαλόντος", "βαλόντι", "βαλόντα"], ["βαλόντες", "βαλόντων", "βαλοῦσι(ν)", "βαλόντας"]),
     "F": (["βαλοῦσα", "βαλούσης", "βαλούσῃ", "βαλοῦσαν"], ["βαλοῦσαι", "βαλουσῶν", "βαλούσαις", "βαλούσας"]),
     "N": (["βαλόν", "βαλόντος", "βαλόντι", "βαλόν"], ["βαλόντα", "βαλόντων", "βαλοῦσι(ν)", "βαλόντα"])})
ptc("ptc-aor-mid", "λύω", "λυσάμενος, -η, -ον — aorist middle participle",
    "σα + -μενος, declined like ἀγαθός. Second aorist: γενόμενος (having become).",
    "AM",
    {"M": (["λυσάμενος", "λυσαμένου", "λυσαμένῳ", "λυσάμενον"], ["λυσάμενοι", "λυσαμένων", "λυσαμένοις", "λυσαμένους"]),
     "F": (["λυσαμένη", "λυσαμένης", "λυσαμένῃ", "λυσαμένην"], ["λυσάμεναι", "λυσαμένων", "λυσαμέναις", "λυσαμένας"]),
     "N": (["λυσάμενον", "λυσαμένου", "λυσαμένῳ", "λυσάμενον"], ["λυσάμενα", "λυσαμένων", "λυσαμένοις", "λυσάμενα"])})
ptc("ptc-aor-pass", "λύω", "λυθείς, λυθεῖσα, λυθέν — aorist passive participle",
    "θε + -ντ endings (masc/neut) or -ῖσα (fem): 'having been loosed'. ἀποκριθείς 'answering' (deponent) starts countless sentences in the Gospels.",
    "AP",
    {"M": (["λυθείς", "λυθέντος", "λυθέντι", "λυθέντα"], ["λυθέντες", "λυθέντων", "λυθεῖσι(ν)", "λυθέντας"]),
     "F": (["λυθεῖσα", "λυθείσης", "λυθείσῃ", "λυθεῖσαν"], ["λυθεῖσαι", "λυθεισῶν", "λυθείσαις", "λυθείσας"]),
     "N": (["λυθέν", "λυθέντος", "λυθέντι", "λυθέν"], ["λυθέντα", "λυθέντων", "λυθεῖσι(ν)", "λυθέντα"])})
ptc("ptc-perf-act", "λύω", "λελυκώς, λελυκυῖα, λελυκός — perfect active participle",
    "Reduplication + κοτ- stem (masc/neut) or -κυῖα (fem): a state resulting from a past action, 'having loosed / in a loosed state'.",
    "XA",
    {"M": (["λελυκώς", "λελυκότος", "λελυκότι", "λελυκότα"], ["λελυκότες", "λελυκότων", "λελυκόσι(ν)", "λελυκότας"]),
     "F": (["λελυκυῖα", "λελυκυίας", "λελυκυίᾳ", "λελυκυῖαν"], ["λελυκυῖαι", "λελυκυιῶν", "λελυκυίαις", "λελυκυίας"]),
     "N": (["λελυκός", "λελυκότος", "λελυκότι", "λελυκός"], ["λελυκότα", "λελυκότων", "λελυκόσι(ν)", "λελυκότα"])})
ptc("ptc-perf-mp", "λύω", "λελυμένος, -η, -ον — perfect middle/passive participle",
    "Reduplication + -μένος (accent on the μέ), declined like ἀγαθός. γεγραμμένος 'written', ἠγαπημένος 'beloved'.",
    "XM",
    {"M": (["λελυμένος", "λελυμένου", "λελυμένῳ", "λελυμένον"], ["λελυμένοι", "λελυμένων", "λελυμένοις", "λελυμένους"]),
     "F": (["λελυμένη", "λελυμένης", "λελυμένῃ", "λελυμένην"], ["λελυμέναι", "λελυμένων", "λελυμέναις", "λελυμένας"]),
     "N": (["λελυμένον", "λελυμένου", "λελυμένῳ", "λελυμένον"], ["λελυμένα", "λελυμένων", "λελυμένοις", "λελυμένα"])})
ptc("ptc-eimi", "εἰμί", "ὤν, οὖσα, ὄν — participle of εἰμί",
    "Pure endings with a rough breathing: ὤν, ὄντος … The present-active participle endings by themselves.",
    "PA",
    {"M": (["ὤν", "ὄντος", "ὄντι", "ὄντα"], ["ὄντες", "ὄντων", "οὖσι(ν)", "ὄντας"]),
     "F": (["οὖσα", "οὔσης", "οὔσῃ", "οὖσαν"], ["οὖσαι", "οὐσῶν", "οὔσαις", "οὔσας"]),
     "N": (["ὄν", "ὄντος", "ὄντι", "ὄν"], ["ὄντα", "ὄντων", "οὖσι(ν)", "ὄντα"])})

PARADIGM_IDS = {p["id"] for p in PARADIGMS}
assert len(PARADIGM_IDS) == len(PARADIGMS), "duplicate paradigm id"

# =============================================================================
# IRREGULAR ("STRANGE") VERBS — the principal-parts drill pool (README § verb
# track). Order: present, future, aorist active, perfect active, perfect
# middle/passive, aorist passive. None = not attested / not used in the NT.
# =============================================================================

IRREGULAR_VERBS = [
    {"lemma": "εἰμί", "parts": ["εἰμί", "ἔσομαι", None, None, None, None], "note": "Imperfect ἦν / ἤμην. No aorist, perfect or passive."},
    {"lemma": "λέγω", "parts": ["λέγω", "ἐρῶ", "εἶπον", "εἴρηκα", "εἴρημαι", "ἐρρέθην"], "note": "Three different roots (λεγ-, ἐρ-, εἰπ-). εἶπεν 'he said' is everywhere."},
    {"lemma": "ἔρχομαι", "parts": ["ἔρχομαι", "ἐλεύσομαι", "ἦλθον", "ἐλήλυθα", None, None], "note": "Deponent present, second aorist ἦλθον on a different root."},
    {"lemma": "ὁράω", "parts": ["ὁράω", "ὄψομαι", "εἶδον", "ἑώρακα", None, "ὤφθην"], "note": "εἶδον 'I saw' is the aorist; ὤφθη 'he appeared / was seen'."},
    {"lemma": "γίνομαι", "parts": ["γίνομαι", "γενήσομαι", "ἐγενόμην", "γέγονα", "γεγένημαι", "ἐγενήθην"], "note": "ἐγένετο 'it came to pass'. Perfect γέγονα is active in form."},
    {"lemma": "ἔχω", "parts": ["ἔχω", "ἕξω", "ἔσχον", "ἔσχηκα", None, None], "note": "Imperfect εἶχον (irregular augment). Future ἕξω gains a rough breathing."},
    {"lemma": "λαμβάνω", "parts": ["λαμβάνω", "λήμψομαι", "ἔλαβον", "εἴληφα", None, "ἐλήμφθην"], "note": "Root λαβ-; the present adds μ and -αν-."},
    {"lemma": "οἶδα", "parts": ["οἶδα", "εἰδήσω", None, "οἶδα", None, None], "note": "Perfect form, present meaning 'I know'; pluperfect ᾔδειν = 'I knew'."},
    {"lemma": "φέρω", "parts": ["φέρω", "οἴσω", "ἤνεγκα", "ἐνήνοχα", None, "ἠνέχθην"], "note": "Three roots: φερ-, οἰ-, ἐνεκ-."},
    {"lemma": "ἐσθίω", "parts": ["ἐσθίω", "φάγομαι", "ἔφαγον", None, None, None], "note": "Aorist on the root φαγ-."},
    {"lemma": "πίνω", "parts": ["πίνω", "πίομαι", "ἔπιον", "πέπωκα", None, "ἐπόθην"], "note": "Aorist stem πι-."},
    {"lemma": "γινώσκω", "parts": ["γινώσκω", "γνώσομαι", "ἔγνων", "ἔγνωκα", "ἔγνωσμαι", "ἐγνώσθην"], "note": "Root aorist ἔγνων, ἔγνως, ἔγνω, ἔγνωμεν, ἔγνωτε, ἔγνωσαν."},
    {"lemma": "δίδωμι", "parts": ["δίδωμι", "δώσω", "ἔδωκα", "δέδωκα", "δέδομαι", "ἐδόθην"], "note": "κ-aorist ἔδωκα."},
    {"lemma": "τίθημι", "parts": ["τίθημι", "θήσω", "ἔθηκα", "τέθεικα", "τέθειμαι", "ἐτέθην"], "note": "κ-aorist ἔθηκα."},
    {"lemma": "ἵστημι", "parts": ["ἵστημι", "στήσω", "ἔστησα / ἔστην", "ἕστηκα", None, "ἐστάθην"], "note": "First aorist ἔστησα is transitive (I set); second aorist ἔστην and perfect ἕστηκα are intransitive (I stood / I stand)."},
    {"lemma": "ἀφίημι", "parts": ["ἀφίημι", "ἀφήσω", "ἀφῆκα", None, "ἀφέωμαι", "ἀφέθην"], "note": "ἀφέωνται 'they are forgiven'."},
    {"lemma": "ἀποθνῄσκω", "parts": ["ἀποθνῄσκω", "ἀποθανοῦμαι", "ἀπέθανον", None, None, None], "note": "Root θαν-; liquid future."},
    {"lemma": "ἐγείρω", "parts": ["ἐγείρω", "ἐγερῶ", "ἤγειρα", None, "ἐγήγερμαι", "ἠγέρθην"], "note": "ἠγέρθη 'he was raised / he rose'."},
    {"lemma": "ἀποστέλλω", "parts": ["ἀποστέλλω", "ἀποστελῶ", "ἀπέστειλα", "ἀπέσταλκα", "ἀπέσταλμαι", "ἀπεστάλην"], "note": "Liquid verb: no σ in future/aorist; second aorist passive without θ."},
    {"lemma": "κρίνω", "parts": ["κρίνω", "κρινῶ", "ἔκρινα", "κέκρικα", "κέκριμαι", "ἐκρίθην"], "note": "Liquid verb."},
    {"lemma": "μένω", "parts": ["μένω", "μενῶ", "ἔμεινα", "μεμένηκα", None, None], "note": "Liquid verb; aorist lengthens ε to ει."},
    {"lemma": "ἀναβαίνω", "parts": ["ἀναβαίνω", "ἀναβήσομαι", "ἀνέβην", "ἀναβέβηκα", None, None], "note": "βαίνω occurs only in compounds (ἀναβαίνω go up, καταβαίνω go down). Root aorist ἀνέβην, ἀνέβη."},
    {"lemma": "πίπτω", "parts": ["πίπτω", "πεσοῦμαι", "ἔπεσον", "πέπτωκα", None, None], "note": "Root πετ-/πτ-."},
    {"lemma": "βάλλω", "parts": ["βάλλω", "βαλῶ", "ἔβαλον", "βέβληκα", "βέβλημαι", "ἐβλήθην"], "note": "Model second aorist ἔβαλον."},
    {"lemma": "εὑρίσκω", "parts": ["εὑρίσκω", "εὑρήσω", "εὗρον", "εὕρηκα", None, "εὑρέθην"], "note": "Second aorist εὗρον."},
    {"lemma": "ἄγω", "parts": ["ἄγω", "ἄξω", "ἤγαγον", None, None, "ἤχθην"], "note": "Reduplicated second aorist ἤγαγον."},
    {"lemma": "πάσχω", "parts": ["πάσχω", None, "ἔπαθον", "πέπονθα", None, None], "note": "Root παθ-."},
    {"lemma": "θέλω", "parts": ["θέλω", "θελήσω", "ἠθέλησα", None, None, None], "note": "Augments as if it began with ε: ἤθελον, ἠθέλησα."},
    {"lemma": "δύναμαι", "parts": ["δύναμαι", "δυνήσομαι", None, None, None, "ἠδυνήθην"], "note": "Deponent; aorist passive in form, active in meaning: ἠδυνήθη 'he was able'."},
    {"lemma": "καλέω", "parts": ["καλέω", "καλέσω", "ἐκάλεσα", "κέκληκα", "κέκλημαι", "ἐκλήθην"], "note": "Does not lengthen the ε (καλέσω, not καλήσω)."},
    {"lemma": "ἀκούω", "parts": ["ἀκούω", "ἀκούσω", "ἤκουσα", "ἀκήκοα", None, "ἠκούσθην"], "note": "Attic-reduplicated perfect ἀκήκοα."},
    {"lemma": "πείθω", "parts": ["πείθω", "πείσω", "ἔπεισα", "πέποιθα", "πέπεισμαι", "ἐπείσθην"], "note": "Second perfect πέποιθα 'I trust' (present meaning)."},
    {"lemma": "ἀποκρίνομαι", "parts": ["ἀποκρίνομαι", None, "ἀπεκρινάμην", None, None, "ἀπεκρίθην"], "note": "The aorist PASSIVE ἀπεκρίθη 'he answered' is the normal form; the middle is rare."},
    {"lemma": "πορεύομαι", "parts": ["πορεύομαι", "πορεύσομαι", None, None, "πεπόρευμαι", "ἐπορεύθην"], "note": "Aorist passive form, active meaning: ἐπορεύθη 'he went'."},
    {"lemma": "φοβέομαι", "parts": ["φοβέομαι", None, None, None, None, "ἐφοβήθην"], "note": "Aorist passive form, active meaning: ἐφοβήθησαν 'they were afraid'."},
    {"lemma": "χαίρω", "parts": ["χαίρω", "χαρήσομαι", None, None, None, "ἐχάρην"], "note": "Second aorist passive with active meaning: ἐχάρησαν 'they rejoiced'."},
    {"lemma": "ἀπόλλυμι", "parts": ["ἀπόλλυμι", "ἀπολέσω / ἀπολῶ", "ἀπώλεσα", "ἀπόλωλα", None, None], "note": "Active: destroy, lose. Middle ἀπόλλυμαι, ἀπολοῦμαι, ἀπωλόμην: perish."},
    {"lemma": "φημί", "parts": ["φημί", None, "ἔφην", None, None, None], "note": "ἔφη 'he said' is imperfect/aorist in form; treat it as a fixed vocabulary item."},
    {"lemma": "ἀνοίγω", "parts": ["ἀνοίγω", "ἀνοίξω", "ἤνοιξα / ἀνέῳξα", "ἀνέῳγα", "ἀνέῳγμαι / ἠνέῳγμαι", "ἀνεῴχθην / ἠνοίχθην / ἠνεῴχθην"], "note": "Famously has several competing augmented forms; recognize the stem οιγ-."},
    {"lemma": "μανθάνω", "parts": ["μανθάνω", None, "ἔμαθον", "μεμάθηκα", None, None], "note": "Root μαθ- (cf. μαθητής)."},
    {"lemma": "φεύγω", "parts": ["φεύγω", "φεύξομαι", "ἔφυγον", "πέφευγα", None, None], "note": "Second aorist ἔφυγον."},
    {"lemma": "ἁμαρτάνω", "parts": ["ἁμαρτάνω", "ἁμαρτήσω", "ἥμαρτον / ἡμάρτησα", "ἡμάρτηκα", None, None], "note": "Both a second and a first aorist occur."},
]

# =============================================================================
# THE SPINE — Books I–VIII (grammar + core vocabulary + John 1 / 1 John 1),
# then the reading track (generated per NT book, in measured difficulty order).
# =============================================================================

# Drill formats per lesson type. The app progresses each item MC → typed →
# produced according to its stored strength (M6, M12, M17).
DRILLS_BY_TYPE = {
    "alphabet": ["letter-name-mc", "letter-sound-mc", "type-transliteration", "read-aloud"],
    "vocab": ["gloss-mc", "gloss-type", "greek-type", "audio-recognize"],
    "grammar": ["gloss-mc", "gloss-type", "form-recognition", "parse", "supply-form"],
    "verb": ["gloss-mc", "gloss-type", "form-recognition", "parse", "supply-form", "principal-parts"],
    "reading": ["tap-gloss", "read-reveal-rate", "comprehension-mc"],
}


def rule(title, body, *examples):
    return {"title": title, "body": body, "examples": [{"gr": g, "en": e} for g, e in examples]}


def read(book, chapter, start, end):
    return {"book": book, "chapter": chapter, "from": start, "to": end}


UNITS = [
    # ------------------------------------------------------------------ BOOK I
    {
        "id": "unit-01-foundations", "kicker": "Book I", "title": "Ὁ Λόγος", "sub": "Foundations",
        "summary": "Read the alphabet, meet the ten most common words in the New Testament, learn 'to be' and 'the', and read John 1:1–2 in Greek.",
        "lessons": [
            {"key": "alphabet-1", "type": "alphabet", "label": "Α Β Γ", "sub": "The alphabet: Α to Μ",
             "alphabet": {"letters": ["α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "ι", "κ", "λ", "μ"]},
             "rule": rule("Twenty-four letters", "Greek has 24 letters; you already know several from math and science (α β γ δ π). Learn each letter's name, its lowercase shape, and its sound. Capitals are used only at the start of names and paragraphs, so lowercase matters most.",
                          ("α β γ δ", "alpha, beta, gamma, delta"), ("λόγος", "lo-gos: word"))},
            {"key": "alphabet-2", "type": "alphabet", "label": "Ν Ξ Ο", "sub": "The alphabet: Ν to Ω",
             "alphabet": {"letters": ["ν", "ξ", "ο", "π", "ρ", "σ", "τ", "υ", "φ", "χ", "ψ", "ω"]},
             "rule": rule("The second half", "Watch the look-alikes: ν (nu) is not v, ρ (rho) is not p, and χ (chi) is not x. Sigma has two shapes: σ inside a word, ς at the end (θεός).",
                          ("θεός", "the-os: God"), ("Χριστός", "Chris-tos: Christ"))},
            {"key": "alphabet-3", "type": "alphabet", "label": "αι ει ου", "sub": "Vowels, diphthongs, breathing marks",
             "alphabet": {"sections": ["vowels", "diphthongs", "iotaSubscript", "breathing"]},
             "rule": rule("Two vowels, one sound", "Seven vowels (α ε η ι ο υ ω) combine into diphthongs that are read as one syllable. Every word beginning with a vowel wears a breathing mark: rough ( ῾ ) adds an h-sound, smooth ( ᾿ ) adds nothing.",
                          ("οὐ", "oo: not"), ("ὁ υἱός", "ho hwee-os: the son"), ("ἐν ἀρχῇ", "en ar-chay: in [the] beginning (the ῃ hides an iota)"))},
            {"key": "alphabet-4", "type": "alphabet", "label": "ά ὰ ᾶ", "sub": "Accents, punctuation, reading aloud",
             "alphabet": {"sections": ["accents", "accentRule", "punctuation", "syllables"]},
             "rule": rule("Stress the accented syllable", "Three accent marks, one job for a reader: they show which syllable to stress. Punctuation is mostly familiar, with two traps: the raised dot (·) is a semicolon/colon, and the Greek question mark looks exactly like our semicolon (;).",
                          ("τίς εἶ;", "Who are you?"), ("Ἐν ἀρχῇ ἦν ὁ λόγος, καὶ ὁ λόγος ἦν πρὸς τὸν θεόν", "In the beginning was the Word, and the Word was with God"))},
            {"key": "first-words", "type": "vocab", "label": "καί", "sub": "The ten most common little words",
             "vocab": ["καί", "δέ", "ἐν", "εἰς", "οὐ", "ὅτι", "γάρ", "μή", "ἐκ", "ἀλλά"],
             "rule": rule("Words that never change", "Conjunctions, prepositions and the negatives have no endings to learn, and these ten alone are about one word in every seven in the New Testament. οὐ is 'not' for facts (indicative); μή is 'not' for everything else (commands, wishes, conditions).",
                          ("καὶ … καὶ …", "both … and …"), ("οὐ … ἀλλά …", "not … but …"), ("ἐν ἀρχῇ", "in [the] beginning"))},
            {"key": "eimi", "type": "verb", "label": "εἰμί", "sub": "To be, and the words of John 1:1",
             "vocab": ["εἰμί", "θεός", "λόγος", "ἀρχή", "ζωή", "φῶς", "ἄνθρωπος", "κόσμος"],
             "paradigms": ["eimi-pres"],
             "rule": rule("Verbs carry their subject", "A Greek verb ending tells you who is doing it, so 'I am' is one word: εἰμί. ἐστίν = 'he/she/it is', εἰσίν = 'they are'. There is usually no separate word for 'I', 'you' or 'he' unless the writer wants emphasis.",
                          ("θεός ἐστιν", "he is God / God is"), ("ἐγώ εἰμι τὸ φῶς", "I am the light"), ("ὑμεῖς ἐστε τὸ φῶς τοῦ κόσμου", "you are the light of the world"))},
            {"key": "article", "type": "grammar", "label": "ὁ ἡ τό", "sub": "The article and the four cases",
             "vocab": ["ὁ", "αὐτός", "οὗτος", "πρός", "ἵνα", "ὡς", "εἰ", "οὖν"],
             "paradigms": ["article"],
             "rule": rule("Endings do the work of word order", "English uses word order to show who does what; Greek uses endings called cases. Nominative = subject (ὁ λόγος), genitive = 'of' (τοῦ θεοῦ), dative = 'to / for / in' (τῷ θεῷ), accusative = object (τὸν λόγον). The article (the) changes with its noun and is your best clue to the case.",
                          ("ὁ λόγος ἦν πρὸς τὸν θεόν", "the Word was with God (ὁ = subject, τόν = after the preposition)"), ("ὁ υἱὸς τοῦ θεοῦ", "the son of God"), ("τῷ κόσμῳ", "to / in the world"))},
            {"key": "read-john-1-1", "type": "reading", "label": "Κατὰ Ἰωάννην", "sub": "Read: John 1:1–2",
             "reading": read("john", 1, 1, 2),
             "vocab": {"fill": {"fromReading": True}},
             "rule": rule("Read for meaning", "You already know almost every word here. Read the Greek, form the sense in your head, then reveal the translation and rate yourself honestly. Tap any word you do not know for its gloss; those taps are how the app learns what to teach you next.")},
        ],
    },
    # ----------------------------------------------------------------- BOOK II
    {
        "id": "unit-02-nouns", "kicker": "Book II", "title": "Ὁ Λόγος καὶ ὁ Θεός", "sub": "Nouns, cases and agreement",
        "summary": "The first and second declensions, prepositions with their cases, adjectives that agree, the personal pronouns, and John 1:3–5.",
        "lessons": [
            {"key": "decl2-masc", "type": "grammar", "label": "λόγος", "sub": "Second declension masculine nouns",
             "vocab": ["κύριος", "υἱός", "ἀδελφός", "οὐρανός", "νόμος", "ἄγγελος", "ὄχλος", "δοῦλος", "θάνατος", "οἶκος", "ὀφθαλμός", "ἄρτος"],
             "paradigms": ["decl2-masc"],
             "rule": rule("Nouns in -ος", "Most masculine nouns end in -ος and follow λόγος: -ος -ου -ῳ -ον in the singular, -οι -ων -οις -ους in the plural. Notice how each ending echoes the article (ὁ λόγος, τοῦ λόγου, τῷ λόγῳ, τὸν λόγον). A vocative (-ε) is used for direct address: κύριε, Lord!",
                          ("οἱ μαθηταὶ τοῦ κυρίου", "the disciples of the Lord"), ("ἐν τῷ οἴκῳ", "in the house"), ("τοὺς ἀδελφούς", "the brothers (object)"))},
            {"key": "decl2-neut", "type": "grammar", "label": "ἔργον", "sub": "Second declension neuter nouns",
             "vocab": ["ἔργον", "τέκνον", "εὐαγγέλιον", "σημεῖον", "πρόσωπον", "δαιμόνιον", "πλοῖον", "ἱμάτιον", "σάββατον", "παιδίον"],
             "paradigms": ["decl2-neut"],
             "rule": rule("Nouns in -ον", "Neuter nouns use the same genitive and dative as λόγος, but nominative and accusative are identical: -ον singular, -α plural. So τὰ ἔργα can be subject or object; let the verb and context decide. A neuter plural subject regularly takes a singular verb.",
                          ("τὰ ἔργα τοῦ θεοῦ", "the works of God"), ("τὸ εὐαγγέλιον τῆς βασιλείας", "the gospel of the kingdom"), ("τὰ τέκνα ἐστίν …", "the children are … (singular verb!)"))},
            {"key": "decl1-fem", "type": "grammar", "label": "ἡ ἀρχή", "sub": "First declension feminine nouns",
             "vocab": ["ἡμέρα", "γῆ", "ψυχή", "ἀγάπη", "βασιλεία", "ἐκκλησία", "δόξα", "καρδία", "ἁμαρτία", "ἀλήθεια", "ὥρα", "ἐξουσία"],
             "paradigms": ["decl1-eta", "decl1-alpha-pure", "decl1-alpha-mixed"],
             "rule": rule("Nouns in -η and -α", "Feminine nouns follow ἡ, τῆς, τῇ, τήν. Three flavours differ only in the singular: -η all the way (ἀρχή), -α all the way when the stem ends in ε ι ρ (ἡμέρα), or -α that turns to η in the genitive and dative (δόξα, δόξης). Every plural is the same: -αι -ων -αις -ας.",
                          ("ἡ βασιλεία τοῦ θεοῦ", "the kingdom of God"), ("ἐν τῇ καρδίᾳ", "in the heart"), ("τὰς ἡμέρας", "the days (object)"))},
            {"key": "decl1-more", "type": "grammar", "label": "μαθητής", "sub": "More nouns: -ης masculines and the odd ones",
             "vocab": ["μαθητής", "προφήτης", "οἰκία", "φωνή", "δικαιοσύνη", "εἰρήνη", "θάλασσα", "ἐντολή", "χαρά", "συναγωγή", "ἐπαγγελία", "σοφία", "γλῶσσα", "παραβολή", "ὁδός"],
             "paradigms": ["decl1-masc"],
             "rule": rule("Gender is grammar, not biology", "Some masculine nouns (μαθητής disciple, προφήτης prophet) take first-declension endings with a -ου genitive, and ἡ ὁδός (the road) is feminine despite its -ος. The article always tells the truth about gender; the ending sometimes lies.",
                          ("ὁ μαθητής, τοῦ μαθητοῦ", "the disciple, of the disciple"), ("ἡ ὁδὸς τοῦ κυρίου", "the way of the Lord"), ("οἱ προφῆται", "the prophets"))},
            {"key": "prepositions", "type": "grammar", "label": "ἐν ἐκ εἰς", "sub": "Prepositions and the cases they take",
             "vocab": ["ἐπί", "διά", "ἀπό", "μετά", "κατά", "περί", "ὑπό", "παρά", "ὑπέρ", "ἕως", "σύν", "ἐνώπιον"],
             "rule": rule("A preposition's meaning depends on the case after it", "ἐν, σύν take the dative; εἰς takes the accusative; ἐκ, ἀπό, πρό take the genitive. Several prepositions change meaning with case: διά + genitive = through, διά + accusative = because of; μετά + genitive = with, μετά + accusative = after; ὑπό + genitive = by, ὑπό + accusative = under.",
                          ("ἐκ τοῦ κόσμου", "out of the world"), ("διὰ τοῦ προφήτου", "through the prophet"), ("μετὰ τρεῖς ἡμέρας", "after three days"))},
            {"key": "adjectives-1", "type": "grammar", "label": "ἀγαθός", "sub": "Adjectives and agreement",
             "vocab": ["ἀγαθός", "ἅγιος", "καλός", "νεκρός", "ἴδιος", "μόνος", "ὅλος", "ἄλλος", "ἕτερος", "πρῶτος", "πιστός", "δίκαιος"],
             "paradigms": ["adj-agathos"],
             "rule": rule("Agreement and position", "An adjective matches its noun in gender, number and case, using the endings you already know (ἀγαθός like λόγος, ἀγαθή like ἀρχή, ἀγαθόν like ἔργον). Between article and noun, or after a repeated article, it describes (ὁ ἀγαθὸς ἄνθρωπος, the good man); outside the article group it is a statement (ἀγαθὸς ὁ ἄνθρωπος, the man is good). With the article and no noun it becomes a noun: οἱ ἅγιοι, the saints.",
                          ("τὸ πνεῦμα τὸ ἅγιον", "the Holy Spirit"), ("πιστὸς ὁ θεός", "God is faithful"), ("οἱ νεκροί", "the dead"))},
            {"key": "pronouns-1", "type": "grammar", "label": "ἐγώ σύ", "sub": "Personal pronouns and αὐτός",
             "vocab": ["ἐγώ", "σύ", "ἑαυτοῦ", "ἀλλήλων", "κἀγώ", "ἐκεῖνος"],
             "paradigms": ["pron-ego", "pron-su", "pron-autos", "pron-houtos", "pron-ekeinos"],
             "rule": rule("Pronouns stand in for nouns and take their case", "ἐγώ / σύ decline like nouns (μου of me, μοι to me, με me). αὐτός is 'he/she/it' in the oblique cases (αὐτοῦ his, αὐτῷ to him, αὐτόν him); in the nominative next to a noun it means 'himself'; with the article it means 'the same'. οὗτος this, ἐκεῖνος that.",
                          ("ὁ λόγος αὐτοῦ", "his word"), ("αὐτὸς ὁ Ἰησοῦς", "Jesus himself"), ("οὗτος ἦν ἐν ἀρχῇ πρὸς τὸν θεόν", "this one was in the beginning with God"))},
            {"key": "names", "type": "vocab", "label": "Ἰησοῦς", "sub": "People and places",
             "vocab": ["Ἰησοῦς", "Χριστός", "Παῦλος", "Πέτρος", "Ἰωάννης", "Μωϋσῆς", "Ἰερουσαλήμ", "Ἱεροσόλυμα", "Ἰσραήλ", "Ἀβραάμ", "Δαυίδ", "Σίμων", "Πιλᾶτος", "Γαλιλαία", "Φαρισαῖος", "Ἰουδαῖος"],
             "rule": rule("Names you already know", "Names borrowed from Hebrew often do not decline at all (Ἰσραήλ, Ἀβραάμ, Δαυίδ); the article shows their case. Ἰησοῦς has its own tiny paradigm: Ἰησοῦς, Ἰησοῦ, Ἰησοῦ, Ἰησοῦν. Jerusalem appears in two spellings, Ἰερουσαλήμ (indeclinable) and Ἱεροσόλυμα (neuter plural).",
                          ("Ἰησοῦς Χριστός", "Jesus Christ"), ("τοῦ Ἰησοῦ", "of Jesus"), ("ἐν Ἱεροσολύμοις", "in Jerusalem"))},
            {"key": "read-john-1-3", "type": "reading", "label": "Κατὰ Ἰωάννην", "sub": "Read: John 1:3–5",
             "reading": read("john", 1, 3, 5),
             "vocab": {"fill": {"fromReading": True}},
             "rule": rule("Neuter plurals and 'through him'", "πάντα (all things) is a neuter plural subject with a singular verb, exactly as you learned. δι' αὐτοῦ is διά + genitive: through him.")},
        ],
    },
    # ---------------------------------------------------------------- BOOK III
    {
        "id": "unit-03-present-verbs", "kicker": "Book III", "title": "Λύω", "sub": "The present tense",
        "summary": "Regular verbs in the present, deponents, contract verbs, the imperfect, the infinitive, and John 1:6–13.",
        "lessons": [
            {"key": "present-1", "type": "verb", "label": "λέγω", "sub": "Present active: the ω-verb",
             "vocab": ["λέγω", "ἔχω", "πιστεύω", "ἀκούω", "γράφω", "βλέπω", "λύω", "μένω", "θέλω", "δέω"],
             "paradigms": ["pres-act"],
             "rule": rule("Six endings, one pattern", "Take the dictionary form, drop -ω, add: -ω -εις -ει -ομεν -ετε -ουσι(ν). λέγει = he says, λέγομεν = we say. The present describes what is happening or what happens in general. δεῖ (from δέω) is a fixed third-person form: 'it is necessary'.",
                          ("πιστεύομεν", "we believe"), ("τί λέγεις;", "what do you say?"), ("δεῖ ὑμᾶς γεννηθῆναι ἄνωθεν", "you must be born from above"))},
            {"key": "present-2", "type": "verb", "label": "γινώσκω", "sub": "More present-tense verbs",
             "vocab": ["βάλλω", "γινώσκω", "εὑρίσκω", "λαμβάνω", "σῴζω", "ἐσθίω", "πέμπω", "ἄγω", "κρίνω", "πίνω", "διδάσκω", "μέλλω"],
             "paradigms": ["pres-act"],
             "rule": rule("Verbs take objects in the accusative", "A transitive verb's object goes in the accusative: βάλλει λίθον, he throws a stone. Some verbs prefer other cases (ἀκούω often takes the genitive of the person heard). μέλλω + infinitive = 'to be about to'.",
                          ("ὁ θεὸς σῴζει τὸν κόσμον", "God saves the world"), ("λαμβάνουσιν τὸν ἄρτον", "they take the bread"), ("γινώσκετε τὴν ἀλήθειαν", "you know the truth"))},
            {"key": "deponents", "type": "verb", "label": "ἔρχομαι", "sub": "Middle/passive endings and deponent verbs",
             "vocab": ["γίνομαι", "ἔρχομαι", "ἀποκρίνομαι", "δύναμαι", "πορεύομαι", "προσεύχομαι", "δέχομαι", "κάθημαι", "ἀσπάζομαι", "φοβέομαι"],
             "paradigms": ["pres-mp"],
             "rule": rule("Middle form, active meaning", "The second set of present endings (-ομαι -ῃ -εται -όμεθα -εσθε -ονται) marks middle or passive voice. Many of the most common verbs exist only in this form and simply mean what they say: ἔρχομαι I come, γίνομαι I become, ἀποκρίνομαι I answer. These are 'deponents'; recognize the endings and read them as active.",
                          ("ἔρχεται ὁ κύριος", "the Lord is coming"), ("οὐ δύναμαι", "I cannot"), ("πορεύεσθε ἐν εἰρήνῃ", "go in peace"))},
            {"key": "compounds", "type": "verb", "label": "ἐξέρχομαι", "sub": "Compound verbs",
             "vocab": ["ἐξέρχομαι", "εἰσέρχομαι", "ἀπέρχομαι", "προσέρχομαι", "ἀναβαίνω", "καταβαίνω", "ἐκβάλλω", "συνάγω", "ὑπάγω", "ἀπολύω", "ὑπάρχω", "ἄρχω"],
             "rule": rule("Preposition + verb", "Greek builds verbs by gluing a preposition to the front: ἐκ + ἔρχομαι = ἐξέρχομαι (go out), εἰς + ἔρχομαι = εἰσέρχομαι (go in), ἀνά + βαίνω = ἀναβαίνω (go up). Learn the prefix meanings once and hundreds of verbs become transparent. The prefix often repeats as a preposition after the verb: εἰσέρχεται εἰς τὴν πόλιν.",
                          ("ἐκβάλλει τὰ δαιμόνια", "he casts out the demons"), ("καταβαίνει ἐκ τοῦ οὐρανοῦ", "he comes down from heaven"), ("ὕπαγε", "go!"))},
            {"key": "contract-1", "type": "verb", "label": "ποιέω", "sub": "Contract verbs in -έω",
             "vocab": ["ποιέω", "λαλέω", "ζητέω", "καλέω", "τηρέω", "θεωρέω", "μαρτυρέω", "περιπατέω", "παρακαλέω", "ἀκολουθέω", "αἰτέω", "δοκέω"],
             "paradigms": ["contract-eo"],
             "rule": rule("Vowels that merge", "When a stem ends in ε, it merges with the ending: ποιέ-ω → ποιῶ, ποιέ-εις → ποιεῖς, ποιέ-ομεν → ποιοῦμεν. The circumflex is the scar. Dictionaries list the uncontracted form (ποιέω) so you can see the stem; the text never does.",
                          ("τί ποιεῖτε;", "what are you doing?"), ("λαλεῖ ὁ Ἰησοῦς", "Jesus is speaking"), ("ζητοῦμεν τὴν βασιλείαν", "we seek the kingdom"))},
            {"key": "contract-2", "type": "verb", "label": "ἀγαπάω", "sub": "Contract verbs in -άω and -όω",
             "vocab": ["ἀγαπάω", "ὁράω", "ζάω", "γεννάω", "ἐρωτάω", "ἐπερωτάω", "πληρόω", "προσκυνέω"],
             "paradigms": ["contract-ao", "contract-oo"],
             "rule": rule("α swallows, ο rounds", "α-stems: everything becomes α or ᾳ (ἀγαπῶ, ἀγαπᾷς, ἀγαπᾷ, ἀγαπῶμεν, ἀγαπᾶτε, ἀγαπῶσι). ο-stems: ω, οι, ου (πληρῶ, πληροῖς, πληροῖ, πληροῦμεν). If you see a circumflex on the ending of a verb, suspect a contract verb.",
                          ("ἀγαπᾷ τὸν υἱόν", "he loves the son"), ("ὁρῶμεν", "we see"), ("ζῶ", "I live"))},
            {"key": "imperfect", "type": "verb", "label": "ἔλυον", "sub": "The imperfect tense (and εἰμί in the past)",
             "vocab": ["οὕτω(ς)", "τότε", "νῦν", "πάλιν", "πῶς", "ἐκεῖ", "ἔτι", "μᾶλλον", "ὅπου", "ἔξω", "ὧδε", "ἤδη"],
             "paradigms": ["impf-act", "impf-mp", "eimi-impf"],
             "rule": rule("Augment = past", "A past tense in the indicative is marked at the FRONT of the verb by an augment: ἐ- before a consonant (λύω → ἔλυον), or a lengthened vowel (ἀκούω → ἤκουον, ἔχω → εἶχον). The imperfect is the past of the present: ongoing or repeated action, 'was doing', 'used to do'. ἦν (was) is the imperfect of εἰμί.",
                          ("ἔλεγεν αὐτοῖς", "he was saying to them / he used to tell them"), ("ἐν ἀρχῇ ἦν ὁ λόγος", "in the beginning the Word was"), ("ἤρχοντο πρὸς αὐτόν", "they kept coming to him"))},
            {"key": "connectives", "type": "vocab", "label": "ἐάν ὅταν", "sub": "Conjunctions and connectives",
             "vocab": ["ἤ", "ἐάν", "τέ", "καθώς", "μέν", "οὐδέ", "ὅταν", "ὅτε", "οὔτε", "ὥστε", "εἴτε", "μηδέ", "διό", "ὅπως"],
             "rule": rule("The glue of Greek sentences", "Greek writers rarely start a sentence without a connector: καί, δέ, γάρ, οὖν. μέν … δέ … pairs two halves ('on the one hand … on the other'). δέ, γάρ, οὖν and μέν are 'postpositive': they sit second in the sentence but translate first. ὅταν = ὅτε + ἄν, 'whenever'; ἐάν = εἰ + ἄν, 'if ever'.",
                          ("ὁ μὲν … ὁ δὲ …", "the one … the other …"), ("ὥστε", "so that, with the result that"), ("οὔτε … οὔτε …", "neither … nor …"))},
            {"key": "infinitive", "type": "verb", "label": "λύειν", "sub": "The infinitive, and four particles",
             "vocab": ["ἰδού", "ἄν", "ἀμήν", "οὐχί"],
             "paradigms": ["infinitives", "infinitives-eimi"],
             "rule": rule("The verb as a noun", "-ειν (active) and -εσθαι (middle/passive) make an infinitive: λύειν 'to loose', ἔρχεσθαι 'to come'. It completes verbs like θέλω, δύναμαι, μέλλω, δεῖ, and with the article it works as a noun (τὸ ζῆν, living). The subject of an infinitive goes in the accusative.",
                          ("θέλω εἶναι μετ' αὐτοῦ", "I want to be with him"), ("οὐ δύναται ἐλθεῖν", "he cannot come"), ("ἰδού", "look! (introduces something new)"))},
            {"key": "pronouns-2", "type": "grammar", "label": "ὅς τίς", "sub": "Relative, interrogative and indefinite pronouns",
             "vocab": ["ὅς", "τίς", "τις", "ὅστις", "ὅσος", "τοιοῦτος", "οὐδείς", "μηδείς"],
             "paradigms": ["pron-hos", "pron-tis", "adj-heis"],
             "rule": rule("Who, which, someone, no one", "ὅς ἥ ὅ (who / which) agrees with its antecedent in gender and number but takes its case from its own clause. τίς with an accent asks a question; τις without one means 'someone, a certain'. οὐδείς / μηδείς = 'no one, nothing', declined like εἷς.",
                          ("ὁ ἄνθρωπος ὃν εἶδες", "the man whom you saw"), ("τίς ἐστιν οὗτος;", "who is this?"), ("οὐδεὶς ἀγαθὸς εἰ μὴ εἷς ὁ θεός", "no one is good except one: God"))},
            {"key": "read-john-1-6", "type": "reading", "label": "Κατὰ Ἰωάννην", "sub": "Read: John 1:6–13",
             "reading": read("john", 1, 6, 13),
             "vocab": {"fill": {"fromReading": True}},
             "rule": rule("Watch the imperfects", "ἦν, ἦλθεν, ἔλαβον: the story moves in past tenses now. ἐγένετο (there was / came) is the aorist of γίνομαι; you will formally meet the aorist in Book V, so for now just read it as 'came to be'.")},
        ],
    },
    # ----------------------------------------------------------------- BOOK IV
    {
        "id": "unit-04-third-declension", "kicker": "Book IV", "title": "Πᾶς", "sub": "The third declension",
        "summary": "Consonant-stem nouns (πατήρ, πνεῦμα, πίστις, βασιλεύς), the big adjectives πᾶς, πολύς, μέγας, numbers, and John 1:14–18.",
        "lessons": [
            {"key": "decl3-1", "type": "grammar", "label": "πατήρ", "sub": "Third declension: consonant stems",
             "vocab": ["πατήρ", "ἀνήρ", "γυνή", "χείρ", "σάρξ", "μήτηρ", "νύξ", "πούς", "αἰών", "χάρις", "ἐλπίς"],
             "paradigms": ["decl3-sarx", "decl3-archon", "decl3-pater"],
             "rule": rule("Find the stem in the genitive", "Third-declension nouns hide their stem in the nominative (σάρξ) and show it in the genitive (σαρκ-ός). Endings: -ς/— -ος -ι -α, plural -ες -ων -σι(ν) -ας. The article is unchanged, so lean on it: τῆς σαρκός, τῷ πατρί, τοὺς πατέρας. Learn each noun with its genitive: πατήρ, πατρός.",
                          ("ὁ πατήρ, τοῦ πατρός", "the father, of the father"), ("ἐν χειρὶ αὐτοῦ", "in his hand"), ("εἰς τὸν αἰῶνα", "forever (into the age)"))},
            {"key": "decl3-2", "type": "grammar", "label": "πνεῦμα", "sub": "Neuters in -μα and -ος",
             "vocab": ["πνεῦμα", "ὄνομα", "σῶμα", "αἷμα", "στόμα", "ῥῆμα", "θέλημα", "ἔθνος", "ὄρος", "πῦρ", "ὕδωρ"],
             "paradigms": ["decl3-onoma", "decl3-ethnos"],
             "rule": rule("Two neuter families", "-μα nouns have a -ματ- stem (πνεῦμα, πνεύματος, plural πνεύματα). -ος neuters (ἔθνος, ὄρος) look masculine but take τό and have a -ους genitive and an -η plural: τὰ ἔθνη, the nations. Neuter rule still holds: nominative = accusative.",
                          ("τὸ πνεῦμα τὸ ἅγιον", "the Holy Spirit"), ("ἐν τῷ ὀνόματι αὐτοῦ", "in his name"), ("πάντα τὰ ἔθνη", "all the nations"))},
            {"key": "decl3-3", "type": "grammar", "label": "πίστις", "sub": "-ις and -ευς nouns, and more second declension",
             "vocab": ["πίστις", "πόλις", "δύναμις", "ἀρχιερεύς", "βασιλεύς", "γραμματεύς", "λαός", "τόπος", "καιρός", "ἀπόστολος", "θρόνος", "λίθος"],
             "paradigms": ["decl3-pistis", "decl3-basileus"],
             "rule": rule("The -εως family", "Abstract nouns in -ις (πίστις faith, πόλις city, δύναμις power) and titles in -ευς (βασιλεύς king, ἀρχιερεύς high priest) share the -εως genitive and -εις plural. ἐκ πίστεως 'by faith' and οἱ ἀρχιερεῖς 'the chief priests' are worth memorizing as phrases.",
                          ("διὰ πίστεως", "through faith"), ("ὁ βασιλεὺς τῶν Ἰουδαίων", "the king of the Jews"), ("ἐν τῇ πόλει", "in the city"))},
            {"key": "adjectives-2", "type": "grammar", "label": "πονηρός", "sub": "More nouns and adjectives",
             "vocab": ["χρόνος", "διδάσκαλος", "καρπός", "κεφαλή", "πονηρός", "αἰώνιος", "ἀγαπητός", "ἔσχατος", "κακός", "μακάριος", "τυφλός", "λοιπός"],
             "paradigms": ["adj-agathos"],
             "rule": rule("Two-ending adjectives", "Some adjectives (mostly compounds like αἰώνιος) have no separate feminine: ζωὴ αἰώνιος, eternal life, uses the masculine form with a feminine noun. Comparatives and superlatives use -τερος / -τατος or irregular forms (μείζων greater, πλείων more).",
                          ("ζωὴν αἰώνιον", "eternal life"), ("μακάριοι οἱ πτωχοί", "blessed are the poor"), ("ἐν ταῖς ἐσχάταις ἡμέραις", "in the last days"))},
            {"key": "pas-polus", "type": "grammar", "label": "πᾶς πολύς", "sub": "πᾶς, πολύς, μέγας, εἷς and numbers",
             "vocab": ["πᾶς", "πολύς", "μέγας", "εἷς", "δύο", "τρεῖς", "ἑπτά", "δώδεκα", "τρίτος"],
             "paradigms": ["adj-pas", "adj-polus", "adj-megas", "adj-heis"],
             "rule": rule("The big four", "πᾶς (all/every) mixes third-declension masculine/neuter with first-declension feminine. πολύς and μέγας are regular except for four short forms each. εἷς μία ἕν (one) is singular only and gives us οὐδείς. Numbers above four (πέντε, ἑπτά, δώδεκα) do not decline.",
                          ("πάντες οἱ ἄνθρωποι", "all the people"), ("πολλοὶ δὲ πρῶτοι ἔσχατοι", "but many first will be last"), ("οἱ δώδεκα", "the Twelve"))},
            {"key": "adjectives-3", "type": "grammar", "label": "πρεσβύτερος", "sub": "Possessive and position words",
             "vocab": ["μέσος", "δεξιός", "ἐμός", "ἕκαστος", "ἱερός", "πρεσβύτερος", "εὐθύς"],
             "rule": rule("Substantive adjectives", "With the article an adjective is a noun: οἱ πρεσβύτεροι the elders, τὸ ἱερόν the temple, ἐκ δεξιῶν on the right. ἐμός is the emphatic 'my' (ὁ ἐμὸς λόγος); the unemphatic 'my' is just μου after the noun (ὁ λόγος μου). εὐθύς as an adverb means 'immediately' and drives Mark's Gospel.",
                          ("ἐν μέσῳ αὐτῶν", "in the middle of them"), ("ἐκ δεξιῶν τοῦ πατρός", "at the right hand of the Father"), ("καὶ εὐθὺς …", "and immediately …"))},
            {"key": "read-john-1-14", "type": "reading", "label": "Κατὰ Ἰωάννην", "sub": "Read: John 1:14–18",
             "reading": read("john", 1, 14, 18),
             "vocab": {"fill": {"fromReading": True}},
             "rule": rule("Third declension in action", "σὰρξ ἐγένετο (became flesh), πλήρης χάριτος καὶ ἀληθείας (full of grace and truth), τοῦ πατρός (of the Father). Almost every word is now yours.")},
        ],
    },
    # ------------------------------------------------------------------ BOOK V
    {
        "id": "unit-05-future-aorist", "kicker": "Book V", "title": "Ἔλυσα", "sub": "Future and aorist",
        "summary": "The future, the first and second aorist, the aorist passive, liquid verbs, and John 1:19–28. Aspect, not just time.",
        "lessons": [
            {"key": "future", "type": "verb", "label": "λύσω", "sub": "The future tense",
             "vocab": ["ἀποστέλλω", "ἐγείρω", "ἀποκτείνω", "φέρω", "αἴρω", "ἀνοίγω", "βαπτίζω", "κηρύσσω", "δοξάζω", "εὐαγγελίζω"],
             "paradigms": ["fut-act", "fut-mid", "eimi-fut"],
             "rule": rule("Add a σ", "Future = present endings with σ before them: λύ-σ-ω, λύ-σ-εις. Consonant stems combine: βλέπω → βλέψω, ἄγω → ἄξω, βαπτίζω → βαπτίσω. Liquid stems (λ μ ν ρ) drop the σ and take a circumflex: ἀποστέλλω → ἀποστελῶ, ἐγείρω → ἐγερῶ, κρίνω → κρινῶ. Some verbs are middle in the future only: ἔσομαι, γνώσομαι, ὄψομαι.",
                          ("σώσει τὸν λαὸν αὐτοῦ", "he will save his people"), ("ἐγερῶ αὐτόν", "I will raise him"), ("ὄψεσθε", "you will see"))},
            {"key": "aorist-1", "type": "verb", "label": "ἔλυσα", "sub": "The first aorist",
             "vocab": ["ἀποθνῄσκω", "πίπτω", "χαίρω", "κράζω", "πείθω", "σπείρω"],
             "paradigms": ["aor1-act", "aor1-mid"],
             "rule": rule("A snapshot, not a movie", "Aorist = augment + σα + endings: ἔ-λυ-σα, ἔλυσας, ἔλυσε(ν), ἐλύσαμεν, ἐλύσατε, ἔλυσαν. Where the imperfect films the action in progress, the aorist photographs it whole. It is the ordinary narrative past ('he said, he went, he healed'), but it says nothing about duration. Liquids: ἀπέστειλα, ἔκρινα, ἔμεινα.",
                          ("ἐπίστευσαν εἰς αὐτόν", "they believed in him"), ("ἔσωσεν ἡμᾶς", "he saved us"), ("ἀπέστειλεν ὁ θεὸς τὸν υἱόν", "God sent the Son"))},
            {"key": "aorist-2", "type": "verb", "label": "εἶπον", "sub": "The second aorist",
             "vocab": {"fill": {"minCount": 50, "n": 8}},
             "paradigms": ["aor2-act", "aor2-mid", "infinitives-aor2"],
             "rule": rule("A new stem, old endings", "Many common verbs form the aorist on a shorter root and use imperfect-style endings: λέγω → εἶπον, ἔρχομαι → ἦλθον, ὁράω → εἶδον, λαμβάνω → ἔλαβον, γίνομαι → ἐγενόμην, βάλλω → ἔβαλον. Meaning is identical to the first aorist. The stem must be memorized as vocabulary: that is why the strange-verb drills exist.",
                          ("εἶπεν αὐτοῖς ὁ Ἰησοῦς", "Jesus said to them"), ("ἦλθεν εἰς τὴν Γαλιλαίαν", "he came into Galilee"), ("καὶ ἐγένετο", "and it came to pass"))},
            {"key": "aorist-passive", "type": "verb", "label": "ἐλύθην", "sub": "Aorist and future passive",
             "vocab": {"fill": {"minCount": 50, "n": 8}},
             "paradigms": ["aor-pass", "fut-pass"],
             "rule": rule("θη means passive", "Augment + θη + active-looking endings: ἐλύθην, ἐλύθης, ἐλύθη, ἐλύθημεν, ἐλύθητε, ἐλύθησαν; future λυθήσομαι. A handful of deponents use the aorist passive with active meaning: ἀπεκρίθη he answered, ἐπορεύθη he went, ἐφοβήθησαν they were afraid. The agent of a passive is ὑπό + genitive.",
                          ("ἐβαπτίσθη ὑπὸ Ἰωάννου", "he was baptized by John"), ("ἠγέρθη", "he was raised"), ("ἀπεκρίθη αὐτῷ", "he answered him"))},
            {"key": "read-john-1-19", "type": "reading", "label": "Κατὰ Ἰωάννην", "sub": "Read: John 1:19–28",
             "reading": read("john", 1, 19, 28),
             "vocab": {"fill": {"fromReading": True}},
             "rule": rule("Dialogue in the aorist", "ἀπέστειλαν, ἠρώτησαν, ὡμολόγησεν, ἀπεκρίθη: John's testimony is told in crisp aorists. Notice how the question-mark semicolon (;) marks each question.")},
        ],
    },
    # ----------------------------------------------------------------- BOOK VI
    {
        "id": "unit-06-perfect-moods", "kicker": "Book VI", "title": "Λέλυκα", "sub": "Perfect tense and the moods",
        "summary": "The perfect and pluperfect, the subjunctive with ἵνα and ἐάν, the imperative, and John 1:29–42.",
        "lessons": [
            {"key": "perfect", "type": "verb", "label": "λέλυκα", "sub": "The perfect active",
             "vocab": {"fill": {"minCount": 45, "n": 10}},
             "paradigms": ["perf-act", "plup-act"],
             "rule": rule("Done, and still true", "Reduplicate (λε-λυ-) and add κα: λέλυκα, λέλυκας, λέλυκε(ν), λελύκαμεν, λελύκατε, λελύκασι(ν). The perfect describes a completed act whose result is present: γέγραπται, it stands written; ἐλήλυθεν, he has come (and is here). Verbs beginning with a vowel lengthen instead of reduplicating (ἀκούω → ἀκήκοα).",
                          ("γέγραπται", "it is written"), ("πεπιστεύκαμεν", "we have believed / we are convinced"), ("ἑώρακα τὸν κύριον", "I have seen the Lord"))},
            {"key": "perfect-mp", "type": "verb", "label": "λέλυμαι", "sub": "The perfect middle/passive",
             "vocab": {"fill": {"minCount": 42, "n": 10}},
             "paradigms": ["perf-mp"],
             "rule": rule("Endings straight onto the stem", "Perfect middle/passive: reduplication + -μαι -σαι -ται -μεθα -σθε -νται with no connecting vowel: λέλυμαι, λέλυσαι, λέλυται. Consonant stems adjust the ending (γέγραπται). οἶδα (I know) is a perfect in form with present meaning.",
                          ("γέγραπται ἐν τῷ νόμῳ", "it is written in the law"), ("σέσωσθε", "you have been saved"), ("οἶδα", "I know"))},
            {"key": "subjunctive", "type": "verb", "label": "λύω λύσω", "sub": "The subjunctive mood",
             "vocab": {"fill": {"minCount": 40, "n": 10}},
             "paradigms": ["pres-act-subj", "aor-act-subj", "pres-mp-subj", "aor-pass-subj", "eimi-subj"],
             "rule": rule("Long vowels, open possibilities", "The subjunctive lengthens the connecting vowel (ω, ῃ, ῃ, ωμεν, ητε, ωσι). It appears after ἵνα (in order that), ἐάν (if), ὅταν (whenever), in exhortations (ἀγαπῶμεν, let us love), in deliberative questions (τί ποιήσωμεν; what should we do?), and in emphatic denials (οὐ μή + aorist subjunctive). Aorist vs present subjunctive is a difference of aspect, not time.",
                          ("ἵνα πιστεύητε", "so that you may believe"), ("ἐὰν εἴπωμεν", "if we say"), ("οὐ μὴ ἀπόλωνται", "they will certainly not perish"))},
            {"key": "imperative", "type": "verb", "label": "λῦε λῦσον", "sub": "The imperative mood",
             "vocab": {"fill": {"minCount": 40, "n": 10}},
             "paradigms": ["pres-act-impv", "aor-act-impv", "pres-mp-impv", "aor-pass-impv"],
             "rule": rule("Commands and prohibitions", "Present imperative (λῦε, λύετε) = keep doing / make a habit; aorist imperative (λῦσον, λύσατε) = do it. Third-person imperatives (-τω, -τωσαν) mean 'let him / let them'. To forbid: μή + present imperative (stop doing) or μή + aorist subjunctive (don't do).",
                          ("ἀκολούθει μοι", "follow me (and keep following)"), ("ἄρον τὸν κράβαττόν σου", "pick up your mat"), ("μὴ φοβοῦ", "do not be afraid"))},
            {"key": "infinitive-uses", "type": "verb", "label": "τοῦ λῦσαι", "sub": "Using the infinitive",
             "vocab": {"fill": {"minCount": 38, "n": 10}},
             "paradigms": ["infinitives"],
             "rule": rule("The articular infinitive", "With a preposition and the neuter article, the infinitive becomes a clause: ἐν τῷ + infinitive 'while …', διὰ τό 'because …', εἰς τό / πρὸς τό 'in order to', μετὰ τό 'after …', τοῦ + infinitive 'in order to'. Indirect speech can use the infinitive with its subject in the accusative.",
                          ("ἐν τῷ σπείρειν αὐτόν", "while he was sowing"), ("εἰς τὸ σωθῆναι", "in order to be saved"), ("μετὰ τὸ ἐγερθῆναί με", "after I am raised"))},
            {"key": "read-john-1-29", "type": "reading", "label": "Κατὰ Ἰωάννην", "sub": "Read: John 1:29–42",
             "reading": read("john", 1, 29, 42),
             "vocab": {"fill": {"fromReading": True}},
             "rule": rule("Perfects and commands", "ἴδε (look!), ἑώρακα (I have seen), μεμαρτύρηκα (I have testified), ἔρχεσθε καὶ ὄψεσθε (come and you will see). Read the whole scene before revealing anything.")},
        ],
    },
    # ---------------------------------------------------------------- BOOK VII
    {
        "id": "unit-07-participles", "kicker": "Book VII", "title": "Λύων", "sub": "Participles",
        "summary": "The verbal adjective that Greek prose runs on: present, aorist and perfect participles in every voice, their uses, the genitive absolute, and John 1:43–51.",
        "lessons": [
            {"key": "ptc-present", "type": "verb", "label": "λύων", "sub": "Present participles",
             "vocab": {"fill": {"minCount": 36, "n": 10}},
             "paradigms": ["ptc-pres-act", "ptc-pres-mp", "ptc-eimi"],
             "rule": rule("A verb wearing adjective endings", "A participle is 'loosing / being loosed' used as an adjective: it has tense and voice like a verb, and case, number and gender like an adjective. Present active: λύων, λύουσα, λῦον (stem λυοντ-). Present middle/passive: λυόμενος -η -ον. Because it agrees with a noun, find the noun it goes with first.",
                          ("ὁ πιστεύων εἰς αὐτόν", "the one who believes in him"), ("ὁ ἐρχόμενος", "the one who is coming"), ("ὁ ὢν ἐν τῷ οὐρανῷ", "the one who is in heaven"))},
            {"key": "ptc-uses", "type": "grammar", "label": "ὁ λύων", "sub": "Attributive, substantival and adverbial participles",
             "vocab": {"fill": {"minCount": 34, "n": 10}},
             "paradigms": ["ptc-pres-act", "ptc-pres-mp"],
             "rule": rule("Three jobs", "With the article, a participle describes a noun (ὁ ἄνθρωπος ὁ πιστεύων, the man who believes) or is itself a noun (ὁ πιστεύων, the believer). Without the article it modifies the action of the main verb: 'while / because / after doing X'. English needs a whole clause for what Greek does in one word.",
                          ("λέγοντες", "saying (introducing a quotation)"), ("ἀκούσαντες δὲ", "and when they heard"), ("τοῖς πιστεύουσιν", "to those who believe"))},
            {"key": "ptc-aorist", "type": "verb", "label": "λύσας", "sub": "Aorist participles",
             "vocab": {"fill": {"minCount": 32, "n": 10}},
             "paradigms": ["ptc-aor-act", "ptc-aor2-act", "ptc-aor-mid", "ptc-aor-pass"],
             "rule": rule("No augment, aorist stem", "First aorist active: λύσας, λύσασα, λῦσαν; second aorist: ἐλθών, ἰδών, εἰπών, λαβών (accent on the ending); middle: λυσάμενος; passive: λυθείς, λυθεῖσα, λυθέν. The aorist participle usually describes an action before the main verb: ἀποκριθεὶς εἶπεν, 'answering, he said'.",
                          ("ἐλθὼν ὁ Ἰησοῦς", "when Jesus came"), ("ἀποκριθεὶς εἶπεν", "he answered and said"), ("ἰδόντες τὸν ἀστέρα", "when they saw the star"))},
            {"key": "ptc-perfect", "type": "verb", "label": "λελυκώς", "sub": "Perfect participles and periphrasis",
             "vocab": {"fill": {"minCount": 30, "n": 10}},
             "paradigms": ["ptc-perf-act", "ptc-perf-mp"],
             "rule": rule("A state, described", "Perfect participles (λελυκώς, λελυμένος) describe a resulting state: γεγραμμένος, written; ἠγαπημένος, beloved. εἰμί + participle ('periphrastic') builds compound tenses: ἦν διδάσκων, he was teaching; ἐστὲ σεσῳσμένοι, you are saved.",
                          ("τὸ γεγραμμένον", "what is written"), ("ἦν διδάσκων αὐτούς", "he was teaching them"), ("χάριτί ἐστε σεσῳσμένοι", "by grace you are saved"))},
            {"key": "genitive-absolute", "type": "grammar", "label": "γενομένης", "sub": "Genitive absolute and special uses",
             "vocab": {"fill": {"minCount": 28, "n": 10}},
             "paradigms": ["ptc-aor2-act", "ptc-aor-mid"],
             "rule": rule("A clause floating in the genitive", "When a participle and its subject have no grammatical link to the main sentence, both go in the genitive: ὀψίας γενομένης, 'when evening had come'. Translate as a 'when / while / after' clause. Watch also for participles with imperatival force in the letters, and for the future participle of purpose (rare).",
                          ("ὀψίας δὲ γενομένης", "and when evening came"), ("ταῦτα αὐτοῦ λαλοῦντος", "while he was saying these things"), ("ἐξελθόντος αὐτοῦ", "after he went out"))},
            {"key": "read-john-1-43", "type": "reading", "label": "Κατὰ Ἰωάννην", "sub": "Read: John 1:43–51",
             "reading": read("john", 1, 43, 51),
             "vocab": {"fill": {"fromReading": True}},
             "rule": rule("Participles everywhere", "ἀποκριθείς, ὄντα, ἐρχόμενον, ἀνεῳγότα: count the participles in this passage and notice how each one hangs on a noun.")},
        ],
    },
    # --------------------------------------------------------------- BOOK VIII
    {
        "id": "unit-08-strange-verbs", "kicker": "Book VIII", "title": "Οἶδα", "sub": "Strange verbs and advanced syntax",
        "summary": "Principal parts, the -μι verbs, the irregular-verb drill pool, conditional sentences, the optative, and 1 John 1. After this Book you know every word that occurs 50+ times in the New Testament.",
        "lessons": [
            {"key": "principal-parts", "type": "verb", "label": "λύω λύσω ἔλυσα", "sub": "The six principal parts",
             "vocab": ["οἶδα", "φημί"],
             "paradigms": ["oida-perf"],
             "rule": rule("Six forms unlock every tense", "Every verb has up to six stems: present (λύω), future (λύσω), aorist active (ἔλυσα), perfect active (λέλυκα), perfect middle/passive (λέλυμαι), aorist passive (ἐλύθην). Regular verbs derive all six by rule; the strange verbs do not, so their parts are learned as vocabulary. οἶδα is a perfect with present meaning; φημί survives mostly as ἔφη, 'he said'.",
                          ("οἴδαμεν ὅτι", "we know that"), ("ᾔδει", "he knew"), ("ἔφη αὐτῷ", "he said to him"))},
            {"key": "mi-verbs", "type": "verb", "label": "δίδωμι", "sub": "The -μι verbs",
             "vocab": ["δίδωμι", "τίθημι", "ἵστημι", "ἀφίημι", "παραδίδωμι", "ἀνίστημι", "ἀπόλλυμι"],
             "paradigms": ["mi-didomi-pres", "mi-didomi-aor", "mi-tithemi-pres", "mi-histemi-pres"],
             "rule": rule("Endings without a connecting vowel", "A small, ancient group (δίδωμι give, τίθημι put, ἵστημι stand, ἀφίημι forgive/leave) adds endings straight to the stem: -μι -ς -σι -μεν -τε -ασι, with reduplication in ι in the present (δί-δωμι). Their aorists use κα (ἔδωκα, ἔθηκα, ἀφῆκα). Their compounds are extremely common: παραδίδωμι hand over, ἀνίστημι rise.",
                          ("δίδωσιν αὐτοῖς", "he gives to them"), ("ἔδωκεν τὸν υἱόν", "he gave the Son"), ("ἀφέωνταί σου αἱ ἁμαρτίαι", "your sins are forgiven"))},
            {"key": "irregular-1", "type": "verb", "label": "εἶπον ἦλθον", "sub": "Strange verbs I: the big ten",
             "vocab": {"fill": {"minCount": 26, "n": 10}},
             "irregular": ["εἰμί", "λέγω", "ἔρχομαι", "ὁράω", "γίνομαι", "ἔχω", "λαμβάνω", "οἶδα", "φέρω", "ἐσθίω"],
             "rule": rule("Learn the parts, not the rule", "For these verbs there is no rule: the aorist of λέγω is εἶπον, of ἔρχομαι ἦλθον, of ὁράω εἶδον, of φέρω ἤνεγκα. Drill them by principal part until εἶδεν simply reads as 'he saw'. They are the verbs that carry every Gospel story.",
                          ("εἶδον καὶ ἐπίστευσα", "I saw and I believed"), ("ἦλθεν … καὶ εἶπεν", "he came … and said"), ("ἐλήλυθα", "I have come"))},
            {"key": "irregular-2", "type": "verb", "label": "ἔγνων ἔπεσον", "sub": "Strange verbs II: the rest of the pool",
             "vocab": {"fill": {"minCount": 24, "n": 10}},
             "irregular": ["πίνω", "γινώσκω", "δίδωμι", "τίθημι", "ἵστημι", "ἀφίημι", "ἀποθνῄσκω", "ἐγείρω", "ἀποστέλλω", "κρίνω", "μένω", "ἀναβαίνω", "πίπτω", "βάλλω", "εὑρίσκω", "ἄγω", "πάσχω", "θέλω", "δύναμαι", "καλέω", "ἀκούω", "πείθω", "ἀποκρίνομαι", "πορεύομαι", "φοβέομαι", "χαίρω", "ἀπόλλυμι", "φημί", "ἀνοίγω", "μανθάνω", "φεύγω", "ἁμαρτάνω"],
             "rule": rule("Root aorists and passive deponents", "A few verbs have 'root aorists' with no connecting vowel: ἔγνων (I knew), ἔβην (I went), ἔστην (I stood). Another group takes an aorist passive form with active meaning: ἀπεκρίθη, ἐπορεύθη, ἐφοβήθη, ἐχάρη. Keep drilling until each form triggers its meaning without analysis.",
                          ("ἔγνω ὁ Ἰησοῦς", "Jesus knew"), ("ἀνέβη εἰς Ἱεροσόλυμα", "he went up to Jerusalem"), ("ἐχάρησαν χαρὰν μεγάλην", "they rejoiced with great joy"))},
            {"key": "conditionals", "type": "grammar", "label": "εἰ ἐάν", "sub": "Conditional sentences and the optative",
             "vocab": {"fill": {"minCount": 22, "n": 10}},
             "rule": rule("Four kinds of 'if'", "First class: εἰ + indicative, assumed true for argument's sake ('if, as is the case'). Second class: εἰ + past indicative with ἄν in the conclusion, contrary to fact ('if it were'). Third class: ἐάν + subjunctive, open possibility. Fourth class: εἰ + optative, remote wish (rare; the optative survives mostly in μὴ γένοιτο, 'may it never be!').",
                          ("εἰ υἱὸς εἶ τοῦ θεοῦ", "if you are the Son of God"), ("εἰ ἦς ὧδε, οὐκ ἂν ἀπέθανεν", "if you had been here, he would not have died"), ("ἐὰν ὁμολογῶμεν", "if we confess"))},
            {"key": "read-1-john-1", "type": "reading", "label": "Ἰωάννου Αʹ", "sub": "Read: 1 John 1",
             "reading": read("1-john", 1, 1, 10),
             "vocab": {"fill": {"fromReading": True}},
             "rule": rule("Your first whole chapter", "1 John uses the simplest Greek in the New Testament and the vocabulary you now own. Read it straight through before revealing any verse.")},
        ],
    },
]

# After Book VIII every lemma with this many occurrences must have been introduced.
CORE_MIN_COUNT = 50
# Words below this count are never scheduled as SRS vocab; they are tap-to-gloss only (M23).
SCHEDULE_MIN_COUNT = 10
# Reading-track vocab lesson size.
READING_VOCAB_LESSON = 12

# Reading track order: John first (the story you started), then the Johannine
# letters, then the rest strictly by measured lexical coverage (data/stats.json).
READING_TRACK_HEAD = ["john", "1-john", "2-john", "3-john"]


# =============================================================================
# BUILD — resolve the spine against real data and write the JSON outputs.
# =============================================================================

ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII",
         "XVIII", "XIX", "XX", "XXI", "XXII", "XXIII", "XXIV", "XXV", "XXVI", "XXVII", "XXVIII", "XXIX", "XXX",
         "XXXI", "XXXII", "XXXIII", "XXXIV", "XXXV", "XXXVI"]


def _chunks(seq, n):
    return [seq[i:i + n] for i in range(0, len(seq), n)]


def _vocab_entry(item):
    e = {k: item[k] for k in ("id", "lemma", "citation", "gloss", "pos", "count", "rank")}
    return e


def build(lex_by_id, ranked, attested_forms, verses, chapter_stats, book_by_num, write_json):
    # ---- 0. static reference data --------------------------------------------
    write_json("alphabet.json", ALPHABET)
    for v in IRREGULAR_VERBS:
        assert v["lemma"] in lex_by_id, f"irregular verb not in lexicon: {v['lemma']}"
        v["gloss"] = lex_by_id[v["lemma"]]["gloss"]
        v["count"] = lex_by_id[v["lemma"]]["count"]
    write_json("irregular-verbs.json", {
        "_meta": {"parts": ["present", "future", "aorist active", "perfect active", "perfect middle/passive", "aorist passive"],
                  "note": "Hand-curated reference grammar; glosses/counts from the lexicon. null = not used in the NT."},
        "verbs": IRREGULAR_VERBS,
    })

    # ---- 1. validate paradigms against attested GNT forms --------------------
    by_lemma_form = {}
    for lemma, norm, parse in attested_forms:
        by_lemma_form.setdefault((lemma, norm), set()).add(parse)
    def same_voice_forms(parse):
        """In the present, imperfect, perfect and pluperfect systems middle and passive forms are identical,
        so a cell tagged M is satisfied by an attestation tagged P (and vice versa)."""
        if parse[1] in "PIXY" and parse[2] in "MP":
            return {parse[:2] + "M" + parse[3:], parse[:2] + "P" + parse[3:]}
        return {parse}

    exact = unattested = 0
    mismatches = []
    for p in PARADIGMS:
        assert p["lemma"] in lex_by_id, f"paradigm lemma not in lexicon: {p['lemma']} ({p['id']})"
        for cell in p["cells"]:
            cell["form"] = nfc(cell["form"])
            key = (p["lemma"], cell["form"])
            if key in by_lemma_form:
                if same_voice_forms(cell["parse"]) & by_lemma_form[key]:
                    exact += 1
                    cell["attested"] = True
                else:
                    mismatches.append((p["id"], cell["form"], cell["parse"], sorted(by_lemma_form[key])))
                    cell["attested"] = False
            else:
                unattested += 1
                cell["attested"] = False
    print(f"  paradigms: {len(PARADIGMS)} paradigms, {exact} cells attested in the GNT with the same parse, "
          f"{unattested} not attested (normal for a full paradigm), {len(mismatches)} parse mismatches")
    for m in mismatches:
        # A mismatch means the form exists in the GNT only as a homograph with another parse
        # (e.g. λύσω is attested only as aorist subjunctive). Informational, not an error.
        print(f"    homograph only: {m[0]}: {m[1]} {m[2]} — GNT attests {m[3]}")
    write_json("paradigms.json", {
        "_meta": {"parseCode": "MorphGNT 8-slot code: person, tense, voice, mood, case, number, gender, degree.",
                  "attested": "true when this exact form+parse occurs in the GNT (validated by build_data.py)."},
        "paradigms": PARADIGMS,
    })

    # ---- 2. resolve the hand-authored Books ----------------------------------
    slug_to_num = {b[2]: b[0] for b in book_by_num.values()}
    name_of = {b[2]: b[3] for b in book_by_num.values()}
    greek_of = {b[2]: b[5] for b in book_by_num.values()}
    tokens_by_verse = {}   # (slug, ch, v) -> [lemma]
    verses_by_chapter = {}  # (slug, ch) -> [v...]
    for (num, ch, v), words in verses.items():
        slug = book_by_num[num][2]
        tokens_by_verse[(slug, ch, v)] = [w["l"] for w in words]
        verses_by_chapter.setdefault((slug, ch), []).append(v)

    assigned = {}  # lemma -> lesson id
    units_out = []
    reading_rows = []
    reserved = {nfc(l) for u in UNITS for les in u["lessons"] if isinstance(les.get("vocab"), list) for l in les["vocab"]}

    def fill(spec, n_default=None, passage_lemmas=None):
        min_count = spec.get("minCount", SCHEDULE_MIN_COUNT)
        n = spec.get("n", n_default) or 10 ** 6
        out = []
        for lemma in ranked:
            if spec.get("fromReading") and lemma not in passage_lemmas:
                continue
            if len(out) >= n:
                break
            if lemma in assigned or lemma in reserved or lex_by_id[lemma]["count"] < min_count:
                continue
            out.append(lemma)
        return out

    def resolve_reading(spec):
        slug, ch = spec["book"], spec["chapter"]
        ids, toks = [], []
        for v in range(spec["from"], spec["to"] + 1):
            if (slug, ch, v) not in tokens_by_verse:
                continue  # SBLGNT omits some traditional verse numbers (e.g. John 5:4, Acts 8:37)
            ids.append(f"{slug}-{ch}-{v}")
            toks.extend(tokens_by_verse[(slug, ch, v)])
        assert ids, f"no verses in {slug} {ch}:{spec['from']}-{spec['to']}"
        known = sum(1 for l in toks if l in assigned)
        schedulable = sum(1 for l in toks if lex_by_id[l]["count"] >= SCHEDULE_MIN_COUNT)
        cov = {"tokens": len(toks), "known": round(known / len(toks), 3), "schedulable": round(schedulable / len(toks), 3)}
        return {**spec, "verseIds": ids, "reference": f"{name_of[slug]} {ch}:{spec['from']}" + (f"–{spec['to']}" if spec["to"] != spec["from"] else ""),
                "greekTitle": greek_of[slug], "coverage": cov}

    def finish_lesson(unit_index, unit_id, lesson):
        lid = f"u{unit_index:02d}-{lesson['key']}"
        out = {"id": lid, "type": lesson["type"], "label": lesson["label"], "sub": lesson["sub"],
               "drills": DRILLS_BY_TYPE[lesson["type"]]}
        if "rule" in lesson:
            out["rule"] = lesson["rule"]
        if "alphabet" in lesson:
            out["alphabet"] = lesson["alphabet"]
        vocab = lesson.get("vocab", [])
        if isinstance(vocab, dict):
            passage = None
            if vocab["fill"].get("fromReading"):
                r = lesson["reading"]
                passage = {l for v in range(r["from"], r["to"] + 1) for l in tokens_by_verse.get((r["book"], r["chapter"], v), [])}
            vocab = fill(vocab["fill"], passage_lemmas=passage)
        resolved = []
        for lemma in vocab:
            lemma = nfc(lemma)
            assert lemma in lex_by_id, f"{lid}: lemma not in lexicon: {lemma!r}"
            if lemma in assigned:
                print(f"    warning: {lid}: {lemma} already introduced in {assigned[lemma]}; skipping")
                continue
            assigned[lemma] = lid
            resolved.append(_vocab_entry(lex_by_id[lemma]))
        out["vocab"] = resolved
        for pid in lesson.get("paradigms", []):
            assert pid in PARADIGM_IDS, f"{lid}: unknown paradigm {pid}"
        out["paradigms"] = lesson.get("paradigms", [])
        if "irregular" in lesson:
            known_irr = {v["lemma"] for v in IRREGULAR_VERBS}
            for l in lesson["irregular"]:
                assert l in known_irr, f"{lid}: {l} not in IRREGULAR_VERBS"
            out["irregular"] = lesson["irregular"]
        if "reading" in lesson:
            out["reading"] = resolve_reading(lesson["reading"])
            reading_rows.append((lid, out["reading"]["reference"], out["reading"]["coverage"]))
        return out

    for ui, unit in enumerate(UNITS, start=1):
        lessons = [finish_lesson(ui, unit["id"], l) for l in unit["lessons"]]
        units_out.append({"id": unit["id"], "index": ui, "kicker": unit["kicker"], "title": unit["title"], "sub": unit["sub"],
                          "summary": unit["summary"], "track": "grammar", "lessons": lessons})

    # Core-coverage guarantee (M22): everything with >= CORE_MIN_COUNT occurrences is introduced by the end of Book VIII.
    leftover_core = [l for l in ranked if lex_by_id[l]["count"] >= CORE_MIN_COUNT and l not in assigned]
    if leftover_core:
        print(f"    note: {len(leftover_core)} core words not placed by hand; adding a catch-up lesson to Book VIII: {leftover_core}")
        last = units_out[-1]
        catch = finish_lesson(len(UNITS), last["id"], {
            "key": "core-catch-up", "type": "vocab", "label": leftover_core[0], "sub": "Core vocabulary: the last few",
            "vocab": leftover_core,
            "rule": rule("Closing the core", "These are the last words that occur 50 or more times in the New Testament. With them, you know the ~310 words that make up four fifths of the text.")})
        last["lessons"].insert(len(last["lessons"]) - 1, catch)
    core_total = sum(1 for l in ranked if lex_by_id[l]["count"] >= CORE_MIN_COUNT)
    print(f"  Books I–VIII: {len(assigned)} words introduced; core (>= {CORE_MIN_COUNT}x) covered {core_total}/{core_total}")

    # ---- 3. the reading track (Books IX+), one unit per NT book -------------
    book_cov = {}
    for row in chapter_stats:
        b = book_cov.setdefault(row["book"], [0, 0])
        b[0] += row["coverage"]["882"] * row["tokens"]
        b[1] += row["tokens"]
    order = READING_TRACK_HEAD + sorted([s for s in slug_to_num if s not in READING_TRACK_HEAD],
                                        key=lambda s: -(book_cov[s][0] / book_cov[s][1]))
    already_read = {("john", 1), ("1-john", 1)}
    lemmas_in_chapter = {}
    for (slug, ch, v), toks in tokens_by_verse.items():
        lemmas_in_chapter.setdefault((slug, ch), set()).update(toks)

    ui = len(units_out)
    for slug in order:
        ui += 1
        chapters = sorted({ch for (s, ch) in verses_by_chapter if s == slug})
        lessons = []
        for ch in chapters:
            if (slug, ch) in already_read:
                continue
            new_words = [l for l in ranked if l in lemmas_in_chapter[(slug, ch)] and l not in assigned
                         and lex_by_id[l]["count"] >= SCHEDULE_MIN_COUNT]
            for i, chunk in enumerate(_chunks(new_words, READING_VOCAB_LESSON), start=1):
                lessons.append(finish_lesson(ui, None, {
                    "key": f"vocab-{ch}-{i}", "type": "vocab", "label": chunk[0], "sub": f"New words for {name_of[slug]} {ch}",
                    "vocab": chunk}))
            vs = sorted(verses_by_chapter[(slug, ch)])
            lessons.append(finish_lesson(ui, None, {
                "key": f"read-{ch}", "type": "reading", "label": greek_of[slug], "sub": f"Read: {name_of[slug]} {ch}",
                "reading": read(slug, ch, vs[0], vs[-1])}))
        units_out.append({"id": f"unit-{ui:02d}-{slug}", "index": ui, "kicker": f"Book {ROMAN[ui - 1]}", "title": greek_of[slug],
                          "sub": f"Read {name_of[slug]}", "track": "reading",
                          "summary": f"Read {name_of[slug]} chapter by chapter. Before each chapter you learn the words it uses that you have not met yet (only words occurring 10+ times in the NT are scheduled; rarer words are tap-to-gloss).",
                          "lessons": lessons})

    scheduled = sum(1 for l in ranked if lex_by_id[l]["count"] >= SCHEDULE_MIN_COUNT)
    print(f"  Reading track: {len(units_out) - len(UNITS)} units; scheduled vocabulary {len(assigned)} / {scheduled} words with >= {SCHEDULE_MIN_COUNT}x")

    # ---- 4. write outputs ----------------------------------------------------
    index = {"_meta": {
        "note": "Curriculum index. Full lesson content lives in data/units/<unit id>.json. Lesson types: alphabet | vocab | grammar | verb | reading.",
        "coreMinCount": CORE_MIN_COUNT, "scheduleMinCount": SCHEDULE_MIN_COUNT,
        "unitCount": len(units_out), "lessonCount": sum(len(u["lessons"]) for u in units_out),
    }, "units": []}
    for u in units_out:
        write_json(f"units/{u['id']}.json", u)
        index["units"].append({
            **{k: u[k] for k in ("id", "index", "kicker", "title", "sub", "summary", "track")},
            "lessons": [{"id": l["id"], "type": l["type"], "label": l["label"], "sub": l["sub"],
                         "vocabCount": len(l["vocab"]), "paradigms": l["paradigms"], "irregularCount": len(l.get("irregular", [])),
                         **({"reading": {k: l["reading"][k] for k in ("book", "chapter", "from", "to", "reference", "coverage")}} if "reading" in l else {})}
                        for l in u["lessons"]],
        })
    write_json("curriculum.json", index)

    print("  reading coverage by lesson (known = share of words already introduced; schedulable = share that will ever be scheduled):")
    for lid, ref, cov in reading_rows[:10]:
        print(f"    {lid:28s} {ref:18s} known {cov['known']:.3f}  schedulable {cov['schedulable']:.3f}  ({cov['tokens']} words)")

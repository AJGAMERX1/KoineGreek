/*
  morph.js — decode MorphGNT part-of-speech and 8-slot parse codes into
  plain English. Shared by the reading screen (tap-to-gloss) and the coming
  parsing drills. Codes are documented in data/forms.json _meta and in
  github.com/morphgnt/sblgnt README.
*/

export const POS = {
  'A-': 'adjective', 'C-': 'conjunction', 'D-': 'adverb', 'I-': 'interjection', 'N-': 'noun',
  'P-': 'preposition', 'RA': 'article', 'RD': 'demonstrative pronoun', 'RI': 'interrogative/indefinite pronoun',
  'RP': 'personal pronoun', 'RR': 'relative pronoun', 'V-': 'verb', 'X-': 'particle',
};

const PERSON = { 1: '1st', 2: '2nd', 3: '3rd' };
const TENSE = { P: 'present', I: 'imperfect', F: 'future', A: 'aorist', X: 'perfect', Y: 'pluperfect' };
const VOICE = { A: 'active', M: 'middle', P: 'passive' };
const MOOD = { I: 'indicative', D: 'imperative', S: 'subjunctive', O: 'optative', N: 'infinitive', P: 'participle' };
const CASE = { N: 'nominative', G: 'genitive', D: 'dative', A: 'accusative', V: 'vocative' };
const NUMBER = { S: 'singular', P: 'plural' };
const GENDER = { M: 'masculine', F: 'feminine', N: 'neuter' };
const DEGREE = { C: 'comparative', S: 'superlative' };

/** Split an 8-character parse code into named slots (null where the slot is '-'). */
export function parseSlots(code) {
  const c = (code || '--------').padEnd(8, '-');
  const g = (table, ch) => (ch === '-' ? null : table[ch] || null);
  return {
    person: g(PERSON, c[0]), tense: g(TENSE, c[1]), voice: g(VOICE, c[2]), mood: g(MOOD, c[3]),
    case: g(CASE, c[4]), number: g(NUMBER, c[5]), gender: g(GENDER, c[6]), degree: g(DEGREE, c[7]),
  };
}

/**
 * Human-readable parse, e.g.
 *   V- 3IAI-S--  → "imperfect active indicative · 3rd person singular"
 *   V- -PAPNSM-  → "present active participle · nominative singular masculine"
 *   N- ----DSF-  → "dative singular feminine"
 *   RA ----NSM-  → "nominative singular masculine"
 */
export function describeParse(pos, code) {
  const s = parseSlots(code);
  const nominal = [s.case, s.number, s.gender].filter(Boolean).join(' ');
  if (pos === 'V-') {
    const verb = [s.tense, s.voice, s.mood].filter(Boolean).join(' ');
    if (s.mood === 'participle') return `${verb} · ${nominal}`;
    if (s.mood === 'infinitive') return verb;
    const who = [s.person && `${s.person} person`, s.number].filter(Boolean).join(' ');
    return who ? `${verb} · ${who}` : verb;
  }
  const bits = [nominal, s.degree].filter(Boolean).join(' · ');
  return bits || POS[pos] || '';
}

/** Short label for the part of speech (with parse-aware refinement for participles/infinitives). */
export function describePos(pos, code) {
  const s = parseSlots(code);
  if (pos === 'V-' && s.mood === 'participle') return 'participle';
  if (pos === 'V-' && s.mood === 'infinitive') return 'infinitive';
  return POS[pos] || pos;
}

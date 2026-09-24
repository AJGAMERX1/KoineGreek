/*
  chain.js — the daily review chain (PEDAGOGY M3: one session assembled from
  everything due). The path builds a sequence of due screens
  (drill → grammar → reading) and each screen hands off to the next via a
  `chain` query parameter, e.g.  drill.html?mode=due&chain=grammar,reading
*/

const SCREENS = { drill: 'drill.html', grammar: 'grammar.html', reading: 'reading.html' };

/** Build the first URL of a chain from the list of due screen keys (in order). */
export function chainHref(keys) {
  if (!keys.length) return null;
  const [first, ...rest] = keys;
  return `${SCREENS[first]}?mode=due${rest.length ? `&chain=${rest.join(',')}` : ''}`;
}

/** From the current page's params, the URL of the next due screen (or null when the chain is done). */
export function nextInChain(params) {
  const chain = (params.get('chain') || '').split(',').filter((k) => SCREENS[k]);
  return chainHref(chain);
}

/** Human label for the hand-off button. */
export function chainLabel(params) {
  const next = (params.get('chain') || '').split(',')[0];
  return { drill: 'Continue to due words', grammar: 'Continue to due forms', reading: 'Continue to due verses' }[next] || null;
}

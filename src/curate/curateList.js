// Orchestrator the UI calls. Tries the AI curator first; on any failure (no proxy,
// no key, network) it silently falls back to the offline mock curator. Then it
// enriches the chosen ISBNs with full catalog metadata for rendering.

import catalog from '../data/catalog.json';
import { aiCurate } from './aiCurator.js';
import { mockCurate } from './mockCurator.js';

const byIsbn = new Map(catalog.books.map((b) => [b.isbn, b]));

// Attach title/author/blurb/tags to each { isbn, why } item.
function enrich(list) {
  const items = list.items
    .map((it) => {
      const book = byIsbn.get(it.isbn);
      if (!book) return null;
      return { ...book, why: it.why };
    })
    .filter(Boolean);
  return { ...list, items };
}

// prompt: string. Returns enriched { listTitle, prompt, source, items:[book+why] }.
export async function curateList(prompt, { count = 10, preferAI = true, signal } = {}) {
  if (preferAI) {
    try {
      const ai = await aiCurate(prompt, catalog, { count, signal });
      return enrich(ai);
    } catch (err) {
      // Expected whenever the proxy/key isn't set up — quietly use the mock path.
      if (import.meta?.env?.DEV) console.info('[curate] AI path unavailable, using mock:', err.message);
    }
  }
  return enrich(mockCurate(prompt, catalog, { count }));
}

// Used when reconstructing a shared list from the URL: the ISBNs + why-notes are
// already decided, we just re-attach catalog metadata.
export function hydrateSharedList(shared) {
  return enrich(shared);
}

export { catalog };

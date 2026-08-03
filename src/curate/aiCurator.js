// AI curation path. The browser never sees the Anthropic key — it POSTs the prompt
// to the local dev proxy (server/proxy.js), which holds the key and talks to Claude.
// The model chooses & orders ISBNs strictly from the catalog we send, and writes a
// short "why it's here" for each. If the proxy isn't running or has no key, this
// throws and the caller falls back to the mock curator.

export async function aiCurate(prompt, catalog, { count = 10, signal } = {}) {
  const res = await fetch('/api/curate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, count, catalog: compactCatalog(catalog) }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`AI curator unavailable (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  if (!data || !Array.isArray(data.items) || data.items.length === 0) {
    throw new Error('AI curator returned no items');
  }

  // Guard against the model inventing ISBNs — keep only ones in our catalog.
  const validIsbns = new Set(catalog.books.map((b) => b.isbn));
  const items = data.items
    .filter((it) => validIsbns.has(String(it.isbn)))
    .map((it) => ({ isbn: String(it.isbn), why: String(it.why || '') }));

  if (items.length === 0) throw new Error('AI curator returned no on-catalog ISBNs');

  return {
    listTitle: data.listTitle || 'A Read-Down List',
    intro: data.intro || '',
    prompt,
    source: 'ai',
    items,
  };
}

// Trim the catalog to the fields the model needs, to keep the request small.
function compactCatalog(catalog) {
  return catalog.books.map((b) => ({
    isbn: b.isbn,
    title: b.title,
    author: b.author,
    tags: b.tags,
    blurb: b.blurb,
  }));
}

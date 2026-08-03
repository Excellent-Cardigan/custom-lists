// Offline curator — no API key, always works. Scores each catalog book against
// the prompt using tag/keyword overlap plus a small "vibe" synonym map so that
// mood prompts ("cozy autumn mysteries", "mind-bending sci-fi") still land well.
// It's intentionally simple and fully explainable; the AI curator is the richer path.

// Maps evocative prompt words to catalog tags they should boost.
const VIBE_SYNONYMS = {
  cozy: ['cozy', 'uplifting', 'witty', 'smalltown', 'comfort'],
  comforting: ['cozy', 'uplifting', 'comfort', 'hopeful'],
  spooky: ['dark', 'haunting', 'thriller', 'atmospheric'],
  creepy: ['dark', 'haunting', 'thriller', 'atmospheric'],
  scary: ['dark', 'haunting', 'thriller'],
  gothic: ['dark', 'atmospheric', 'haunting', 'classic'],
  beach: ['summer', 'romance', 'uplifting', 'fun'],
  summer: ['summer', 'romance', 'uplifting', 'fun'],
  vacation: ['travel', 'summer', 'adventure', 'romance'],
  sad: ['emotional', 'grief', 'melancholy'],
  cry: ['emotional', 'grief', 'melancholy'],
  emotional: ['emotional', 'grief', 'melancholy'],
  funny: ['witty', 'comedy', 'fun', 'satire'],
  hilarious: ['comedy', 'witty', 'fun'],
  smart: ['clever', 'literary', 'philosophical'],
  'mind-bending': ['twisty', 'clever', 'science-fiction', 'multiverse'],
  mindbending: ['twisty', 'clever', 'science-fiction'],
  twisty: ['twisty', 'thriller', 'suspense'],
  space: ['space', 'science-fiction'],
  spacey: ['space', 'science-fiction'],
  epic: ['epic', 'fantasy', 'science-fiction', 'war'],
  romantic: ['romance', 'steamy'],
  love: ['romance'],
  swoony: ['romance', 'steamy'],
  inspiring: ['inspiring', 'memoir', 'resilience'],
  motivational: ['self-help', 'inspiring', 'business', 'productivity'],
  hopeful: ['hopeful', 'uplifting'],
  nature: ['nature', 'quiet'],
  quiet: ['quiet', 'melancholy', 'literary'],
  dark: ['dark', 'haunting', 'thriller', 'violent'],
  historical: ['historical', 'classic'],
  classic: ['classic'],
  literary: ['literary'],
  thought: ['philosophical', 'literary', 'nonfiction'],
  thoughtful: ['philosophical', 'literary'],
  adventurous: ['adventure', 'epic', 'roadtrip'],
  adventure: ['adventure', 'epic'],
  foodie: ['food', 'cooking'],
  cooking: ['cooking', 'food'],
  kids: ['kids', 'picture-book'],
  children: ['kids', 'picture-book'],
  teen: ['young-adult', 'coming-of-age'],
  ya: ['young-adult', 'coming-of-age'],
  autumn: ['cozy', 'atmospheric', 'quiet'],
  fall: ['cozy', 'atmospheric'],
  winter: ['cozy', 'atmospheric', 'quiet'],
  ocean: ['nautical', 'nature', 'atmospheric'],
  sea: ['nautical', 'nature', 'atmospheric'],
  nautical: ['nautical', 'adventure', 'survival'],
  mystery: ['mystery', 'thriller', 'suspense'],
  detective: ['mystery', 'crime', 'thriller'],
  war: ['war', 'historical', 'epic'],
  identity: ['identity', 'coming-of-age', 'race'],
  feminist: ['feminist'],
  dystopian: ['dystopian', 'science-fiction'],
  fantasy: ['fantasy', 'magic', 'epic'],
  magic: ['magic', 'fantasy'],
};

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'for', 'to', 'of', 'in', 'on', 'with',
  'about', 'that', 'this', 'my', 'me', 'i', 'we', 'some', 'something', 'books',
  'book', 'read', 'reads', 'reading', 'list', 'want', 'like', 'give', 'get',
  'story', 'stories', 'novel', 'novels', 'set', 'by', 'at', 'from', 'into',
]);

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w));
}

// Expand prompt tokens into a weighted set of target tags.
function promptToTargetTags(prompt) {
  const tokens = tokenize(prompt);
  const targets = new Map(); // tag -> weight
  const add = (tag, w) => targets.set(tag, (targets.get(tag) || 0) + w);
  for (const tok of tokens) {
    add(tok, 1); // the raw word may itself be a tag or appear in blurbs/titles
    const syns = VIBE_SYNONYMS[tok];
    if (syns) for (const s of syns) add(s, 1.5);
  }
  return { targets, tokens };
}

function scoreBook(book, targets, tokens) {
  let score = 0;
  const matched = [];
  const tagSet = new Set(book.tags);
  for (const [tag, weight] of targets) {
    if (tagSet.has(tag)) {
      score += 3 * weight;
      matched.push(tag);
    }
  }
  // Light boost for raw token appearances in title/author/blurb.
  const haystack = `${book.title} ${book.author} ${book.blurb}`.toLowerCase();
  for (const tok of tokens) {
    if (tok.length > 2 && haystack.includes(tok)) score += 1;
  }
  return { score, matched };
}

function titleCase(str) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function makeListTitle(prompt) {
  const clean = String(prompt || '').trim().replace(/[.!?]+$/, '');
  if (!clean) return 'Your Reading List';
  const short = clean.length > 70 ? clean.slice(0, 67) + '…' : clean;
  return titleCase(short);
}

function makeIntro(prompt, count) {
  const clean = String(prompt || '').trim().replace(/[.!?]+$/, '');
  return `You asked for “${clean}.” Here are ${count} Penguin Random House books that fit the bill — add them to your TBR and find your next favorite read.`;
}

// A short editorial line placing the book in the list (the description is shown
// separately below it). Kept tag-based so it stays honest and explainable.
function whyNote(book, matched) {
  if (matched.length) {
    const top = matched.slice(0, 2).join(' and ');
    const article = /^[aeiou]/i.test(top) ? 'An' : 'A';
    return `${article} ${top} pick for this list.`;
  }
  return 'A well-loved pick worth your time.';
}

// Returns { listTitle, items: [{ isbn, why }] } — same shape as the AI curator.
export function mockCurate(prompt, catalog, { count = 10 } = {}) {
  const books = catalog.books || [];
  const { targets, tokens } = promptToTargetTags(prompt);

  const scored = books
    .map((book) => {
      const { score, matched } = scoreBook(book, targets, tokens);
      return { book, score, matched };
    })
    .sort((a, b) => b.score - a.score);

  // If nothing matched at all, fall back to a varied sample so the demo never empties.
  const top = scored.filter((s) => s.score > 0).slice(0, count);
  const picks = top.length >= 4 ? top : scored.slice(0, count);

  return {
    listTitle: makeListTitle(prompt),
    intro: makeIntro(prompt, picks.length),
    prompt,
    source: 'mock',
    items: picks.map(({ book, matched }) => ({
      isbn: book.isbn,
      why: whyNote(book, matched),
    })),
  };
}

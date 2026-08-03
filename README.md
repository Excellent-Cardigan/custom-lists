# PRH Read Down — Prompted Lists (POC)

Type an idea, a vibe, or a genre → get a curated **read-down list of real Penguin
Random House books**, each with a short "why it's here" note, at a **shareable
URL**, topped with a **generative cover** made by a rule-based p5.js system
(seeded from your prompt — **no AI image generation**).

Inspired by Spotify's Prompted Playlist pattern, adapted for PRH's editorial
*Read Down* lists.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173, type a prompt (or click an example), and you'll get a
list + poster + a shareable link. This works fully **offline** — no API key needed —
using the built-in mock curator.

### Optional: AI curation (richer "vibe" matching)

The AI path lets Claude pick and order titles from the catalog and write the notes.
The API key stays server-side via a tiny proxy.

```bash
cp .env.example .env      # add your ANTHROPIC_API_KEY
npm run proxy             # terminal 1  (http://localhost:8787)
npm run dev               # terminal 2
```

The app tries the AI path first and silently falls back to the mock curator if the
proxy isn't running.

## How it works

| Piece | File | Notes |
|---|---|---|
| Deterministic seed + PRNG | `src/art/seed.js` | `cyrb53(prompt)` → seed → `mulberry32`. Same prompt = same art, for everyone. |
| Warm palettes | `src/art/palette.js` | Rule-based, seeded. |
| Generative poster | `src/art/poster.js` | p5.js: 4 composition archetypes, Perlin noise, film grain, vignette. |
| Curation (interface) | `src/curate/curateList.js` | Tries AI, falls back to mock, then enriches with catalog metadata. |
| Mock curator | `src/curate/mockCurator.js` | Offline tag/keyword + vibe-synonym matching. |
| AI curator | `src/curate/aiCurator.js` + `server/proxy.js` | Claude via server-side proxy. |
| Seeded catalog | `src/data/catalog.json` | ~90 real PRH titles, ISBNs validated against the cover CDN. |
| Covers | `src/covers.js` | PRH image CDN with the Cover Fetcher fallback chain. |
| Buy links | `src/retailers.js` | Add to Cart → PRH book page (search-by-ISBN redirect); retailer row (Amazon, B&N, Books-A-Million, Bookshop.org, Target, Apple Books) built by ISBN. Patterns taken from a real PRH Read Down page. |
| Read Down layout | `src/components/ListView.jsx`, `BookRow.jsx` | Single-column editorial article matching PRH's template: eyebrow, title, byline, intro, then full book cards (cover, title/author, editorial line, description, Add to Bookshelf, Add to Cart, retailers). |
| Shareable URLs | `src/share/encode.js` | Whole list packed into the URL hash — no backend. |

## What this proves — and what it doesn't

**Proves:** the end-to-end UX (idea → curated real-book list → shareable link) and
the seeded, reproducible generative-art system.

**Not production:** a real build would swap the URL-hash payload for short IDs +
storage, curate live via the PRH Search API (BISAC codes) instead of a seeded
catalog, add title availability/rights checks, and apply PRH's design system.

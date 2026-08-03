// Optional local curation proxy. Holds the Anthropic key server-side so it never
// reaches the browser. The Vite dev server forwards /api/* here (see vite.config.js).
//
//   1. cp .env.example .env  and set ANTHROPIC_API_KEY
//   2. npm run proxy         (starts on :8787)
//   3. npm run dev           (in another terminal)
//
// Without this running, the app still works via the offline mock curator.
//
// Zero-dependency: uses Node's built-in http + fetch (Node 18+).

import http from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Minimal .env loader so we don't add a dependency.
function loadEnv() {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const text = readFileSync(join(here, '..', '.env'), 'utf8');
    for (const line of text.split('\n')) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* no .env file — rely on real environment */
  }
}
loadEnv();

const PORT = process.env.PROXY_PORT || 8787;
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
const API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM = `You are a book curator for Penguin Random House's "Read Down" lists.
You are given a reader's prompt and a CATALOG of real PRH books (each with isbn, title, author, tags, blurb).
Choose the 8-12 books from the CATALOG that best match the reader's idea, mood, or genre, and order them so the list reads well (a strong opener, a satisfying arc).
For each pick, write a warm, specific one-sentence "why it's here" (max ~20 words) that connects THIS book to THE READER'S prompt — not just a summary.
Also invent a short, editorial list title in the spirit of PRH Read Down lists (e.g. "Slow-Burn Mysteries for a Foggy Weekend"), and a 1-2 sentence editorial "intro" that sets up the list for the reader.
Only use ISBNs that appear in the CATALOG. Never invent books or ISBNs.
Respond with ONLY a JSON object, no prose, no markdown fences:
{"listTitle": string, "intro": string, "items": [{"isbn": string, "why": string}]}`;

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function sendJson(res, status, obj) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {});
  if (req.method !== 'POST' || !req.url.startsWith('/api/curate')) {
    return sendJson(res, 404, { error: 'not found' });
  }
  if (!API_KEY) {
    return sendJson(res, 503, { error: 'ANTHROPIC_API_KEY not set; use the offline mock curator' });
  }

  try {
    const { prompt, catalog, count = 10 } = JSON.parse((await readBody(req)) || '{}');
    if (!prompt || !Array.isArray(catalog)) {
      return sendJson(res, 400, { error: 'prompt and catalog are required' });
    }

    const userContent = `READER PROMPT: ${prompt}\nTARGET COUNT: ${count}\n\nCATALOG (JSON):\n${JSON.stringify(catalog)}`;

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system: SYSTEM,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      return sendJson(res, 502, { error: `Anthropic API error: ${errText.slice(0, 300)}` });
    }

    const payload = await anthropicRes.json();
    const text = (payload.content || []).map((b) => b.text || '').join('').trim();
    const jsonText = text.replace(/^```(?:json)?\s*|\s*```$/g, '');
    const parsed = JSON.parse(jsonText);
    return sendJson(res, 200, parsed);
  } catch (err) {
    return sendJson(res, 500, { error: String(err.message || err) });
  }
});

server.listen(PORT, () => {
  console.log(`[curate proxy] listening on http://localhost:${PORT}  (model: ${MODEL})`);
  if (!API_KEY) console.log('[curate proxy] WARNING: ANTHROPIC_API_KEY not set — /api/curate will 503.');
});

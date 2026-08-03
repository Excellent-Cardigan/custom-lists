// Deterministic seeding: the same prompt always yields the same number, and that
// number drives every random choice in the poster. This is what makes a shared
// link show everyone the *same* artwork with no server involved.

// cyrb53 — a small, well-distributed string hash. Returns a 53-bit integer.
export function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

// Normalize a prompt so trivial differences (case, spacing) map to the same seed.
export function normalizePrompt(prompt) {
  return String(prompt || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

// Turn a prompt into a stable 32-bit unsigned seed.
export function seedFromPrompt(prompt) {
  return cyrb53(normalizePrompt(prompt)) >>> 0;
}

// mulberry32 — a fast, seedable PRNG. Given the same seed it emits the same
// sequence of floats in [0, 1). All poster randomness pulls from one of these.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Small helpers built on an rng() for readable poster code.
export function makeRandom(rng) {
  const range = (min, max) => min + (max - min) * rng();
  const int = (min, max) => Math.floor(range(min, max + 1));
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const chance = (p) => rng() < p;
  return { rng, range, int, pick, chance };
}

// Rule-based palettes. Warm, inviting, a little analog — never neon, never cold
// by default. The seed picks a "mood" and the exact hues wander within warm bands
// so every list feels distinct but the family always reads as one system.

import { mulberry32, makeRandom } from './seed.js';
import fall from '../data/seasons/fall.json';
import summer from '../data/seasons/summer.json';
import winter from '../data/seasons/winter.json';

const SEASONS = { fall, summer, winter };

// Warm anchor hues (in degrees) we allow the base to land near.
// Ambers, ochres, rusts, terracotta, oxblood, warm rose.
const WARM_ANCHORS = [18, 28, 36, 44, 10, 350, 4];
// A restrained set of accent hues — a cool note is allowed, but only as a spark.
const ACCENT_ANCHORS = [190, 172, 205, 52, 320];

// Legacy comma syntax — p5's color parser does not accept the modern
// space-separated form, so we keep hsl(h, s%, l%) here.
function hsl(h, s, l) {
  const hue = Math.round(((h % 360) + 360) % 360);
  return `hsl(${hue}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

// Given a seed, produce a coherent palette object used across the poster.
export function paletteFromSeed(seed, opts = {}) {
  const r = makeRandom(mulberry32(seed ^ 0x9e3779b9));

  // Two broad moods: "dusk" (deep warm ground, glowing marks) and
  // "paper" (warm cream ground, inky saturated marks). Roughly 50/50.
  const mood = r.chance(0.5) ? 'dusk' : 'paper';

  const baseHue = r.pick(WARM_ANCHORS) + r.range(-8, 8);
  const accentHue = r.pick(ACCENT_ANCHORS) + r.range(-6, 6);
  const secondHue = baseHue + r.range(18, 44) * (r.chance(0.5) ? 1 : -1);

  let background, ink, marks, glow, accent;

  if (mood === 'dusk') {
    background = hsl(baseHue - 4, r.range(38, 55), r.range(10, 16));
    ink = hsl(baseHue + 30, r.range(55, 75), r.range(88, 94)); // warm off-white text
    marks = [
      hsl(baseHue, r.range(60, 82), r.range(48, 60)),
      hsl(secondHue, r.range(55, 78), r.range(42, 56)),
      hsl(baseHue + 14, r.range(70, 88), r.range(58, 70)),
    ];
    glow = hsl(baseHue + 8, r.range(80, 95), r.range(60, 70));
    accent = hsl(accentHue, r.range(55, 78), r.range(55, 66));
  } else {
    background = hsl(baseHue + 8, r.range(30, 46), r.range(88, 94)); // warm cream
    ink = hsl(baseHue - 6, r.range(45, 65), r.range(14, 22)); // warm near-black
    marks = [
      hsl(baseHue, r.range(62, 82), r.range(40, 52)),
      hsl(secondHue, r.range(58, 78), r.range(36, 48)),
      hsl(baseHue - 10, r.range(65, 85), r.range(30, 42)),
    ];
    glow = hsl(baseHue + 6, r.range(70, 88), r.range(52, 62));
    accent = hsl(accentHue, r.range(48, 70), r.range(40, 52));
  }

  return {
    mood,
    baseHue,
    background,
    ink,
    marks,
    glow,
    accent,
    // Grain strength leans heavier on dusk for a filmic feel.
    grain: mood === 'dusk' ? r.range(0.06, 0.12) : r.range(0.04, 0.08),
    ...opts,
  };
}

// PRH's real seasonal/genre brand colors (Fall 26, Summer 26, Winter 2025/26),
// sourced from the "Coming Soon" Figma file. Each genre has 4 flat colors;
// some seasons don't cover every genre (e.g. Winter has no literary-fiction),
// so we fall back to "fiction" rather than fake a value.
export function paletteFromSeasonGenre(season, genre, opts = {}) {
  const seasonData = SEASONS[season];
  const entry = seasonData?.genres[genre] ?? seasonData?.genres['fiction'];
  if (!entry) return null;

  const [background, m1, m2, accent] = entry.colors;

  return {
    mood: 'paper',
    background,
    ink: accent,
    marks: [m1, m2, accent],
    glow: m2,
    accent,
    grain: 0.08,
    ...opts,
  };
}

// Fall = Sep-Nov, Winter = Dec-Feb, Summer = Mar-Aug (the seasonal data has no
// "spring" set, so summer's colors cover the spring gap too).
export function currentSeason(date = new Date()) {
  const month = date.getMonth(); // 0-11
  if (month >= 8 && month <= 10) return 'fall'; // Sep, Oct, Nov
  if (month === 11 || month <= 1) return 'winter'; // Dec, Jan, Feb
  return 'summer'; // Mar-Aug
}

// Pools every genre's 4 colors for a season into one list, then seed-picks 4 of
// them (deterministic per seed, so shareable links stay reproducible) to build
// a palette. This is genre-agnostic — it's meant to represent "the season," not
// any one book category.
export function paletteFromSeasonPool(season, seed, opts = {}) {
  const seasonData = SEASONS[season];
  if (!seasonData) return null;

  const pool = Object.values(seasonData.genres).flatMap((g) => g.colors);
  const r = makeRandom(mulberry32(seed ^ 0x51ed270b));

  const remaining = [...pool];
  const picks = [];
  for (let i = 0; i < 4; i++) {
    const index = r.int(0, remaining.length - 1);
    picks.push(remaining.splice(index, 1)[0]);
  }
  const [background, m1, m2, accent] = picks;

  return {
    mood: 'paper',
    background,
    ink: accent,
    marks: [m1, m2, accent],
    glow: m2,
    accent,
    grain: 0.08,
    ...opts,
  };
}

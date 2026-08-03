// The generative poster. Everything here is rule-based and seeded — no AI imagery.
// A p5 instance-mode sketch is returned; PosterCanvas.jsx mounts it into a div.
//
// Inputs:
//   seed    – 32-bit int from the prompt (see seed.js)
//   palette – warm palette object (see palette.js)
//   meta    – { bookCount, dominantSubject } to tie art to the list
//   size    – { w, h } render size in px (portrait poster by default)

import { mulberry32, makeRandom } from './seed.js';

const ARCHETYPES = ['bands', 'sun', 'field', 'grid'];

export function createPosterSketch({ seed, palette, meta = {}, size }) {
  const W = size?.w ?? 1000;
  const H = size?.h ?? 1250;
  const bookCount = clamp(meta.bookCount ?? 10, 4, 14);

  // Pick composition + a few global params up front, independent of draw order.
  const setup = makeRandom(mulberry32(seed));
  // Wide banner formats (e.g. the 2000x380 Read Down header) only read well with
  // the archetypes that fill the full width; the grid/sun leave dead space.
  const archetypePool = W / H > 2.4 ? ['field', 'bands'] : ARCHETYPES;
  const archetype = archetypePool[setup.int(0, archetypePool.length - 1)];
  // Keep wide banners nearly level so rotation doesn't expose corner gaps.
  const rotation = W / H > 2.4 ? setup.range(-0.015, 0.015) : setup.range(-0.06, 0.06);
  // Small margin on wide banners so the art bleeds to the edges (no cream border).
  const margin = W / H > 2.4
    ? Math.round(Math.min(W, H) * 0.03)
    : Math.round(Math.min(W, H) * setup.range(0.06, 0.1));

  return (p) => {
    p.setup = () => {
      p.createCanvas(W, H);
      p.pixelDensity(1);
      p.noiseSeed(seed);
      p.randomSeed(seed);
      p.noLoop();
      draw();
    };

    function draw() {
      p.background(palette.background);

      p.push();
      // Slight rotation about center for a hand-placed, analog feel.
      p.translate(W / 2, H / 2);
      p.rotate(rotation);
      p.translate(-W / 2, -H / 2);

      if (archetype === 'bands') drawBands();
      else if (archetype === 'sun') drawSun();
      else if (archetype === 'field') drawField();
      else drawGrid();

      p.pop();

      vignette();
      grain();
    }

    // --- Archetype: stacked, noise-warped horizontal bands -----------------
    function drawBands() {
      const bands = clamp(Math.round(bookCount * 0.9), 5, 12);
      const usable = H - margin * 2;
      const bandH = usable / bands;
      p.noStroke();
      for (let i = 0; i < bands; i++) {
        const col = pickMark(i);
        p.fill(withAlpha(col, p.random(0.7, 1)));
        const y0 = margin + i * bandH;
        p.beginShape();
        p.vertex(0, y0 + bandH);
        for (let x = 0; x <= W; x += 12) {
          const n = p.noise(x * 0.0018, i * 0.6, seed * 0.0001);
          const wobble = (n - 0.5) * bandH * 1.1;
          p.vertex(x, y0 + wobble);
        }
        p.vertex(W, y0 + bandH);
        p.endShape(p.CLOSE);
      }
      // A single accent stripe as punctuation.
      p.fill(palette.accent);
      const ay = margin + p.random(bands) * bandH;
      p.rect(0, ay, W, p.random(3, 7));
    }

    // --- Archetype: rising sun / arc with radiating strokes ----------------
    function drawSun() {
      const cx = W * p.random(0.32, 0.68);
      const cy = H * p.random(0.52, 0.72);
      const maxR = Math.min(W, H) * p.random(0.42, 0.6);

      // Radiating rays.
      p.stroke(withAlpha(palette.marks[0], 0.5));
      const rays = clamp(bookCount * 6, 36, 84);
      for (let i = 0; i < rays; i++) {
        const a = (i / rays) * p.TWO_PI + p.random(-0.02, 0.02);
        p.strokeWeight(p.random(0.6, 2.2));
        const r0 = maxR * 0.2;
        const r1 = maxR * p.random(0.9, 1.25);
        p.line(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      }

      // Concentric rings, one per book, warped by noise.
      p.noFill();
      for (let i = 0; i < bookCount; i++) {
        const rr = maxR * (0.18 + (i / bookCount) * 0.9);
        p.stroke(withAlpha(pickMark(i), p.random(0.55, 0.95)));
        p.strokeWeight(p.random(1.5, 4.5));
        p.beginShape();
        for (let a = 0; a <= p.TWO_PI + 0.1; a += 0.12) {
          const n = p.noise(Math.cos(a) + 2, Math.sin(a) + 2, i * 0.4);
          const rad = rr * (0.94 + n * 0.12);
          p.vertex(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
        }
        p.endShape();
      }

      // Solid disc core with a glow.
      p.noStroke();
      p.fill(withAlpha(palette.glow, 0.9));
      p.circle(cx, cy, maxR * 0.34);
    }

    // --- Archetype: flowing Perlin field of short strokes ------------------
    function drawField() {
      const step = 20;
      const len = 22;
      p.strokeCap(p.ROUND);
      for (let y = margin; y < H - margin; y += step) {
        for (let x = margin; x < W - margin; x += step) {
          const n = p.noise(x * 0.0025, y * 0.0025, seed * 0.00005);
          const a = n * p.TWO_PI * 2;
          const col = pickMark(Math.floor(n * 3));
          p.stroke(withAlpha(col, p.map(n, 0, 1, 0.25, 0.9)));
          p.strokeWeight(p.map(n, 0, 1, 0.8, 3.2));
          const jx = x + p.random(-4, 4);
          const jy = y + p.random(-4, 4);
          p.line(jx, jy, jx + Math.cos(a) * len, jy + Math.sin(a) * len);
        }
      }
      // A few glowing seeds scattered — one per book.
      p.noStroke();
      for (let i = 0; i < bookCount; i++) {
        p.fill(withAlpha(palette.glow, p.random(0.5, 0.9)));
        p.circle(p.random(margin, W - margin), p.random(margin, H - margin), p.random(6, 16));
      }
    }

    // --- Archetype: grid of hand-drawn marks -------------------------------
    function drawGrid() {
      const cols = clamp(Math.round(Math.sqrt(bookCount) + 1), 3, 5);
      const rows = clamp(Math.ceil(bookCount / cols) + 1, 3, 6);
      const cw = (W - margin * 2) / cols;
      const ch = (H - margin * 2) / rows;
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const cxp = margin + gx * cw + cw / 2;
          const cyp = margin + gy * ch + ch / 2;
          const s = Math.min(cw, ch) * p.random(0.42, 0.62);
          const col = pickMark(gy * cols + gx);
          p.push();
          p.translate(cxp, cyp);
          p.rotate(p.random(-0.25, 0.25));
          const kind = p.random(['dot', 'ring', 'cross', 'arc']);
          p.stroke(col);
          p.strokeWeight(p.random(2, 6));
          if (kind === 'dot') {
            p.noStroke();
            p.fill(col);
            p.circle(0, 0, s);
          } else if (kind === 'ring') {
            p.noFill();
            p.circle(0, 0, s);
          } else if (kind === 'cross') {
            p.line(-s / 2, 0, s / 2, 0);
            p.line(0, -s / 2, 0, s / 2);
          } else {
            p.noFill();
            p.arc(0, 0, s, s, p.random(p.TWO_PI), p.random(p.TWO_PI) + p.PI);
          }
          p.pop();
        }
      }
      // Accent tick in one cell.
      p.noStroke();
      p.fill(palette.accent);
      p.circle(margin + p.random(cols) * cw, margin + p.random(rows) * ch, p.random(10, 22));
    }

    // --- Shared texture passes --------------------------------------------
    function vignette() {
      // Soft darkening toward the edges — filmic, keeps focus centered.
      const ctx = p.drawingContext;
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, palette.mood === 'dusk' ? 'rgba(0,0,0,0.45)' : 'rgba(40,20,0,0.18)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    function grain() {
      // Per-pixel film grain — the analog signature. Rendered once (noLoop).
      const amt = palette.grain ?? 0.08;
      p.loadPixels();
      const d = p.pixelDensity();
      const n = 4 * (W * d) * (H * d);
      for (let i = 0; i < n; i += 4) {
        const g = (p.random() - 0.5) * 255 * amt;
        p.pixels[i] = clampByte(p.pixels[i] + g);
        p.pixels[i + 1] = clampByte(p.pixels[i + 1] + g);
        p.pixels[i + 2] = clampByte(p.pixels[i + 2] + g);
      }
      p.updatePixels();
    }

    // --- helpers -----------------------------------------------------------
    function pickMark(i) {
      return palette.marks[((i % palette.marks.length) + palette.marks.length) % palette.marks.length];
    }
  };
}

// Convert an hsl(h, s%, l%) string to hsla(h, s%, l%, a). Legacy comma syntax so
// p5's color parser accepts it.
function withAlpha(hslStr, alpha) {
  const a = Math.max(0, Math.min(1, alpha)).toFixed(3);
  if (hslStr.startsWith('hsl(')) {
    return hslStr.replace('hsl(', 'hsla(').replace(/\)\s*$/, `, ${a})`);
  }
  return hslStr;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function clampByte(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

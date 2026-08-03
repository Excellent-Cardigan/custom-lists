// PRH cover CDN. Same fallback chain proven in Rob's "PRH Cover Fetcher" Figma
// plugin — try each URL until one loads. Covers are shown as <img>, never drawn
// into a canvas, so cross-origin is a non-issue.

export const COVER_URL_PATTERNS = [
  (isbn) => `https://images1.penguinrandomhouse.com/cover/${isbn}`,
  (isbn) => `https://images3.penguinrandomhouse.com/cover/${isbn}`,
  (isbn) => `https://images1.penguinrandomhouse.com/cover/700jpg/${isbn}`,
  (isbn) => `https://images3.penguinrandomhouse.com/cover/700jpg/${isbn}`,
];

export function coverUrls(isbn) {
  const clean = String(isbn).replace(/[^0-9X]/gi, '');
  return COVER_URL_PATTERNS.map((fn) => fn(clean));
}

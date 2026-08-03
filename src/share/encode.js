// Backend-free sharing: the whole resolved list is packed into the URL hash as
// base64url. Opening the link in any browser reconstructs the list and (because
// the poster is seeded from the prompt) the identical artwork — no server, no DB.
//
// Compact shape keeps URLs short:
//   { t: listTitle, p: prompt, b: [[isbn, why], ...] }

function utf8ToBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToUtf8(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// list: { listTitle, prompt, items: [{ isbn, why }] } -> hash string "#/list?d=..."
export function encodeListToHash(list) {
  const compact = {
    t: list.listTitle,
    i: list.intro || '',
    p: list.prompt,
    b: list.items.map((it) => [it.isbn, it.why || '']),
  };
  const d = utf8ToBase64Url(JSON.stringify(compact));
  return `#/list?d=${d}`;
}

// Parse the current location.hash back into a list, or null if none/invalid.
export function decodeListFromHash(hash = window.location.hash) {
  const m = /[?&]d=([^&]+)/.exec(hash || '');
  if (!m) return null;
  try {
    const compact = JSON.parse(base64UrlToUtf8(m[1]));
    return {
      listTitle: compact.t || 'Untitled list',
      intro: compact.i || '',
      prompt: compact.p || '',
      items: (compact.b || []).map(([isbn, why]) => ({ isbn, why })),
    };
  } catch (err) {
    console.warn('Could not decode shared list from URL:', err);
    return null;
  }
}

export function isListRoute(hash = window.location.hash) {
  return /^#\/list\b/.test(hash || '');
}

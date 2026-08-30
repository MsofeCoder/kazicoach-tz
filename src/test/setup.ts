import '@testing-library/jest-dom/vitest';

// Some jsdom builds ship a crypto object without randomUUID; the app relies on it for ids.
if (typeof globalThis.crypto !== 'undefined' && !globalThis.crypto.randomUUID) {
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    configurable: true,
    value: () => {
      const bytes = new Uint8Array(16);
      globalThis.crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
      const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0'));
      return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
    },
  });
}

// Some jsdom builds expose window.localStorage as undefined; the app needs a working Storage.
function ensureStorage() {
  if (typeof window === 'undefined') return; // Node-environment tests have no window.
  try {
    window.localStorage.getItem('kazicoach-probe');
    return; // Real storage works.
  } catch {
    // Fall through to the shim.
  }
  const data = new Map<string, string>();
  const shim: Storage = {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: key => (data.has(key) ? (data.get(key) as string) : null),
    key: index => Array.from(data.keys())[index] ?? null,
    removeItem: key => { data.delete(key); },
    setItem: (key, value) => { data.set(key, String(value)); },
  };
  Object.defineProperty(window, 'localStorage', { value: shim, configurable: true });
  Object.defineProperty(globalThis, 'localStorage', { value: shim, configurable: true });
}
ensureStorage();

// jsdom does not implement scrolling; keep the output clean.
if (typeof window !== 'undefined') window.scrollTo = () => {};


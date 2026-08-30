// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { bucketStart, decideCount, rateLimit, type RateLimitStore } from './_rate-limit';

class FakeStore implements RateLimitStore {
  readonly values = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async put(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }
}

describe('bucketStart', () => {
  it('snaps timestamps to fixed windows', () => {
    expect(bucketStart(3_700_000, 3_600_000)).toBe(3_600_000);
    expect(bucketStart(3_599_999, 3_600_000)).toBe(0);
    expect(bucketStart(0, 3_600_000)).toBe(0);
  });
});

describe('decideCount', () => {
  it('allows requests below the limit and reports the remaining budget', () => {
    const result = decideCount(4, 10, 3_600_000, 3_650_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(6);
  });

  it('blocks at the limit with a retry-after until the window resets', () => {
    const result = decideCount(10, 10, 3_600_000, 3_650_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(3600);
  });
});

describe('rateLimit', () => {
  it('counts requests per IP and stops at the limit', async () => {
    const store = new FakeStore();
    const now = 1_720_000_000_000;
    for (let index = 0; index < 3; index += 1) {
      const result = await rateLimit('1.2.3.4', { store, max: 3, windowMs: 60_000, now });
      expect(result.allowed).toBe(true);
    }
    const blocked = await rateLimit('1.2.3.4', { store, max: 3, windowMs: 60_000, now });
    expect(blocked.allowed).toBe(false);
    const otherIp = await rateLimit('5.6.7.8', { store, max: 3, windowMs: 60_000, now });
    expect(otherIp.allowed).toBe(true);
  });

  it('opens a fresh window after the bucket rolls over', async () => {
    const store = new FakeStore();
    const start = 1_720_000_000_000;
    for (let index = 0; index < 2; index += 1) {
      await rateLimit('1.2.3.4', { store, max: 2, windowMs: 60_000, now: start });
    }
    expect((await rateLimit('1.2.3.4', { store, max: 2, windowMs: 60_000, now: start })).allowed).toBe(false);
    expect((await rateLimit('1.2.3.4', { store, max: 2, windowMs: 60_000, now: start + 60_000 })).allowed).toBe(true);
  });

  it('keeps working when the store itself fails', async () => {
    const failing: RateLimitStore = {
      get: () => Promise.reject(new Error('kv down')),
      put: () => Promise.reject(new Error('kv down')),
    };
    const result = await rateLimit('1.2.3.4', { store: failing, max: 1, windowMs: 60_000, now: 1_720_000_000_000 });
    expect(result.allowed).toBe(true);
  });
});

/**
 * Per-IP rate limiting for the AI generation route.
 *
 * Two backends, chosen automatically:
 *  1. A Cloudflare KV binding (`RATE_LIMIT_KV`) gives durable, global counting
 *     across every edge isolate. Recommended for production.
 *  2. Without a binding, an in-process sliding window is used. It is best
 *     effort (per isolate) but still stops simple abuse bursts.
 */

export interface RateLimitStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface RateLimitOptions {
  store?: RateLimitStore;
  max?: number;
  windowMs?: number;
  now?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export const DEFAULT_MAX = 10;
export const DEFAULT_WINDOW_MS = 3_600_000;

export function bucketStart(now: number, windowMs: number): number {
  return Math.floor(now / windowMs) * windowMs;
}

export function decideCount(count: number, max: number, windowMs: number, now: number): RateLimitResult {
  const bucketEnd = bucketStart(now, windowMs) + windowMs;
  const retryAfterSeconds = Math.max(1, Math.ceil((bucketEnd - now) / 1000));
  return {
    allowed: count < max,
    remaining: Math.max(0, max - count),
    retryAfterSeconds,
  };
}

export class MemoryRateStore implements RateLimitStore {
  private readonly counts = new Map<string, number>();
  private lastPrune = 0;

  constructor(private readonly windowMs: number = DEFAULT_WINDOW_MS, private readonly now: () => number = Date.now) {}

  async get(key: string): Promise<string | null> {
    return this.counts.has(key) ? String(this.counts.get(key)) : null;
  }

  async put(key: string, value: string): Promise<void> {
    this.prune();
    const count = Number(value) || 0;
    if (count <= 0) this.counts.delete(key);
    else this.counts.set(key, Math.min(count, 1_000_000));
  }

  private prune(): void {
    const now = this.now();
    if (now - this.lastPrune < 60_000) return;
    this.lastPrune = now;
    const cutoff = bucketStart(now, this.windowMs);
    for (const key of this.counts.keys()) {
      const stamp = Number(key.slice(key.lastIndexOf(':') + 1));
      if (Number.isFinite(stamp) && stamp < cutoff) this.counts.delete(key);
    }
  }
}

const memoryStore = new MemoryRateStore();

export async function rateLimit(ip: string, options: RateLimitOptions = {}): Promise<RateLimitResult> {
  const max = options.max && options.max > 0 ? Math.floor(options.max) : DEFAULT_MAX;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const now = options.now ?? Date.now();
  const key = `rl:${ip}:${bucketStart(now, windowMs)}`;
  const store = options.store ?? memoryStore;

  let count = 0;
  try {
    const raw = await store.get(key);
    count = raw ? Number(raw) || 0 : 0;
  } catch {
    count = 0;
  }

  const decision = decideCount(count, max, windowMs, now);
  if (decision.allowed) {
    try {
      await store.put(key, String(count + 1), { expirationTtl: Math.max(60, Math.ceil(windowMs / 1000) * 2) });
    } catch {
      // Counting must never take the route down.
    }
  }
  return decision;
}

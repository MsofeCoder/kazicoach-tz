/**
 * Privacy-safe client error sink.
 *
 * Receives minimal reports (message, truncated stack, page path) from the app
 * and writes them to the Pages Function console. Inspect live output with:
 *   npx wrangler pages deployment tail
 *
 * No user content (CV text, answers, materials) is ever included; the payload
 * shape is enforced again here so nothing unexpected is logged.
 */

import { rateLimit } from './_rate-limit';

interface Env {
  RATE_LIMIT_KV?: { get(key: string): Promise<string | null>; put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> };
}

interface ErrorReportBody {
  message?: unknown;
  stack?: unknown;
  extra?: unknown;
  source?: unknown;
  path?: unknown;
  release?: unknown;
  userAgent?: unknown;
  timestamp?: unknown;
}

const MAX_BODY_BYTES = 8_000;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});

const str = (value: unknown, max: number): string | undefined =>
  typeof value === 'string' && value.trim() ? value.slice(0, max) : undefined;

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > MAX_BODY_BYTES) return json({ ok: false }, 413);

  // Burst protection: a broken client looping on errors must not flood the logs.
  const ip = request.headers.get('CF-Connecting-IP') ?? request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ?? 'unknown';
  await rateLimit(`err:${ip}`, { store: env.RATE_LIMIT_KV, max: 30 });

  let body: ErrorReportBody;
  try {
    body = await request.json() as ErrorReportBody;
  } catch {
    return json({ ok: false }, 400);
  }

  const entry = {
    message: str(body.message, 300) ?? 'unknown',
    stack: str(body.stack, 2_000),
    extra: str(body.extra, 1_000),
    source: str(body.source, 60) ?? 'unknown',
    path: str(body.path, 200) ?? '/',
    release: str(body.release, 40) ?? 'unknown',
    userAgent: str(body.userAgent, 200),
    timestamp: str(body.timestamp, 40),
  };
  // Visible in Cloudflare Pages deployment logs: `wrangler pages deployment tail`.
  console.log('[client-error]', JSON.stringify(entry));
  return json({ ok: true });
};
/**
 * Minimal, privacy-safe production error reporting.
 *
 * Design goals:
 * - Never send user content: only the error message, a truncated stack, the
 *   page path (no query string) and coarse client metadata.
 * - Fire-and-forget: reporting failures must never break the app or delay it.
 * - Silent in development; in production it posts to /api/log-error, a
 *   Cloudflare Pages Function whose logs are inspectable with
 *   `npx wrangler pages deployment tail`. No third-party service receives data.
 */

const ENDPOINT = '/api/log-error';
const MAX_MESSAGE = 300;
const MAX_STACK = 2_000;
const MAX_EXTRA = 1_000;

export interface ErrorReport {
  message: string;
  stack?: string;
  extra?: string;
  source: string;
  path: string;
  release: string;
  userAgent: string;
  timestamp: string;
}

const safeSlice = (value: unknown, max: number): string | undefined =>
  typeof value === 'string' && value.trim() ? value.slice(0, max) : undefined;

export function buildReport(error: unknown, source: string, extra?: string): ErrorReport {
  const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
  return {
    message: message.slice(0, MAX_MESSAGE),
    stack: safeSlice(error instanceof Error ? error.stack : undefined, MAX_STACK),
    extra: safeSlice(extra, MAX_EXTRA),
    source: source.slice(0, 60),
    path: typeof location !== 'undefined' ? location.pathname.slice(0, 200) : '/',
    release: import.meta.env.VITE_APP_VERSION || 'dev',
    userAgent: typeof navigator !== 'undefined' && typeof navigator.userAgent === 'string' ? navigator.userAgent.slice(0, 200) : 'unknown',
    timestamp: new Date().toISOString(),
  };
}

/** Overridable seam so tests can force the production transport deterministically. */
export const errorReportingConfig = {
  isDev: (): boolean => Boolean(import.meta.env?.DEV),
};

/** Deliver a report without ever throwing or awaiting. */
export function reportError(error: unknown, source: string, extra?: string): void {
  try {
    if (errorReportingConfig.isDev()) {
      console.error(`[${source}]`, error, extra ?? '');
      return;
    }
    const body = JSON.stringify(buildReport(error, source, extra));
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(ENDPOINT, body);
      return;
    }
    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Reporting must never break the application.
  }
}

/** Attach process-level handlers so uncaught errors are captured too. Idempotent. */
export function installGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return;
  const w = window as Window & { __kazicoachErrorHandlers?: boolean };
  if (w.__kazicoachErrorHandlers) return;
  w.__kazicoachErrorHandlers = true;
  window.addEventListener('error', event => {
    reportError(event.error ?? event.message, 'window.error');
  });
  window.addEventListener('unhandledrejection', event => {
    reportError(event.reason, 'unhandledrejection');
  });
}
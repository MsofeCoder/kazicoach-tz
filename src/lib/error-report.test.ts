import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildReport, errorReportingConfig, installGlobalErrorHandlers, reportError } from './error-report';

const beacon = vi.fn();
const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));

function forceProduction() {
  vi.spyOn(errorReportingConfig, 'isDev').mockReturnValue(false);
}

const stubNavigator = (extra: Record<string, unknown>) =>
  vi.stubGlobal('navigator', { userAgent: 'vitest-agent', ...extra });

describe('error reporting', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    (window as unknown as { __kazicoachErrorHandlers?: boolean }).__kazicoachErrorHandlers = false;
    fetchMock.mockClear();
    beacon.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('builds a truncated, content-free report', () => {
    const error = new Error('Boom happened');
    error.stack = 'x'.repeat(5_000);
    const report = buildReport(error, 'test-source', 'y'.repeat(2_000));
    expect(report.message).toBe('Boom happened');
    expect(report.stack?.length).toBe(2_000);
    expect(report.extra?.length).toBe(1_000);
    expect(report.source).toBe('test-source');
    expect(report.timestamp).toBeTruthy();
  });

  it('sends via sendBeacon when available', () => {
    forceProduction();
    stubNavigator({ sendBeacon: beacon });
    reportError(new Error('render failed'), 'error-boundary', 'component stack');
    expect(beacon).toHaveBeenCalledOnce();
    expect(beacon.mock.calls[0][0]).toBe('/api/log-error');
    const payload = JSON.parse(beacon.mock.calls[0][1]) as { message: string; extra: string };
    expect(payload.message).toBe('render failed');
    expect(payload.extra).toBe('component stack');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('falls back to keepalive fetch without sendBeacon', async () => {
    forceProduction();
    vi.stubGlobal('fetch', fetchMock);
    stubNavigator({ sendBeacon: undefined });
    reportError(new Error('network died'), 'window.error');
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body)).message).toBe('network died');
  });

  it('stays silent in development', () => {
    vi.spyOn(errorReportingConfig, 'isDev').mockReturnValue(true);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    stubNavigator({ sendBeacon: beacon });
    reportError(new Error('dev only'), 'test');
    expect(consoleSpy).toHaveBeenCalledOnce();
    expect(beacon).not.toHaveBeenCalled();
  });

  it('never throws when reporting fails', () => {
    forceProduction();
    stubNavigator({ sendBeacon: undefined });
    vi.stubGlobal('fetch', vi.fn(() => { throw new Error('broken environment'); }));
    expect(() => reportError(new Error('original'), 'test')).not.toThrow();
  });

  it('installs global handlers once and reports uncaught errors', () => {
    forceProduction();
    stubNavigator({ sendBeacon: beacon });
    installGlobalErrorHandlers();
    installGlobalErrorHandlers(); // second call must be a no-op
    window.dispatchEvent(new ErrorEvent('error', { error: new Error('uncaught boom') }));
    expect(beacon).toHaveBeenCalledOnce();
    const payload = JSON.parse(beacon.mock.calls[0][1]) as { message: string; source: string };
    expect(payload.message).toBe('uncaught boom');
    expect(payload.source).toBe('window.error');
  });
});
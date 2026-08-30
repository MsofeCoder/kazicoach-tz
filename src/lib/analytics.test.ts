import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ init: vi.fn(), capture: vi.fn() }));

vi.mock('posthog-js', () => ({
  default: { init: mocks.init, capture: mocks.capture },
}));

describe('privacy-safe analytics', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    mocks.init.mockReset();
    mocks.capture.mockReset();
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('is a complete no-op when no PostHog key is configured', async () => {
    vi.stubEnv('VITE_PUBLIC_POSTHOG_KEY', '');
    const analytics = await import('./analytics');
    await analytics.initAnalytics();
    expect(mocks.init).not.toHaveBeenCalled();
    analytics.track('practice_started', { mode: 'oral' });
    analytics.trackPageView('dashboard');
    expect(mocks.capture).not.toHaveBeenCalled();
  });

  it('initializes only with a key and captures sanitized events', async () => {
    vi.stubEnv('VITE_PUBLIC_POSTHOG_KEY', 'phc_mock');
    vi.stubEnv('VITE_PUBLIC_POSTHOG_HOST', 'https://eu.i.posthog.com');
    const analytics = await import('./analytics');
    await analytics.initAnalytics();
    expect(mocks.init).toHaveBeenCalledTimes(1);
    const [key, options] = mocks.init.mock.calls[0] as [string, Record<string, unknown>];
    expect(key).toBe('phc_mock');
    expect(options.api_host).toBe('https://eu.i.posthog.com');
    expect(options.person_profiles).toBe('never');
    expect(options.autocapture).toBe(false);
    expect(options.persistence).toBe('memory');

    analytics.track('practice_attempt_completed', { mode: 'oral', score: 72 });
    expect(mocks.capture).toHaveBeenCalledTimes(1);
    const [eventName, properties] = mocks.capture.mock.calls[0] as [string, Record<string, unknown>];
    expect(eventName).toBe('practice_attempt_completed');
    expect(properties.score).toBe(72);

    analytics.trackPageView('practice');
    expect(mocks.capture.mock.calls[1][0]).toBe('$pageview');
  });

  it('initializes exactly once even when called repeatedly', async () => {
    vi.stubEnv('VITE_PUBLIC_POSTHOG_KEY', 'phc_mock');
    const analytics = await import('./analytics');
    await analytics.initAnalytics();
    await analytics.initAnalytics();
    expect(mocks.init).toHaveBeenCalledTimes(1);
  });

  it('never lets an analytics failure break the app', async () => {
    vi.stubEnv('VITE_PUBLIC_POSTHOG_KEY', 'phc_mock');
    mocks.capture.mockImplementation(() => {
      throw new Error('analytics transport failed');
    });
    const analytics = await import('./analytics');
    await analytics.initAnalytics();
    expect(() => analytics.track('anything', {})).not.toThrow();
  });
});
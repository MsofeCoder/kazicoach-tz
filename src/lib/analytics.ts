/**
 * Optional, privacy-safe usage analytics for KaziCoach TZ.
 *
 * The product is privacy-first: no user content (name, role, job description,
 * CV, letters, notes, answers) is ever sent to analytics. When the site owner
 * configures `VITE_PUBLIC_POSTHOG_KEY`, ONLY anonymous product events go to the
 * configured PostHog project:
 *   - No person profiles, no cookies, no cross-session identity
 *     (`person_profiles: 'never'`, `persistence: 'memory'`).
 *   - No autocapture, no session recording, no page-leave beacons.
 *   - The posthog-js bundle is only downloaded when a key is configured.
 * Without a configuration key this module is a complete no-op and the app
 * behaves exactly as it does today (no tracking).
 */
import type { PostHog } from 'posthog-js';

let posthog: PostHog | null = null;
let initStarted = false;
let sessionStart = 0;

export const analyticsConfig = {
  get key(): string | undefined {
    return (import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined) || undefined;
  },
  get host(): string {
    return (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com';
  },
  get configured(): boolean {
    return Boolean(analyticsConfig.key);
  },
};

export async function initAnalytics(): Promise<void> {
  if (initStarted || typeof window === 'undefined') return;
  initStarted = true;
  const key = analyticsConfig.key;
  if (!key) return;
  sessionStart = Date.now();
  try {
    const module = await import('posthog-js');
    posthog = module.default;
    posthog.init(key, {
      api_host: analyticsConfig.host,
      person_profiles: 'never',
      capture_pageview: false,
      capture_pageleave: false,
      autocapture: false,
      disable_session_recording: true,
      advanced_disable_decide: true,
      persistence: 'memory',
    });
    track('app_loaded', { timestamp: new Date().toISOString() });
  } catch {
    posthog = null;
  }
}

/** Send an anonymous product event. Properties must NEVER include user content. */
export function track(event: string, properties: Record<string, string | number | boolean> = {}): void {
  if (!posthog) return;
  try {
    posthog.capture(event, properties);
  } catch {
    // Analytics must never break the app.
  }
}

/** Anonymous page-view event (view id only, never a route with user input). */
export function trackPageView(view: string): void {
  track('$pageview', { page: view });
}

/** Track a feature interaction. Never include user content. */
export function trackFeature(feature: string, action: string, extra?: Record<string, string | number | boolean>): void {
  track('feature_used', { feature, action, ...extra });
}

/** Track session duration on page unload. */
export function trackSessionEnd(): void {
  if (!sessionStart || !posthog) return;
  const durationSec = Math.round((Date.now() - sessionStart) / 1000);
  track('session_ended', { duration_seconds: durationSec });
}

/** Check if PostHog is connected and return status. */
export function getAnalyticsStatus(): { configured: boolean; connected: boolean; host: string } {
  return {
    configured: analyticsConfig.configured,
    connected: Boolean(posthog),
    host: analyticsConfig.host,
  };
}
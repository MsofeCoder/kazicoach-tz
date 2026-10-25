import { describe, expect, it } from 'vitest';
import { guideKey, guideSteps, rememberGuide, shouldOfferGuide, spotlightBounds } from './onboarding';

describe('first-use guide privacy and recovery boundaries', () => {
  const storage = (values: Record<string, string> = {}) => ({ getItem: (key: string) => values[key] ?? null });
  it('offers new browsers a guide without requiring an account', () => {
    expect(shouldOfferGuide(storage(), '')).toBe(true);
  });
  it('does not interrupt an existing private workspace or a dismissed guide', () => {
    expect(shouldOfferGuide(storage({ 'kazicoach-tz:v1': '{}' }), '')).toBe(false);
    expect(shouldOfferGuide(storage({ [guideKey]: 'seen' }), '')).toBe(false);
  });
  it.each(['?kc_auth=1&code=secret', '?kc_recovery=1', '?code=secret'])('does not obscure an account callback %s', search => {
    expect(shouldOfferGuide(storage(), search)).toBe(false);
  });
  it('persists only a separate non-sensitive dismissal marker', () => {
    const writes: Array<[string, string]> = [];
    rememberGuide({ setItem: (key, value) => { writes.push([key, value]); } });
    expect(writes).toEqual([[guideKey, 'seen']]);
  });
  it('tolerates unavailable browser storage', () => {
    expect(shouldOfferGuide({ getItem: () => { throw Error('blocked'); } }, '')).toBe(false);
    expect(() => rememberGuide({ setItem: () => { throw Error('blocked'); } })).not.toThrow();
  });
});

describe('real-page tour spotlight', () => {
  const card = { left: 800, right: 1210, top: 400, bottom: 872 };
  it('keeps a wide target clear of the explanation card', () => {
    expect(spotlightBounds({ left: 280, right: 1200, top: 100, bottom: 650 }, card, 1280, 900))
      .toEqual({ left: 272, top: 92, width: 510, height: 566 });
  });
  it('preserves the full target when it is beside the card', () => {
    expect(spotlightBounds({ left: 280, right: 700, top: 100, bottom: 650 }, card, 1280, 900)?.height).toBe(566);
  });
  it('clips mobile highlights to the viewport and above the bottom sheet', () => {
    expect(spotlightBounds({ left: 14, right: 346, top: 96, bottom: 700 }, { left: 12, right: 348, top: 370, bottom: 788 }, 360, 800))
      .toEqual({ left: 8, top: 88, width: 344, height: 264 });
  });
  it('hides offscreen targets instead of painting a misleading highlight', () => {
    expect(spotlightBounds({ left: 280, right: 700, top: -600, bottom: -100 }, card, 1280, 900)).toBeNull();
  });
  it('has distinct stable targets across every workspace page', () => {
    expect(new Set(guideSteps.map(step => step.target)).size).toBe(guideSteps.length);
    expect(new Set(guideSteps.map(step => step.view))).toEqual(new Set(['dashboard', 'materials', 'practice', 'progress', 'settings']));
  });
});

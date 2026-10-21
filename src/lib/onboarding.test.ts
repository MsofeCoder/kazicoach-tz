import { describe, expect, it } from 'vitest';
import { guideKey, rememberGuide, shouldOfferGuide } from './onboarding';

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

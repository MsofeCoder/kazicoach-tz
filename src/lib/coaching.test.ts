import { describe, expect, it } from 'vitest';
import { realisticCoachNote } from './coaching';

describe('realisticCoachNote', () => {
  it('does not treat a weak attempt as a hiring prediction', () => {
    const note = realisticCoachNote(32, ['inspection scope', 'objective evidence']);
    expect(note.message).toContain('not a prediction');
    expect(note.message).toContain('inspection scope');
  });

  it('tells a strong candidate to improve delivery rather than add facts', () => {
    const note = realisticCoachNote(90, []);
    expect(note.title).toContain('delivery');
    expect(note.message).toContain('Do not add more facts');
  });
});

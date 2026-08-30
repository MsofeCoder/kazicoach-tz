import { describe, expect, it } from 'vitest';
import { calculateReadiness, scoreAnswer } from './scoring';
import type { OralQuestion } from '../types';

const question: OralQuestion = {
  id: 'test', category: 'technical', difficulty: 'Core', timeLimit: 90,
  question: 'Explain ALARA', swHint: '', modelAnswer: '', source: '',
  keyPoints: ['Meaning', 'Time', 'Distance', 'Shielding'],
  keywords: [['as low as reasonably achievable', 'alara'], ['time'], ['distance'], ['shielding', 'shield']],
};

describe('scoreAnswer', () => {
  it('returns zero and all missing concepts for an empty answer', () => {
    const result = scoreAnswer(question, '');
    expect(result.score).toBe(0);
    expect(result.missed).toHaveLength(4);
  });

  it('rewards covered concepts and useful structure', () => {
    const answer = 'ALARA means as low as reasonably achievable. First, I reduce time. Second, I increase distance. Finally, I use shielding. I would verify these controls during an inspection because written procedures alone are not enough.';
    const result = scoreAnswer(question, answer);
    expect(result.matched).toHaveLength(4);
    expect(result.conceptScore).toBe(65);
    expect(result.score).toBeGreaterThan(75);
  });
});

describe('calculateReadiness', () => {
  it('uses a safe baseline with no attempts', () => expect(calculateReadiness([])).toBe(18));
  it('increases with completed strong attempts', () => expect(calculateReadiness([80, 85, 90])).toBeGreaterThan(70));
});

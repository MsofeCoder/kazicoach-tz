import { describe, expect, it } from 'vitest';
import { memoryAids, oralQuestions, panelMemberForQuestion, panelMembers, writtenQuestions } from './data';

describe('Radiation-safety reference role pack', () => {
  it('ships the expanded oral and written banks with unique ids', () => {
    expect(oralQuestions.length).toBeGreaterThanOrEqual(33);
    expect(writtenQuestions.length).toBeGreaterThanOrEqual(15);
    const ids = [...oralQuestions, ...writtenQuestions].map(item => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps scoring concepts aligned with keyword groups', () => {
    oralQuestions.forEach(question => expect(question.keywords.length).toBe(question.keyPoints.length));
  });

  it('provides exactly five points in each authored mnemonic', () => {
    Object.values(memoryAids).forEach(aid => expect(aid.points).toHaveLength(5));
  });

  it('uses only members from the five-person panel', () => {
    oralQuestions.forEach((question, index) => {
      expect(panelMembers).toContain(panelMemberForQuestion(question.category, index));
    });
  });
});

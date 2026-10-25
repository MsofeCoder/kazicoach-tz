import { describe, expect, it } from 'vitest';
import { memoryAids, oralQuestions, panelMemberForQuestion, panelMembers, writtenQuestions } from './data';

describe('Public coaching role pack', () => {
  it('ships the expanded oral and written banks with unique ids', () => {
    expect(oralQuestions.length).toBeGreaterThanOrEqual(33);
    expect(writtenQuestions.length).toBeGreaterThanOrEqual(15);
    const ids = [...oralQuestions, ...writtenQuestions].map(item => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps scoring concepts aligned with keyword groups', () => {
    oralQuestions.forEach(question => expect(question.keywords.length).toBe(question.keyPoints.length));
  });

  it('keeps written prompts distinct from oral prompts and answer keys valid', () => {
    const oralPrompts = new Set(oralQuestions.map(question => question.question.trim()));
    writtenQuestions.forEach(question => {
      expect(oralPrompts.has(question.question.trim()), question.id).toBe(false);
      expect(new Set(question.options).size, question.id).toBe(question.options.length);
      expect(question.correctIndex, question.id).toBeGreaterThanOrEqual(0);
      expect(question.correctIndex, question.id).toBeLessThan(question.options.length);
      expect(Number.isInteger(question.correctIndex), question.id).toBe(true);
    });
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

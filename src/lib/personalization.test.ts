import { describe, expect, it } from 'vitest';
import { oralBankFor, writtenBankFor } from './personalization';
import { testSamples } from '../samples';
import type { CandidateProfile, Material } from '../types';

const profileFrom = (index: number): CandidateProfile => ({
  ...testSamples[index].profile,
  id: `test-${index}`,
  createdAt: new Date(0).toISOString(),
});

const materialsFrom = (index: number): Material[] => {
  const sample = testSamples[index];
  return [
    { id: 'job', name: 'job.txt', kind: 'job', mime: 'text/plain', size: sample.jobDescription.length, extractedText: sample.jobDescription, status: 'ready', addedAt: new Date(0).toISOString() },
    { id: 'cv', name: 'cv.txt', kind: 'cv', mime: 'text/plain', size: sample.cv.length, extractedText: sample.cv, status: 'ready', addedAt: new Date(0).toISOString() },
  ];
};

describe('private role personalization', () => {
  it('personalizes generic questions to the active user and job', () => {
    const profile = profileFrom(1);
    const questions = oralBankFor(profile, materialsFrom(1), []);
    expect(questions[0].question).toContain('Human Resource Officer II');
    expect(questions[0].modelAnswer).toContain('Neema John');
    expect(writtenBankFor(profile)[1].question).toContain('Human Resource Officer II');
  });

  it('adds the specialist reference pack only for a matching role', () => {
    expect(oralBankFor(profileFrom(0), materialsFrom(0), []).length).toBeGreaterThan(30);
    expect(oralBankFor(profileFrom(2), materialsFrom(2), []).length).toBe(10);
  });

  it('ships three complete fictional test samples', () => {
    expect(testSamples).toHaveLength(3);
    testSamples.forEach(sample => {
      expect(sample.profile.name.length).toBeGreaterThan(3);
      expect(sample.profile.jobPosition.length).toBeGreaterThan(3);
      expect(sample.jobDescription.length).toBeGreaterThan(100);
      expect(sample.cv.length).toBeGreaterThan(100);
      expect(sample.applicationLetter.length).toBeGreaterThan(100);
      expect(sample.notes.length).toBeGreaterThan(100);
    });
  });
});

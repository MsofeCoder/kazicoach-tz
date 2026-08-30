// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { mergeBackup, shouldSuggestBackup, workspaceItemCount } from './backup';
import { defaultState } from './storage';
import type { AppState, Attempt } from '../types';

function attempt(index: number): Attempt {
  return {
    id: `attempt-${index}`, questionId: `q-${index}`, category: 'technical', mode: 'oral',
    answer: 'A reasonable answer.', score: 70, matched: ['a'], missed: ['b'],
    createdAt: '2026-08-10T08:00:00.000Z', durationSeconds: 45,
  };
}

const withProfile: AppState = {
  ...defaultState,
  version: 3,
  profile: {
    id: 'p1', name: 'Asha Mwakalinga', jobPosition: 'Radiation Safety Inspector II',
    organization: 'TAEC', interviewDate: '2026-09-10', createdAt: '2026-08-01T08:00:00.000Z',
  },
};

const sampleMaterial = {
  id: 'mat-1', name: 'notes.txt', kind: 'notes' as const, mime: 'text/plain', size: 400,
  extractedText: 'Long enough study notes.', status: 'ready' as const, addedAt: '2026-08-02T08:00:00.000Z',
};

describe('mergeBackup', () => {
  it('restores the profile, preferences and capped collections over a fresh state', () => {
    const snapshot: Partial<AppState> = {
      profile: withProfile.profile,
      attempts: Array.from({ length: 340 }, (_, index) => attempt(index)),
      materials: withProfile.materials,
      customQuestions: withProfile.customQuestions,
      preferences: { ...defaultState.preferences, voiceStyle: 'deep' },
    };
    const merged = mergeBackup(snapshot, defaultState);
    expect(merged.profile?.name).toBe('Asha Mwakalinga');
    expect(merged.preferences.voiceStyle).toBe('deep');
    expect(merged.preferences.swahiliCoach).toBe(true);
    expect(merged.attempts).toHaveLength(300);
    expect(merged.materials).toHaveLength(0);
  });

  it('keeps the fallback arrays when the snapshot is malformed', () => {
    const fallback: AppState = { ...withProfile, attempts: [attempt(1)] };
    const merged = mergeBackup({ attempts: 'bad' as unknown as AppState['attempts'] }, fallback);
    expect(merged.attempts).toHaveLength(1);
    expect(merged.profile).toEqual(fallback.profile);
  });
});

describe('shouldSuggestBackup', () => {
  it('never nudges an empty workspace', () => {
    expect(shouldSuggestBackup(defaultState)).toBe(false);
  });

  it('nudges once there is content and no export has happened', () => {
    expect(shouldSuggestBackup({ ...withProfile, attempts: [attempt(1)] })).toBe(true);
  });

  it('stays quiet within a week of the last export', () => {
    const now = new Date('2026-08-14T08:00:00.000Z');
    expect(shouldSuggestBackup({ ...withProfile, attempts: [attempt(1)], lastExportAt: '2026-08-10T08:00:00.000Z' }, now)).toBe(false);
  });

  it('nudges again after a week', () => {
    const now = new Date('2026-08-18T08:00:00.000Z');
    expect(shouldSuggestBackup({ ...withProfile, attempts: [attempt(1)], lastExportAt: '2026-08-10T08:00:00.000Z' }, now)).toBe(true);
  });

  it('treats a corrupted export stamp as due', () => {
    expect(shouldSuggestBackup({ ...withProfile, materials: [sampleMaterial], lastExportAt: 'not-a-date' })).toBe(true);
  });
});

describe('workspaceItemCount', () => {
  it('adds attempts, materials and custom questions', () => {
    expect(workspaceItemCount({ ...withProfile, attempts: [attempt(1)], materials: [sampleMaterial] })).toBe(2);
  });
});

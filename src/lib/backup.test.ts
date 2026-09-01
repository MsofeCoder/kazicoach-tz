// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { mergeBackup, shouldSuggestBackup, workspaceItemCount } from './backup';
import { defaultState } from './storage';
import type { AppState, Attempt, Workspace } from '../types';

function attempt(index: number): Attempt {
  return {
    id: `attempt-${index}`, questionId: `q-${index}`, category: 'technical', mode: 'oral',
    answer: 'A reasonable answer.', score: 70, matched: ['a'], missed: ['b'],
    createdAt: '2026-08-10T08:00:00.000Z', durationSeconds: 45,
  };
}

function makeWorkspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: `ws-${Math.random().toString(36).slice(2, 8)}`,
    profile: {
      id: 'p1', name: 'Asha Mwakalinga', jobPosition: 'Radiation Safety Inspector II',
      organization: 'TAEC', interviewDate: '2026-09-10', createdAt: '2026-08-01T08:00:00.000Z',
    },
    materials: [],
    customQuestions: [],
    attempts: [],
    createdAt: '2026-08-01T08:00:00.000Z',
    ...overrides,
  };
}

const withWorkspace: AppState = {
  ...defaultState,
  workspaces: [makeWorkspace()],
  activeWorkspaceId: 'ws-1',
};

const sampleMaterial = {
  id: 'mat-1', name: 'notes.txt', kind: 'notes' as const, mime: 'text/plain', size: 400,
  extractedText: 'Long enough study notes.', status: 'ready' as const, addedAt: '2026-08-02T08:00:00.000Z',
};

describe('mergeBackup', () => {
  it('restores the profile, preferences and capped collections over a fresh state', () => {
    const ws = makeWorkspace({ attempts: Array.from({ length: 340 }, (_, index) => attempt(index)) });
    const snapshot: Partial<AppState> = {
      workspaces: [ws],
      activeWorkspaceId: ws.id,
      preferences: { ...defaultState.preferences, voiceStyle: 'deep' },
    };
    const merged = mergeBackup(snapshot, defaultState);
    expect(merged.workspaces[0]?.profile.name).toBe('Asha Mwakalinga');
    expect(merged.preferences.voiceStyle).toBe('deep');
    expect(merged.preferences.swahiliCoach).toBe(true);
    expect(merged.workspaces[0]?.attempts).toHaveLength(300);
    expect(merged.workspaces[0]?.materials).toHaveLength(0);
  });

  it('converts old v3 format with top-level profile into a workspace', () => {
    const snapshot = {
      version: 3,
      profile: {
        id: 'p1', name: 'Test User', jobPosition: 'ICT Officer',
        organization: 'Ministry', interviewDate: '2026-10-01', createdAt: '2026-08-01T08:00:00.000Z',
      },
      attempts: [attempt(1)],
      materials: [sampleMaterial],
      customQuestions: [],
    } as unknown as Partial<AppState>;
    const merged = mergeBackup(snapshot, defaultState);
    expect(merged.workspaces).toHaveLength(1);
    expect(merged.workspaces[0]?.profile.name).toBe('Test User');
    expect(merged.workspaces[0]?.attempts).toHaveLength(1);
    expect(merged.workspaces[0]?.materials).toHaveLength(1);
  });

  it('keeps the fallback arrays when the snapshot is malformed', () => {
    const fallback: AppState = { ...withWorkspace };
    const merged = mergeBackup({ workspaces: 'bad' as unknown as Workspace[] }, fallback);
    expect(merged.workspaces).toHaveLength(1);
  });
});

describe('shouldSuggestBackup', () => {
  it('never nudges an empty workspace', () => {
    expect(shouldSuggestBackup(defaultState)).toBe(false);
  });

  it('nudges once there is content and no export has happened', () => {
    const ws = makeWorkspace({ attempts: [attempt(1)] });
    expect(shouldSuggestBackup({ ...withWorkspace, workspaces: [ws] })).toBe(true);
  });

  it('stays quiet within a week of the last export', () => {
    const now = new Date('2026-08-14T08:00:00.000Z');
    const ws = makeWorkspace({ attempts: [attempt(1)] });
    expect(shouldSuggestBackup({ ...withWorkspace, workspaces: [ws], lastExportAt: '2026-08-10T08:00:00.000Z' }, now)).toBe(false);
  });

  it('nudges again after a week', () => {
    const now = new Date('2026-08-18T08:00:00.000Z');
    const ws = makeWorkspace({ attempts: [attempt(1)] });
    expect(shouldSuggestBackup({ ...withWorkspace, workspaces: [ws], lastExportAt: '2026-08-10T08:00:00.000Z' }, now)).toBe(true);
  });

  it('treats a corrupted export stamp as due', () => {
    const ws = makeWorkspace({ materials: [sampleMaterial] });
    expect(shouldSuggestBackup({ ...withWorkspace, workspaces: [ws], lastExportAt: 'not-a-date' })).toBe(true);
  });
});

describe('workspaceItemCount', () => {
  it('adds attempts, materials and custom questions across workspaces', () => {
    const ws1 = makeWorkspace({ attempts: [attempt(1)], materials: [sampleMaterial] });
    const ws2 = makeWorkspace({ attempts: [attempt(2), attempt(3)] });
    expect(workspaceItemCount({ ...withWorkspace, workspaces: [ws1, ws2] })).toBe(4);
  });
});

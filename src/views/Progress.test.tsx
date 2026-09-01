import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../App';
import { AppProvider } from '../context';
import { defaultState } from '../lib/storage';
import type { AppState, Attempt, Workspace } from '../types';

const STORAGE_KEY = 'kazicoach-tz:v1';

function makeAttempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    id: 'attempt-1', questionId: 'written-1', category: 'role', mode: 'written',
    answer: 'Time, distance and shielding keep exposure as low as reasonably achievable.',
    score: 72, matched: ['time'], missed: ['shielding'],
    createdAt: '2026-08-20T10:00:00.000Z', durationSeconds: 65, ...overrides,
  };
}

function makeWorkspace(): Workspace {
  return {
    id: 'ws-test-1',
    profile: {
      id: 'profile-1', name: 'Asha Mwakalinga', jobPosition: 'Radiation Safety Inspector II',
      organization: 'Tanzania Atomic Energy Commission', interviewDate: '2026-09-10',
      createdAt: '2026-08-01T08:00:00.000Z',
    },
    materials: [],
    customQuestions: [],
    attempts: [],
    createdAt: '2026-08-01T08:00:00.000Z',
  };
}

function seedState(overrides: Partial<AppState> = {}, wsOverrides: Partial<Workspace> = {}) {
  const ws = { ...makeWorkspace(), ...wsOverrides };
  const state: AppState = {
    ...defaultState,
    workspaces: [ws],
    activeWorkspaceId: ws.id,
    ...overrides,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(cleanup);

describe('Progress', () => {
  it('shows the empty history state before the first attempt', async () => {
    seedState();
    render(<AppProvider><App /></AppProvider>);
    await userEvent.click(screen.getByRole('button', { name: /^Progress/i }));
    expect(screen.getByText('No attempts yet')).toBeInTheDocument();
    expect(screen.getByText(/Start with the advertised inspector duties/i)).toBeInTheDocument();
  });

  it('lists recent attempts and recurring missed concepts after practice', async () => {
    seedState({
      xp: 120, streak: 2,
    }, {
      attempts: [
        makeAttempt(),
        makeAttempt({ id: 'attempt-2', questionId: 'oral-role-2', mode: 'oral', score: 45, missed: ['shielding', 'dosimetry'] }),
      ],
    });
    render(<AppProvider><App /></AppProvider>);
    await userEvent.click(screen.getByRole('button', { name: /^Progress/i }));
    expect(screen.getByText(/Written knowledge check/i)).toBeInTheDocument();
    expect(screen.getByText(/1×/)).toBeInTheDocument();
    expect(screen.getByText(/Shielding/i)).toBeInTheDocument();
    expect(screen.getByText(/1 \/ 4 unlocked/i)).toBeInTheDocument();
  });
});

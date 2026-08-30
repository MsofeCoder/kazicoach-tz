import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../App';
import { AppProvider } from '../context';
import { defaultState } from '../lib/storage';
import type { AppState } from '../types';

const STORAGE_KEY = 'kazicoach-tz:v1';

function seedState(overrides: Partial<AppState> = {}) {
  const state: AppState = {
    ...defaultState,
    profile: {
      id: 'profile-1', name: 'Asha Mwakalinga', jobPosition: 'Radiation Safety Inspector II',
      organization: 'Tanzania Atomic Energy Commission', interviewDate: '2026-09-10',
      createdAt: '2026-08-01T08:00:00.000Z',
    },
    ...overrides,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(cleanup);

describe('Dashboard', () => {
  it('greets the candidate and shows the mission, countdown and quick actions', async () => {
    seedState();
    render(<AppProvider><App /></AppProvider>);
    expect(screen.getByText(/Habari, Asha/i)).toBeInTheDocument();
    expect(screen.getByText(/Your 15-minute mission/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start mission/i })).toBeInTheDocument();
    expect(screen.getByText(/Interview date/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Take a written quick test/i })).toBeInTheDocument();
  });

  it('starts an oral practice run from the mission card', async () => {
    seedState();
    render(<AppProvider><App /></AppProvider>);
    await userEvent.click(screen.getByRole('button', { name: /Start mission/i }));
    expect(await screen.findByText(/Question 1 of/i)).toBeInTheDocument();
  });

  it('renders the coverage map for all five focus areas', () => {
    seedState();
    render(<AppProvider><App /></AppProvider>);
    for (const area of [/Personal fit/i, /Role & law/i, /Technical/i, /Scenarios/i, /Ethics/i]) {
      expect(screen.getAllByText(area).length).toBeGreaterThan(0);
    }
  });
});
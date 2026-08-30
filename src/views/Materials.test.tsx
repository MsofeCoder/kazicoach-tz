import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { AppProvider } from '../context';
import { defaultState } from '../lib/storage';
import type { AppState } from '../types';

const STORAGE_KEY = 'kazicoach-tz:v1';

const longNotes = [
  'Radiation safety inspections begin with a clear scope agreed between the inspector and the facility radiation protection officer before any measurements start.',
  'Objective evidence is collected through direct observation of work practices, review of monitoring records and interviews with the workers who use the sources daily.',
  'Every inspection report must separate facts from opinions so that the regulated facility can act on each finding without guessing what was actually observed on site.',
].join(' ');

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
  vi.restoreAllMocks();
  // The AI route config probe must never hit a network in tests.
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ configured: false, turnstile: false, siteKey: null }), { status: 200 })));
});

afterEach(cleanup);

describe('Materials workspace', () => {
  it('creates local practice cards from the selected source without leaving the device', async () => {
    seedState({
      materials: [{
        id: 'mat-1', name: 'Study notes.txt', kind: 'notes', mime: 'text/plain', size: 500,
        extractedText: longNotes, status: 'ready', addedAt: '2026-08-02T08:00:00.000Z',
      }],
    });
    render(<AppProvider><App /></AppProvider>);
    await userEvent.click(screen.getByRole('button', { name: /^Materials/ }));
    // The name appears in the library row and in the generator summary.
    expect(screen.getAllByText('Study notes.txt').length).toBeGreaterThan(0);
    expect(screen.getByText(/Selected:/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Create locally/i }));
    expect(await screen.findByText(/local practice cards created/i)).toBeInTheDocument();
  });

  it('keeps the AI button unusable until a source is selected', async () => {
    seedState();
    render(<AppProvider><App /></AppProvider>);
    await userEvent.click(screen.getByRole('button', { name: /^Materials/ }));
    expect(screen.getByRole('button', { name: /Create with AI/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Create locally/i })).toBeDisabled();
  });

  it('shows the empty library state when no material exists', async () => {
    seedState();
    render(<AppProvider><App /></AppProvider>);
    await userEvent.click(screen.getByRole('button', { name: /^Materials/ }));
    expect(screen.getByText('Your private files will appear here.')).toBeInTheDocument();
  });
});

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
  vi.restoreAllMocks();
  // jsdom does not implement object URLs; the export flow needs them.
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:mock') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
});

afterEach(cleanup);

describe('Settings', () => {
  it('shows preferences, AI configuration guidance and local data summary', async () => {
    seedState({ xp: 90, attempts: [], materials: [], customQuestions: [] });
    render(<AppProvider><App /></AppProvider>);
    await userEvent.click(screen.getByRole('button', { name: /^Settings/i }));
    expect(screen.getByRole('heading', { name: /Coaching preferences/i })).toBeInTheDocument();
    expect(screen.getByText(/GEMINI_API_KEY=••••••••/)).toBeInTheDocument();
    expect(screen.getByText('No JSON export yet. An automatic IndexedDB mirror updates after every answer, but a downloaded copy is the strongest backup.')).toBeInTheDocument();
  });

  it('exports the workspace as JSON and records the export time', async () => {
    seedState({ xp: 90 });
    render(<AppProvider><App /></AppProvider>);
    await userEvent.click(screen.getByRole('button', { name: /^Settings/i }));
    await userEvent.click(screen.getByRole('button', { name: /Export JSON/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/Progress export downloaded/i);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as AppState;
    expect(stored.lastExportAt).toBeTruthy();
  });

  it('refuses to delete the workspace when the confirmation is cancelled', async () => {
    seedState({ xp: 90 });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<AppProvider><App /></AppProvider>);
    await userEvent.click(screen.getByRole('button', { name: /^Settings/i }));
    await userEvent.click(screen.getByRole('button', { name: /Delete workspace & start new/i }));
    expect(confirmSpy).toHaveBeenCalledOnce();
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as AppState;
    expect(stored.profile).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
  });
});
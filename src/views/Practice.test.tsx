import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppProvider } from '../context';
import { defaultState } from '../lib/storage';
import Practice from './Practice';
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

describe('Practice room', () => {
  it('renders the oral panel question', () => {
    seedState();
    render(<AppProvider><Practice /></AppProvider>);
    expect(screen.getByText(/Question 1 of/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hear the panel ask/i })).toBeInTheDocument();
  });

  it('scores a typed oral answer and shows coach feedback', { timeout: 20_000 }, async () => {
    seedState();
    render(<AppProvider><Practice /></AppProvider>);
    const answer = screen.getByLabelText(/Transcript \/ typed answer/i);
    await userEvent.type(answer, 'ALARA means as low as reasonably achievable. First, I reduce time. Second, I increase distance. Finally, I use shielding. I would verify these controls during an inspection because written procedures alone are not enough.');
    await userEvent.click(screen.getByRole('button', { name: /Get my feedback/i }));
    expect(screen.getByText(/Coach feedback/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your answer/i)).toBeInTheDocument();
  });

  it('refuses to score an empty answer', async () => {
    seedState();
    render(<AppProvider><Practice /></AppProvider>);
    await userEvent.click(screen.getByRole('button', { name: /Get my feedback/i }));
    expect(screen.queryByText(/Coach feedback/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Transcript \/ typed answer/i)).toBeInTheDocument();
  });

  it('runs the written drill: select, check and see the explanation', async () => {
    seedState();
    const { container } = render(<AppProvider><Practice /></AppProvider>);
    await userEvent.click(screen.getByRole('button', { name: /Written test/i }));
    const option = container.querySelector<HTMLButtonElement>('.option-list button');
    expect(option).not.toBeNull();
    await userEvent.click(option as HTMLButtonElement);
    await userEvent.click(screen.getByRole('button', { name: /Check answer/i }));
    expect(screen.getByText(/well done\.|Not quite — learn the reason\./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next question|View session result/i })).toBeInTheDocument();
  });
});

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../App';
import { AppProvider } from '../context';

beforeEach(() => {
  localStorage.clear();
});

afterEach(cleanup);

describe('Onboarding', () => {
  it('shows the private setup form and fictional sample panel when no profile exists', () => {
    render(<AppProvider><App /></AppProvider>);
    expect(screen.getByText('Create my private practice')).toBeInTheDocument();
    expect(screen.getByText(/Load fictional sample data/i)).toBeInTheDocument();
    expect(screen.getByText(/No document leaves this browser during setup/i)).toBeInTheDocument();
  });

  it('blocks submission until the required fields are filled', async () => {
    render(<AppProvider><App /></AppProvider>);
    await userEvent.click(screen.getByRole('button', { name: /Create my private practice/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Enter the candidate name/i);
  });

  it('enforces a meaningful job description', async () => {
    render(<AppProvider><App /></AppProvider>);
    await userEvent.type(screen.getByPlaceholderText('Example: Asha Mrema'), 'Baraka Mushi');
    await userEvent.type(screen.getByPlaceholderText('Example: Human Resource Officer II'), 'ICT Officer II');
    await userEvent.type(screen.getByPlaceholderText(/Paste the advertised duties/i), 'Too short.');
    await userEvent.click(screen.getByRole('button', { name: /Create my private practice/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/at least a short job description/i);
  });

  it('completes onboarding from a fictional sample and lands on the dashboard', async () => {
    render(<AppProvider><App /></AppProvider>);
    await userEvent.click(screen.getByRole('button', { name: /Radiation Safety Inspector II/i }));
    await userEvent.click(screen.getByRole('button', { name: /Create my private practice/i }));
    expect(await screen.findByText(/Habari, Asha/i)).toBeInTheDocument();
    expect(screen.getByText(/Your 15-minute mission/i)).toBeInTheDocument();
    // The workspace is live, so the setup screen must not come back.
    expect(screen.queryByText(/Load fictional sample data/i)).not.toBeInTheDocument();
  });
});
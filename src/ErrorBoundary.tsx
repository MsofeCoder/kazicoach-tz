import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { reportError } from './lib/error-report';

interface Props { children: ReactNode }
interface State { failed: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Minimal, privacy-safe report (no CV text or answers). In production this
    // posts to /api/log-error; in development it logs to the console.
    reportError(error, 'error-boundary', info.componentStack ?? undefined);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="fatal-error" role="alert">
        <span><AlertTriangle size={30} /></span>
        <h1>Something did not load correctly.</h1>
        <p>Your local preparation data has not been deleted. Reload the application and continue.</p>
        <button className="button primary" onClick={() => window.location.reload()}><RefreshCw size={17} /> Reload KaziCoach</button>
      </main>
    );
  }
}

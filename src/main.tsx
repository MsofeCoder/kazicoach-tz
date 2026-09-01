import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import { AppProvider } from './context';
import { installGlobalErrorHandlers } from './lib/error-report';
import { initAnalytics, trackSessionEnd } from './lib/analytics';
import './styles.css';

installGlobalErrorHandlers();
void initAnalytics();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', trackSessionEnd);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') trackSessionEnd();
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            newWorker.postMessage('skip-waiting');
          }
        });
      });
    }).catch(() => undefined);
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  });
}

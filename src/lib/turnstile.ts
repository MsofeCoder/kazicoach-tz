/**
 * Client-side helper for the optional Cloudflare Turnstile gate on /api/generate.
 * The server decides (via GET /api/generate) whether a human check is required;
 * only then is the Turnstile script loaded and an explicit-render widget shown.
 */

export interface AiConfig {
  configured: boolean;
  turnstile: boolean;
  siteKey: string | null;
}

interface TurnstileWidgetOptions {
  sitekey: string;
  callback: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
}

interface TurnstileApi {
  render: (element: HTMLElement, options: TurnstileWidgetOptions) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loader: Promise<TurnstileApi | null> | null = null;

export async function fetchAiConfig(): Promise<AiConfig | null> {
  try {
    const response = await fetch('/api/generate', { headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    const payload = (await response.json()) as Partial<AiConfig>;
    return {
      configured: Boolean(payload.configured),
      turnstile: Boolean(payload.turnstile),
      siteKey: typeof payload.siteKey === 'string' && payload.siteKey ? payload.siteKey : null,
    };
  } catch {
    return null;
  }
}

export function loadTurnstile(): Promise<TurnstileApi | null> {
  if (typeof document === 'undefined') return Promise.resolve(null);
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!loader) {
    loader = new Promise(resolve => {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = () => resolve(window.turnstile ?? null);
      script.onerror = () => {
        loader = null;
        resolve(null);
      };
      document.head.appendChild(script);
    });
  }
  return loader;
}

export function renderTurnstile(
  container: HTMLElement,
  siteKey: string,
  onToken: (token: string) => void,
  onError: () => void,
): string | null {
  const api = window.turnstile;
  if (!api) return null;
  container.replaceChildren();
  return api.render(container, {
    sitekey: siteKey,
    callback: onToken,
    'error-callback': onError,
    'expired-callback': onError,
  });
}

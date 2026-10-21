export function canonicalHttpsOrigin(value: string | undefined): string | null {
  try {
    const url = new URL(value || '');
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash || !url.hostname.includes('.') || /^(localhost|127\.)/.test(url.hostname)) return null;
    return url.origin;
  } catch { return null; }
}
export function hostedEndpoint(value: string | undefined): string | null {
  const origin = canonicalHttpsOrigin(value);
  return origin && /^[a-z0-9]{20}\.supabase\.co$/.test(new URL(origin).hostname) ? origin : null;
}
export function publishableKey(value: string | undefined): boolean {
  return /^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(value || '');
}
export function securityHeaders(endpoint?: string | null): Record<string,string> {
  const connection = hostedEndpoint(endpoint || undefined);
  return {
    'Content-Security-Policy': `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'${connection ? ` ${connection}` : ''}; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`,
    'X-Content-Type-Options':'nosniff',
    'X-Frame-Options':'DENY',
    'Referrer-Policy':'no-referrer',
    'Permissions-Policy':'camera=(), geolocation=(), microphone=(self)',
    'Strict-Transport-Security':'max-age=31536000',
  };
}

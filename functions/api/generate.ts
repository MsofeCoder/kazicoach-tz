import { rateLimit, type RateLimitStore } from './_rate-limit';

interface Env {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_SITE_KEY?: string;
  RATE_LIMIT_MAX?: string;
  RATE_LIMIT_KV?: RateLimitStore;
}

interface GenerateBody {
  material?: unknown;
  materialName?: unknown;
  role?: unknown;
  organization?: unknown;
  turnstileToken?: unknown;
}

interface GeminiPart {
  text?: string;
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiPart[];
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extra,
  },
});

const clientIp = (request: Request) =>
  request.headers.get('CF-Connecting-IP')
  || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
  || 'unknown';

async function verifyTurnstile(secret: string, token: string, ip: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const form = new FormData();
    form.set('secret', secret);
    form.set('response', token);
    form.set('remoteip', ip);
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

/** Public configuration probe so the client knows whether AI is available and whether a human check is required. */
export const onRequestGet = async ({ env }: { env: Env }) => json({
  configured: Boolean(env.GEMINI_API_KEY),
  turnstile: Boolean(env.TURNSTILE_SECRET_KEY),
  siteKey: env.TURNSTILE_SITE_KEY || null,
});

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  if (!env.GEMINI_API_KEY) return json({ error: 'AI generation is not configured.' }, 503);

  const ip = clientIp(request);
  const limit = await rateLimit(ip, {
    store: env.RATE_LIMIT_KV,
    max: Number(env.RATE_LIMIT_MAX) || undefined,
  });
  if (!limit.allowed) {
    return json({ error: 'Too many AI requests from this connection. Please wait before trying again.' }, 429, {
      'Retry-After': String(limit.retryAfterSeconds),
    });
  }

  const length = Number(request.headers.get('content-length') || 0);
  if (length > 120_000) return json({ error: 'Request is too large.' }, 413);

  let body: GenerateBody;
  try {
    body = await request.json() as GenerateBody;
  } catch {
    return json({ error: 'Invalid JSON request.' }, 400);
  }

  if (env.TURNSTILE_SECRET_KEY) {
    const token = typeof body.turnstileToken === 'string' ? body.turnstileToken.trim() : '';
    const passed = Boolean(token) && await verifyTurnstile(env.TURNSTILE_SECRET_KEY, token, ip);
    if (!passed) {
      return json({ error: 'Security check failed. Complete the verification and try again.', code: 'turnstile' }, 403);
    }
  }

  const material = typeof body.material === 'string' ? body.material.trim().slice(0, 30_000) : '';
  if (material.length < 80) return json({ error: 'More source text is required.' }, 400);
  const role = typeof body.role === 'string' ? body.role.slice(0, 160) : 'Public-service role';
  const organization = typeof body.organization === 'string' ? body.organization.slice(0, 160) : 'Tanzanian public institution';
  const sourceName = typeof body.materialName === 'string' ? body.materialName.slice(0, 160) : 'user material';
  const model = env.GEMINI_MODEL || 'gemini-2.5-flash';


  const systemPrompt = `You create interview-practice cards for a Tanzanian candidate. Use only the supplied source and explicitly identified role context. Do not invent candidate experience, laws, numerical limits, dates, or employer facts. Keep a professional public-service tone. Return ONLY valid JSON with this shape: {"questions":[{"category":"personal|role|technical|scenario|ethics","question":"...","swHint":"one short Kiswahili coaching hint","modelAnswer":"80-150 word answer grounded in the source","keyPoints":["3 to 6 concise concepts"]}]}. Create exactly 5 varied questions. Model answers are coaching drafts and must not claim official endorsement.`;

  const userPrompt = `ROLE: ${role}\nORGANIZATION: ${organization}\nSOURCE NAME: ${sourceName}\n\nSOURCE TEXT:\n${material}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.25, maxOutputTokens: 3500 },
      }),
    });

    if (response.status === 429) return json({ error: 'AI quota is currently busy.' }, 429);
    if (!response.ok) return json({ error: 'AI provider request failed.' }, 502);
    const payload = (await response.json()) as GeminiResponse;
    const text = payload.candidates?.[0]?.content?.parts?.map(part => part.text ?? '').join('') ?? undefined;
    if (typeof text !== 'string') return json({ error: 'AI provider returned no usable content.' }, 502);
    const parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, '')) as { questions?: unknown };
    if (!parsed || !Array.isArray(parsed.questions)) return json({ error: 'AI response did not match the required format.' }, 502);
    return json({ questions: parsed.questions.slice(0, 5) });
  } catch (error) {
    return json({ error: error instanceof Error && error.name === 'AbortError' ? 'AI request timed out.' : 'AI response could not be processed.' }, 502);
  } finally {
    clearTimeout(timeout);
  }
};


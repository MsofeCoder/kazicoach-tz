import { premiumAccess, type AccessEnv } from '../lib/access';
interface Env extends AccessEnv {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  },
});

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  if (!context.env.GEMINI_API_KEY) return json({ error: 'AI generation is not configured.' }, 503);
  const denied=await premiumAccess(context.request,context.env);
  if(denied) return json({error:denied.error},denied.status);

  const length = Number(context.request.headers.get('content-length') || 0);
  if (length > 120_000) return json({ error: 'Request is too large.' }, 413);

  let body: { material?: string; materialName?: string; role?: string; organization?: string };
  try {
    if(!context.request.body) return json({error:'Invalid JSON request.'},400);
    const reader=context.request.body.getReader();
    const chunks:Uint8Array[]=[]; let total=0;
    while(true) {
      const {done,value}=await reader.read(); if(done) break;
      total+=value.byteLength;
      if(total>120_000) {await reader.cancel(); return json({error:'Request is too large.'},413);}
      chunks.push(value);
    }
    const bytes=new Uint8Array(total);let offset=0;
    for(const chunk of chunks) {bytes.set(chunk,offset);offset+=chunk.length;}
    const parsed:unknown=JSON.parse(new TextDecoder().decode(bytes));
    if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)) return json({error:'Invalid JSON request.'},400);
    body=parsed;
  } catch {
    return json({ error: 'Invalid JSON request.' }, 400);
  }

  const material = typeof body.material === 'string' ? body.material.trim().slice(0, 30_000) : '';
  if (material.length < 80) return json({ error: 'More source text is required.' }, 400);
  const role = typeof body.role === 'string' ? body.role.slice(0, 160) : 'Public-service role';
  const organization = typeof body.organization === 'string' ? body.organization.slice(0, 160) : 'Tanzanian public institution';
  const sourceName = typeof body.materialName === 'string' ? body.materialName.slice(0, 160) : 'user material';
  const model = context.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const systemPrompt = `You create interview-practice cards for a Tanzanian candidate. Use only the supplied source and explicitly identified role context. Do not invent candidate experience, laws, numerical limits, dates, or employer facts. Keep a professional public-service tone. Return ONLY valid JSON with this shape: {"questions":[{"category":"personal|role|technical|scenario|ethics","question":"...","swHint":"one short Kiswahili coaching hint","modelAnswer":"80-150 word answer grounded in the source","keyPoints":["3 to 6 concise concepts"]}]}. Create exactly 5 varied questions. Model answers are coaching drafts and must not claim official endorsement.`;

  const userPrompt = `ROLE: ${role}\nORGANIZATION: ${organization}\nSOURCE NAME: ${sourceName}\n\nSOURCE TEXT:\n${material}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(context.env.GEMINI_API_KEY)}`, {
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
    const payload: any = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') return json({ error: 'AI provider returned no usable content.' }, 502);
    const parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ''));
    if (!parsed || !Array.isArray(parsed.questions)) return json({ error: 'AI response did not match the required format.' }, 502);
    return json({ questions: parsed.questions.slice(0, 5) });
  } catch (error) {
    return json({ error: error instanceof Error && error.name === 'AbortError' ? 'AI request timed out.' : 'AI response could not be processed.' }, 502);
  } finally {
    clearTimeout(timeout);
  }
};

export const onRequestGet = async () => json({ configured: false, message: 'Use POST to generate questions.' }, 405);

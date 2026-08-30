# KaziCoach TZ — Free Hosting & Usage Monitoring Plan

Goal: make KaziCoach TZ publicly available at **$0 cost** for at least 30 days
(and indefinitely, since every tier below is free with no expiry), and monitor
real user usage with a free **PostHog** account — all while preserving the
app's privacy promise.

---

## 1. Hosting decision

The app has two optional server-side routes in `functions/`:

| Route | Purpose |
|---|---|
| `/api/generate` | AI question generation (Gemini), Turnstile + rate-limited |
| `/api/log-error` | Privacy-safe client error sink |

These are **Cloudflare Pages Functions**. Any free host that cannot run
server-side/edge Functions will simply not serve those routes (the app still
works fully offline-first, but the AI coach button and error log stay off).

| Host | Price | Functions? | Verdict |
|---|---|---|---|
| **Cloudflare Pages** | **$0 forever** | Yes (100k req/day) | Recommended |
| GitHub Pages | $0 | No | Already deployed as a demo mirror; AI route disabled |
| Netlify Free | $0 | Yes (limited) | Works, but 100GB bandwidth cap and slower Functions |
| Vercel Hobby | $0 | Yes | Works, but no easy KV binding and less generous than CF |
| Firebase Hosting + CF | $0 spark plan | Functions separate | Overkill for this project |

**Recommendation: Cloudflare Pages free tier.** It is the only host that
natively runs the existing `functions/` directory, gives a free `*.pages.dev`
public URL, unlimited bandwidth (fair use), 500 builds/month, and per-IP rate
limiting via the same KV products — for $0.

---

## 2. Public availability — 30 days (and beyond)

- The free tier **never expires** and has **no trial clock**. Once deployed,
  the site stays public at `https://<your-project>.pages.dev` indefinitely.
- For a 30-day validation window simply leave it up; there is nothing to
  renew. If you later want to take it down after the pilot:
  - **Suspend** (keep the code): Project → Settings → remove the deployment /
    pause the Pages project.
  - **Delete entirely**: Project → Settings → Delete project.
- Optional: connect a custom domain. Cloudflare DNS proxying for the domain is
  also free, but the `*.pages.dev` subdomain is already public without purchase.

### Cost summary (30 days of a real pilot)

| Item | Cost |
|---|---|
| Cloudflare Pages hosting + bandwidth | $0 |
| Functions requests (AI + errors, well under limits) | $0 |
| KV storage (rate limit counters) | $0 |
| PostHog analytics free tier (1M events/mo) | $0 |
| **TOTAL** | **$0** |

---

## 3. Deploy to Cloudflare Pages (free) — step by step

Prerequisite: the code is already on GitHub
(`MsofeCoder/kazicoach-tz`, branch `main`) with a working CI quality gate.

1. Create a free account at **https://dash.cloudflare.com/sign-up**.
2. Left sidebar → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Authorize GitHub and pick the **MsofeCoder/kazicoach-tz** repository.
4. Framework preset: **Vite** (or leave custom).
   - Build command: `npm run build`
   - Build output directory: `dist`
5. The `functions/` folder is picked up automatically (it is for a
   `functions/` directory at the repo root).
6. Click **Save and Deploy**. After ~2 minutes the app is public at
   **`https://<your-project>.pages.dev`** — share that URL.

### 3.1 Production environment variables (Settings → Environment variables)

| Variable | Required? | Where from | Notes |
|---|---|---|---|
| `GEMINI_API_KEY` | Only for AI coach | Google AI Studio | Encrypted, never in browser |
| `GEMINI_MODEL` | No | — | Default `gemini-2.5-flash` |
| `TURNSTILE_SECRET_KEY` | Only for AI abuse protection | Cloudflare | Must also set `TURNSTILE_SITE_KEY` |
| `TURNSTILE_SITE_KEY` | Only for AI abuse protection | Cloudflare | Public widget key |
| `RATE_LIMIT_MAX` | No | — | Default 10 req/hour/IP |
| `VITE_PUBLIC_POSTHOG_KEY` | Only for analytics | PostHog | Public key (safe by design) |
| `VITE_PUBLIC_POSTHOG_HOST` | No | — | Default `https://us.i.posthog.com` |

Any variable beginning with `VITE_` is intentionally public and read by the
browser. Everything else stays server-side.

### 3.2 Durable rate limiting (recommended)

The AI route rate-limits per-IP. Without a KV binding it falls back to an
in-memory per-isolate counter, which is still fine for a pilot.

```bash
npx wrangler kv namespace create RATE_LIMIT_KV
```

Then in the Pages dashboard: **Settings → Functions → KV namespace bindings →
Add binding** → variable name `RATE_LIMIT_KV`, select the namespace created
above, and redeploy.---

## 4. PostHog — free usage monitoring setup

PostHog's free tier includes **1 million events/month and 5,000 sessions** — far
more than an interview-prep pilot needs (a heavy user might generate ~20–40
events; 30 days of a 1,000-user pilot is roughly 40k events).

### 4.1 Create the account and project

1. Sign up at **https://posthog.com/signup** (GitHub/Google login; free plan).
   - Choose **US Cloud** (closest to Tanzania) or EU Cloud. If you pick EU,
     set `VITE_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com` later.
2. In PostHog, create a project named **"KaziCoach TZ"**.
3. Copy **Project settings → Project API key** — the value starting with
   `phc_...` → this is `VITE_PUBLIC_POSTHOG_KEY`.
4. Note the host for your cloud region:
   US → `https://us.i.posthog.com`, EU → `https://eu.i.posthog.com`.

### 4.2 PostHog privacy settings (do this before going live)

To keep the app honest ("no personal content is ever sent to analytics"):

- **Product analytics → Person profiles → turn OFF.** The app already sends
  `person_profiles: 'never'` and memory persistence, so no profiles/cookies.
- **Privacy & security → IP logging → OFF** (anonymize addresses).
- **Data ingestion → autocapture → OFF** (the app also disables it client-side).
- **Session replay → OFF** (the app disables it client-side).
- **Data retention** → set to 30 days if you only want to validate the pilot.
- **Data capture → Domain allow-list** → add your `*.pages.dev` domain so only
  real visitors can send events.

### 4.3 Add the PostHog environment variables in Cloudflare Pages

In the Pages project **Settings → Environment variables → Production** add:

```
VITE_PUBLIC_POSTHOG_KEY = phc_xxxxxxxxxxxxxxxxxxxx
VITE_PUBLIC_POSTHOG_HOST = https://us.i.posthog.com
```

Then redeploy (or the next deploy from git picks them up). The app only
downloads the PostHog SDK and sends events **when the key is present**; with no
key the bundle behaves exactly as the privacy-first default.

### 4.4 What is tracked vs never tracked

Health warning: **do not add custom `track()` events with user content.** Only
the anonymized events wired in `src/lib/analytics.ts` are sent:

**Tracked (anonymous, aggregate):**
- `$pageview` with the view id (`dashboard`, `practice`, `materials`,
  `progress`, `settings`, `onboarding`)
- `onboarding_completed` with `usedSample` (boolean)
- `practice_started` with `mode` (`oral`/`written`) and `category`
- `practice_attempt_completed` with `mode`, `score` (0–100), `category`
- `materials_generated` with `source` (`local`/`ai`)

**Never tracked:**
- Name, job position, organization, interview date, all file uploads (CV,
  letters, notes, images), question/answer text, custom questions, IP address,
  or any saved progress content.

### 4.5 Viewing the data

1. **Product analytics → Trends** → choose `$pageview` → page views per day.
2. **Product analytics → Trends** → `practice_started` or
   `practice_attempt_completed` → build the onboarding → practice funnel by
   selecting both events and "funnel" mode.
3. **Data management → Events** → live event stream; every event shows only the
   sanitized properties from 4.4.
4. Privacy check: click any event → expand properties → confirm there is no
   `name`, `jobPosition`, or content field. There must not be one.
---

## 5. PostHog ingest via your own domain (optional, more private)

Ad-blockers sometimes block direct `*.posthog.com` calls. PostHog supports
reverse-proxying capture through your own domain, which also keeps the CSP
`connect-src` as `'self'` only. On Cloudflare the simplest way is to add a
Pages Function `functions/ingest/[...].ts` (or a Worker) that proxies
`/ingest/*` to `https://us.i.posthog.com/*`, then set
`VITE_PUBLIC_POSTHOG_HOST=https://<your-domain>/ingest`.

Direct mode (section 4) works fine for a pilot and the CSP already allows only
the two official PostHog hosts.

---

## 6. Verification checklist (first 30 days)

- [ ] `https://<your-project>.pages.dev` opens on a phone **not** on your Wi-Fi.
- [ ] Clear-site-data + reload: IndexedDB mirror silently recovers the workspace.
- [ ] Practice a written + oral answer; a `practice_attempt_completed` event
      appears in PostHog **Data management → Events**.
- [ ] Inspect 5 random events: zero user content fields (section 4.4).
- [ ] Open the site in a private window: still works, no tracking cookies set
      (DevTools → Application → Cookies is empty for analytics).
- [ ] `npx wrangler pages deployment tail` shows no errors from `/api/log-error`.
- [ ] If AI is configured: the rate limit returns `429` after the cap, and the
      Turnstile gate shows when enabled.
- [ ] After 30 days review: channels = where users come from, retention = do
      users return, funnel = onboarding → practice → attempts.

---

## 7. Privacy compliance note (Tanzania PDPA)

Tanzania's **Personal Data Protection Act 2022** applies when you process data
of data subjects in Tanzania. The integration here is designed to avoid
"personal data":

- No user content is transmitted to PostHog (see 4.4).
- No person profiles, no cookies, no IP logging → aggregates only.
- PostHog's data processor terms honor the PDPA data-transfer requirements.

If you ever add identified analytics (e.g., email capture for a paid plan), you
would need a privacy policy and lawful basis — the current anonymous pilot does
not require it. Keep the two states of this app separate: **local
personalization (never leaves the device)** vs **anonymous product telemetry
(aggregates only)**.

---

## 8. Alternatives if the free limits are ever exceeded

| Scenario | Option |
|---|---|
| More than 100k Function req/day | Move Functions to a dedicated Worker (same code, trivial change) |
| Bandwidth abuse | Add a Cloudflare WAF rate rule (free plan includes basic protection) |
| PostHog > 1M events/mo | PostHog's paid tier, or self-hosted Umami/Plausible on a cheap VPS |
| Custom domain | Register with any registrar and proxy via Cloudflare (DNS proxy free) |

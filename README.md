# KaziCoach TZ

A polished, offline-first Tanzanian interview preparation application customized privately for each user. The first screen asks for a preferred name, job position, job description, CV, application letter and optional study materials; these remain in the user’s browser in private mode.

## Included

- Private generic onboarding for any candidate and job position
- Local customization from job description, CV, application letter and notes
- A generic interview bank plus a 33-question radiation-safety reference pack
- Generic written practice plus a 15-question radiation-safety written pack
- Realistic five-member panel: Chairperson, Secretary, two technical members and a public-service member
- Mixed, male, female, soft and deep interviewer voice modes using the best voices available on the device
- Five-point probable answers with mnemonics and an eye-controlled blurred reveal
- Browser speech recognition with typed fallback
- Browser text-to-speech
- Explainable concept/depth/structure scoring
- XP, streaks, levels, category progress, trend and realistic score-sensitive improvement suggestions
- End-of-session repeat or performance-reset flow that preserves preparation materials
- Local TXT/MD/PDF/DOCX extraction and image-reference uploads
- Local question generation with no API
- Optional Gemini generation through a server-side Cloudflare Pages Function
- Turnstile-protected, per-IP rate-limited AI route
- Automatic IndexedDB workspace mirror with silent recovery after storage wipes
- Weekly JSON export reminder while the workspace has unbacked-up content
- Responsive mobile/desktop UI and offline service worker
- Local JSON data export/reset
- No real candidate profile ships in the application bundle

## Fictional test packs

Three complete fictional onboarding packs are available in `test-data/` and as one-click sample cards on the first screen:

1. Radiation Safety Inspector II
2. Human Resource Officer II
3. ICT Officer II

Each pack contains a profile, job description, CV, application letter and study notes. No sample contains real contact or identity information.

## Run locally

```bash
npm install
npm run dev
```

Open the Vite URL. The core app needs no environment variables. Vite does not emulate the Cloudflare Pages Function; local and built-in generation still work.

## Quality checks

```bash
npm test              # 52 unit + component tests (vitest / Testing Library)
npm run lint          # TypeScript project checks
npm run lint:functions# Typechecks the Cloudflare Pages Functions
npm run lint:eslint   # ESLint incl. jsx-a11y and react-hooks rules
npm run build         # Type-check + production build
npm run smoke         # Boots the built app and verifies the shell + assets serve
```

## Error monitoring

Production render failures and uncaught errors are reported (message, truncated
stack, page path only — never CV text or answers) to `/api/log-error`, a
Cloudflare Pages Function that writes them to the deployment log. Inspect live
errors with:

```bash
npx wrangler pages deployment tail
```

No third-party error service receives any data, keeping the private-mode promise.

## Deploy to Cloudflare Pages

1. Push this directory to GitHub.
2. Create a Cloudflare Pages project.
3. Build command: `npm run build`
4. Build output directory: `dist`
5. Add an encrypted secret named `GEMINI_API_KEY` only if AI generation is wanted.
6. Optionally add `GEMINI_MODEL` (default: `gemini-2.5-flash`).
7. Optional abuse protection for the AI route:
   - `TURNSTILE_SECRET_KEY` + `TURNSTILE_SITE_KEY` to require a Cloudflare Turnstile human check before generation.
   - Bind a KV namespace as `RATE_LIMIT_KV` for durable per-IP limits (default 10 requests/hour, override with `RATE_LIMIT_MAX`). Without the binding, a per-isolate in-memory limit still applies.

   To create and bind the KV namespace:

   ```bash
   npx wrangler kv namespace create RATE_LIMIT_KV
   ```

   Then in the Cloudflare dashboard: your Pages project → Settings → Functions →
   KV namespace bindings → add `RATE_LIMIT_KV` → select the new namespace
   (variable name must be exactly `RATE_LIMIT_KV`). Repeat for the error-log
   route's burst limit, which reuses the same binding. Redeploy afterwards.
8. Deploy. Pages will publish `functions/api/generate.ts` at `/api/generate`.

## Privacy model

- Core app and scoring run in the browser.
- Files are extracted locally and capped before persistence.
- Raw audio is not stored.
- AI generation sends selected text only after explicit confirmation.
- API keys remain server-side.
- Name, role, document text and progress are stored only in browser `localStorage`; users can export or delete the entire private workspace.
- No analytics or account database is active in private mode.

## Content warning

This is an independent educational tool—not an official PSRS, Ajira Portal, TAEC, IAEA or employer product. Review current legal and technical facts against official sources. Personalized answers must use the user’s own verified evidence and must not invent duties, achievements or research results.

## Production safeguards already added

- Cloudflare security headers and restrictive Content-Security-Policy
- Cloudflare Turnstile human check and per-IP rate limiting on the AI route
- API/auth/payment cache exclusion in the service worker
- Network-first navigation with offline fallback
- Application error boundary that preserves local user data
- Privacy-safe error monitoring: `/api/log-error` Pages Function, no third parties, no user content
- Debounced IndexedDB mirror of the workspace with silent recovery
- 52 Testing Library / vitest tests covering every view and core library
- ESLint quality gate with jsx-a11y and react-hooks rules; Cloudflare Functions are type-checked
- Deploy smoke test (`npm run smoke`) verifying the built shell, hashed assets and PWA files serve
- GitHub Actions test/build/smoke/audit quality gate
- Dependabot update policy and a pinned Node engine range (`engines` + `.nvmrc`)

These safeguards improve the codebase but do not replace the business, privacy, backend, payment and operational launch gates in the production roadmap.

## Project documents

- Product requirements: [`../PRD.md`](../PRD.md)
- Production roadmap: [`../PRODUCTION_ROADMAP.md`](../PRODUCTION_ROADMAP.md)
- Tanzania marketing and monetization strategy: [`../DIGITAL_MARKETING_MONETIZATION_TZ.md`](../DIGITAL_MARKETING_MONETIZATION_TZ.md)

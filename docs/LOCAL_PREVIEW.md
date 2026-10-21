# Local preview and verification

**Current checkpoint:** [release readiness — 2026-10-21](RELEASE_READINESS_2026-10-21.md). Current API/DB/inbox ports are **57251/57252/57254**, superseding older port references below. Run `supabase migration up --local` before `npm run preview:setup`. Fixture tools validate the configured port and cannot accept a remote override.

The local owner now requires MFA. Setup enrolls only the synthetic owner and stores its seed in ignored `.local-review/owner-mfa.json`. Sign in as that fixture, run `node scripts/local-owner-code.mjs` privately and enter its code in Settings → Owner security. Never record its seed, QR or code in reports/screenshots. The helper cannot authenticate a real/hosted owner. Real-owner enrollment and recovery require approved staging evidence.

On an authorized Samsung ADB connection, reverse 5173 and the configured API port (currently 57251). Wireless debugging must already be authorized by the owner; do not invent an address. Use the [OpenCode UAT prompt](OPEN_CODE_RELEASE_UAT_PROMPT.md) against local services only.

## Earlier review instructions (port/MFA updates above take precedence)

Latest correction: setup fills a blank local contact setting with the approved `+255688010595` through the audited admin RPC and preserves subsequent changes. Each package button opens WhatsApp with package/price/duration only. See [CORRECTIVE_CHECKPOINT.md](CORRECTIVE_CHECKPOINT.md) for current validation and pending mobile steps.

Requires Node 22.19+ (CI uses Node 22), Docker Desktop and Supabase CLI 2.121.0. No hosted project, payment gateway or paid AI is required.

```powershell
git switch feature/kazicoach-v2
npm ci
supabase start
supabase migration up --local
npm run preview:setup
npm run dev -- --host 127.0.0.1
```

Open [local preview](http://127.0.0.1:5173). Default app mode is private without configuration. Setup creates an ignored `.env.local` containing only the local publishable key. Both the browser and Supabase endpoint must use loopback; hosted URLs are rejected in this review build. Existing `.env.local` is preserved—review it if accounts do not appear. Restart Vite after configuration changes.

Local fixtures, **never for production**:

| Account | Role | Password |
| --- | --- | --- |
| owner@kazicoach.test | Sole local Super Admin | LocalReview123! |
| learner@kazicoach.test | Learner | LocalReview123! |
| other@kazicoach.test | Second learner for isolation | LocalReview123! |

The setup script refuses a different API URL or branch, does not print privileged CLI keys and will not replace an existing administrator. No production owner identity is inferred from these fixtures. Local email confirmation is disabled; local test inbox is at [Mailpit](http://127.0.0.1:57424). Production auth and recovery still require review.

## Review flow

1. Stay signed out. Complete oral/written practice without a network connection after the production build has installed its service worker. The first five scored answers consume the browser trial; Progress retains the fifth result. Materials, local generation, JSON export and private data remain accessible after the invitation.
2. Settings is in the desktop sidebar or mobile menu. Sign in as learner; copy its account ID. Confirm that sign-in alone uploads no local workspace data. Explicitly select progress for sync; only metadata and numeric scores enter the queue. Pause sync or sign out to stop future uploads.
3. Sign in as owner. In Settings → Super Admin, load users/moderation/audit; paste the learner account ID, select Basic/Plus and activate **only as a local test**. Review audit entries. Prices, durations, global free-trial count and daily cloud quota are editable without source changes. Contact settings accept international WhatsApp digits; leave blank until the real number is provided.
4. Sign back in as learner; refresh access. Basic unlocks ongoing practice; Plus adds five-member panel and backend-authorized cloud category analysis. Expiry is checked by Postgres on every protected operation. Config changes do not extend previous grants.
5. Submit a synthetic testimonial, verify it is absent from public results, approve it as owner, then read approved testimonials signed out. Owner withdrawal removes the public projection. Approved submissions cannot be edited without withdrawal and re-review.
6. Export account data separately from the private workspace. Account export paginates all owned records and includes pending summaries. Self-deletion cascades owned cloud records; private materials remain. Sole administrator deletion is blocked until administration has been transferred through a reviewed trusted operation.

## Commands

```powershell
npm test
npm run test:db
npm run test:local
npm run lint
npm run lint:functions
npm run lint:eslint
npm run build
npm run smoke
supabase db advisors --local --type security --level warn --fail-on error
```

`test:db` creates its own disposable `postgres:16-alpine` container with no published ports, boots Auth-compatible roles/functions, replays every migration, exercises actual grants/RLS and removes the container. It cannot connect to an existing database. CI runs it without any secrets.

`test:local` is an additional integration check against this repository's local Auth/PostgREST stack. Run `preview:setup` first. It uses synthetic review accounts, creates/deletes its own fixture rows and a disposable test account, and leaves the learner without premium access. Do not use those fixture accounts for personal data.

For the built offline shell:

```powershell
npm run build
npm run preview -- --host 127.0.0.1
```

Open the printed URL, visit once online to install the service worker, then reload offline. First install downloads document parser assets, including a roughly 2.2 MB PDF worker; normal navigation uses the cached public shell. API responses, authorization-bearing requests and remote Supabase requests are excluded from caches.

Vite does not emulate Cloudflare Pages Functions. Local personalization works without paid services. The AI route is disabled unless local server variables and a Gemini key are explicitly supplied; this work does **not** make provider calls. The route now requires a valid user token and an unexpired premium grant, atomically consumes the configurable daily quota and fails closed on access-service failure. Testing an actual AI provider or deploying the function requires a separate decision.

To stop only this repository's services while preserving local data: stop Vite with Ctrl+C and run `supabase stop` from this directory. Other Supabase projects are untouched. Do not run `supabase link`, `db push` or any `--linked` command during review.

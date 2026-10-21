# Production deployment checklist

Current authority and evidence: [hosted checkpoint — 2026-10-21](DEPLOYMENT_CHECKPOINT_2026-10-21.md). The owner authorized autonomous completion of this release. No repeated approval is needed for that scope. Billing, paid AI, new costs and destructive operations remain outside it. Public account launch is held on technical/operational requirements below.

## Completed preparation

- [x] Work only on `feature/kazicoach-v2`; preserve master and private browser data; disable the legacy automatic deployment workflow.
- [x] Inspect the actual empty `KaziCoach-TZ` launch project (`qkyuqfqrixohcbdkchoo`), PostgreSQL 17, Auth and migration history before changes.
- [x] Apply all seven reviewed additive migrations with exact source versions; verify application RLS and default-denied private tables.
- [x] Run 13 PostgreSQL scenarios and 12 real hosted Auth/PostgREST proofs covering ownership, role forgery, MFA, activation, switching/revocation, moderation and audit. Expiry/future-start boundaries are database-clock tested in the PostgreSQL suite.
- [x] Remove only this session's synthetic hosted identities; verify zero real/test users or fictional testimonials remain. Keep minimized verification audit records.
- [x] Configure exact production/staging HTTPS callback origins, email confirmation, strong passwords and TOTP without weakening unrelated hosted settings.
- [x] Restore actual post-initialization schema/data exports in an isolated local database, verify permissions/counts, then remove that disposable database. Encrypt retained exports and verify hashes. See checkpoint for scope and encryption custody limitations.
- [x] Create Cloudflare Pages project `kazicoach-tz`, production branch `release`; configure exact-origin preview/production public bindings, with no privileged or paid-provider keys.
- [x] Freeze audited staging artifact at `a459b54`; deploy Functions and static assets; verify actual live CSP, headers, three assets, service worker and non-cacheable disabled-provider response.
- [x] Inspect rendered staging Home/Settings, package order/links, restricted guest voice choices and empty approved-testimonial response without captured console warnings/errors. This is browser evidence, not physical-phone UAT.

## Required before collecting production customer data

- [ ] Configure a verified SMTP sender in the existing Supabase project. Owner confirmed none is configured. Use provider/dashboard secret fields; never put SMTP credentials in source, chat or public build variables. Do not disable email confirmation.
- [ ] Verify real confirmation/recovery delivery, exact redirects, wrong-browser PKCE, invalid/expired/reused links, password replacement, old-refresh denial and generic non-enumerating responses. Local synthetic-inbox integration already passes; hosted delivery does not.
- [ ] Real owner registers/confirms their own identity and enrolls their own authenticator. Independently verify that identity before running the one-time guarded [bootstrap template](OWNER_BOOTSTRAP.sql.example); audit the grant and never promote a synthetic review account.
- [ ] Verify owner AAL1 denial, recent TOTP AAL2 administration, logout/revocation, package/contact audit and manual activation using the real hosted UI after owner setup. Test fixtures previously proved backend enforcement; they are now deleted.
- [ ] Finish current-commit visible Samsung Plus/Super Admin, voice/microphone, document import, logout email reset, private/offline/reconnect and package/expiry acceptance. Record device/browser, commit and redacted screenshots. Do not substitute locked-screen CDP responses or historical 8/8 results.
- [ ] Establish recovery custodian, factor-loss/role-transfer procedure, dashboard MFA, least-privilege operator access and incident contacts. No password-only backdoor.
- [ ] Approve retention wording and deletion across backups/other devices; no automatic purging is enabled. Account live-row deletion does not erase external WhatsApp history, exports, audit identifiers or immutable backups.
- [ ] Establish independent portable encrypted backups/key custody, restore/deletion reconciliation, monitoring and realistic RPO/RTO. Current DPAPI snapshots depend on this Windows profile. Verify actual hosting-plan backup/PITR capabilities; do not assume paid features or incur costs.
- [ ] Move future fixture/integration tests to a separate non-production database before real launch users exist. Current preview and reserved production bindings share the initialized launch project.

## Production artifact and deployment

Reserved production origin: `https://kazicoach-tz-441.pages.dev`. Staging alias: `https://staging.kazicoach-tz-441.pages.dev`. Do not reuse staging-origin JavaScript for production because the client enforces exact origin.

1. Freeze the reviewed source commit and dependencies; save a fresh encrypted pre-change export if any hosted data changed. Inspect migration diff/history; never reset or blindly drop hosted data.
2. Run the required checks after relevant source changes: `npm ci`, `npm test`, `npm run test:db`, `npm run lint`, `npm run lint:functions`, `npm run lint:eslint`, `npm run test:release-config`, `npm run build`, `npm run smoke`. Local Auth/recovery harnesses remain loopback-only. Do not rerun fixtures on a launch database with customer accounts.
3. Build using explicit process variables: `KAZICOACH_RELEASE_ACCOUNTS=true`, `KAZICOACH_RELEASE_APP_ORIGIN` set to the production origin, `KAZICOACH_RELEASE_SUPABASE_URL` set to the exact project URL, and `KAZICOACH_RELEASE_PUBLISHABLE_KEY` set to the modern public key. Release builds do not inherit local review account configuration. Never use a service-role, SMTP or provider secret here.
4. Run `npm run audit:release` under that explicit configuration; retain the inventory/hashes. Copy output to a frozen artifact directory before deployment. Ensure no fixtures, backups, source maps, local accounts, private candidate content or privileged keys are uploaded. Functions are built separately by Pages; review their bundle too.
5. Verify production Function bindings: `ACCOUNTS_MODE=hosted`, `APP_ORIGIN` exact production origin, `SUPABASE_URL` exact project, `SUPABASE_PUBLISHABLE_KEY` public key. Keep `GEMINI_API_KEY` absent and billing disabled. `_routes.json` includes only `/api/*`; static security headers remain in `_headers`.
6. Deploy the frozen artifact and reviewed Functions with Wrangler to project `kazicoach-tz`, branch `release`, specifying the reviewed commit. No master merge/push is required. Verify effective environment bindings and actual production alias before advertising it.
7. Check TLS, page/assets, exact Supabase CSP, framing/referrer/MIME headers, fresh service worker, no-store API denial, owner MFA, sync/ownership and premium boundaries. Verify direct server calls, not just UI visibility. Confirm private documents/answers never enter cloud sync.
8. Record deployment ID, source commit, hashes, migration versions, runtime checks and acceptance. Monitor redacted errors/latency and unauthorized activity without capturing tokens, customer answers or documents. Do not enable billing/provider usage as part of this release.

## Backup and rollback procedure

- Keep the corrected frozen staging artifact and encrypted exports described in the checkpoint. Earlier preview `5e037290` had defective CSP and is not a rollback candidate. Older application bundles contain personal candidate content or lack MFA enforcement and must not be republished.
- There is no previous production deployment in this new project yet. After the first verified production release, retain its compatible artifact/configuration inventory and confirm Cloudflare rollback eligibility. A preview deployment is not a prior production rollback target.
- For authorization exposure, suspend protected operations, revoke affected grants/sessions and preserve minimized audit evidence. Leave browser-private workspace data intact. Configuration/secrets and database state do not automatically follow code rollback.
- Prefer a compatible app rollback or reviewed additive forward fix. Do not drop application/private schemas, disable MFA or delete identities to roll back code.
- A data restore requires an explicit snapshot/time and lost-write decision, maintenance isolation, verified restore, reapplication of confirmed deletions/withdrawals, RLS/grant checks and owner reconciliation before reopening traffic. Never restore directly over customer data as an unattended test.
- Installed service workers can outlive origin rollback. Confirm update behavior; backend checks remain authoritative for revoked/expired access.

Reference runbooks: [Supabase backups](https://supabase.com/docs/guides/platform/backups), [Cloudflare Pages bindings](https://developers.cloudflare.com/pages/functions/bindings/), [Cloudflare rollbacks](https://developers.cloudflare.com/pages/configuration/rollbacks/). Verify current plan capabilities when executing; these links do not establish that a feature is enabled for this account.

# Hosted release checkpoint — 2026-10-21

**GO for staging review; NO-GO for public account launch.** The owner authorized proceeding autonomously to production. That authorization covers this release; the remaining blockers are delivery/identity/acceptance requirements, not another request for deployment permission. Billing and external AI remain disabled. No merge or push was performed. Master remains `bba3502a6e822f715dcd16b3e90144a28aef2c71`.

This report supersedes earlier statements that hosted services have not been contacted. Work is on `feature/kazicoach-v2`; the deployed implementation is `a459b54`.

## Review target and actual changes

- Working staging: <https://staging.kazicoach-tz-441.pages.dev/>. Immutable deployment: <https://6d7e03f6.kazicoach-tz-441.pages.dev/>. The app's exact-origin account configuration is for the staging alias; use that alias for account review.
- Cloudflare Pages project `kazicoach-tz`, production branch `release`. The reserved production origin is `https://kazicoach-tz-441.pages.dev`; no production deployment has been published. Production requires a new build for that exact origin, not promotion of staging-origin JavaScript.
- Hosted Supabase project `KaziCoach-TZ`, reference `qkyuqfqrixohcbdkchoo`, PostgreSQL 17. Initial inventory found no public/application tables, Auth users or migration history. All seven versioned migrations are now applied, including audited initialization of the approved business contact only when blank.
- Hosted Auth retains email confirmation, enables exact staging/production callback URLs, enforces 12-character passwords with character variety and supports TOTP. No password-only administration bypass was added.
- Preview and reserved production configuration currently reference the same initialized launch database. This is not an isolated permanent staging database. After real users exist, do not run fixture provisioning or destructive acceptance against it; use a separate non-production project for future integration testing.
- No real owner was provisioned. Temporary uniquely named synthetic test users were removed. Final verification found zero Auth users, administrators, profiles, attempts, entitlements and testimonials; all application RLS remained enabled. Audit entries for verification/bootstrap are intentionally retained with synthetic IDs and minimized details.

## Evidence

| Scope | Actual result |
| --- | --- |
| Unit/regression | 72 tests in 10 suites pass |
| PostgreSQL 17 | 13 scenarios pass, including activation, expiry/future start, switching/revocation, isolation, quota, MFA boundaries, pagination and restore |
| Hosted Auth/PostgREST | 12 proofs pass: anonymous denial, public packages/contact, cross-user isolation, metadata forgery denial, AAL1 owner denial, actual TOTP AAL2, stale AAL1 denial, manual seven-day Basic/Plus grants, switching, revocation, moderation and audit/deletion protection |
| Hosted cleanup | Only this session's three synthetic identities removed; final identity and learner-table counts zero |
| Security advisors | No WARN/ERROR. Private default-denied tables intentionally have RLS without client policies |
| Types/lint/build | Application and Functions TypeScript, ESLint and build pass; prior clean dependency installation and smoke checks remain recorded |
| Artifact scan | Hosted build passes review credential, testimonial, personal-content, local endpoint, privileged-key and source-map checks; inventory/hashes recorded |
| Dependency audit | Zero known findings at this checkpoint; vulnerable DOCX CLI chain removed |
| Actual deployed HTTP | Nine checks pass: page, CSP, security headers, asset references, three asset responses, uncached service worker and disabled provider's no-store 503 |
| Rendered staging browser | Home and Settings render, menu navigation works, Basic precedes Plus, correct package-specific WhatsApp links are present, guest voice selector omits mixed panel, public query returns no approved testimonials; no captured warn/error console messages |
| Physical Samsung | Earlier owner-confirmed WhatsApp recipient/package checks remain valid historical evidence. No fresh complete Samsung Plus/Super Admin acceptance is claimed for this deployed commit |

Selected redacted evidence and browser screenshots are in [deployment-evidence-2026-10-21](deployment-evidence-2026-10-21/). Prior full local checks are in [release-hardening-2026-10-21](release-hardening-2026-10-21/). Browser screenshots are not physical-device evidence. Passing artifact scans cover known patterns and structural isolation, not every possible secret or every historical Git object.

The first deployed page probe exposed a real CSP defect: a Vite plugin ran during test/dev shutdown and could overwrite release headers/service-worker output with private configuration. Commit `a459b54` restricts it to builds and adds a regression that compares both files before/after tests. The corrected frozen artifact was deployed and its actual headers rechecked. The earlier defective preview is not a rollback candidate.

## Backup and rollback evidence

Actual hosted schema and data exports (public, private, Auth and migration history) were restored into a newly created, disposable local database using the local Supabase administrative role. Checks confirmed zero Auth identities, two packages, business contact, seven migration records, application RLS and anonymous denial. Only that disposable database was removed.

These are **post-initialization** exports, taken before synthetic hosted test accounts. The first attempted pre-initialization export failed during tooling setup; do not describe it as a successful pre-change snapshot. The empty baseline was independently inspected before migration.

Exports are encrypted with Windows CurrentUser DPAPI in ignored `.local-review/deployment-evidence/`; decrypt-and-hash round trips passed and this session's plaintext exports were removed. Schema plaintext SHA-256: `21f2447927c3408174a53d4da4a9b6310e3d7b0eac1bae271eb6306ede57fea4`; data: `56cba3ad3f4afdf5f5b36be73512a4f2b2bad5c6c7b3a64885e72ad908a19f32`. DPAPI recovery depends on this Windows profile. This is not an independent offsite backup, a scheduled backup, PITR evidence or a proven production RPO/RTO.

Retain corrected frozen artifact `.local-review/staging-artifact-a459b54` and its hash inventory. Preserve additive database migrations during application rollback. Do not drop application schemas or Auth users as a rollback shortcut. There is no previous production deployment in this new Pages project to roll back to; establish an initial known-good production artifact before promising one-click production rollback. Bindings/Auth configuration require separate rollback review; installed service workers may outlive an origin rollback.

## Remaining launch requirements

1. **Verified SMTP sender is not configured**, confirmed by the owner. Configure it through [Supabase SMTP settings](https://supabase.com/dashboard/project/qkyuqfqrixohcbdkchoo/auth/smtp) using a sender/domain the owner controls. Do not paste SMTP credentials into chat or commit them. Do not disable email verification to unblock launch. Test real confirmation/recovery delivery, wrong-browser/reused/expired links and password/session boundaries on the exact deployment origin. Local synthetic-inbox recovery tests already pass; they do not prove hosted email delivery.
2. Once email works, the real owner creates/confirms their own account and enrolls their own authenticator. Independently verify that identity, then use the guarded [owner bootstrap template](OWNER_BOOTSTRAP.sql.example) once, with an audit record. No synthetic identity becomes a real administrator. Establish factor-loss recovery, dashboard MFA and restricted operator access. No real owner password, seed or OTP belongs in reports.
3. Complete current-commit Samsung Plus and Super Admin acceptance with actual visible phone interactions. Do not use a locked-screen CDP response or historical 8/8 result as proof. Test expiry/package switching, microphone/voice behavior, document import, logout email reset, offline/reconnect and audited administration. Do not disrupt another tester's ongoing local session.
4. Confirm operational ownership, deletion/backup reconciliation and retention policy before making public retention promises. No automatic purge is enabled. The supplied owner contact alone did not approve the proposed retention periods. Establish a portable encrypted backup with controlled key custody and monitoring/restore ownership before collecting production customer data.

Offline bundled practice, trial counters and cached interfaces remain modifiable on a user's device. Secure server operations use trusted backend entitlement checks; offline licensing is not tamper-proof. Paid AI is intentionally unavailable without a separately authorized provider secret/budget. Billing remains disabled, and no payment gateway is integrated.

## Next release operation

After the requirements above are evidenced, build for the reserved production origin with the explicit release variables documented in the deployment checklist, scan/freeze the output, and deploy that artifact and Functions to branch `release`. Recheck live headers, origin restrictions, owner MFA and learner boundaries. The existing release authorization need not be requested again unless scope, cost or destructive impact changes. Keep source work on `feature/kazicoach-v2` and master untouched.

Local preview remains `npm run dev -- --host 127.0.0.1` at <http://127.0.0.1:5173/>; full setup and actual configured API ports are in [LOCAL_PREVIEW.md](LOCAL_PREVIEW.md). Never point local fixture tools at this hosted project.

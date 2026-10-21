# Entitlement audit — 2026-10-19

## Current update — 2026-10-21

Registered Free summary sync is now explicitly approved and reflected in the capability function. It remains owner-scoped and opt-in. Paid generation and Plus analysis still use live trusted entitlements. All privileged administrative reads/writes now require a matching live Auth session, verified MFA factor, AAL2 and a signed TOTP event within 15 minutes. The synthetic local owner has no bypass. Administrative reads use bounded keyset pagination.

An explicit HTTPS hosted configuration path is prepared and default-disabled; its validation tests use mocks/synthetic configuration only. No hosted service has been contacted. See [current readiness report](RELEASE_READINESS_2026-10-21.md). The offline limitation below remains applicable; earlier missing-MFA/hosted-path/sync-decision notes are historical.

Scope: local code, migrations, fresh PostgreSQL tests and isolated local Supabase Auth/PostgREST. No hosted verification or paid provider calls. Billing stays disabled.

| Operation | Trusted enforcement | Evidence |
| --- | --- | --- |
| Paid AI question generation `/api/generate` | Calls `kc_consume_cloud_request` using caller JWT + publishable key before provider fetch; Auth/PostgREST validates token; private SQL helper reads current entitlement and package quota | Route tests prove denial makes only the authorization request; outage/5xx/redirect errors fail closed; actual request bytes bounded |
| Daily AI quota | Database counter keyed by caller and Dar es Salaam date; conditional atomic upsert prevents increments beyond package limit | Real PostgreSQL tests validate allowed then denied request. Failed/invalid client payload may consume an authorized slot, as documented |
| Plus cloud category analysis | `kc_advanced_progress` checks live `kc_has_capability('advanced_analysis')`; invoker query is RLS-owned | Basic denied; Plus allowed; immediate Plus→Basic and revoked grant denied; cross-user access excluded |
| Entitlement/role mutation | No learner write grants; private definer helper checks trusted `kc_private.admins`; wrapper is invoker; audit in same transaction | Direct writes and forged user metadata do not confer access; unauthorized admin RPC denied |
| Profiles, selected progress, export and withdrawal | Caller-owned RLS/grants and Auth foreign keys; not gated by current premium grant | Users retain access to their own existing account data after paid expiry; deletion/export must not depend on payment |
| Progress-summary insertion | Current policy permits an authenticated owner regardless of premium | **Policy decision:** `kc_has_capability` lists sync among paid capabilities, but insert RLS does not call it. Do not market sync as exclusively paid without an approved policy change and tests. Basic's advanced learning benefits do not by themselves define whether registered free accounts may sync summaries |
| Testimonial publication | Safe projection returns approved rows only; direct anonymous table access revoked; owner cannot approve | Real Auth/API and RLS tests cover pending, approval, withdrawal, private owner rows |

## Lifecycle semantics verified locally

- Manual activation is a trusted owner action after external verification; no payment provider or webhook exists. A successful grant starts at database `now()` and expires after the package's configured duration, initially seven days. Activation does not itself verify a receipt.
- Activating another package replaces the account's single entitlement row and starts a new period. It does not prorate or append duration. Both upgrade and downgrade take effect on the next backend call; package price/duration edits do not rewrite existing grants. This matches the recorded engineering behavior, subject to business acceptance.
- Automatic expiry uses `starts_at <= now()` and `expires_at > now()`. Tests cover a past expiry, future start and exact equality in one transaction using database time, not the device clock. No cron is needed for denial. Expired rows remain until replaced/deleted; expiry does not imply retention deletion.
- Revocation deletes the grant and immediately denies the next protected request even with an otherwise valid token. Other users' grants remain intact. In-flight work authorized before revocation may finish; stronger cancellation semantics would require separate design.
- Ownership cannot be reassigned through profile updates, attempts cannot be edited after creation and duplicate IDs are idempotent. Deleted users cannot restore owned rows using a stale JWT because live ownership foreign keys and entitlement checks apply. Refresh/session revocation and recovery assurance still require production review.

## Offline boundary

The browser receives question banks, scoring algorithms, voice controls and motivational calculations. A learner who controls that browser can modify storage, its clock or JavaScript, reset the trial counter and execute downloaded code. UI hiding is an experience rule, not a cryptographic license. Cached package state can remain until refresh/expiry; client-computed score/XP is self-reported. A signed offline token could improve authentic offline expiry but cannot protect already-downloaded code from its device owner or provide immediate offline revocation.

Real server costs/data permissions must therefore remain behind live backend checks. This checkpoint does not claim paid offline features are impossible to bypass. No service-role key may be used as a substitute for caller authorization. Changing the product to require online delivery for protected panel/content is a major product decision requiring owner approval.

## Remaining security work before production

Implement a reviewed hosted HTTPS path and test deployed Cloudflare runtime; current release/client intentionally has local accounts disabled and route allows loopback only. Enforce admin MFA/recent authentication server-side, add deployed request-level abuse controls and verify CSP/recovery/session behavior. Bound admin overview queries/pagination under realistic user volume. Confirm whether registered-free progress sync is intended before assigning it a price entitlement. No live inspection has been authorized.

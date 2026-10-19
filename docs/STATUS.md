# Checkpoint — local v2 review

Latest corrective work: [CORRECTIVE_CHECKPOINT.md](CORRECTIVE_CHECKPOINT.md). 52 unit tests and 8 PostgreSQL authorization scenarios pass; selected mobile cases and physical-phone WhatsApp checks pass. Remaining Plus/admin mobile UAT is explicitly pending browser-tool access. See that report before treating older evidence below as current.

Branch: `feature/kazicoach-v2`, created from local master `bba3502`. Master is unchanged. No push, merge, deployment, hosted project inspection or hosted mutation.

| Phase | Implementation | Evidence / remaining work |
| --- | --- | --- |
| 0 audit | Complete | Baseline 10 tests, TypeScript and build passed; see REPO_AUDIT.md |
| 1 schema/RLS | Local implementation | Disposable PostgreSQL and local Auth/PostgREST tests; owner isolation, explicit grants, immutable summaries, expiry, moderation, deletion |
| 2 optional accounts | Local preview | Email/password local test service only; profile, sign-out, paginated export, self-deletion; hosted recovery is pending |
| 3 selected sync | Local preview | Account-scoped durable queue, explicit consent, bounded retries, first-write-wins; no answers/CVs/documents uploaded |
| 4 packages | Local preview | Approved Basic/Plus prices; audited manual activation/revocation and editable prices/durations/limits; backend checks expiry and quota |
| 5 progress/moderation | Local preview | Existing private XP/badges retained, cloud summary and Plus analysis, opt-in testimonial/public-safe approval/withdrawal, sole local Super Admin |
| 6 verification | Local checks pass | 41 unit/regression tests, 7 PostgreSQL authorization scenarios, local Auth/PostgREST integration, typechecks/ESLint/build/smoke; desktop/mobile preview inspected |
| 7 rollout | Approval gate | No billing/gateway enabled. No remote PR creation, production migration, merge or deployment |

Changes are reversible by leaving this feature branch after saving local work. See ROLLBACK.md. Planning kit remains untouched and untracked.

## Verification evidence — 2026-10-19
- `npm ci`: passed at baseline and again from the final lockfile after stopping Vite to release its Windows native-module lock. Dependency lock pins Supabase SDK 2.118.0 and new tooling; subsequent tests/typechecks/ESLint/build/smoke all pass.
- `npm test`: 6 suites, 41 tests pass (baseline was 3 suites / 10 tests). Covers legacy workspace compatibility, queue consent/isolation/retry/conflict handling, expiry, trial count, disabled billing, local configuration, shell-cache privacy and backend authorization/size limits.
- `npm run test:db`: 7 scenarios pass against a fresh disposable PostgreSQL 16 container, replaying all three migrations. Covers two learners, anonymous and trusted admin; forbidden writes/reassignment, immutable attempts, package capability/expiry, atomic quota, moderation/withdrawal, cascading deletion and stale JWT writes. Docker calls need a 30-second per-scenario timeout on this Windows host.
- `npm run test:local`: passes against isolated local Supabase Auth/PostgREST on 57421. Validates actual authenticated HTTP grants, insert-only replay, Basic/Plus analysis boundary, safe public testimonial projection, withdrawal, deletion and old-token denial. No hosted service used.
- Both app/function TypeScript checks and ESLint pass. Build and smoke pass, retrieving all 10 offline assets and scanning JavaScript bundles for privileged key values. Supabase SDK is separated into a roughly 55 KB gzip chunk; main app is roughly 102 KB gzip. PDF worker remains roughly 2.2 MB and is included in the offline install.
- Local Supabase security **and performance** advisors at warning/error level: no issues. Local migration history matches all three CLI-created migrations.
- Browser verification: optional sign-in works; no sync selected by default; sole local Super Admin controls and audit overview render; account export reports success. Desktop and mobile layouts inspected, action wrapping corrected. Live paid AI/provider behavior is deliberately untested/disabled.
- `npm audit`: baseline 4 findings (3 moderate, 1 high). Updated transitive source-map-js to remove the high finding. Three pre-existing moderate findings remain in mammoth → argparse → sprintf-js; no compatible safe automatic fix is offered. Do not force the suggested downgrade. Review/replace the DOCX dependency before public launch; local use remains a documented residual risk.

## Limits and next approval gate
- This is a functional local v2 increment, not a production launch sign-off. Billing, recovery/email delivery, hosted integration and verified production ownership are pending.
- Browser/offline feature gating is advisory, guest quotas can be reset by browser-data deletion, and progress scores are client-reported. Only protected backend operations offer enforceable entitlement isolation. See DECISIONS.md.
- An already signed-in tab can keep private practice working during connectivity failure using its in-memory unexpired package. Reloading offline does not guarantee restoration of account/package state; guest workspace remains readable. Durable offline premium licensing requires a separate product/security decision.
- Audit retains actor/target UUIDs in local test records; retention/backup erasure is not approved. Self-deletion preserves the private browser workspace. Queues are per account, paused on sign-out and removed on that account's self-deletion from this browser.
- No external PR was created or branch pushed; docs/DRAFT_PR.md is the concrete review draft. Do not merge, connect hosted services, run production migrations, enable billing or deploy without explicit approval.

## Local commits
- `0097529`: repository audit, approved decisions and review/rollback guidance.
- `2f854e9`: schema, trusted operations, queue helpers, authorization tests, CI and offline-shell foundation.
- `6bfccc8`: optional account UI, trial/package flows, progress and Super Admin preview.
- Final documentation checkpoint includes the verification evidence and `local-preview.png`.

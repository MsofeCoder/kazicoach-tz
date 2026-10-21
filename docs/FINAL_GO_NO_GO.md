# Final pre-production checkpoint — 2026-10-19

**Current verdict and actual hosted changes:** see [hosted deployment checkpoint — 2026-10-21](DEPLOYMENT_CHECKPOINT_2026-10-21.md). This document is historical. It must not be used to infer that hosted services remain untouched or that release authorization is still missing.

**Superseded by [release readiness — 2026-10-21](RELEASE_READINESS_2026-10-21.md).** The older evidence and blockers below describe the earlier build. The current build has addressed local ports, dependency findings, public CV content, hosted configuration preparation and backend admin MFA. Production release still requires fresh phone/staging/operational evidence and explicit approval.

**Decision: NO-GO for production deployment, billing enablement or merge. GO for continued isolated local acceptance and remediation.** This is an evidence-based engineering recommendation, not production authorization.

Branch `feature/kazicoach-v2`; master remains `bba3502a6e822f715dcd16b3e90144a28aef2c71`. No live Supabase connection, hosted migration, remote push, merge, payment gateway, paid provider call or deployment was performed.

## Evidence collected

| Check | Result / evidence |
| --- | --- |
| Unit and regression suite | **57 tests / 7 suites pass**, including new trusted-service denial, canonical endpoints, no redirect and 5xx fail-closed checks |
| Fresh PostgreSQL authorization suite | **10 scenarios pass**, replaying all four migrations; activation, Plus→Basic, revocation, exact expiry/future start, quota, owner isolation, moderation, deletion and audit |
| Local Auth/PostgREST integration | **Pass**; real JWT/RLS API calls, metadata forgery denied, activation/switch/revoke, Basic/Plus isolation, safe testimonial publication/withdrawal and deleted-user writes denied |
| Application/Functions TypeScript, ESLint, build, smoke | **Pass**; retrieves all 10 precached assets without private API caching |
| Local database advisors | **No warning/error issues** across security and performance checks |
| Release artifact isolation | **Pass**; production configuration strips developer local account values even with `.env.local` present; no public source maps; no known synthetic accounts, demo password, fixture testimonials, local endpoint/key or bootstrap scripts in output. Hash inventory: `preproduction-2026-10-19/release-audit.json` |
| Samsung USB / services | **Pass**; ADB device SM-S908U authorized; 5173 and 57421 reverse mappings restored; requests issued from the phone return 200 for app and local Auth health |
| Actual physical Samsung acceptance | See [phone evidence report](preproduction-2026-10-19/SAMSUNG_UAT.md) for completed cases and any unverified scope. Prior desktop responsive captures are not substituted |
| WhatsApp actual-phone handoff | Owner previously verified both Basic/Plus links open the correct business recipient with selected package. No messages were sent by the agent |
| Production backup/restore or hosted runtime | **Not executed / not approved**; runbook prepared, not a passing operational drill |

## Changes made during this checkpoint

- Prevented production `vite build` from inheriting review `VITE_LOCAL_ACCOUNTS`, local Supabase URL and publishable key. Source maps are no longer shipped. Development Vite keeps the local test account path; release remains private mode until a separately reviewed hosted configuration is implemented.
- Added `npm run audit:release` and CI enforcement for release inventory, hashes, test credential/fixture markers and local configuration exclusion. No account seed scripts or database rows are bundled. Scans are evidence for the listed patterns and structural separation, not proof that all personal content is absent: the existing named v1 candidate/role pack remains in the application and requires public-content review.
- Hardened the trusted authorization service call against endpoint userinfo/path/query/hash, redirects and 5xx ambiguity. Added tests proving backend denial never contacts the paid provider.
- Expanded lifecycle tests to cover downgrade, single-row replacement, revocation, another user's continuing access and exact database-clock expiry.
- Prepared [deployment/backup/rollback checklist](PRODUCTION_DEPLOYMENT_CHECKLIST.md), [entitlement audit](ENTITLEMENT_AUDIT.md) and expanded [recovery, retention, deletion and admin recommendations](RECOVERY_AND_RETENTION_PROPOSAL.md).

## Outstanding release blockers

1. **Hosted configuration/staging integration absent.** Both client and paid route are intentionally local-only; a production Vite build strips local configuration. Shipping this artifact unchanged does not provide hosted accounts. No live schema compatibility, production Auth or Cloudflare Function runtime has been verified.
2. **Recovery, deletion across copies, retention and backups need approval and implementation.** The current live-row cascade preserves browser-private data and cannot promise immediate deletion from backups/other devices/audit history. Recovery UI/email delivery is not implemented. Approve and test the proposed policy and restore/deletion reconciliation before publishing promises.
3. **Admin assurance.** Trusted roles and audit exist; backend AAL2/recent-authentication enforcement, real owner bootstrap, transfer/break-glass recovery and dashboard/operator controls are not implemented/verified for production.
4. **Offline licensing and sync business boundary.** Local bundled features/trial counts are tamperable; protected backend calls have live checks. Decide whether registered-free summary sync is permitted: current owner RLS permits it despite a paid sync capability name. See ENTITLEMENT_AUDIT.md before a pricing/security claim.
5. **Three moderate dependency findings remain.** They derive from the Mammoth CLI chain, not the current browser import path; evidence and non-breaking remediation plan are in DEPENDENCY_REMEDIATION.md. Owner must accept documented temporary risk or require upstream/replacement remediation. No audit suppression or forced downgrade was applied.
6. **Public content / rollout operations.** Existing personalized candidate content, privacy/consent wording, hosting budget, production request limits, headers/CSP, monitoring, actual backup/restore drill and choice between GitHub Pages/static and Cloudflare Functions need reviewed acceptance. No uncontrolled master push should trigger deployment.
7. **Acceptance scope.** Only actually captured phone cases count. Any pending phone/admin action and deployed-runtime test in SAMSUNG_UAT.md must be completed before release; a historic “8/8” claim is not a substitute for this commit's evidence.

## Exit criteria for a production GO

Resolve each blocker with owner decisions, a reviewed implementation and non-production evidence; complete the Samsung checklist; record a compatible restore/rollback drill and release artifact hashes; obtain explicit approval naming the Supabase project, Cloudflare target, migration scope and release commit. Approving this report alone does not authorize connecting live services or deployment.

Local preview: `http://127.0.0.1:5173/` via USB reverse on Samsung. Keep Docker/local Supabase and Vite running. `npm run build` is deliberately a sanitized release artifact; use `npm run dev -- --host 127.0.0.1` for the local account review. Detailed commands remain in LOCAL_PREVIEW.md.

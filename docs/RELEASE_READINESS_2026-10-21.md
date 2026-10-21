# Release readiness checkpoint — 2026-10-21

**Engineering hardening is locally verified. Production release remains NO-GO pending the operational and acceptance gates below.** This report is not deployment, billing, hosted connection or merge authorization.

Work remains on `feature/kazicoach-v2`; master stays at `bba3502a6e822f715dcd16b3e90144a28aef2c71`. No hosted project was contacted, paid provider called, payment initiated, merge performed or deployment made.

Implementation checkpoint: `08873bc` (`feat: harden v2 release privacy, account recovery and MFA authorization`). Documentation/evidence is committed separately. Prior local review images and unrelated project-kit files are preserved outside these commits.

## Changes delivered

- Removed bundled personal candidate identity, CV history, project/employer details and stale interview date/venue/advertised-post assertions. Public answers use clearly labelled coaching templates. Existing browser-private data, storage keys, question IDs and user-created materials are preserved. Release scans reject known personal-content markers as well as test credentials, fixture testimonials, local keys/endpoints and source maps. Historical Git revisions and already-installed old caches are outside this bundle scan; do not publish old artifacts as rollback targets.
- Updated Vite to pinned 8.3.5 and replaced Mammoth's plain-text DOCX reader with pinned fflate 0.8.3 plus native XML parsing. This removes the vulnerable argparse/sprintf-js CLI chain without a forced downgrade or incompatible override. Input/expansion/archive/node/depth limits and synthetic DOCX tests are included. PDF extraction disables dynamic evaluation and document font loading. Real-phone document corpus acceptance remains pending.
- Local fixture tools verify this branch, project ID and configured API port against CLI discovery. They cannot accept a remote override. Matching local publishable keys are refreshed on setup after a stack restart. Current local API is 57251, DB 57252 and inbox 57254. Vite binds loopback, validates hosts and refuses a conflicting port.
- Added an explicit, default-disabled hosted configuration path. A hosted build requires an exact HTTPS app origin, canonical Supabase project URL and publishable key from separate build-process variables. It never inherits review configuration from `.env.local`. The hosted backend separately validates its configured origin/endpoint and forwards the caller JWT to trusted entitlement checks. Configuration tests use a synthetic domain/project without networking; final output is restored to sanitized private mode.
- Added CSP, framing, referrer, content-type, permissions and HTTPS headers for both static assets and Pages Function middleware. Static headers are generated for the configured project only. Browser/runtime behavior must still be verified on approved staging; Vite preview does not emulate Cloudflare header processing or Functions.
- Privileged RPCs now require trusted role membership, a live matching Auth session and verified MFA factor, AAL2, and a signed TOTP authentication event within 15 minutes. There is no local/hosted bypass. Owner UI supports authenticator enrollment and verification. Password-only owners cannot view administrative data or change settings. Admin reads use bounded keyset pagination rather than silently truncating the user list.
- Added explicit PKCE email-confirmation/recovery callbacks, generic recovery-request responses, password confirmation and global sign-out after password replacement. Codes are removed from the address bar before exchange and query-bearing requests are excluded from the service-worker cache. Existing data export/deletion remains independent of premium; paginated exports reject account changes.
- Registered Free summary sync is approved by the owner and reflected in `kc_has_capability('sync')`. Paid generation and Plus advanced analysis still require live trusted entitlements. Offline browser code, trial counts, scores and cached UI cannot be made tamper-proof on a learner-owned device.
- Disabled the legacy automatic GitHub Pages deployment workflow in this branch. CI validates dependencies, authorization, configuration and artifacts without deployment permissions. Billing remains disabled.

## Verification

Evidence is in [release-hardening-2026-10-21](release-hardening-2026-10-21/). Logs identify actual command results; they are not a substitute for physical-device or hosted-runtime evidence.

Absolute workstation paths in saved logs are redacted to `<workspace>` before commit. Initial failed checks are retained alongside passing final logs. Only this session's disposable integration/recovery/UAT identities were cleaned up; existing review identities and private workspace data were preserved.

| Check | Result |
| --- | --- |
| Clean dependency installation | `npm ci` passes |
| Advisory audit | 0 known vulnerabilities at this checkpoint |
| Unit/regression suite | 72 tests / 10 suites pass |
| Fresh PostgreSQL suite | 13 scenarios pass, including MFA denial, lifecycle/isolation, 208-user pagination and isolated backup restoration |
| Real local Auth/PostgREST | Pass, including password-only owner denial and authenticated MFA owner access |
| Local recovery integration | Pass: synthetic inbox, exact callback, wrong-browser PKCE rejection, recovery event, password replacement, old-password/refresh rejection and used-code denial; fixture removed |
| App/Functions type checks and ESLint | Pass; the Functions config was corrected after an initial TS-extension setting failure, with a passing final log |
| Build, release scan and offline smoke | Pass; current artifact inventory includes SHA-256 hashes |
| Hosted build configuration tests | Pass using synthetic configuration only; invalid local endpoint rejected; default private build restored |
| Local security/performance advisors | No warning/error issues |
| Physical Samsung / hosted staging | Not rerun for this changed build; no fresh pass claimed |

The restore exercise uses a disposable PostgreSQL database only. It checks restored audit data, cross-user RLS and password-only admin denial. It does not prove managed-host backups, encryption/key custody, storage backup completeness or the proposed production RPO/RTO.

## Remaining release gates

1. Supply and approve the exact application domain, Supabase staging/production references and Cloudflare target. Best practice is separate staging and production projects, exact HTTPS origins/redirects and separate public keys/server bindings. No target is inferred or provisioned from the owner's email.
2. Verify the owner identity and email out of band; bootstrap only that verified account through a reviewed trusted operation. Configure and rehearse MFA enrollment, recent-auth expiry, factor loss, owner transfer and emergency recovery. No synthetic account may be promoted or seeded in a hosted environment.
3. Configure a verified recovery sender and exact confirmation/recovery redirect allowlist; verify delivery, expired/tampered/reused links, wrong-browser behavior, logout and session handling on approved staging. Local PKCE tests are not hosted email or UI acceptance.
4. Obtain explicit retention/deletion policy approval. The owner's supplied email identifies an intended owner/contact; it does not approve proposed retention periods. No purge job is enabled. Test deletion reconciliation across backup restores, other devices and minimized audit history before publishing retention promises.
5. Perform the real backup/restore and rollback drill for the approved hosting plan. Keep encrypted off-host backups with approved custody/retention; include Auth, private audit/admin data, schema/grants and any future storage objects. Do not roll back to an artifact containing candidate data or insecure administration.
6. Configure and test deployed abuse protection, operational monitoring, request/provider budgets and incident handling. Per-user database quota is enforced, but does not replace edge request limits. No provider key or payment gateway has been enabled here.
7. Complete fresh physical Samsung UAT for Free/Basic/Plus, MFA Super Admin, moderation, account switching, recovery, offline behavior and representative synthetic DOCX/PDF files. Use the [OpenCode acceptance prompt](OPEN_CODE_RELEASE_UAT_PROMPT.md). Do not reuse the historic 8/8 result as acceptance of these changes.
8. Approve the reviewed commit, staging evidence, artifact hashes, migration inventory and exact production action scope. Only then may merge, hosted changes or deployment proceed.

## Local preview

```powershell
npm ci
supabase start
supabase migration up --local
npm run preview:setup
npm run dev
```

Open `http://127.0.0.1:5173/`. Samsung USB/wireless ADB must be authorized independently; reverse 5173 and the current configured API port 57251. Never use the live website for fixture tests. The local owner requires authenticator verification before administrative operations; setup's generated synthetic TOTP secret is stored only under ignored `.local-review/`.

## Rollback

Before production, keep this branch and the sanitized artifact inventory as the review checkpoint. App rollback must use a reviewed sanitized artifact compatible with the additive database schema. Preserve `kazicoach-tz:v1` and pending queues. Do not drop tables, reset a hosted database or remove MFA protections to recover a release. The migrations here change functions/capabilities and add pagination, with no customer-row purge. Production rollback/forward repair needs explicit target approval and a tested backup.

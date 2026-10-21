# Production deployment checklist — approval required

**Current implementation update — 2026-10-21:** [readiness report](RELEASE_READINESS_2026-10-21.md) supersedes earlier statements that hosted configuration, MFA or recovery code is absent. Those paths now exist and are locally tested; they remain disabled/unverified on hosted services. The local restore test covers a disposable database, not real managed backups or production RPO/RTO. Automatic GitHub Pages deployment is disabled in this branch. All hosted/owner/retention/operational checkboxes below remain explicit release gates until verified.

The [owner bootstrap template](OWNER_BOOTSTRAP.sql.example) requires independently verified UUID/email parameters and a confirmed existing account. It refuses an existing administrator, records an audit event and has no default identity. It has not been run on hosted services. Role transfer/factor-loss recovery must be reviewed with the owner and rehearsed before production; never add a password-only bypass.

Prepared 2026-10-19. This is a runbook, not authorization. No hosted project has been inspected or connected. Do not run remote CLI, migrations, provisioning or deployment actions until the owner explicitly approves their exact target and scope. Current verdict: **NO-GO for production**; see FINAL_GO_NO_GO.md.

## 1. Decisions, ownership and change control

- [ ] Approve product acceptance on the actual Samsung, including Plus, Super Admin, switching, expiry and loss of connectivity. Record device/browser/version, app commit, test identity and screenshots. Desktop responsive tests are not phone acceptance.
- [ ] Approve the limits of offline licensing, retention/deletion/recovery policy, dependency residual risk, public candidate content, business phone and billing-disabled copy.
- [ ] Verify the real sole owner out of band. Do not promote `owner@kazicoach.test` or bootstrap synthetic credentials. Configure account MFA, backup factors/codes, role-change approval and a break-glass custodian/procedure. Backend privileged RPCs must require appropriate assurance/recent authentication before public rollout; current admin table checks alone do not enforce AAL2.
- [ ] Name release operator, incident owner, rollback approver, maintenance window and acceptable RPO/RTO. Proposed starting targets for owner approval: RPO ≤24 hours and RTO ≤4 hours, contingent on a successful timed restore drill and affordable hosting plan.
- [ ] Retain a reviewed commit, dependency lock, built-artifact hashes, migration inventory and completed go/no-go evidence. Require human approval on deployment environments. The existing GitHub Pages workflow is not a Cloudflare Functions deployment; decide which host is authoritative before any merge that could trigger automation.

## 2. Supabase staging before production

- [ ] After explicit permission, identify exact staging project/reference, owner, region and plan using read-only inspection first. Confirm it is separate from production. Do not trust earlier reported project details.
- [ ] Inventory schemas, tables, grants, RLS, functions/default privileges, Auth settings, extensions, storage and migration history. Resolve collisions with `kc_*`/`kc_private` and assess upgrade compatibility. The current local migration sequence assumes those names do not exist; do not “fix” a collision by dropping data.
- [ ] Apply reviewed additive migrations only to approved staging, then run anonymous, two-learner and admin HTTP tests against actual Auth/PostgREST; do not simulate all checks as postgres. Verify exact expiry, future grants, Plus→Basic, revocation, immutable duplicate sync and cross-user reassignment/reads/writes.
- [ ] Verify grants and policies on every exposed table and RPC, definer search paths, private-schema exposure, no client-writable admin or entitlements, quota concurrency and statement/request limits. Review performance/security advisors and query plans under realistic volume.
- [ ] Implement and verify a separate explicit hosted HTTPS client/server configuration path. **Current code intentionally accepts only loopback local accounts; release builds force local settings off. This is not a working hosted-account configuration.** Do not relax loopback protection ad hoc or point the local fixture scripts at a hosted URL.
- [ ] Enable verified email confirmation and approved recovery sender, exact redirect allowlists and secure recovery route. Test generic reset responses, link reuse/expiry, session revocation and deleted-user stale-token behavior. Confirm privileged actions check live authorization and assurance, not user metadata or UI state.
- [ ] Bootstrap the verified owner through a reviewed one-time trusted operation; audit it and remove the bootstrap capability. Confirm package prices/durations/trial/quota, public WhatsApp setting and initial absence of fictional testimonials. No demo seed/account import.
- [ ] Keep payment gateways and billing disabled. Manual grants reflect externally verified payments only after the owner approves activation operations; use audited activate/revoke/package RPCs and verify UTC expiry plus Dar es Salaam display. Never share service-role keys with clients.

## 3. Backups and restore rehearsal

- [ ] Verify the actual plan's backup, PITR, export/download and retention capabilities; do not assume free-plan backups or a recoverable snapshot exists. [Supabase backup documentation](https://supabase.com/docs/guides/platform/backups) is the source of platform behavior; the chosen plan must be checked again at execution time.
- [ ] Before production migration, take an approved consistent database backup/export, including required Auth identities, private roles/audit, application data, schema/grants and migration history. Separately inventory configuration, encrypted secrets and any storage objects: database backups alone are not a guarantee of file-object recovery. Keep privileged backups encrypted and access-controlled, outside the repo/build artifacts.
- [ ] Record snapshot timestamp, scope, integrity hash, key custody and retention. Verify restoration into an isolated non-production environment. Check identity relationships, row counts, permissions, entitlements, approved-only testimonials and representative exports. Time the drill against the agreed RPO/RTO.
- [ ] Maintain a minimized deletion reconciliation mechanism for backup restores. Reapply confirmed account deletions/withdrawals before restored data is exposed; prevent a restore from reviving a public testimonial or privileged grant.
- [ ] Document which post-snapshot writes would be lost, a reconciliation path and the owner who approves restore. A backup existing without a tested restore is not a green gate.

## 4. Cloudflare Pages release preparation

- [ ] Only after hosted path implementation and staging approval, use a separate approved preview project/environment. Disable uncontrolled branch auto-deploy and hooks; protect production with a human approval gate. Do not run the existing master deployment workflow as part of this checkpoint.
- [ ] Build with pinned/locked dependencies and Node version used in CI. Run unit/RLS/API/typecheck/lint/build/release-scan/smoke. Archive hash inventory. Upload only release `dist` and separately reviewed Pages Functions, never `.env*`, docs, fixtures, seed scripts, local backups or source maps. Current production build strips local account environment values and omits source maps.
- [ ] Set non-secret hosted project URL/publishable key only after the explicit hosted configuration is implemented. Set provider secrets only as encrypted server bindings when separately authorized. No `VITE_` service-role/secret/provider keys. Use separate preview/production credentials and verify account/host mappings. [Pages bindings documentation](https://developers.cloudflare.com/pages/functions/bindings/) describes environment-specific configuration.
- [ ] Verify `/api/generate` is deployed as a Function, not a static fallback, and denies missing/invalid/expired/free access without contacting the paid provider. Test the exact deployed worker runtime in staging with mocked provider first; real provider/cost testing requires approval. Current route intentionally rejects hosted service URLs and therefore cannot be enabled in production unchanged.
- [ ] Review CSP, frame protection, Referrer-Policy, MIME types, TLS, recovery-route token handling, CORS and no-store response headers for account/premium endpoints. Tune CSP against tested browser worker/blob/document-reader requirements rather than inventing a permissive policy. Static `_headers` do not automatically secure Function responses; verify both.
- [ ] Verify all static paths under the approved domain/base path, public shell version/hash, initial install and updates, offline reconnect, no private API cache entries, low-bandwidth asset budget, mobile access and expiry. Large PDF assets remain a first-install cost.
- [ ] Ensure logs redact tokens, emails, documents, payment evidence and answer text. Configure actionable failure/latency/quota monitoring without private payload capture. Approve spend caps and alerts before enabling an external AI provider.

## 5. Production change sequence — only after explicit final approval

1. Reconfirm exact project/domain, backup/restore evidence and deployment approval; freeze unrelated changes and record the currently healthy deployment ID and migration version.
2. Take the approved pre-change snapshot. Apply staging-proven additive schema/grant changes with an operator-reviewed migration plan; verify checks before routing traffic. Do not use `db reset`, `--linked` convenience commands or blind `db push` from the development workspace.
3. Publish the approved artifact/Functions to the approved target while billing stays disabled. Verify anonymous/Basic/Plus/admin smoke checks without creating public fictional testimonials.
4. Observe error rates, access-denied behavior, quota, mobile login/recovery/sync and service worker version. Owner signs acceptance. Enable further integrations only under a new explicit approval.

## 6. Rollback / incident response

- [ ] Keep the last known-good **compatible** application/Function artifact and configuration inventory. Cloudflare production rollbacks use a previous successful production deployment; previews are not a production rollback target. See [Cloudflare rollbacks](https://developers.cloudflare.com/pages/configuration/rollbacks/). Verify current eligibility and permissions before release.
- [ ] Define triggers: authorization bypass/private-data exposure, failed sign-in/recovery, unexpected cost spike, destructive migration or sustained critical failures. Suspend expensive operations and privileged mutations first through an approved operational control; leave private offline workspace data intact.
- [ ] Roll back app/Functions to the compatible approved deployment. Validate bindings/config separately rather than assuming code rollback restores secrets or database state. Check installed service workers/caches: origin rollback does not instantly replace cached clients, and client UI cannot be trusted for authorization.
- [ ] Prefer preserving additive schema and applying a reviewed forward fix. Do not drop `kc_*`, `kc_private`, Auth users or grants merely to make code rollback easier. If a data restore is necessary, require owner approval for snapshot/time and known lost writes, maintenance isolation, tested restore, deletion reconciliation and permission checks before reopening traffic.
- [ ] Revoke/rotate compromised credentials and affected sessions, remove inappropriate grants and preserve minimized audit evidence. Resetting a UI cache is not revocation. Record incident timeline, recovery checks, lost/reconciled writes and owner sign-off.

No production backup or rollback has been executed or verified in this local checkpoint. Those remain explicit release blockers.

# Corrective checkpoint — 2026-10-19

Branch: `feature/kazicoach-v2`. Master remains `bba3502a6e822f715dcd16b3e90144a28aef2c71`. Billing is disabled. No push, merge, deployment or hosted Supabase access/mutation occurred.

## Delivered changes

1. Approved business WhatsApp `+255688010595` is stored as normalized international digits `255688010595` in local admin-managed `kc_settings`. The preview setup configures it through the authenticated `kc_set_contact` RPC only when blank and preserves later admin edits. Package-specific upgrade buttons include selected package, current price and duration; no customer email, account ID, token, document or answer enters the message. Links use no-referrer and noopener/noreferrer.
2. All Settings/oral/written voice selectors exclude mixed panel for Free and Basic. The runtime also converts a stale mixed preference to a single female coach when Plus is unavailable. This preserves the stored preference so Plus can resume its five-member simulation; it does not destructively rewrite the workspace.
3. Package reads have explicit ascending IDs and both card/editor lists use tested immutable Basic-then-Plus sorting.
4. Account forms remount by identity; sign-out clears email/password immediately, and an email field focus selects existing contents to prevent accidental appending. Auth auto-completion remains available without preserving application state from the prior account.
5. Contact RPC records previous/new public business settings atomically with each successful change. Invalid/unauthorized writes create no success audit. All existing admin UI mutations (activation, revocation, package edit, moderation and contact) go through audited trusted RPCs. Synthetic first-admin bootstrap now records an audit action. Direct privileged database maintenance still requires its own reviewed operational audit; application audit is not a claim to capture a superuser's every SQL statement.
6. Added dependency remediation and recovery/retention proposals for owner approval. No breaking dependency update, forced downgrade, suppression, recovery email delivery or purge job was introduced.

## Verification

- Clean `npm ci` passed; same three moderate findings remain. Windows native-module lock was resolved by stopping this repo's Vite process and waiting for the active database test before reinstalling.
- `npm test`: **52 tests / 7 suites pass** (previous checkpoint: 41).
- `npm run test:db`: **8 scenarios pass** against disposable PostgreSQL replaying all four migrations, including denied learner/direct settings writes, approved public read, contact before/after audit and failed-write atomicity.
- `npm run test:local`: passes against real local Auth/PostgREST, including forged user metadata failing to grant admin, unauthorized contact changes denied, correct contact audit, two-user isolation and Basic/Plus backend boundaries. The harness now uses disposable learners to avoid overwriting/deleting previous UAT fixtures.
- `npm run lint`, `lint:functions`, `lint:eslint`, `build`, `smoke`: pass. Smoke retrieves all 10 offline assets, checks for privileged key values and guards against the vulnerable CLI dependency markers entering browser JavaScript.
- Local Supabase security/performance advisors: **no warning/error issues**. Local stored phone and contact audit queried and verified.
- Mobile rerun: Free/Basic voice controls, package links/order, no overflow and clean email transition passed; **owner verified both WhatsApp links on a physical phone**. Remaining Plus/admin mobile interactions are blocked by browser tool availability. See [detailed UAT evidence](corrective-uat-2026-10-19/REPORT.md). Do not label this corrective rerun 8/8 complete.

## Access boundary and approval gate

Protected backend operations still require an unexpired trusted entitlement; Basic cannot call Plus analysis, anonymous users cannot read private rows and client metadata cannot promote admin. Mixed-voice controls and speech calls now honor the resolved package. **Offline bundled content and browser trial counts cannot be made tamper-proof**; a client modification can execute downloaded code. This limitation remains a launch decision rather than an unsupported “premium cannot be bypassed” claim.

Owner review: [dependency plan](DEPENDENCY_REMEDIATION.md), [recovery/retention proposal](RECOVERY_AND_RETENTION_PROPOSAL.md), remaining Plus/admin mobile UAT and explicit production rollout approval. The previous 8/8 owner UAT is acknowledged separately.

## Preview and rollback

The development preview is running at [127.0.0.1:5173](http://127.0.0.1:5173). Restart using `npm run dev -- --host 127.0.0.1`. From a stopped local stack: `supabase start`, `supabase migration up --local`, `npm run preview:setup`, then Vite. Existing local owner is `owner@kazicoach.test`, password `LocalReview123!` (local demo only).

Rollback the corrective commits only after saving work; the original v1 workspace key is unchanged. Contact audit migration changes the existing private RPC without widening grants. It does not change production. The contact stays admin-editable; resetting it would be a new audited admin action. See [ROLLBACK.md](ROLLBACK.md) before any data-reset proposal. Never run a hosted reset to undo this local increment.

# Repository audit — 2026-10-19

## Baseline
- Local master `bba3502`; cached origin/master is divergent (3 ahead / 4 behind). No fetch, reset, merge or remote mutation performed.
- Created `feature/kazicoach-v2` from local master. Planning kit was pre-existing and untracked; copied its instructions and six documents into canonical root locations without modifying the kit.
- React 18, TypeScript, Vite; Cloudflare Pages function for optional Gemini. GitHub Actions deploys master to GitHub Pages. Static Pages cannot execute that function.
- Baseline: 3 suites / 10 tests pass; TypeScript and production build pass. Node on this workstation is 26; CI previously uses 22.
- Browser key `kazicoach-tz:v1` owns private attempts, answers, materials and custom questions. Progress, XP, streaks and badges already exist. No auth, sync, schema, account deletion, entitlements or moderation exists.

## Risks / decisions
- Public bundle includes a named candidate, interview date, grounded CV facts and role-specific coaching. Generalizing/anonymizing this content needs product review before public v2 launch. Do not duplicate it into cloud rows.
- AI endpoint has no durable quota enforcement. Pricing, premium features, quotas, payment provider and webhook rules remain unapproved. Do not put existing private features behind a paywall.
- Existing service worker caches all same-origin GETs, including API responses, and returns HTML for offline asset failures. Restrict to public shell assets before adding account APIs.
- ESLint, function typechecking, smoke tests and branch-only CI were absent. Add meaningful checks; do not fabricate passing results for missing checks.
- Hosted project's state/schema/region remain unverified. No hosted connection is authorized. A new local schema does not establish compatibility with production.

## Safe implementation scope
1. Versioned migration with explicit grants/RLS, trusted roles/entitlements, moderated public-safe testimonials and account lifecycle RPCs. Execute in isolated local Postgres tests first.
2. Local-test optional email/password accounts, selected progress summaries, explicit consent, account-scoped durable retry queue and deterministic immutable attempt conflicts. Private answers/materials/custom questions never enter sync payloads.
3. Reuse existing local gamification; derive cloud summary from unique attempts. Mock/disabled billing abstraction; no payment integration.
4. Owner testimonial submission/withdrawal, trusted moderation RPC and minimal local admin UI. Audit only IDs/actions, never testimonial body or private documents.
5. Regression checks, preview, rollback and checkpoint report. No merge, deploy, push or live database operations.

## Approval decisions
Prices/currency, free/premium features and limits, provider, renewal/refund policy, age eligibility, retention including backups/audit, recovery/email delivery, moderator/admin ownership and grant/revocation process, hosting budget, generic role packs and consent copy. Prototype defaults are engineering safeguards, not approved business policy.

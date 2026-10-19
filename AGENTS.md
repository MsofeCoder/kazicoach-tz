# AGENTS.md — KaziCoach TZ 2.0
You are the implementation engineer, architect, security reviewer and tester.
## Non-negotiable
- Work ONLY on feature/kazicoach-v2, created from master; never commit to master.
- Never merge, push to production, deploy, or modify live Supabase without explicit user approval.
- Inspect existing source and documentation before changing architecture.
- Preserve v1 private/offline-first experience and existing user data.
- Never commit credentials, .env files, service-role keys, personal CVs or sensitive user data.
- Use migrations, RLS, least privilege, and test authorization as multiple user roles.
- Treat AI output as coaching advice, not official recruitment guidance.
- Do not invent Tanzanian regulatory or payment compliance facts.
- Make small, reviewable commits; maintain a progress log and clear rollback instructions.
- Ask before destructive operations, schema changes to existing production data, payments, external integrations, or unexpected costs.
## Engineering workflow
1. Check git status, default branch, README, package.json, source tree, tests, CI, deployment configuration.
2. Create/switch to feature/kazicoach-v2; verify branch before writes.
3. Record baseline tests and risks.
4. Implement in phases: schema and RLS; authentication; migration of optional local data; progress; subscriptions; gamification; testimonials; admin.
5. Keep payments behind an abstraction until provider and business rules are approved.
6. Add automated tests for access controls, subscription entitlements, data migration, account deletion and offline fallback.
7. Run npm ci, npm test, npm run lint, npm run lint:functions, npm run lint:eslint, npm run build, npm run smoke (adjust only when documented).
8. Deliver local preview instructions, evidence of passing checks, migration/rollback plan and draft PR. Wait for user approval.
## Definition of done
No regressions; RLS verified; no sensitive logs; accessible mobile UX; secure error handling; documentation; tests; explicit approval gate.

# Architecture Proposal
Implemented local-review design and its limits are documented below. Approved business rules are in DECISIONS.md.
Keep existing React/TypeScript/Vite app and Cloudflare Pages hosting.
Add Supabase Auth + Postgres for opted-in users only. Preserve browser-local mode as default.
Use an explicit sync service with idempotent upserts and timestamps; never silently upload CVs or documents.
Separate public client publishable key from server-side secrets; use JWT and RLS for user data.
Server-side entitlements should derive from trusted payment/webhook or admin events, not client writes.
Payment provider and webhook design remain pending user decision.
Supabase project KaziCoach-TZ was reported active on Free plan in Frankfurt; verify exact project before any connection or migration.

## Local implementation
- The v1 browser key is preserved. Optional AccountProvider sits inside AppProvider; signing in never uploads workspace data. Local configuration rejects non-loopback app/API hosts and privileged browser keys.
- `kc_attempts` stores immutable allowlisted summaries. Account-scoped queues persist failures and acknowledge only sent IDs. Explicit selection includes existing summaries; pausing/sign-out disables further work, and async results use identity generations to prevent a previous account's response replacing current state. Remote data never overwrites the shared private workspace.
- First accepted immutable attempt wins. Conflicting edits use a new attempt ID; no client timestamp overwrites cloud history. XP/streaks derive from unique summaries and remain motivational, not trusted outcomes.
- Public `kc_*` tables expose explicit grants and owner RLS. Trusted roles, usage and audit live in unexposed `kc_private`. Definer helpers have empty search_path and revoked PUBLIC execution; privileged helpers check the trusted admin table. Public RPC wrappers use invoker semantics.
- Package rows hold prices, durations, trial count and cloud quota. Grants capture fixed start/end times; expiry does not need a scheduled job. Cloud coaching consumes quota atomically; Plus analysis independently checks its capability.
- Public testimonials come from an explicit approved-only projection RPC containing ID, display name and body. Owners read their own full row; no anonymous table access. Admin changes are audited without storing private documents or testimonial bodies.
- Service worker caches only versioned public shell assets, never account/API/authorized responses. Development/local services are isolated on ports 57421/57422; no hosted configuration is enabled.

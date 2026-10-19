# Product Requirements — v2 Draft
Approved launch packages, manual activation and trial requirements now take precedence over the draft open pricing/provider decisions below; see [DECISIONS.md](DECISIONS.md).
## Goal
Extend existing Tanzanian interview-preparation app with optional cloud accounts and premium access without removing private offline mode.
## Personas
Guest/private learner; registered learner; premium learner; moderator/admin.
## Functional requirements
- Guest: use existing local study, speech, practice, scoring and export without account.
- Registered learner: sign up/in, securely sync selected progress and profile, sign out, export/delete account data.
- Progress: sessions, topic mastery, history, streaks and XP; conflict-aware synchronization and local offline queue.
- Subscription: free/premium entitlement checks enforced server-side, not by UI alone.
- Testimonials: opt-in submission; admin moderation; public display only after approval; allow withdrawal.
- Admin: minimal restricted dashboard for moderation and entitlements; auditable actions.
## Open decisions requiring approval
Subscription prices, free/premium feature limits, payment provider, renewal/refund rules, age policy, retention periods, hosting budgets, account recovery and administrative ownership.
## Out of scope until approved
Charging real payments; marketing consent defaults; automatic migration of private local CVs; production rollout.
## Nonfunctional
Accessibility, low-bandwidth Tanzanian mobile usage, safe offline fallback, performance, security, privacy and reliable backup.

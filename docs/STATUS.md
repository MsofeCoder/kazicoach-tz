# Checkpoint — local v2 review

Branch: `feature/kazicoach-v2`, created from local master `bba3502`. Master is unchanged. No push, merge, deployment, hosted project inspection or hosted mutation.

| Phase | Implementation | Evidence / remaining work |
| --- | --- | --- |
| 0 audit | Complete | Baseline 10 tests, TypeScript and build passed; see REPO_AUDIT.md |
| 1 schema/RLS | Local implementation | Disposable PostgreSQL and local Auth/PostgREST tests; owner isolation, explicit grants, immutable summaries, expiry, moderation, deletion |
| 2 optional accounts | Local preview | Email/password local test service only; profile, sign-out, paginated export, self-deletion; hosted recovery is pending |
| 3 selected sync | Local preview | Account-scoped durable queue, explicit consent, bounded retries, first-write-wins; no answers/CVs/documents uploaded |
| 4 packages | Local preview | Approved Basic/Plus prices; audited manual activation/revocation and editable prices/durations/limits; backend checks expiry and quota |
| 5 progress/moderation | Local preview | Existing private XP/badges retained, cloud summary and Plus analysis, opt-in testimonial/public-safe approval/withdrawal, sole local Super Admin |
| 6 verification | In progress | Final evidence is recorded below after checks; see LOCAL_PREVIEW.md |
| 7 rollout | Approval gate | No billing/gateway enabled. No remote PR creation, production migration, merge or deployment |

Changes are reversible by leaving this feature branch after saving local work. See ROLLBACK.md. Planning kit remains untouched and untracked.

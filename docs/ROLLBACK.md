# Rollback and migration review

## Application
Work is isolated on `feature/kazicoach-v2`; master remains at `bba3502`. No remote writes occurred. Save any local changes before leaving the feature branch. Browser key `kazicoach-tz:v1` is unchanged: the original app can still read the private workspace. New state is isolated in local Auth storage, `kazicoach-tz:v2:trial-used` and per-account summary queues. Never remove the v1 key to roll back the feature.

## Local database
Migrations create only new `kc_*` public tables and `kc_private`; they do not alter pre-existing application tables. Auth foreign keys cascade **only on intentional account deletion**. No production compatibility is asserted.

Use `supabase stop` to suspend the isolated local stack without deleting its database. There is no automatic destructive down migration. If discarding local test data is desired, explicitly confirm and back up it first, then recreate only the `kazicoach-tz` local stack and replay migrations. Never copy a destructive reset/drop command into a hosted SQL editor.

The migration suite creates a completely separate disposable Postgres instance on each run; it never needs to reset the review database. Both migrations are transactional and versioned with CLI-generated filenames. Check history using `supabase migration list --local`. The output field named `remote` in local mode describes the **local database history**, not a hosted connection.

## Production gate
Before any hosted application, identify the exact project, inventory existing schemas/RLS/auth settings, assess name collisions and grants, take an approved backup, verify recovery, compare staging schema, test real Auth/PostgREST under separate users and approve a staged rollout/rollback. These migrations are a local-tested proposal, not permission to apply them live. Recovery, audit/backup retention, real administrator identity, WhatsApp contact and public-content review remain open.

No migration repairs, merges, billing enablement, hosted connections or deployment should be inferred from approval to review this branch.

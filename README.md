# KaziCoach TZ 2.0

Offline-first interview coaching with optional accounts, selected progress sync, Basic/Plus packages, achievements and moderated testimonials. Coaching is independent advice, not official recruitment guidance. The technical role pack is an example; use your own verified experience and current official vacancy notices.

Current evidence and launch requirements: [hosted checkpoint](docs/DEPLOYMENT_CHECKPOINT_2026-10-21.md). [Staging preview](https://staging.kazicoach-tz-441.pages.dev/) is deployed and the inspected empty hosted Supabase project is initialized. Public account launch awaits verified SMTP, real-owner MFA and remaining acceptance/operations evidence. Work stays on `feature/kazicoach-v2`; master is unchanged and billing is disabled. The v2 branch has no automatic deployment workflow.

Personal candidate/CV content is excluded from the public application bundle. Existing `kazicoach-tz:v1` browser data, materials, answers, custom cards and question IDs remain readable. Signing in uploads nothing automatically. Explicit summary sync excludes answers/documents and is available to registered Free accounts. Downloaded offline features and browser trial counts are advisory; paid backend calls enforce current trusted entitlements.

## Private preview

New browsers receive a short optional guide. Reopen it anytime with **Show me around** in the menu/sidebar or Settings. [Owner setup instructions](docs/OWNER_SETUP_GUIDE.md) cover the remaining dashboard steps; [guide verification](docs/onboarding-2026-10-21/CHECKPOINT.md) records the current staging update.

```powershell
npm ci
npm run dev
```

Open http://127.0.0.1:5173/. No account or hosted service is required. Vite binds loopback and refuses a conflicting port.

## Local account review

```powershell
supabase start
supabase migration up --local
npm run preview:setup
npm run dev
```

Fixture tools accept only this checkout's isolated `kazicoach-tz` stack. Its current API port is 57251; tools validate CLI discovery against `supabase/config.toml`. Setup refreshes the matching local public key after a stack restart. See [local preview](docs/LOCAL_PREVIEW.md) for fixtures and MFA instructions. Keep real documents and customer data out of disposable accounts.

## Checks

```powershell
npm test
npm run test:db
npm run test:local
npm run test:recovery
npm run lint
npm run lint:functions
npm run lint:eslint
npm run test:release-config
npm run build
npm run audit:release
npm run smoke
npm audit --audit-level=moderate
```

`test:db` uses disposable PostgreSQL with no published ports and includes RLS, MFA, entitlement lifecycle, pagination and backup restoration. Auth/recovery tests use only local services and a synthetic inbox. They do not send hosted email or call a paid provider.

## Hosted preparation

The default production build is sanitized private mode. An explicit hosted build requires all `KAZICOACH_RELEASE_*` inputs described in [.env.example](.env.example), through the build process environment. It never inherits local account settings from `.env.local`. The client accepts only the exact configured HTTPS app origin, canonical Supabase project endpoint and publishable key. Server bindings are configured separately. No privileged Supabase key is required by the application.

Preparing configuration does not authorize hosted connection, migration, owner provisioning, provider enablement, merge or deployment. Follow the [deployment/backup checklist](docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md), [entitlement audit](docs/ENTITLEMENT_AUDIT.md), [recovery/retention proposal](docs/RECOVERY_AND_RETENTION_PROPOSAL.md) and [draft PR](docs/DRAFT_PR.md). Complete fresh Samsung acceptance and approved staging validation before release.

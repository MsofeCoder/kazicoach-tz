# Onboarding checkpoint — 2026-10-21

Adds an accessible native modal guide with five steps, Next/Back, direct step selection, skip/close/Escape, optional page shortcuts and a final Practice destination. Reopen from desktop sidebar, mobile drawer or Settings. No dependencies, schema, entitlement or billing changes.

Only a separate `kazicoach-tz:guide:v1=seen` dismissal marker is written. Existing v1 workspaces are not interrupted; email confirmation/recovery/code callbacks suppress auto-opening. Storage errors never block the app. Native modal focus/background containment, initial/step heading focus, responsive scrollable sizing and focus restoration are provided.

Verification: 79 unit tests / 11 suites pass, including seven onboarding boundary cases; app/Functions type checks, ESLint, default build, smoke and release artifact scan pass. Dependency installation was not repeated because the lockfile/dependencies did not change and another local testing session is active. Existing database/hosted authorization evidence remains applicable: this change adds no backend behavior, so remote fixture mutation was not repeated.

Actual browser checks: first opening on a fresh local origin; manual mobile-menu reopen in an existing workspace; Next, Back, step selection, Materials shortcut; Escape dismissal; no auto-popup after reload; Settings help entry. These are browser tests, not physical Samsung results. Screenshot: `welcome-guide.png`. Hosted staging publication/verification is recorded separately after deployment.

Owner actions and direct dashboard links: [OWNER_SETUP_GUIDE.md](../OWNER_SETUP_GUIDE.md). No real owner email, SMTP password, authenticator secret or customer data is included. The inline owner setup guide is presentation-only and performs no dashboard mutations or email sends.

Rollback: revert the onboarding implementation commit and rebuild the appropriate exact-origin artifact. The extra local marker may remain harmlessly; do not clear or migrate the private `kazicoach-tz:v1` workspace. Master stays unchanged. No public production deployment or billing/provider enablement is included.

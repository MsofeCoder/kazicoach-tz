# KaziCoach TZ 2.0: optional accounts and secured premium administration

Local PR draft; no Git push, remote PR or merge has been performed.

Preserve the offline private workspace while adding optional accounts, consent-based summary sync for registered Free users, configurable Basic/Plus packages, audited manual activation, expiry, progress/gamification and moderated testimonials. Trusted backend checks enforce ownership, live premium access and recent owner MFA. Offline bundled functionality and browser trial counters remain modifiable by the device owner.

Release hardening removes bundled personal candidate content and the vulnerable DOCX dependency chain, adds bounded document extraction, explicit exact-origin hosted configuration, PKCE confirmation/recovery, paginated export/admin reads and static/Functions security headers. A regression prevents test/dev shutdown from overwriting release headers or service-worker output. The legacy automatic deployment workflow is disabled.

Validation: 72 unit tests, 13 PostgreSQL 17 scenarios, local Auth/recovery integration, 12 real hosted authorization proofs, actual hosted export restoration into a disposable local database, type/lint/build/artifact/configuration checks and zero known audit findings. Corrected Cloudflare staging passes nine deployed HTTP checks and rendered browser inspection. Temporary hosted test identities were removed. Billing and paid AI remain disabled.

Under the owner's autonomous release authorization, the empty launch Supabase project was initialized and staging deployed. Public account launch remains held on verified SMTP, real-owner identity/MFA, current physical Samsung acceptance and operational recovery requirements. Master remains unchanged. See [current evidence and actual hosted changes](DEPLOYMENT_CHECKPOINT_2026-10-21.md), [deployment/rollback checklist](PRODUCTION_DEPLOYMENT_CHECKLIST.md), and [local preview](LOCAL_PREVIEW.md).

Latest frontend increment (25 October): a seven-stop tour navigates to and highlights real workspace features. Includes responsive explanation cards, reduced motion, keyboard dismissal and preservation of unfinished practice on Close. Local browser evidence and rollback: [tour checkpoint](onboarding-2026-10-25/CHECKPOINT.md). Unit suite is now 84 passing tests; this increment is not deployed.

Account password fields now offer an accessible eye toggle with masking on field exit, shared with recovery inputs. Local desktop/mobile interaction verified; no authentication behavior changed. See [password visibility evidence](password-visibility-2026-10-25/CHECKPOINT.md).

Recovery entry is now a visible button inside the sign-in card, opening a labelled form with email prefill, focus and sending feedback. Request/callback security behavior is unchanged. 84 tests/types/lint/build/smoke pass; this increment awaits browser review and staging deployment.

Account feedback distinguishes local test accounts from staging, maps known failures to safe actionable alerts and preserves sign-in/out feedback. Recovery only reports conditional acceptance after a successful request; returned/thrown failures show an error. 92 tests plus types/lint/build/smoke/artifact checks pass. No hosted mutation or deployment. See [checkpoint](ACCOUNT_FEEDBACK_2026-10-25.md).

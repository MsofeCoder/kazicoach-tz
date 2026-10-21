# KaziCoach TZ 2.0: private workspace, optional accounts and secured premium administration

This is a local PR draft; nothing has been pushed or opened remotely.

Current release hardening removes bundled CV details, resolves all currently known dependency findings, fixes local configuration drift and prepares explicit default-disabled hosted HTTPS configuration. Owner operations require a live recent MFA session; account confirmation/recovery uses PKCE, and registered Free users may sync selected summaries. Security headers, paginated administration/export, artifact isolation and an isolated database restore check are included. The legacy automatic deployment workflow is disabled.

Validation: 72 unit tests, 13 database scenarios, local Auth/recovery integration, zero known audit findings, type/lint/build/configuration/artifact/smoke checks and local advisors. Functions type configuration had an initial failure that was corrected and rerun successfully. Fresh physical Samsung and approved hosted/operational acceptance remain required. See [release readiness](RELEASE_READINESS_2026-10-21.md) for exact evidence and remaining gates. Billing, live Supabase, master and production are unchanged.

The private React/Vite app gains optional local-test accounts, explicit progress-summary sync and approved Basic/Plus packages while retaining the existing workspace key and local materials. Trusted Postgres RPCs enforce entitlements, quota, expiry, manual administration and moderated public-safe testimonials. Browser UI gating cannot securely license algorithms and content already distributed offline; hosted operations enforce their permissions independently.

Includes transactional migrations with explicit grants/RLS, isolated two-user/anonymous authorization tests, local Auth/API integration checks, branch CI without deployment, build-versioned public-shell caching, paginated exports, account deletion, configurable package/contact controls and administrative audit details. Billing and hosted connections remain disabled.

Validation evidence and phase status: STATUS.md. Review/setup: LOCAL_PREVIEW.md. Rollback and hosted approval gate: ROLLBACK.md. Approved business decisions and remaining launch decisions: DECISIONS.md.

Do not merge or deploy until the owner explicitly approves the implementation and a separate production migration plan.

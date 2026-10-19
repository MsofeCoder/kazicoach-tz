# Phased Delivery
0. Audit existing repo, tests, hosting, dependencies, privacy flows and deployment configuration.
1. Draft reviewed schema, RLS policies, local migration workflow and authorization tests.
2. Implement optional authentication and account management without breaking guest mode.
3. Add opt-in progress sync, conflict handling, offline queue, data export/deletion.
4. Add trusted entitlement model and free/premium UI, initially with mocked billing.
5. Add XP/streak persistence and approved-testimonial moderation.
6. Security/accessibility/performance regression, local preview and user acceptance.
7. After explicit approval only: PR review, merge and production migration/deployment.
At every phase report changed files, test results, risks, decisions and rollback.

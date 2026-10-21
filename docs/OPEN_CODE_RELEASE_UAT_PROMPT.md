# Copy/paste prompt for OpenCode

```text
Act as independent QA/security tester for KaziCoach TZ 2.0. Execute tests and report actual evidence, without changing implementation to make checks pass.

Workspace: open the local kazicoach-tz checkout and verify its origin is https://github.com/MsofeCoder/kazicoach-tz. Do not run from another project.

Read AGENTS.md, README.md, docs/RELEASE_READINESS_2026-10-21.md, docs/ACCEPTANCE_TESTS.md, docs/ENTITLEMENT_AUDIT.md and docs/LOCAL_PREVIEW.md first. Verify feature/kazicoach-v2 and record commit/git status. Preserve all existing changes and private user data. Reports/screenshots are allowed. Do not commit, merge, push, deploy, connect hosted Supabase, enable billing/providers, change dependencies/migrations, provision real identities, send WhatsApp messages or make payments.

Use the physical Samsung SM-S908U via installed scrcpy/ADB. Inspect adb devices -l and adb mdns services. Prefer an already authorized wireless connection if available; report unavailable discovery honestly. Never invent a wireless address, pair a device, enable insecure debugging or operate security/password-manager prompts autonomously. If needed, request owner action while continuing independent tests. Stop phone input if the owner stops control. Do not save test passwords.

Verify this checkout's local Supabase/Docker and Vite. CLI status contains privileged keys: inspect internally, never print/save them in reports. Read the API port from supabase/config.toml (currently 57251). App: http://127.0.0.1:5173/. Reverse 5173 and the configured API port on the selected authorized phone; confirm phone-side HTTP reachability. Never use the production website. Identify port conflicts; do not silently move Vite or stop unrelated services.

Use only synthetic local fixtures. Run preview:setup. The local owner now requires MFA; run node scripts/local-owner-code.mjs privately for its current temporary code. Never log/screenshot the code, seed or QR. Production owner credentials must never be used. Prepare disposable Basic/Plus identities without overwriting another session's fixture manifest; clean only identities/content you created.

Run these checks, coordinating npm ci with stopping only this repository's Vite to avoid Windows locks:
npm ci
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
Run security/performance advisors only with --local. Save exit codes and redacted logs. Restart a usable preview afterwards. Unit/API/database checks do not count as physical-phone UI evidence.

PHYSICAL-PHONE TEST MATRIX:
1. Free/private: no login needed; preserve existing workspace; five scored-question trial on a separate disposable origin/profile, upgrade invitation after five, materials/export still usable. Never clear the owner's browser data. No mixed five-member voice option in any selector/runtime.
2. Packages: Basic before Plus; current admin-managed prices/durations; WhatsApp buttons open +255688010595 with the selected package and terms, without customer email/ID/token/answers/CV. Do not send a message. Distinguish direct observation from owner reports.
3. Accounts: sign-in/out, empty email/password after logout, next email replaces rather than appends, Basic/Plus switching never leaks old account rows/forms/consent. Sign-in uploads nothing; explicit summary sync excludes answers/documents/custom text. Registered Free summary sync works. Offline retries do not duplicate attempts/XP.
4. Basic: ongoing oral/written practice, local personalization, feedback/progress/XP; no mixed panel in Settings/oral/written; saved mixed preference safely ignored. Plus backend analysis denied.
5. Plus: mixed option everywhere; oral/written five-member panel, active interviewer, navigation, read-aloud and safe speech fallback. Verify practice results and progress. Do not call a paid provider.
6. Admin security: password-only owner is denied every privileged backend read/write. Valid MFA unlocks operations. Invalid/stale (>15 minutes), removed factor, expired/revoked/nonmatching session denied. Learner metadata/direct writes cannot grant admin/premium. Separate simulated database timing from phone evidence.
7. Admin operations on disposable identities: Basic activation, Plus switch, Basic downgrade, revoke, seven-day duration and automatic expiry. Other users unchanged. Basic-before-Plus editors. Package/contact changes audited; restore original settings through audited actions. Paginated users/testimonials/audit reach beyond 100 without duplicates. Never modify real customers.
8. Moderation: synthetic submission pending/private, no self-approval, verified owner approval publishes safe fields, rejection/withdrawal removes public display. Clean all newly created test content and identities.
9. Recovery/confirmation: generic request response; valid PKCE callback; expired/tampered/reused/wrong-browser rejection; new/confirmed password; old password/refresh rejected; callback code removed from URL and never cached/logged. Synthetic inbox only. SDK tests are not full UI evidence.
10. Documents: synthetic TXT/MD/PDF/DOCX with paragraphs/tables/split runs/Unicode/Kiswahili/notes, damaged/empty/password-protected files, >8 MB input and XML expansion/depth/declaration limits. Verify plain-text equivalence, offline usability and no external relationship fetch or file upload. Rich formatting/images are not required. Never upload a real CV.
11. Export/deletion: >1,000 summary export, pagination completeness, pending summaries, account-switch abort; self-deletion cascades only its cloud rows while preserving private workspace; stale tokens cannot restore deleted rows; admin deletion blocked. Delete only disposable fixtures through authorized local API cleanup.
12. Mobile/accessibility/resilience: navigation, clipping, labels/focus, network loss/reconnect, shell update and privacy-safe errors. Public greeting/materials/answers must contain no old personal CV or interview appointment. The role pack is coaching advice, not official guidance.

BACKEND/RELEASE EVIDENCE:
Separately verify anonymous denial, cross-user reads/writes/reassignment/foreign delete, forged metadata, live entitlements, downgrade/revoke/exact/future expiry, quotas, MFA role/session/freshness and audited mutations. Downloaded offline code/storage is tamperable; never claim otherwise. Paid server operations must remain protected.

Scan dist for synthetic accounts/testimonials, credentials, personal candidate/CV content, local keys/endpoints, bootstrap scripts, source maps and privileged keys. Record hashes/generated headers. test:release-config uses synthetic hosted configuration without contacting it and restores the default private build. Never deploy a synthetic build. Vite does not validate deployed Cloudflare headers/Functions or hosted email delivery.

REPORT:
Create docs/test-sessions/<EAT-date-time>/REPORT.md, TEST_MATRIX.csv, DEFECTS.md, screenshots/ and redacted logs/. Each case needs ID, expected/actual, PASS/FAIL/BLOCKED/NOT RUN, evidence path, device/browser and branch/commit. Label physical UI, API, database, unit, desktop and owner-reported evidence separately. Never reuse the old 8/8 statement. Record severity/reproduction, cleanup, running services/ADB mappings and preview URL. Leave existing users/data intact.

Return an evidence-based go/no-go with exact counts, security boundaries, defects, physical-phone gaps, artifact paths and outstanding owner/staging/retention/backup/deployment gates. No production GO without evidence for every gate. Begin inspection and execute authorized local checks autonomously.
```

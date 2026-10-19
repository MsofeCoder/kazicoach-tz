# Account recovery and data retention — owner approval proposal

These are proposed engineering/product defaults, **not approved policy or a claim about Tanzanian statutory deadlines**. No recovery emails, purge job, production configuration or hosted data change is enabled by this document. The existing local account deletion workflow continues to delete owned live rows immediately and preserve the private browser workspace.

## Recovery recommendations

| Area | Recommended approach | Owner decision |
| --- | --- | --- |
| Learner recovery | Email-based recovery to an already verified account address; a generic response whether or not the address exists | Approve verified sender/domain and delivery budget |
| Recovery destination | Exact allowlisted HTTPS route, short-lived single-use recovery link and explicit user password entry; no tokens in logs/analytics/referrers | Approve production domain and recovery wording |
| Abuse resistance | Rate limits by account and request source; optional challenge after repeated requests; no account enumeration | Approve limits and support handling |
| Account access after recovery | Reauthenticate for sensitive changes; revoke refresh sessions; test access-token lifetime and use current session checks for sensitive backend operations | Approve session/recovery acceptance criteria |
| Sole Super Admin | MFA, offline recovery codes under the owner's control, and a documented break-glass procedure requiring out-of-band ownership verification | Name owner and independent recovery custodian; no second admin is provisioned automatically |
| Support / WhatsApp | Provide support instructions only. Never request passwords, recovery tokens, CVs or practice answers in an upgrade message. A payment conversation does not establish recovery identity | Approve support verification procedure |

The [Supabase recovery API](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail) supports recovery email with a redirect destination. Implementation must handle the recovery callback before allowing the user to set a new password. The present local client deliberately has URL session detection disabled; adding recovery requires a dedicated reviewed route and tests, not just a reset-email button. [Supabase session documentation](https://supabase.com/docs/guides/auth/sessions) explains access/refresh session lifetimes: do not assume removing a session or account immediately invalidates every already-issued access token. Existing live entitlement checks and ownership foreign keys remain required.

Recovery acceptance before enablement: expired/reused/tampered links denied; incorrect redirects blocked; no existence disclosure; successful owner-mediated recovery retains the correct account ID/data; old refresh sessions stop working; stale-token attempts cannot mutate a deleted account; no privileged key reaches the browser; no automated account reassignment based solely on a WhatsApp message.

## Proposed retention schedule

| Data | Proposed default for approval | Deletion/exception handling |
| --- | --- | --- |
| CVs, documents, answers and custom questions | Keep browser-local until the learner explicitly resets/removes them | Cloud sync never uploads these. Shared-device guidance and an inactivity reminder may help; no silent purge of the private workspace |
| Cloud profile and selected progress summaries | Retain while account is active; propose review after 24 months of inactivity with 30 days' notice | On confirmed self-deletion, delete live owned rows immediately; cancel sync and invalidate sessions. No inactivity purge is implemented yet |
| Offline progress queues | Retain pending summaries until acknowledged or owner removal; warn when older than 30 days | Avoid silently losing unsent study progress. Self-deletion removes this browser's account queue; other devices need a tombstone/logout cleanup design |
| Testimonials | Pending for up to 90 days; approved until withdrawal/account deletion or annual consent review | Withdraw/unpublish immediately in live reads. Delete rejected/expired pending content after 30 days unless the learner requests earlier removal |
| Administrative audit | Propose 180 days for operational investigation, minimized to IDs/action/approved settings/entitlement changes | Restrict access; then delete or irreversibly anonymize user identifiers. Do not store documents, answers, tokens, passwords or testimonial bodies |
| Expired entitlements | Current grant plus bounded audit history; propose 180 days after expiry where needed for access disputes | No card/mobile-money credentials or payment receipts are collected by this app. Approve any necessary receipt accounting separately |
| Operational logs | Propose at most 30 days of redacted technical events | Omit request bodies, customer email/account IDs where not needed, bearer tokens and private file text |
| Backups | Propose a rolling maximum 30-day retention if the selected hosting plan supports it | Approved access controls and restore drills; after restore, reapply deletions before serving users. Never promise immediate erasure from immutable backups |

Administrative audit rows currently retain UUIDs indefinitely in the local review database. Backups, external WhatsApp conversations, browser exports and other devices are outside the current cascade-deletion guarantee. The owner must approve a policy covering these copies before a public deletion/retention promise is published. Do not retain a second identifier-rich deletion register indefinitely merely to implement erasure.

## Approval checklist

Choose or amend the periods above; identify the verified owner and recovery custodian; approve the sender/domain, support procedure and backup capability; review applicable privacy obligations with appropriate local advice; then approve implementation and test a non-production recovery/purge/restore workflow. Hosted rollout remains a separate explicit gate.

# Security & RLS Requirements
Local verification commands and limitations are in LOCAL_PREVIEW.md and STATUS.md. No live schema has been inspected or modified.
- Enable RLS on all user-linked tables.
- SELECT/INSERT/UPDATE/DELETE for learner-owned data only when auth.uid() = user_id, with both USING and WITH CHECK as applicable.
- Subscription entitlements and admin roles must not be client-editable.
- Testimonials: authenticated owner can submit/edit pending item; public can only read approved public-safe fields; moderators use tightly controlled server-side access.
- Admin identity must be assigned through trusted server-side operations, never user-controlled profile fields.
- Do not log CVs, letters, practice answers, access tokens or payment details.
- Enforce quotas/rate limits for expensive operations; audit privileged changes.
- Validate ownership under two separate users and anonymous access.
- Provide account export and deletion workflow with clear data-retention rules.
- Do not run the schema on the live project without review.

## Implemented access matrix

| Resource | Anonymous | Learner | Super Admin |
| --- | --- | --- | --- |
| Profiles / immutable attempts | None | Owned rows only; attempts cannot update | No extra direct private-row grants |
| Package prices / public contact | Read | Read | Change through audited trusted RPCs |
| Entitlements | None | Read own; never write | Activate/revoke through trusted RPC |
| Testimonials | Approved safe projection only | Own pending edits, own withdrawal; no self-approval | Review and approve/reject through trusted RPC |
| Roles / audit / quota rows | None | None | Audited overview/RPC only, no direct table grants |
| Cloud generation | Deny | Valid Basic/Plus grant plus atomic quota | Same package requirement |
| Advanced cloud analysis | Deny | Plus required, own rows only | Same Plus requirement |

Self-deletion removes Auth user and cascaded owned rows. Existing JWTs can outlive deletion, so foreign keys and live entitlement checks deny subsequent private writes/premium access. Audit IDs remain in the local test database; production retention/recovery remains an approval decision. Admin self-deletion is blocked to prevent orphaning ownership.

Local guest quotas, cached offline premium UI and self-reported scores are not security boundaries. Do not treat a client badge, XP total, profile field, `user_metadata`, or cached package as authorization for a backend operation.
